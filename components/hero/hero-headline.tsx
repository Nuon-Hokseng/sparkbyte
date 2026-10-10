"use client";

import { Fragment, useEffect, useRef } from "react";
import { JET_SECONDS, POLE_REACH, hole } from "./hole";

type Props = {
  text: string;
  className?: string;
};

/** Mark units. Inside CAPTURE a released letter falls in; inside SNATCH it is taken from the cursor. */
const CAPTURE = 3.3;
const SNATCH = 1.15;
const PULL = 3.0;
/** Seconds a clicked letter takes to collapse into its star. */
const COLLAPSE = 0.14;
/** Seconds after being swallowed: when the jet fires, and when the star leaves the pole. */
const JET_DELAY = 0.55;
const OUT_DELAY = JET_DELAY + JET_SECONDS * 0.8;
/** Seconds the letter takes to re-form once its star is home. */
const POP = 0.3;
/** One unprompted demonstration, this long after load, if nobody has tried it. */
const TEASER_MS = 3400;

// A shooting star: a tail that fades back from a bright head. It is laid out
// pointing right and turned to face its direction of travel.
const STAR =
  "absolute left-0 top-0 hidden h-[3px] origin-right rounded-full bg-linear-to-r from-transparent via-[#b9c8ff]/45 to-white";
const STAR_HEAD =
  "absolute -right-1 top-1/2 size-2.5 -translate-y-1/2 rounded-full bg-white shadow-[0_0_14px_5px_rgba(190,208,255,0.85)]";

type State = "home" | "drag" | "in" | "gone" | "out" | "pop" | "spring";

type Letter = {
  slot: HTMLElement;
  glyph: HTMLElement;
  star: HTMLElement | null;
  state: State;
  // where it is now, client px: the glyph while dragged, the star while flying
  x: number;
  y: number;
  t: number;
  seconds: number;
  // drag
  grabX: number;
  grabY: number;
  rawX: number;
  rawY: number;
  downX: number;
  downY: number;
  moved: number;
  // flight: starts at (ax, ay) and bows sideways by `bow` of its length
  ax: number;
  ay: number;
  bow: number;
  /** True if the letter was still in its place when the flight began. */
  collapsing: boolean;
  jetFired: boolean;
};

const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smoothstep = (lo: number, hi: number, v: number) => {
  const t = clamp01((v - lo) / (hi - lo));
  return t * t * (3 - 2 * t);
};

/**
 * The hero headline, with letters that can be fed to the black hole. Click or
 * tap one (or drag it close) and it collapses into a shooting star that
 * streaks into the hole; the hole flashes and throws it back out along the
 * pole, and the letter re-forms in its place.
 *
 * Screen readers get the plain sentence; the per-letter markup is hidden.
 */
