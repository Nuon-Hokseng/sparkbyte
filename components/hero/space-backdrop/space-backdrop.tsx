"use client";

import { useEffect, useRef } from "react";
import { hole, isLowEnd, quality } from "../hole";
import { NEBULA, SKY, VERTEX } from "./shader";

type Props = {
  className?: string;
  /** CSS selector of the element the hole rests in; the sky gathers around it. */
  focus: string;
};

// The sky is soft by nature, so it never needs full retina resolution, and
// weaker devices draw it at one device pixel per CSS pixel.
const MAX_DPR = 1.5;
const MAX_DPR_LOW_END = 1;
const MIN_DPR = 0.75;
/** Stars drift and twinkle slowly, so half the display's frame rate is plenty. */
const FRAME_SECONDS = 1 / 31;

function link(gl: WebGLRenderingContext, fragment: string) {
  const make = (type: number, src: string) => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.warn("SpaceBackdrop shader:", gl.getShaderInfoLog(shader));
      return null;
    }
    return shader;
  };
  const vs = make(gl.VERTEX_SHADER, VERTEX);
  const fs = make(gl.FRAGMENT_SHADER, fragment);
  const program = gl.createProgram();
  if (!vs || !fs || !program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.bindAttribLocation(program, 0, "aPos");
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn("SpaceBackdrop program:", gl.getProgramInfoLog(program));
    return null;
  }
  return program;
}

/**
 * Deep space behind the hero: nebula clouds, distant galaxies and three depths
 * of stars that drift, twinkle and bend around the hole. Purely decorative;
 * without WebGL the hero simply keeps its plain dark background.
 */
