"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import {
  JET_SECONDS,
  POLE_REACH,
  QUALITY_FLOOR,
  QUALITY_STEP,
  fromDisc,
  hole,
  isLowEnd,
  quality,
  toDisc,
} from "../hole";
import {
  DRAW_REACH,
  FRAGMENT,
  SPARKS,
  UNITS_PER_BOX,
  VERTEX,
} from "./shader";

type Props = {
  /** Sizes and places the square the mark is drawn inside while at rest. */
  className?: string;
};

const UNIFORMS = [
  "uCenter",
  "uUnit",
  "uTime",
  "uFlow",
  "uPx",
  "uAmbient",
  "uMark",
  "uPulse",
  "uAlpha",
  "uWobble",
  "uLite",
  "uJet",
  "uSparkN",
  "uSparks",
] as const;

type UniformName = (typeof UNIFORMS)[number];

/** How close (in mark units) the cursor must be before it sheds sparks. */
const REACH = 2.9;
/** Stiffness of the spring that brings the disc to rest while it docks. */
const TURN_STIFFNESS = 16;
/** Radians per second the disc turns about the pole, away from the logo's pose. */
const ORBIT = 1.5;
/** Extra radians per second right after it swallows something. */
const FEED_KICK = 10;
const TAU = Math.PI * 2;

