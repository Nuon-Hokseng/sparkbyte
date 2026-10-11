"use client";

import { useEffect, useEffectEvent, useRef } from "react";
import { isLowEnd } from "../hero/hole";
import {
  BORDER,
  FRAGMENT,
  HOME as HOME_AT,
  LEAN,
  NOD,
  VERTEX,
} from "./earth-shader";
import { STONES, type Stone } from "./stones";

type Props = {
  /** The stone that has been picked, by its place in STONES, if any. */
  picked: number | null;
  /** Picks a stone, or with the one already picked, lets it go. */
  onPick: (stone: number) => void;
};

// The scene is a square. These are in fractions of its side: the globe's
// radius, the side of the canvas it is drawn on (which has room for the glow
// of its air), and the ring's two radii, seen at an angle as it is.
const GLOBE = 0.26;
const CANVAS = 0.72;
const RING_ACROSS = 0.47;
const RING_DEEP = 0.125;
/** How far the ring is tipped out of level, in degrees. */
const TIP = -14;

const TAU = Math.PI * 2;
/** Where on the ring a stone is nearest to us: front and centre. */
const FRONT = Math.PI / 2;
/** Seconds for the planet to turn once, and for the stones to go round once. */
const DAY = 48;
const YEAR = 64;
/** The longitude facing us when the planet is first seen: Cambodia's. */
const HOME = (HOME_AT[0] * Math.PI) / 180;
const HOME_LAT = (HOME_AT[1] * Math.PI) / 180;
/** Seconds the ring takes to open out from behind the planet. */
const OPENING = 1.6;
/** The planet is redrawn this often; it turns too slowly to need more. */
const FRAME = 1 / 31;

/** How far a press has to travel before it is a drag and not a click, px. */
const SLOP = 5;
/** The fastest the ring can be thrown, radians a second. */
const THROW = 5;

const MAX_DPR = 2;
const MAX_DPR_LOW_END = 1.25;
/** The canvas is never more than this many px across, whatever the screen. */
const MAX_SIDE = 900;

// Grains of rock in the ring, which show it turning: where each lies on the
// ring seen from above, in % of the scene, and how big it is. Worked out, not
// random, so the server and the browser agree.
const GRAINS = Array.from({ length: 18 }, (_, i) => {
  const at = ((i * 0.618034) % 1) * TAU;
  const reach = (0.9 + ((i * 0.381966) % 1) * 0.1) * RING_ACROSS * 100;
  return {
    left: `${(50 + Math.cos(at) * reach).toFixed(2)}%`,
    top: `${(50 + Math.sin(at) * reach).toFixed(2)}%`,
    big: i % 4 === 0,
  };
});

function program(gl: WebGLRenderingContext) {
  const make = (type: number, src: string) => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.warn("Earth shader:", gl.getShaderInfoLog(shader));
      return null;
    }
    return shader;
  };
  const vs = make(gl.VERTEX_SHADER, VERTEX);
  const fs = make(gl.FRAGMENT_SHADER, FRAGMENT);
  const prog = gl.createProgram();
  if (!vs || !fs || !prog) return null;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.bindAttribLocation(prog, 0, "aPos");
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.warn("Earth program:", gl.getProgramInfoLog(prog));
    return null;
  }
  return prog;
}

/**
 * The Earth, turning, with a ring round it like Saturn's and the stones going
 * round on the ring: in front of the planet on the near side, behind it on
 * the far side. Pressing and dragging sideways turns the ring by hand, and
 * letting go throws it. A stone can be picked, which brings it round to the
 * front and holds it there.
 *
 * The planet is one small WebGL canvas, drawn about thirty times a second at
 * no more than two device pixels per CSS pixel. The stones are buttons, moved
 * by transforms alone. Nothing runs while the scene is off screen; without
 * WebGL, or until the map has loaded, a plain shaded ball stands in.
 */