export function HeroHeadline({ text, className }: Props) {
  const rootRef = useRef<HTMLHeadingElement>(null);
  const skyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const sky = skyRef.current;
    if (!root || !sky) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const letters: Letter[] = Array.from(
      root.querySelectorAll<HTMLElement>("[data-slot]"),
    ).map((slot) => ({
      slot,
      glyph: slot.firstElementChild as HTMLElement,
      star: null,
      state: "home",
      x: 0,
      y: 0,
      t: 0,
      seconds: 1,
      grabX: 0,
      grabY: 0,
      rawX: 0,
      rawY: 0,
      downX: 0,
      downY: 0,
      moved: 0,
      ax: 0,
      ay: 0,
      bow: 0,
      collapsing: false,
      jetFired: false,
    }));
    const byGlyph = new Map(letters.map((l) => [l.glyph, l]));

    let raf = 0;
    let last = 0;
    let touched = false;
    let dragging: { letter: Letter; pointerId: number } | null = null;
    let tap: { letter: Letter; x: number; y: number; at: number } | null = null;

    const usable = () => hole.strength > 0.6 && !reduceMotion.matches;
    const home = (l: Letter) => {
      const r = l.slot.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    };
    /** Distance from the hole, in mark units. */
    const reach = (x: number, y: number) =>
      Math.hypot(x - hole.x, y - hole.y) / Math.max(hole.unit, 1);

    function paintGlyph(
      l: Letter,
      dx: number,
      dy: number,
      scaleX: number,
      scaleY: number,
      opacity: number,
    ) {
      l.glyph.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(${scaleX}, ${scaleY})`;
      l.glyph.style.opacity = String(opacity);
    }

    function paintStar(
      l: Letter,
      heading: number,
      length: number,
      size: number,
      opacity: number,
    ) {
      if (!l.star) {
        l.star = document.createElement("span");
        l.star.className = STAR;
        const head = document.createElement("span");
        head.className = STAR_HEAD;
        l.star.appendChild(head);
        sky!.appendChild(l.star);
      }
      const el = l.star;
      el.style.display = "block";
      el.style.width = `${length}px`;
      el.style.opacity = String(opacity);
      // The head (the element's right end) sits at (x, y).
      el.style.transform = `translate3d(${l.x - length}px, ${l.y - 1.5}px, 0) rotate(${heading}rad) scaleY(${size})`;
      // The head inherits the vertical squeeze, so only match it sideways.
      (el.firstElementChild as HTMLElement).style.transform = `scaleX(${size})`;
    }

    function hideStar(l: Letter) {
      if (l.star) l.star.style.display = "none";
    }

    function settle(l: Letter) {
      l.state = "home";
      hideStar(l);
      const g = l.glyph.style;
      g.transform = g.opacity = g.zIndex = g.cursor = g.willChange = g.textShadow = "";
    }

    function wake() {
      if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    }

    /**
     * Moves a star along its bowed path from (ax, ay) to (toX, toY) and draws
     * it. `e` is progress along the path, 0..1.
     */
    function fly(l: Letter, e: number, toX: number, toY: number, dt: number, size: number, opacity: number) {
      const dx = toX - l.ax;
      const dy = toY - l.ay;
      // Bow toward the side the disc is turning, so it curves in like
      // something caught by the hole rather than thrown at it.
      const bx = l.ax + dx * 0.5 - dy * l.bow;
      const by = l.ay + dy * 0.5 + dx * l.bow;
      const u = 1 - e;
      const x = u * u * l.ax + 2 * u * e * bx + e * e * toX;
      const y = u * u * l.ay + 2 * u * e * by + e * e * toY;
      const vx = x - l.x;
      const vy = y - l.y;
      const speed = dt > 0 ? Math.hypot(vx, vy) / dt : 0;
      const heading = speed > 1 ? Math.atan2(vy, vx) : Math.atan2(by - l.ay, bx - l.ax);
      l.x = x;
      l.y = y;
      // The faster it goes, the longer its tail.
      const length = Math.min(240, Math.max(14, speed * 0.085)) * Math.max(size, 0.25);
      paintStar(l, heading, length, size, opacity);
    }

    /** Turns a letter into a star at (fromX, fromY) and sends it to the hole. */
    function startIn(l: Letter, fromX: number, fromY: number, collapsing: boolean) {
      const dist = Math.hypot(hole.x - fromX, hole.y - fromY);
      l.state = "in";
      l.t = 0;
      l.seconds = 0.5 + dist / 2400;
      l.ax = l.x = fromX;
      l.ay = l.y = fromY;
      l.bow = 0.12;
      l.collapsing = collapsing;
      const g = l.glyph.style;
      g.cursor = "";
      g.willChange = "transform, opacity";
      if (!collapsing) {
        g.transform = "";
        g.opacity = "0";
      }
      wake();
    }

    function swallow(l: Letter) {
      l.state = "gone";
      l.t = 0;
      l.jetFired = false;
      hideStar(l);
      l.glyph.style.transform = "";
      l.glyph.style.opacity = "0";
      hole.fed++;
    }

    function tick(now: number) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      let busy = false;

      for (const l of letters) {
        if (l.state === "home") continue;
        busy = true;
        const present = hole.strength > 0.3;
        const h = home(l);

        if (l.state === "drag") {
          // The closer to the hole, the harder it pulls the letter off the
          // cursor, until it takes it.
          let x = l.rawX + l.grabX;
          let y = l.rawY + l.grabY;
          const far = reach(x, y);
          const pull = present && far < PULL ? 0.5 * Math.pow(1 - far / PULL, 2) : 0;
          x = mix(x, hole.x, pull);
          y = mix(y, hole.y, pull);
          l.x = x;
          l.y = y;
          paintGlyph(l, x - h.x, y - h.y, 1 + pull * 0.9, 1 - pull * 0.35, 1);
          if (present && reach(x, y) < SNATCH) {
            dragging = null;
            startIn(l, x, y, false);
          }
        } else if (l.state === "in") {
          if (!present) {
            // The hole has gone (the page was scrolled): put the letter back.
            hideStar(l);
            l.state = "pop";
            l.t = 0;
            continue;
          }
          l.t = Math.min(1, l.t + dt / l.seconds);
          if (l.collapsing) {
            const k = clamp01((l.t * l.seconds) / COLLAPSE);
            paintGlyph(l, 0, 0, 1 - 0.75 * k, 1 - 0.75 * k, 1 - k);
          }
          // It starts slowly and keeps accelerating, as if falling.
          const e = Math.pow(l.t, 2.4);
          const size = 1 - smoothstep(0.86, 1, e);
          fly(l, e, hole.x, hole.y, dt, size, clamp01((l.t * l.seconds) / 0.1));
          if (l.t >= 1) swallow(l);
        } else if (l.state === "gone") {
          l.t += dt;
          // The pole runs up-right and down-left; use the end nearer home.
          const dir: 1 | -1 = h.x - hole.x + (hole.y - h.y) >= 0 ? 1 : -1;
          if (!l.jetFired && l.t >= JET_DELAY && present) {
            l.jetFired = true;
            hole.jetDir = dir;
            hole.jetAt = performance.now();
          }
          if (l.t >= OUT_DELAY) {
            if (present) {
              const tip = POLE_REACH * hole.unit * Math.SQRT1_2 * dir;
              l.state = "out";
              l.t = 0;
              l.ax = l.x = hole.x + tip;
              l.ay = l.y = hole.y - tip;
              l.bow = -0.1;
              l.seconds = 0.45 + Math.hypot(h.x - l.ax, h.y - l.ay) / 2600;
            } else {
              l.state = "pop";
              l.t = 0;
            }
          }
        } else if (l.state === "out") {
          l.t = Math.min(1, l.t + dt / l.seconds);
          // Thrown out fast, slowing as it comes home.
          const e = 1 - Math.pow(1 - l.t, 2.4);
          fly(l, e, h.x, h.y, dt, 1, 1 - smoothstep(0.8, 1, l.t));
          if (l.t >= 1) {
            hideStar(l);
            l.state = "pop";
            l.t = 0;
          }
        } else if (l.state === "pop") {
          // The letter re-forms where its star landed, with a brief glow.
          l.t = Math.min(1, l.t + dt / POP);
          const e = 1 - Math.pow(1 - l.t, 3);
          paintGlyph(l, 0, 0, 0.5 + 0.5 * e, 0.5 + 0.5 * e, e);
          l.glyph.style.textShadow = `0 0 ${(1 - e) * 22}px rgba(190, 208, 255, ${1 - e})`;
          if (l.t >= 1) settle(l);
        } else if (l.state === "spring") {
          const k = 1 - Math.exp(-dt * 12);
          l.x = mix(l.x, h.x, k);
          l.y = mix(l.y, h.y, k);
          paintGlyph(l, l.x - h.x, l.y - h.y, 1, 1, 1);
          if (Math.hypot(l.x - h.x, l.y - h.y) < 0.5) settle(l);
        }
      }

      raf = busy ? requestAnimationFrame(tick) : 0;
    }

    const feed = (l: Letter) => {
      const h = home(l);
      startIn(l, h.x, h.y, true);
    };

    const letterAt = (target: EventTarget | null) => {
      const glyph = (target as Element | null)?.closest?.("[data-glyph]");
      return glyph ? byGlyph.get(glyph as HTMLElement) : undefined;
    };

    const onDown = (e: PointerEvent) => {
      const l = letterAt(e.target);
      if (!l || l.state !== "home" || !usable()) return;
      if (e.pointerType === "touch") {
        // A finger on the headline is usually a scroll, so touch only taps.
        tap = { letter: l, x: e.clientX, y: e.clientY, at: e.timeStamp };
        return;
      }
      if (e.button !== 0) return;
      e.preventDefault();
      touched = true;
      const h = home(l);
      l.state = "drag";
      l.x = h.x;
      l.y = h.y;
      l.grabX = h.x - e.clientX;
      l.grabY = h.y - e.clientY;
      l.rawX = l.downX = e.clientX;
      l.rawY = l.downY = e.clientY;
      l.moved = 0;
      l.glyph.style.cursor = "grabbing";
      l.glyph.style.zIndex = "20";
      l.glyph.style.willChange = "transform";
      l.glyph.setPointerCapture(e.pointerId);
      dragging = { letter: l, pointerId: e.pointerId };
      wake();
    };

    const onMove = (e: PointerEvent) => {
      if (!dragging || dragging.pointerId !== e.pointerId) return;
      const l = dragging.letter;
      l.rawX = e.clientX;
      l.rawY = e.clientY;
      l.moved = Math.max(
        l.moved,
        Math.hypot(e.clientX - l.downX, e.clientY - l.downY),
      );
    };

    const onUp = (e: PointerEvent) => {
      if (tap && e.pointerType === "touch") {
        const { letter, x, y, at } = tap;
        tap = null;
        const still = Math.hypot(e.clientX - x, e.clientY - y) < 12;
        if (still && e.timeStamp - at < 500 && letter.state === "home" && usable()) {
          touched = true;
          feed(letter);
        }
        return;
      }
      if (!dragging || dragging.pointerId !== e.pointerId) return;
      const l = dragging.letter;
      dragging = null;
      if (l.state !== "drag") return;
      l.glyph.style.cursor = "";
      if (!usable()) l.state = "spring";
      else if (l.moved < 5) {
        // A click, not a drag: it goes from where it stands.
        l.glyph.style.transform = "";
        feed(l);
      } else if (reach(l.x, l.y) < CAPTURE) startIn(l, l.x, l.y, false);
      else l.state = "spring";
    };

    const onCancel = (e: PointerEvent) => {
      tap = null;
      if (!dragging || dragging.pointerId !== e.pointerId) return;
      const l = dragging.letter;
      dragging = null;
      if (l.state === "drag") l.state = "spring";
    };

    // Show the trick once, with the letter nearest the hole.
    const teaser = window.setTimeout(() => {
      if (touched || !usable() || window.scrollY > 10 || document.hidden) return;
      let nearest: Letter | null = null;
      let best = Infinity;
      for (const l of letters) {
        const h = home(l);
        const d = reach(h.x, h.y);
        if (d < best) {
          best = d;
          nearest = l;
        }
      }
      if (nearest) feed(nearest);
    }, TEASER_MS);

    root.addEventListener("pointerdown", onDown);
    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerup", onUp);
    root.addEventListener("pointercancel", onCancel);

    return () => {
      window.clearTimeout(teaser);
      if (raf) cancelAnimationFrame(raf);
      root.removeEventListener("pointerdown", onDown);
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerup", onUp);
      root.removeEventListener("pointercancel", onCancel);
      letters.forEach((l) => {
        settle(l);
        l.star?.remove();
      });
    };
  }, [text]);

  const words = text.split(" ");

  return (
    <>
      <h1 ref={rootRef} aria-label={text} className={className}>
        {words.map((word, wi) => (
          <Fragment key={wi}>
            <span aria-hidden="true" className="inline-block whitespace-nowrap">
              {Array.from(word).map((char, ci) => (
                // The slot keeps the letter's place in the line; the glyph is
                // what collapses, or gets carried off.
                <span key={ci} data-slot="" className="inline-block">
                  <span
                    data-glyph=""
                    className="relative inline-block cursor-grab select-none motion-reduce:cursor-auto"
                  >
                    {char}
                  </span>
                </span>
              ))}
            </span>
            {wi < words.length - 1 ? " " : null}
          </Fragment>
        ))}
      </h1>
      {/* Shooting stars are drawn here, in viewport coordinates. */}
      <div
        ref={skyRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-20 overflow-hidden"
      />
    </>
  );
}