// Resolution. Capable devices draw at up to 2 device pixels per CSS pixel; if
// frames run long the shared quality steps down (see ../hole.ts).
const MAX_DPR = 2;
const MAX_DPR_LOW_END = 1.5;
const MIN_DPR = 0.75;
const SLOW_FRAME = 0.024; // seconds; about 42 frames a second
const FAST_FRAME = 0.0185; // seconds; about 54 frames a second
const QUALITY_WINDOW = 1; // seconds of animation judged at a time
const QUALITY_WARMUP = 2; // seconds ignored after it starts
/** Layout is re-measured this often, in frames, as well as on resize. */
const MEASURE_EVERY = 30;

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const smoothstep = (lo: number, hi: number, v: number) => {
  const t = clamp((v - lo) / (hi - lo), 0, 1);
  return t * t * (3 - 2 * t);
};

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn("BlackHole shader:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

/**
 * The hero mark: the logo as a black hole. The long straight stroke is its
 * pole and never moves; the two arms of the S are the disc around it, which
 * keeps turning about the pole (pausing as it passes through the logo's pose),
 * pulls in dust and whatever comes near, and surges each time it swallows
 * something.
 *
 * It is drawn on a small transparent canvas, fixed above the page, that
 * follows the mark: resting in the hero, and as the page scrolls, flying up
 * to land on the header icon (`[data-dock-target]`), which then takes over.
 */
export function BlackHole({ className }: Props) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const anchor = anchorRef.current;
    const canvas = canvasRef.current;
    if (!anchor || !canvas) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const dockTarget =
      document.querySelector<HTMLElement>("[data-dock-target]");
    const dockVars = document.querySelector<HTMLElement>("[data-dock]");

    let gl: WebGLRenderingContext | null = null;
    let program: WebGLProgram | null = null;
    let buffer: WebGLBuffer | null = null;
    let loc = {} as Record<UniformName, WebGLUniformLocation | null>;

    let raf = 0;
    let running = false;
    let disposed = false;

    const sparkData = new Float32Array(SPARKS * 3);
    const sparks = Array.from({ length: SPARKS }, () => ({
      alive: false,
      rho: 0,
      phi: 0,
      age: 0,
    }));
    let nextSpark = 0;

    const baseDpr = Math.min(
      window.devicePixelRatio || 1,
      isLowEnd() ? MAX_DPR_LOW_END : MAX_DPR,
    );

    // Layout, measured rarely: where the mark rests (page coordinates) and
    // where it docks (the header is fixed, so viewport coordinates).
    const at = {
      restX: 0,
      restY: 0,
      restSize: 0,
      dockX: 0,
      dockY: 0,
      dockSize: 0,
      box: 0, // CSS size of the canvas
      age: MEASURE_EVERY,
    };

    const s = {
      // pointer, client px
      px: 0,
      py: 0,
      pointerAt: -1e9,
      burst: 0,
      // last place a spark was shed, mark units
      shedX: 1e9,
      shedY: 1e9,
      near: 0,
      p: -1, // dock progress, smoothed; -1 until the first frame
      range: 0, // scroll distance over which the mark docks
      landed: false,
      // The disc starts just short of the logo's pose and eases into it.
      alpha: -0.35,
      alphaVel: 0,
      kick: 0,
      flow: 0,
      excite: 0,
      pulse: 0,
      fedSeen: hole.fed,
      last: 0,
      // Frame-rate watch: time and frames in the current window. It starts
      // negative so the first, unrepresentative second is not judged.
      windowTime: -QUALITY_WARMUP,
      frames: 0,
      slowRun: 0, // slow windows in a row
      fastRun: 0, // fast windows in a row
      raised: false, // quality was just stepped back up, on trial
      settled: false, // a step up failed, so no more are tried
      dock: -1,
      icon: -1,
    };

    function setup() {
      const ctx = canvas!.getContext("webgl", {
        alpha: true,
        premultipliedAlpha: true,
        antialias: false,
        depth: false,
        stencil: false,
        preserveDrawingBuffer: false,
      });
      if (!ctx) return false;
      const vs = compile(ctx, ctx.VERTEX_SHADER, VERTEX);
      const fs = compile(ctx, ctx.FRAGMENT_SHADER, FRAGMENT);
      const prog = ctx.createProgram();
      if (!vs || !fs || !prog) return false;
      ctx.attachShader(prog, vs);
      ctx.attachShader(prog, fs);
      ctx.linkProgram(prog);
      if (!ctx.getProgramParameter(prog, ctx.LINK_STATUS)) {
        console.warn("BlackHole program:", ctx.getProgramInfoLog(prog));
        return false;
      }
      ctx.useProgram(prog);
      ctx.clearColor(0, 0, 0, 0);

      // One oversized triangle covers the canvas.
      const buf = ctx.createBuffer();
      ctx.bindBuffer(ctx.ARRAY_BUFFER, buf);
      ctx.bufferData(
        ctx.ARRAY_BUFFER,
        new Float32Array([-1, -1, 3, -1, -1, 3]),
        ctx.STATIC_DRAW,
      );
      const aPos = ctx.getAttribLocation(prog, "aPos");
      ctx.enableVertexAttribArray(aPos);
      ctx.vertexAttribPointer(aPos, 2, ctx.FLOAT, false, 0, 0);

      gl = ctx;
      program = prog;
      buffer = buf;
      loc = Object.fromEntries(
        UNIFORMS.map((n) => [n, ctx.getUniformLocation(prog, n)]),
      ) as typeof loc;
      return true;
    }

    /** Reads layout. Kept out of the per-frame path, which only reads scroll. */
    function measure() {
      at.age = 0;
      const ar = anchor!.getBoundingClientRect();
      at.restX = ar.left + ar.width / 2 + window.scrollX;
      at.restY = ar.top + ar.height / 2 + window.scrollY;
      at.restSize = Math.min(ar.width, ar.height);
      if (dockTarget) {
        const tr = dockTarget.getBoundingClientRect();
        at.dockSize = tr.height;
        at.dockX = tr.left + tr.height / 2;
        at.dockY = tr.top + tr.height / 2;
      }
      // The canvas is a square just big enough for the mark at rest.
      const box = Math.ceil((at.restSize / UNITS_PER_BOX) * DRAW_REACH * 2) + 4;
      if (box !== at.box) {
        at.box = box;
        canvas!.style.width = canvas!.style.height = `${box}px`;
      }
    }

    /** Hands the header icon its share of the transition. */
    function setDock(dock: number, icon: number) {
      if (!dockVars) return;
      const d = Math.round(dock * 1000) / 1000;
      const i = Math.round(icon * 1000) / 1000;
      if (d !== s.dock) {
        s.dock = d;
        dockVars.style.setProperty("--dock", String(d));
      }
      if (i !== s.icon) {
        s.icon = i;
        dockVars.style.setProperty("--dock-icon", String(i));
      }
    }

    function shed(x: number, y: number) {
      const sp = sparks[nextSpark];
      nextSpark = (nextSpark + 1) % SPARKS;
      const from = toDisc(x, y);
      sp.alive = true;
      sp.rho = from.rho;
      sp.phi = from.phi;
      sp.age = 0;
    }

    /**
     * Draws one frame. Returns true once the mark has fully landed on the
     * header icon, which is the cue to stop rendering.
     */
    function draw(time: number, dt: number, live: boolean) {
      if (!gl) return false;
      if (++at.age >= MEASURE_EVERY) measure();
      if (at.restSize < 1) return false;

      const restX = at.restX - window.scrollX;
      const restY = at.restY - window.scrollY;
      const restSize = at.restSize;

      let target = 0;
      if (live && dockTarget) {
        // Scrolling alone carries the mark this far up the page, so the
        // flight ends exactly as its resting place would reach the header.
        s.range = Math.max(at.restY - at.dockY, 160);
        target = clamp(window.scrollY / s.range, 0, 1);
      }
      s.p = s.p < 0 || !live ? target : mix(s.p, target, 1 - Math.exp(-dt * 14));
      if (Math.abs(s.p - target) < 0.0005) s.p = target;
      const p = s.p;
      const docks = live && dockTarget !== null;

      // Sideways travel finishes first, so the mark rises into the icon from
      // below instead of sliding in across the wordmark.
      const e = smoothstep(0, 1, p);
      const x = docks ? mix(restX, at.dockX, smoothstep(0, 0.85, p)) : restX;
      const y = docks ? mix(restY, at.dockY, e) : restY;
      const size = docks
        ? restSize * Math.pow(at.dockSize / restSize, e)
        : restSize;
      const unit = size / UNITS_PER_BOX;

      const ambient = 1 - smoothstep(0, 0.55, p);
      const handoff = smoothstep(0.86, 1, p);
      if (live) setDock(smoothstep(0.1, 0.75, p), handoff);

      const landed = live && target === 1 && p === 1;
      const offScreen = y < -size || y > window.innerHeight + size;

      // Tell the headline and the backdrop where the hole is.
      hole.x = x;
      hole.y = y;
      hole.unit = unit;
      hole.strength = live && !landed && !offScreen ? ambient : 0;

      // The canvas follows the mark; the mark is drawn at its centre.
      const half = at.box / 2;
      canvas!.style.transform = `translate3d(${x - half}px, ${y - half}px, 0)`;
      const dpr = Math.max(MIN_DPR, baseDpr * quality.scale);
      const side = Math.round(at.box * dpr);
      if (canvas!.width !== side || canvas!.height !== side) {
        canvas!.width = canvas!.height = side;
      }

      if (landed || offScreen || unit < 0.5) {
        gl.disable(gl.SCISSOR_TEST);
        gl.clear(gl.COLOR_BUFFER_BIT);
        canvas!.dataset.ready = "true";
        return landed;
      }

      let jetAt = 0;
      let jetGlow = 0;
      let sparkCount = 0;
      if (live) {
        // Something was swallowed: flash, and the disc surges round the pole.
        if (hole.fed !== s.fedSeen) {
          s.fedSeen = hole.fed;
          s.pulse = 1;
          s.excite = 1;
          s.kick = FEED_KICK;
        }
        const pose = Math.round(s.alpha / TAU) * TAU;
        if (p > 0.05) {
          // While docking, come to rest at the logo's pose so it lands as the
          // icon: a critically damped spring.
          const accel =
            (pose - s.alpha) * TURN_STIFFNESS -
            s.alphaVel * 2 * Math.sqrt(TURN_STIFFNESS);
          s.alphaVel += accel * dt;
          s.kick = 0;
        } else {
          // Otherwise the disc keeps turning about the pole. It slows right
          // down as it passes through the logo's pose, so the S can be read.
          const away = smoothstep(0.1, 0.9, Math.abs(s.alpha - pose));
          s.kick *= Math.exp(-dt * 2.2);
          s.alphaVel = ORBIT * (0.2 + 0.8 * away) * (1 + 0.8 * s.near) + s.kick;
        }
        s.alpha += s.alphaVel * dt;

        // The cursor sheds sparks while it moves within reach of the hole.
        const mx = (s.px - x) / unit;
        const my = -(s.py - y) / unit;
        const dist = Math.hypot(mx, my);
        const moving = time - s.pointerAt < 1.2;
        const inReach = moving && dist < REACH && dist > 0.3 && ambient > 0.3;
        if (inReach) {
          if (Math.hypot(mx - s.shedX, my - s.shedY) > 0.2) {
            shed(mx, my);
            s.shedX = mx;
            s.shedY = my;
          }
          while (s.burst > 0) {
            const a = Math.random() * TAU;
            shed(mx + Math.cos(a) * 0.18, my + Math.sin(a) * 0.18);
            s.burst--;
          }
        }
        s.burst = 0;
        s.near = mix(s.near, inReach ? 1 : 0, 1 - Math.exp(-dt * 3));

        // Sparks spiral in through the disc, faster as they get closer, and
        // feed the core. Only the live ones are sent to the shader.
        for (const sp of sparks) {
          if (!sp.alive) continue;
          sp.age += dt;
          sp.rho *= Math.exp(-dt * (0.5 + 0.6 / (sp.rho + 0.2)));
          sp.phi += dt * (0.5 + 1.4 / (sp.rho + 0.25));
          if (sp.rho < 0.2) {
            sp.alive = false;
            s.pulse = Math.max(s.pulse, 0.45);
            continue;
          }
          const to = fromDisc(sp.rho, sp.phi);
          sparkData[sparkCount * 3] = to.dx;
          sparkData[sparkCount * 3 + 1] = to.dyUp;
          sparkData[sparkCount * 3 + 2] = Math.min(1, sp.age / 0.15) * 0.9;
          sparkCount++;
        }
        s.pulse *= Math.exp(-dt * 2.2);
        s.excite *= Math.exp(-dt * 1.4);
        s.flow += dt * (1 + 1.6 * s.near + 3 * s.excite);

        // A packet thrown back out along the pole.
        const jetAge = (performance.now() - hole.jetAt) / 1000 / JET_SECONDS;
        if (jetAge >= 0 && jetAge < 1) {
          jetAt = hole.jetDir * POLE_REACH * (1 - Math.pow(1 - jetAge, 2));
          jetGlow = Math.sin(Math.PI * jetAge) * 1.4;
        }
      }

      // Shade only the square the mark can reach; it shrinks as the mark docks.
      const c = side / 2;
      const reach = Math.ceil(unit * DRAW_REACH * dpr) + 2;
      const lo = clamp(Math.floor(c - reach), 0, side);
      const hi = clamp(Math.ceil(c + reach), 0, side);
      gl.disable(gl.SCISSOR_TEST);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.SCISSOR_TEST);
      gl.scissor(lo, lo, hi - lo, hi - lo);
      gl.viewport(0, 0, side, side);
      gl.uniform2f(loc.uCenter, c, c);
      gl.uniform1f(loc.uUnit, unit * dpr);
      gl.uniform1f(loc.uTime, time);
      gl.uniform1f(loc.uFlow, live ? s.flow : 4);
      gl.uniform1f(loc.uPx, dpr);
      gl.uniform1f(loc.uAmbient, ambient);
      gl.uniform1f(loc.uMark, 1 - handoff);
      gl.uniform1f(loc.uPulse, s.pulse);
      gl.uniform1f(loc.uAlpha, live ? s.alpha : 0);
      // The disc holds still while it docks, so it lands as the icon.
      gl.uniform1f(loc.uWobble, live ? ambient : 0);
      gl.uniform1f(loc.uLite, quality.lite ? 1 : 0);
      gl.uniform2f(loc.uJet, jetAt, jetGlow);
      gl.uniform1f(loc.uSparkN, sparkCount);
      if (sparkCount > 0) gl.uniform3fv(loc.uSparks, sparkData);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      canvas!.dataset.ready = "true";
      return false;
    }

    function tick(now: number) {
      raf = 0;
      if (!running) return;
      const elapsed = (now - s.last) / 1000;
      const dt = Math.min(elapsed, 0.05);
      s.last = now;
      if (draw(now / 1000, dt, true)) {
        // Docked: the header icon has taken over, so stop until scrolled back.
        running = false;
        s.landed = true;
        canvas!.style.visibility = "hidden";
        return;
      }

      // Slow device: step the resolution down rather than drop frames, and at
      // the floor shed the least noticeable layers too. It is judged a second
      // of real time at a stretch. One slow second proves nothing (a page
      // still loading has those), so it takes two in a row, unless frames are
      // running at half speed or worse. A run of fast seconds earns one step
      // back up; if that turns out to be too much, it is not tried again.
      s.windowTime += elapsed;
      if (s.windowTime > 0) s.frames++;
      if (s.windowTime >= QUALITY_WINDOW) {
        const frame = s.windowTime / Math.max(s.frames, 1);
        s.slowRun = frame > SLOW_FRAME ? s.slowRun + 1 : 0;
        s.fastRun = frame < FAST_FRAME ? s.fastRun + 1 : 0;
        const crawling = frame > 2 * SLOW_FRAME;
        if (s.slowRun >= 2 || crawling) {
          if (s.raised) s.settled = true;
          if (quality.scale > QUALITY_FLOOR) {
            quality.scale = Math.max(
              QUALITY_FLOOR,
              quality.scale - (crawling ? 2 : 1) * QUALITY_STEP,
            );
          } else {
            quality.lite = true;
          }
          s.slowRun = 0;
          s.raised = false;
        } else if (s.fastRun >= 4 && quality.scale < 1 && !s.settled) {
          quality.scale = Math.min(1, quality.scale + QUALITY_STEP);
          quality.lite = false;
          s.fastRun = 0;
          s.raised = true;
        }
        s.windowTime = 0;
        s.frames = 0;
      }
      raf = requestAnimationFrame(tick);
    }

    function start() {
      if (running || disposed || !gl) return;
      if (reduceMotion.matches || document.hidden) return;
      running = true;
      s.landed = false;
      s.windowTime = -QUALITY_WARMUP;
      s.frames = 0;
      canvas!.style.visibility = "";
      s.last = performance.now();
      raf = requestAnimationFrame(tick);
    }

    function stop() {
      running = false;
      hole.strength = 0;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }

    // Reduced motion: a single calm frame of the logo that simply scrolls with
    // the hero. The header icon stays visible throughout (see globals.css).
    let stillQueued = false;
    function drawStill() {
      if (stillQueued) return;
      stillQueued = true;
      requestAnimationFrame(() => {
        stillQueued = false;
        if (disposed || !reduceMotion.matches) return;
        canvas!.style.visibility = "";
        draw(4, 0, false);
      });
    }

    function refresh() {
      if (reduceMotion.matches) drawStill();
      else start();
    }

    // While docked, scrolling further down the page costs nothing.
    const onScroll = () => {
      if (s.landed && window.scrollY >= s.range) return;
      refresh();
    };
    const onResize = () => {
      at.age = MEASURE_EVERY;
      refresh();
    };
    const onPointer = (e: PointerEvent) => {
      if (reduceMotion.matches) return;
      s.px = e.clientX;
      s.py = e.clientY;
      s.pointerAt = performance.now() / 1000;
      if (e.type === "pointerdown") s.burst = 3;
    };
    const onVisibility = () => {
      if (document.hidden) stop();
      else refresh();
    };
    const onMotionChange = () => {
      stop();
      if (reduceMotion.matches) {
        dockVars?.style.removeProperty("--dock");
        dockVars?.style.removeProperty("--dock-icon");
        s.dock = s.icon = -1;
        s.p = -1;
      }
      refresh();
    };
    const onLost = (e: Event) => {
      e.preventDefault();
      stop();
      gl = null;
      anchor.dataset.fallback = "true";
      setDock(1, 1);
    };
    const onRestored = () => {
      if (setup()) {
        delete anchor.dataset.fallback;
        refresh();
      }
    };

    if (!setup()) {
      // No WebGL: the hero shows the logo image and the header keeps its icon.
      anchor.dataset.fallback = "true";
      setDock(1, 1);
      return;
    }

    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(anchor);

    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestored);
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("pointerdown", onPointer, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);
    reduceMotion.addEventListener("change", onMotionChange);

    refresh();

    return () => {
      disposed = true;
      stop();
      resizeObserver.disconnect();
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      reduceMotion.removeEventListener("change", onMotionChange);
      if (gl) {
        if (buffer) gl.deleteBuffer(buffer);
        if (program) gl.deleteProgram(program);
      }
    };
  }, []);

  return (
    <div
      ref={anchorRef}
      data-bh-anchor=""
      data-fallback="false"
      aria-hidden="true"
      className={`group ${className ?? ""}`}
    >
      {/* Fixed above the page and the header, and moved by a transform, so the
          mark can fly into the header. Nothing here may create a stacking
          context around the canvas. */}
      <canvas
        ref={canvasRef}
        data-bh-canvas=""
        className="pointer-events-none fixed left-0 top-0 z-55 opacity-0 transition-opacity duration-700 will-change-transform data-[ready=true]:opacity-100 motion-reduce:transition-none"
      />
      <div className="relative hidden size-full group-data-[fallback=true]:block">
        <Image
          src="/icon-512.png"
          alt=""
          fill
          sizes="(min-width: 1024px) 40vw, 90vw"
          className="object-contain"
        />
      </div>
    </div>
  );
}