export function Orbit({ picked, onPick }: Props) {
  const areaRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const homeRef = useRef<HTMLDivElement>(null);
  const stoneRefs = useRef<(HTMLButtonElement | null)[]>([]);
  // The two halves of the ring's grains, each turned as one.
  const grainRefs = useRef<(HTMLDivElement | null)[]>([]);
  // What the animation reads each frame, and a way to ask it for one frame
  // when it is not running.
  const live = useRef({ picked, held: false, poke: () => {} });

  // Taking hold of the ring lets go of the stone it was holding.
  const letGo = useEffectEvent(() => {
    if (picked !== null) onPick(picked);
  });

  useEffect(() => {
    const area = areaRef.current;
    const scene = sceneRef.current;
    const canvas = canvasRef.current;
    if (!area || !scene || !canvas) return;
    const state = live.current;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    // ── The planet ──────────────────────────────────────────────────────────
    const gl = canvas.getContext("webgl", {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false,
    });
    const prog = gl && program(gl);
    let mapped = false;
    let lost = false;
    let uniforms: Record<string, WebGLUniformLocation | null> = {};

    if (gl && prog) {
      gl.useProgram(prog);
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      // One oversized triangle covers the canvas.
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 3, -1, -1, 3]),
        gl.STATIC_DRAW,
      );
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.clearColor(0, 0, 0, 0);
      uniforms = Object.fromEntries(
        ["uRes", "uRadius", "uSpin", "uDrift", "uTime", "uBorder", "uMap"].map(
          (n) => [n, gl.getUniformLocation(prog, n)],
        ),
      );
      // The border goes round and back to where it began.
      gl.uniform2fv(
        uniforms.uBorder,
        new Float32Array([...BORDER, BORDER[0]].flat()),
      );
    }

    const dpr = Math.min(
      window.devicePixelRatio || 1,
      isLowEnd() ? MAX_DPR_LOW_END : MAX_DPR,
    );
    let side = 0; // the scene's side, CSS px

    function drawPlanet(seconds: number) {
      if (!gl || !prog || !mapped || lost) return;
      const px = canvas!.width;
      gl.viewport(0, 0, px, px);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(uniforms.uRes, px, px);
      gl.uniform1f(uniforms.uRadius, (px * GLOBE) / CANVAS);
      gl.uniform1f(uniforms.uSpin, (seconds / DAY) * TAU - HOME);
      gl.uniform1f(uniforms.uDrift, (seconds / (DAY * 7)) * TAU);
      gl.uniform1f(uniforms.uTime, seconds);
      gl.uniform1i(uniforms.uMap, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      placeHome(seconds);
    }

    // The label that says where we are follows Cambodia round the planet,
    // and fades as it nears the edge on its way to the far side.
    const home = homeRef.current;
    let homeShown = -1;
    function placeHome(seconds: number) {
      if (!home) return;
      // Where Cambodia is on the planet as it has turned, then as the planet
      // nods and leans: the shader's own steps, the other way round.
      const a = (seconds / DAY) * TAU;
      const mx = Math.cos(HOME_LAT) * Math.sin(a);
      const my = Math.sin(HOME_LAT);
      const mz = Math.cos(HOME_LAT) * Math.cos(a);
      const vy = Math.cos(NOD) * my + Math.sin(NOD) * mz;
      const nz = Math.cos(NOD) * mz - Math.sin(NOD) * my;
      const nx = Math.cos(LEAN) * mx - Math.sin(LEAN) * vy;
      const ny = Math.sin(LEAN) * mx + Math.cos(LEAN) * vy;
      const x = (0.5 + nx * GLOBE) * side;
      const y = (0.5 - ny * GLOBE) * side;
      home.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      const shown = Math.round(Math.min(1, Math.max(0, (nz - 0.15) / 0.3)) * 20) / 20;
      if (shown !== homeShown) {
        homeShown = shown;
        home.style.opacity = String(shown);
      }
    }

    // ── The ring ────────────────────────────────────────────────────────────
    // The stones ride on it, evenly spaced. Each remembers which side of the
    // planet it was last on.
    const count = stoneRefs.current.length;
    const stones = stoneRefs.current.map((el, i) => ({
      el,
      at: (i / count) * TAU,
      front: -1,
    }));
    const grains = grainRefs.current;

    const tip = (TIP * Math.PI) / 180;
    const cosTip = Math.cos(tip);
    const sinTip = Math.sin(tip);
    let turn = 0; // how far round the ring has turned, radians
    let pace = 1; // 0..1: the ring slows to a stop under the pointer
    let open = 0; // 0..1: how far the ring has opened out
    let thrown = 0; // the turn a throw has left it with, radians a second

    function place() {
      // Eased, so the ring opens fast and settles.
      const out = 1 - Math.pow(1 - open, 3);
      for (const stone of stones) {
        const { el } = stone;
        if (!el) continue;
        const angle = turn + stone.at;
        const depth = Math.sin(angle); // 1 nearest to us, -1 furthest
        const across = Math.cos(angle) * RING_ACROSS * out;
        const deep = depth * RING_DEEP * out;
        const x = (0.5 + across * cosTip - deep * sinTip) * side;
        const y = (0.5 + across * sinTip + deep * cosTip) * side;
        const size = 0.74 + 0.26 * (0.5 + 0.5 * depth);
        el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%) scale(${size.toFixed(3)})`;
        // Which side of the planet it is on only changes twice a round.
        const front = depth > 0 ? 1 : 0;
        if (front !== stone.front) {
          stone.front = front;
          el.dataset.front = front ? "true" : "false";
        }
      }
      // The grains all turn together, as one flat disc.
      const spun = `rotate(${turn.toFixed(4)}rad)`;
      for (const el of grains) if (el) el.style.transform = spun;
    }

    // ── Turning it by hand ──────────────────────────────────────────────────
    // The press in progress: its pointer, where it and the ring were when it
    // became a drag, and where and when it last moved.
    const drag = { id: -1, dragging: false, x: 0, from: 0, lastX: 0, lastAt: 0 };
    // A drag ends in a click, which is not a click on whatever is under it.
    let swallow = false;

    /** Moves the ring on by `dt` seconds. */
    function advance(dt: number) {
      open = Math.min(1, open + dt / OPENING);
      if (drag.dragging) return; // The hand has it.
      if (state.picked !== null) {
        // Bring the picked stone to the front the short way round, and hold it.
        thrown = 0;
        const want = FRONT - (state.picked / count) * TAU;
        const off = ((((want - turn) % TAU) + TAU + Math.PI) % TAU) - Math.PI;
        turn += off * (1 - Math.exp(-dt * 3.4));
        return;
      }
      // Round at its own pace, and for a while by what a throw gave it.
      pace += ((state.held ? 0 : 1) - pace) * (1 - Math.exp(-dt * 6));
      turn += (dt / YEAR) * TAU * pace + thrown * dt;
      thrown *= Math.exp(-dt * 1.8);
    }

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0 || drag.id !== -1) return;
      drag.id = e.pointerId;
      drag.dragging = false;
      drag.x = e.clientX;
      swallow = false;
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerId !== drag.id) return;
      if (!drag.dragging) {
        if (Math.abs(e.clientX - drag.x) < SLOP) return;
        drag.dragging = true;
        drag.x = drag.lastX = e.clientX;
        drag.from = turn;
        drag.lastAt = e.timeStamp;
        thrown = 0;
        area.setPointerCapture(e.pointerId);
        area.dataset.dragging = "true";
        letGo();
      }
      // What is nearest to us goes the way the pointer does.
      const reach = RING_ACROSS * side;
      const seconds = Math.max(1, e.timeStamp - drag.lastAt) / 1000;
      const speed = -(e.clientX - drag.lastX) / reach / seconds;
      thrown = thrown * 0.6 + speed * 0.4;
      drag.lastX = e.clientX;
      drag.lastAt = e.timeStamp;
      turn = drag.from - (e.clientX - drag.x) / reach;
      if (!raf) place();
    };

    const onUp = (e: PointerEvent) => {
      if (e.pointerId !== drag.id) return;
      drag.id = -1;
      if (!drag.dragging) return;
      drag.dragging = false;
      swallow = e.type === "pointerup";
      delete area.dataset.dragging;
      // Held still before it was let go, or nothing running to carry it on:
      // it stays where it was put.
      const held = e.timeStamp - drag.lastAt > 90;
      thrown =
        held || !raf || e.type !== "pointerup"
          ? 0
          : Math.min(THROW, Math.max(-THROW, thrown));
    };

    const onClick = (e: MouseEvent) => {
      if (!swallow) return;
      swallow = false;
      e.stopPropagation();
      e.preventDefault();
    };

    // ── Running ─────────────────────────────────────────────────────────────
    let raf = 0;
    let last = 0;
    let lastPlanet = -1;
    let onScreen = false;
    // The planet's own clock, in seconds. It only runs while the planet is
    // on screen, so it is first seen facing the same way by everyone.
    let clock = 0;

    function tick(now: number) {
      raf = requestAnimationFrame(tick);
      const seconds = now / 1000;
      const dt = Math.min(seconds - last, 0.05);
      last = seconds;
      clock += dt;
      advance(dt);
      place();
      if (seconds - lastPlanet >= FRAME) {
        lastPlanet = seconds;
        drawPlanet(clock);
      }
    }

    function stop() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }

    /** One frame of everything where it stands, with no motion. */
    function still() {
      open = 1;
      if (state.picked !== null) {
        turn = FRONT - (state.picked / count) * TAU;
      }
      place();
      drawPlanet(clock);
    }

    function refresh() {
      stop();
      if (reduceMotion.matches) still();
      else if (onScreen && !document.hidden) {
        last = performance.now() / 1000;
        raf = requestAnimationFrame(tick);
      }
    }

    state.poke = () => {
      if (!raf) refresh();
    };

    function resize() {
      side = scene!.clientWidth;
      const px = Math.max(
        1,
        Math.min(MAX_SIDE, Math.round(side * CANVAS * dpr)),
      );
      if (canvas!.width !== px) canvas!.width = canvas!.height = px;
      place();
      lastPlanet = -1;
      if (!raf) drawPlanet(clock);
    }

    /** Fetches the map of the Earth, the first time the scene comes near. */
    let asked = false;
    function loadMap() {
      if (asked || !gl || !prog) return;
      asked = true;
      const image = new Image();
      image.decoding = "async";
      image.onload = () => {
        if (lost) return;
        gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
        // It wraps round the planet, so east meets west without a seam.
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        mapped = true;
        drawPlanet(clock);
        canvas!.dataset.ready = "true";
        // The label has nothing to point at until the planet is drawn.
        scene!.dataset.ready = "true";
      };
      image.src = "/process/earth.webp";
    }

    const near = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadMap();
      },
      { rootMargin: "100% 0px" },
    );
    const seen = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        if (onScreen) scene.dataset.open = "true";
        // The stones only glow and pulse while there is someone to see them.
        scene.dataset.live = onScreen ? "true" : "false";
        refresh();
      },
      { threshold: 0.15 },
    );
    const resized = new ResizeObserver(resize);
    const onLost = (e: Event) => {
      e.preventDefault();
      lost = true;
      delete canvas.dataset.ready;
    };

    canvas.addEventListener("webglcontextlost", onLost);
    area.addEventListener("pointerdown", onDown);
    area.addEventListener("pointermove", onMove);
    area.addEventListener("pointerup", onUp);
    area.addEventListener("pointercancel", onUp);
    area.addEventListener("click", onClick, true);
    document.addEventListener("visibilitychange", refresh);
    reduceMotion.addEventListener("change", refresh);
    near.observe(scene);
    seen.observe(scene);
    resized.observe(scene);
    resize();

    return () => {
      stop();
      state.poke = () => {};
      canvas.removeEventListener("webglcontextlost", onLost);
      area.removeEventListener("pointerdown", onDown);
      area.removeEventListener("pointermove", onMove);
      area.removeEventListener("pointerup", onUp);
      area.removeEventListener("pointercancel", onUp);
      area.removeEventListener("click", onClick, true);
      document.removeEventListener("visibilitychange", refresh);
      reduceMotion.removeEventListener("change", refresh);
      near.disconnect();
      seen.disconnect();
      resized.disconnect();
    };
  }, []);

  useEffect(() => {
    live.current.picked = picked;
    live.current.poke();
  }, [picked]);

  const hold = (held: boolean) => () => {
    live.current.held = held;
  };

  return (
    // The scene is a square, but the ring lies flat across its middle and
    // leaves the top and bottom of it empty, so only that middle takes up
    // room on the page. It is also what is pressed and dragged to turn the
    // ring: sideways, so that on a touch screen up and down still scroll.
    <div
      ref={areaRef}
      className="relative mx-auto aspect-4/3 w-full max-w-[min(42rem,84svh)] cursor-grab touch-pan-y select-none data-dragging:cursor-grabbing"
    >
      <div
        ref={sceneRef}
        className="group/orbit pointer-events-none absolute left-0 top-1/2 aspect-square w-full -translate-y-1/2"
      >
        {/* The light the planet sits in. */}
        <div
          aria-hidden="true"
          className="absolute inset-[-12%] rounded-full bg-[radial-gradient(closest-side,rgba(199,214,255,0.1),transparent)]"
        />

        <Ring half="back" />
        <Grains
          half="back"
          spin={(el) => {
            grainRefs.current[0] = el;
          }}
        />

        {/* The stand-in for the planet, under the canvas that replaces it. */}
        <div
          aria-hidden="true"
          className="absolute left-[24%] top-[24%] z-10 size-[52%] rounded-full bg-[radial-gradient(circle_at_32%_30%,#3c6fb8,#12305f_55%,#050b18_100%)] shadow-[0_0_3rem_rgba(82,140,255,0.35)]"
        />
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="absolute left-[14%] top-[14%] z-10 size-[72%] opacity-0 transition-opacity duration-1000 data-[ready=true]:opacity-100 motion-reduce:transition-none"
        />

        {/* Where we are. It is over the planet and under the near half of
            the ring, and is moved to Cambodia by the animation. */}
        <div
          ref={homeRef}
          style={{ opacity: 0 }}
          className="absolute left-0 top-0 z-10 will-change-transform"
        >
          <p className="absolute bottom-3 left-0 -translate-x-1/2 whitespace-nowrap rounded-full bg-ink/75 px-2.5 py-1 text-xs font-medium text-white opacity-0 ring-1 ring-[#ffd680]/50 transition-opacity delay-1000 duration-700 group-data-[ready=true]/orbit:opacity-100 motion-reduce:transition-none">
            <span className="mr-1.5 inline-block size-1.5 rounded-full bg-[#ffd680] align-middle" />
            Based in Cambodia
          </p>
        </div>

        <Ring half="front" />
        <Grains
          half="front"
          spin={(el) => {
            grainRefs.current[1] = el;
          }}
        />

        {STONES.map((stone, i) => (
          <button
            key={stone.id}
            ref={(el) => {
              stoneRefs.current[i] = el;
            }}
            type="button"
            aria-pressed={i === picked}
            aria-label={
              stone.made
                ? `${stone.name}: ${stone.status.toLowerCase()}`
                : `A stone not made yet (${stone.id.slice(-1)} of 4)`
            }
            onClick={() => onPick(i)}
            onPointerEnter={hold(true)}
            onPointerLeave={hold(false)}
            onFocus={hold(true)}
            onBlur={hold(false)}
            // Unseen until the ring has begun to open. Behind the planet it
            // is dimmer for being further off.
            className="group pointer-events-auto absolute left-0 top-0 z-5 grid size-[max(2.75rem,13%)] cursor-pointer place-items-center rounded-full opacity-0 transition-opacity duration-500 will-change-transform data-[front=true]:z-30 group-data-[open=true]/orbit:opacity-70 group-data-[open=true]/orbit:data-[front=true]:opacity-100 motion-reduce:transition-none"
          >
            <span
              className={`relative block w-[54%] transition-transform duration-300 group-hover:scale-115 group-aria-pressed:scale-135 motion-reduce:transition-none ${
                i % 2 ? "rotate-16" : "-rotate-14"
              }`}
            >
              {/* The light a stone that is made gives off. One that is not
                  only gives a hint of the colour it will be. */}
              <span
                style={{
                  background: `radial-gradient(closest-side, ${stone.color[1]}b0, ${stone.color[1]}38 38%, transparent 78%)`,
                }}
                className={`absolute inset-[-85%] rounded-full transition-opacity duration-300 ${
                  stone.made
                    ? "animate-[stone-glow_3.4s_ease-in-out_infinite] opacity-60 group-data-[live=false]/orbit:[animation-play-state:paused] motion-reduce:animate-none"
                    : "opacity-0 group-hover:opacity-25 group-aria-pressed:opacity-25"
                }`}
              />
              <Gem stone={stone} />
            </span>
            <span className="pointer-events-none absolute left-1/2 top-full -translate-x-1/2 whitespace-nowrap rounded-full bg-ink/80 px-2.5 py-1 text-xs font-medium text-white opacity-0 ring-1 ring-white/15 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 group-aria-pressed:opacity-100">
              {stone.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Half of the ring: the far half goes behind the planet and the near half in
 * front of it. A band of three fine lines, tipped as the stones' path is.
 */
function Ring({ half }: { half: "back" | "front" }) {
  const across = RING_ACROSS * 100;
  const deep = RING_DEEP * 100;
  return (
    <svg
      viewBox="0 0 100 100"
      aria-hidden="true"
      className={`absolute inset-0 size-full scale-0 overflow-visible opacity-0 transition-[scale,opacity] duration-1600 ease-[cubic-bezier(0.2,0.7,0.2,1)] group-data-[open=true]/orbit:scale-100 group-data-[open=true]/orbit:opacity-100 motion-reduce:transition-none ${
        half === "back" ? "z-0" : "z-20"
      }`}
    >
      <defs>
        <clipPath id={`ring-${half}`}>
          <rect x="-20" y={half === "back" ? -20 : 50} width="140" height="70" />
        </clipPath>
      </defs>
      <g
        transform={`rotate(${TIP} 50 50)`}
        clipPath={`url(#ring-${half})`}
        fill="none"
      >
        {[
          [1, "rgba(255,255,255,0.22)", 0.28],
          [0.955, "rgba(199,214,255,0.14)", 0.5],
          [0.915, "rgba(255,255,255,0.08)", 0.22],
        ].map(([scale, stroke, width]) => (
          <ellipse
            key={scale}
            cx="50"
            cy="50"
            rx={across * (scale as number)}
            ry={deep * (scale as number)}
            stroke={stroke as string}
            strokeWidth={width}
          />
        ))}
      </g>
    </svg>
  );
}

/**
 * Half of the grains of rock in the ring: those behind the planet, or those
 * in front of it. They lie on a flat disc that is seen at the ring's angle,
 * so turning that one disc (`spin` is given it, to turn) sends every grain
 * round the ring, and the half of it on the other side of the planet is
 * clipped away.
 */
function Grains({
  half,
  spin,
}: {
  half: "back" | "front";
  spin: (el: HTMLDivElement | null) => void;
}) {
  return (
    <div
      aria-hidden="true"
      className={`absolute inset-0 scale-0 opacity-0 transition-[scale,opacity] duration-1600 ease-[cubic-bezier(0.2,0.7,0.2,1)] group-data-[open=true]/orbit:scale-100 motion-reduce:transition-none ${
        half === "back"
          ? "z-0 group-data-[open=true]/orbit:opacity-40"
          : "z-20 group-data-[open=true]/orbit:opacity-85"
      }`}
    >
      <div
        style={{
          rotate: `${TIP}deg`,
          clipPath:
            half === "back"
              ? "inset(-50% -50% 50% -50%)"
              : "inset(50% -50% -50% -50%)",
        }}
        className="absolute inset-0"
      >
        <div
          style={{ scale: `1 ${RING_DEEP / RING_ACROSS}` }}
          className="absolute inset-0"
        >
          <div ref={spin} className="absolute inset-0 will-change-transform">
            {GRAINS.map((grain, i) => (
              <span
                key={i}
                style={{ left: grain.left, top: grain.top }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-mist ${
                  grain.big ? "size-1.5" : "size-1"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// A stone's outline: a long oval, a little fuller on one side.
const OUTLINE =
  "M20 2C29 2 36 10 37 21C38 33 31 47 21 50C11 52 3 38 3 25C3 12 11 2 20 2Z";
// Its cuts: the flat table in the middle, then the facets from the table's
// edges out to the rim, each with how much it lightens or darkens the stone.
const TABLE = "14,16 25,13 30,24 26,36 15,38 10,27";
const FACETS: [points: string, shade: string, strength: number][] = [
  ["14,16 25,13 22,-2 6,2", "#fff", 0.3],
  ["25,13 30,24 42,18 34,2", "#fff", 0.08],
  ["30,24 26,36 40,46 42,20", "#000", 0.2],
  ["26,36 15,38 20,56 36,52", "#000", 0.34],
  ["15,38 10,27 -2,30 4,52", "#000", 0.24],
  ["10,27 14,16 2,4 -2,22", "#fff", 0.14],
];

/**
 * A stone, cut as a long oval gem. One that is made is lit from within: a
 * white-hot heart in the middle of its colour. One that is not is the same
 * stone gone dark, with only its rim to say what colour it will be.
 */
function Gem({ stone }: { stone: Stone }) {
  const [light, mid, dark] = stone.color;
  const id = `gem-${stone.id}`;
  const lit = stone.made;
  return (
    <svg viewBox="0 0 40 52" aria-hidden="true" className="relative block w-full">
      <defs>
        <radialGradient id={`${id}-body`} cx="47%" cy="46%" r="60%">
          {lit ? (
            <>
              <stop offset="0" stopColor="#fff" />
              <stop offset="0.2" stopColor={light} />
              <stop offset="0.58" stopColor={mid} />
              <stop offset="1" stopColor={dark} />
            </>
          ) : (
            <>
              <stop offset="0" stopColor="#4b505c" />
              <stop offset="0.55" stopColor="#262930" />
              <stop offset="1" stopColor="#0d0e12" />
            </>
          )}
        </radialGradient>
        <radialGradient id={`${id}-heart`}>
          <stop offset="0" stopColor={lit ? "#fff" : mid} />
          <stop offset="1" stopColor={lit ? "#fff" : mid} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-rim`} x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0" stopColor={lit ? "#fff" : light} stopOpacity={lit ? 0.9 : 0.7} />
          <stop offset="0.5" stopColor={mid} stopOpacity={lit ? 0.2 : 0.25} />
          <stop offset="1" stopColor={light} stopOpacity={lit ? 0.7 : 0.45} />
        </linearGradient>
        <clipPath id={`${id}-clip`}>
          <path d={OUTLINE} />
        </clipPath>
      </defs>

      <path d={OUTLINE} fill={`url(#${id}-body)`} />
      <g clipPath={`url(#${id}-clip)`}>
        {FACETS.map(([points, shade, strength]) => (
          <polygon
            key={points}
            points={points}
            fill={shade}
            opacity={lit ? strength : strength * 0.55}
          />
        ))}
        <polygon points={TABLE} fill="#fff" opacity={lit ? 0.16 : 0.05} />
        <polygon
          points={TABLE}
          fill="none"
          stroke="#fff"
          strokeWidth="0.5"
          opacity={lit ? 0.45 : 0.14}
        />
        {/* Its heart: white-hot if lit, a dull ember of its colour if not. */}
        <ellipse
          cx="20"
          cy="26"
          rx="9"
          ry="12"
          fill={`url(#${id}-heart)`}
          opacity={lit ? 0.85 : 0.3}
        />
      </g>
      <path
        d={OUTLINE}
        fill="none"
        stroke={`url(#${id}-rim)`}
        strokeWidth="1.1"
      />
      {/* The light it catches. */}
      <ellipse
        cx="14"
        cy="11"
        rx="4.5"
        ry="2.2"
        transform="rotate(-32 14 11)"
        fill="#fff"
        opacity={lit ? 0.8 : 0.22}
      />
      {lit && (
        <path
          d="M28 8l0.9 2.6 2.6 0.9-2.6 0.9-0.9 2.6-0.9-2.6-2.6-0.9 2.6-0.9z"
          fill="#fff"
          opacity="0.9"
        />
      )}
    </svg>
  );
}