export function SpaceBackdrop({ className, focus }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const focusEl = document.querySelector<HTMLElement>(focus);

    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
    });
    if (!gl) return;
    const nebula = link(gl, NEBULA);
    const sky = link(gl, SKY);
    if (!nebula || !sky) return;

    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const texture = gl.createTexture();
    const target = gl.createFramebuffer();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const u = (program: WebGLProgram, name: string) =>
      gl.getUniformLocation(program, name);
    const nebulaU = {
      res: u(nebula, "uRes"),
      focus: u(nebula, "uFocus"),
      scale: u(nebula, "uScale"),
    };
    const skyU = {
      nebula: u(sky, "uNebula"),
      res: u(sky, "uRes"),
      focus: u(sky, "uFocus"),
      scale: u(sky, "uScale"),
      time: u(sky, "uTime"),
      px: u(sky, "uPx"),
      shift: u(sky, "uShift"),
      hole: u(sky, "uHole"),
      pull: u(sky, "uPull"),
      streak: u(sky, "uStreak"),
    };

    const baseDpr = Math.min(
      window.devicePixelRatio || 1,
      isLowEnd() ? MAX_DPR_LOW_END : MAX_DPR,
    );
    let dpr = baseDpr;
    let width = 0;
    let height = 0;
    let focusX = 0;
    let focusY = 0;
    let scale = 1;
    let raf = 0;
    let onScreen = true;
    let lastDraw = 0;
    let lost = false;
    // pointer parallax, eased; -1..1 across the viewport
    let aimX = 0;
    let aimY = 0;
    let shiftX = 0;
    let shiftY = 0;

    /** Sizes the canvas and repaints the nebula texture to match. */
    function layout() {
      const rect = canvas!.getBoundingClientRect();
      // Follows the shared quality, so a slow device gets a smaller sky too.
      dpr = Math.max(MIN_DPR, baseDpr * quality.scale);
      const w = Math.max(1, Math.round(rect.width * dpr));
      const h = Math.max(1, Math.round(rect.height * dpr));
      const fr = focusEl?.getBoundingClientRect();
      const fx = fr ? (fr.left + fr.width / 2 - rect.left) * dpr : w * 0.7;
      const fy = fr ? (rect.bottom - (fr.top + fr.height / 2)) * dpr : h * 0.6;
      // Sub-pixel scroll jitter must not repaint the nebula.
      const moved = Math.abs(fx - focusX) > 2 || Math.abs(fy - focusY) > 2;
      if (w === width && h === height && !moved) return;
      width = w;
      height = h;
      focusX = fx;
      focusY = fy;
      scale = Math.min(w, h);
      canvas!.width = w;
      canvas!.height = h;

      const tw = Math.max(1, Math.round(w / 2));
      const th = Math.max(1, Math.round(h / 2));
      gl!.bindTexture(gl!.TEXTURE_2D, texture);
      gl!.texImage2D(
        gl!.TEXTURE_2D,
        0,
        gl!.RGBA,
        tw,
        th,
        0,
        gl!.RGBA,
        gl!.UNSIGNED_BYTE,
        null,
      );
      gl!.bindFramebuffer(gl!.FRAMEBUFFER, target);
      gl!.framebufferTexture2D(
        gl!.FRAMEBUFFER,
        gl!.COLOR_ATTACHMENT0,
        gl!.TEXTURE_2D,
        texture,
        0,
      );
      gl!.viewport(0, 0, tw, th);
      gl!.useProgram(nebula);
      gl!.uniform2f(nebulaU.res, tw, th);
      gl!.uniform2f(nebulaU.focus, fx / 2, fy / 2);
      gl!.uniform1f(nebulaU.scale, scale / 2);
      gl!.drawArrays(gl!.TRIANGLES, 0, 3);
      gl!.bindFramebuffer(gl!.FRAMEBUFFER, null);
    }

    function draw(seconds: number, still: boolean) {
      if (lost) return;
      layout();
      const rect = canvas!.getBoundingClientRect();
      shiftX += (aimX - shiftX) * 0.06;
      shiftY += (aimY - shiftY) * 0.06;

      gl!.viewport(0, 0, width, height);
      gl!.useProgram(sky);
      gl!.activeTexture(gl!.TEXTURE0);
      gl!.bindTexture(gl!.TEXTURE_2D, texture);
      gl!.uniform1i(skyU.nebula, 0);
      gl!.uniform2f(skyU.res, width, height);
      gl!.uniform2f(skyU.focus, focusX, focusY);
      gl!.uniform1f(skyU.scale, scale);
      gl!.uniform1f(skyU.time, seconds);
      gl!.uniform1f(skyU.px, dpr);
      gl!.uniform2f(skyU.shift, -shiftX * 14 * dpr, shiftY * 14 * dpr);
      gl!.uniform2f(
        skyU.hole,
        (hole.x - rect.left) * dpr,
        (rect.bottom - hole.y) * dpr,
      );
      gl!.uniform1f(skyU.pull, still ? 0 : hole.unit * 0.85 * dpr * hole.strength);
      gl!.uniform1f(skyU.streak, still ? 0 : 1);
      gl!.drawArrays(gl!.TRIANGLES, 0, 3);
      canvas!.dataset.ready = "true";
    }

    function tick(now: number) {
      raf = requestAnimationFrame(tick);
      const seconds = now / 1000;
      if (seconds - lastDraw < FRAME_SECONDS) return;
      lastDraw = seconds;
      draw(seconds, false);
    }

    function stop() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }

    function refresh() {
      stop();
      if (lost) return;
      if (reduceMotion.matches) {
        // One still frame: no drift, no twinkle, no streaks.
        draw(3, true);
      } else if (onScreen && !document.hidden) {
        raf = requestAnimationFrame(tick);
      }
    }

    const onPointer = (e: PointerEvent) => {
      aimX = (e.clientX / window.innerWidth) * 2 - 1;
      aimY = (e.clientY / window.innerHeight) * 2 - 1;
    };
    const intersection = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      refresh();
    });
    const resize = new ResizeObserver(() => {
      if (reduceMotion.matches) refresh();
    });
    const onLost = (e: Event) => {
      e.preventDefault();
      lost = true;
      stop();
    };

    canvas.addEventListener("webglcontextlost", onLost);
    window.addEventListener("pointermove", onPointer, { passive: true });
    document.addEventListener("visibilitychange", refresh);
    reduceMotion.addEventListener("change", refresh);
    intersection.observe(canvas);
    resize.observe(canvas);
    refresh();

    return () => {
      stop();
      canvas.removeEventListener("webglcontextlost", onLost);
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("visibilitychange", refresh);
      reduceMotion.removeEventListener("change", refresh);
      intersection.disconnect();
      resize.disconnect();
    };
  }, [focus]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none opacity-0 transition-opacity duration-1000 data-[ready=true]:opacity-100 motion-reduce:transition-none ${className ?? ""}`}
    />
  );
}
