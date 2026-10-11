"use client";

import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useReducedMotion } from "./use-reduced-motion";

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

// A touch screen with nothing that hovers: a phone or a tablet. globals.css
// asks the same question, to size the section.
const TOUCH = "(hover: none) and (pointer: coarse)";
const subscribeTouch = (onChange: () => void) => {
  const mq = window.matchMedia(TOUCH);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};

/** How long a slide the visitor has touched stays up, in ms. */
const HELD = 16000;
/** How far a finger has to travel for its swipe to count, in px. */
const SWIPE = 44;
/** The stage counts as in place when this close to the top, in viewports. */
const NEAR = 0.2;

/**
 * Drives a carousel of `count` slides on a stage: give `sectionRef` to the
 * section and `stageRef` to the screen-high stage inside it. It works in one
 * of two ways.
 *
 * With a mouse or a trackpad the section is several screens tall and the
 * stage sticks: how far the page has scrolled through the section decides
 * which slide is `active`, so scrolling down steps forward and scrolling up
 * steps back.
 *
 * On a touch screen (`paged`) the section is one screen tall and the slide is
 * the stage's own business. A swipe up or down on it moves exactly one slide,
 * and past either end goes on to the neighbouring section; left alone, the
 * slides change by themselves every `dwell` ms. Touching the stage keeps its
 * slide up for longer. `timed` says that the slide showing is on that clock.
 *
 * The scroll is never written to the stage as a whole, which would restyle
 * everything on it every frame. Only what moves with it is told, by custom
 * properties set on the elements marked for them:
 *   [data-at]       --at, 0..count: the slide, plus how far through it
 *   [data-through]  --through, 0..1: how far through the slide
 *   [data-fill=i]   --fill, 0..1: how much of slide i has gone by
 * When paged there is no "how far through": --at is the slide alone.
 */
export function useScrollStage(count: number, dwell = 7000) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  // Where the section starts and how much scrolling it spans, page px.
  const span = useRef({ top: 0, range: 1 });

  const [active, setActive] = useState(0);
  const [onStage, setOnStage] = useState(false);
  // How many times the visitor has touched the slide that is showing.
  const [touches, setTouches] = useState(0);
  const reduced = useReducedMotion();
  const paged = useSyncExternalStore(
    subscribeTouch,
    () => window.matchMedia(TOUCH).matches,
    () => false,
  );

  const step = (to: number) => {
    setActive(to);
    setTouches(0);
  };

  // Whatever plays on the stage should only play while it is mostly in view.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const staged = new IntersectionObserver(
      ([entry]) => setOnStage(entry.isIntersecting),
      { threshold: 0.5 },
    );
    staged.observe(stage);
    return () => staged.disconnect();
  }, []);

  // ── With a mouse: the scroll decides ──────────────────────────────────────
  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    // `paged` is false while the page hydrates, whatever the screen is.
    if (!section || !stage || paged || window.matchMedia(TOUCH).matches) return;

    const marked = (name: string) =>
      Array.from(stage.querySelectorAll<HTMLElement>(`[data-${name}]`));
    const ats = marked("at");
    const throughs = marked("through");
    const fills = marked("fill").map((el) => ({
      el,
      index: Number(el.dataset.fill),
      shown: -1,
    }));

    let raf = 0;
    let listening = false;

    const measure = () => {
      const rect = section.getBoundingClientRect();
      span.current.top = rect.top + window.scrollY;
      span.current.range = Math.max(1, rect.height - window.innerHeight);
    };

    const update = () => {
      raf = 0;
      const { top, range } = span.current;
      const at = clamp((window.scrollY - top) / range, 0, 1) * count;
      const slide = Math.min(count - 1, Math.floor(at));
      setActive(slide);
      for (const el of ats) el.style.setProperty("--at", at.toFixed(3));
      for (const el of throughs) {
        el.style.setProperty("--through", (at - slide).toFixed(3));
      }
      for (const fill of fills) {
        const shown = Math.round(clamp(at - fill.index, 0, 1) * 1000) / 1000;
        if (shown === fill.shown) continue;
        fill.shown = shown;
        fill.el.style.setProperty("--fill", String(shown));
      }
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    const onResize = () => {
      measure();
      onScroll();
    };

    // Only follow the scroll while the section is anywhere near the screen.
    const nearby = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting === listening) return;
        listening = entry.isIntersecting;
        if (listening) {
          measure();
          window.addEventListener("scroll", onScroll, { passive: true });
          onScroll();
        } else {
          window.removeEventListener("scroll", onScroll);
        }
      },
      { rootMargin: "50% 0px" },
    );
    const resized = new ResizeObserver(onResize);

    nearby.observe(section);
    resized.observe(section);
    window.addEventListener("resize", onResize);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      nearby.disconnect();
      resized.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      for (const el of ats) el.style.removeProperty("--at");
      for (const el of throughs) el.style.removeProperty("--through");
      for (const { el } of fills) el.style.removeProperty("--fill");
    };
  }, [count, paged]);

  // ── On a touch screen: a swipe is a step ──────────────────────────────────
  const swipe = useEffectEvent((dir: 1 | -1) => {
    const section = sectionRef.current;
    if (!section) return;
    const rect = section.getBoundingClientRect();
    const top = rect.top + window.scrollY;
    const scroll = (to: number) =>
      window.scrollTo({ top: to, behavior: reduced ? "auto" : "smooth" });
    // Onwards is the section after this one. Back is the one before it, or
    // as much of it as a screen shows.
    const leave = () => {
      if (dir > 0) return scroll(top + rect.height);
      const before = section.previousElementSibling?.getBoundingClientRect();
      const start = before ? before.top + window.scrollY : 0;
      scroll(Math.max(start, top - window.innerHeight));
    };

    if (Math.abs(rect.top) > window.innerHeight * NEAR) {
      // The stage is only partly on screen. A swipe towards it brings it
      // in; a swipe away lets it go.
      if ((dir > 0) === (rect.top > 0)) scroll(top);
      else leave();
      return;
    }
    const next = active + dir;
    if (next < 0 || next >= count) return leave();
    if (Math.abs(rect.top) > 1) scroll(top);
    step(next);
  });

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !paged) return;

    // From here on a finger moving up or down the stage no longer scrolls
    // the page (see [data-paged] in globals.css): it is read as a swipe.
    // Set from here, so that without JavaScript the page still scrolls.
    stage.dataset.paged = "";

    // The swipe in progress: where it began, the list inside the stage it
    // began on (if any) and how far down that was scrolled, and whether it
    // has been dealt with.
    let touch: {
      x: number;
      y: number;
      list: Element | null;
      from: number;
      done: boolean;
    } | null = null;

    const onStart = (e: TouchEvent) => {
      touch = null;
      if (e.touches.length !== 1) return;
      let list: Element | null = null;
      for (
        let el = e.target as Element | null;
        el && el !== stage;
        el = el.parentElement
      ) {
        const style = getComputedStyle(el);
        // Something that is dragged about keeps its touches to itself.
        if (style.touchAction === "none") return;
        if (
          /auto|scroll/.test(style.overflowY) &&
          el.scrollHeight > el.clientHeight + 1
        ) {
          list = el;
          break;
        }
      }
      const { clientX, clientY } = e.touches[0];
      touch = {
        x: clientX,
        y: clientY,
        list,
        from: list?.scrollTop ?? 0,
        done: false,
      };
    };

    const onMove = (e: TouchEvent) => {
      if (!touch || touch.done) return;
      const dx = e.touches[0].clientX - touch.x;
      const dy = e.touches[0].clientY - touch.y;
      if (e.touches.length !== 1) touch.done = true;
      if (touch.done || Math.abs(dy) < SWIPE || Math.abs(dy) < Math.abs(dx) * 1.5) {
        return;
      }
      touch.done = true;
      const dir = dy < 0 ? 1 : -1;
      // A list that can still scroll that way keeps the swipe; one already
      // at its end passes it on.
      const { list, from } = touch;
      if (list) {
        const room = list.scrollHeight - list.clientHeight;
        if (dir > 0 ? from < room - 1 : from > 1) return;
      }
      swipe(dir);
    };

    const onEnd = () => {
      touch = null;
    };
    // If the page scrolls under the finger after all, the browser has taken
    // the swipe as its own.
    const onScroll = () => {
      if (touch) touch.done = true;
    };
    const onTouched = () => setTouches((n) => n + 1);

    stage.addEventListener("touchstart", onStart, { passive: true });
    stage.addEventListener("touchmove", onMove, { passive: true });
    stage.addEventListener("touchend", onEnd, { passive: true });
    stage.addEventListener("touchcancel", onEnd, { passive: true });
    stage.addEventListener("pointerdown", onTouched, { passive: true });
    stage.addEventListener("keydown", onTouched);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      delete stage.dataset.paged;
      stage.removeEventListener("touchstart", onStart);
      stage.removeEventListener("touchmove", onMove);
      stage.removeEventListener("touchend", onEnd);
      stage.removeEventListener("touchcancel", onEnd);
      stage.removeEventListener("pointerdown", onTouched);
      stage.removeEventListener("keydown", onTouched);
      window.removeEventListener("scroll", onScroll);
    };
  }, [paged]);

  // The backdrop shifts once for each step.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !paged) return;
    for (const el of stage.querySelectorAll<HTMLElement>("[data-at]")) {
      el.style.setProperty("--at", String(active));
    }
  }, [paged, active]);

  // Left alone, the slides change by themselves, round and round.
  const timed = paged && onStage && !reduced && touches === 0;
  const waiting = paged && onStage && !reduced;
  const advance = useEffectEvent(() => step((active + 1) % count));
  useEffect(() => {
    if (!waiting) return;
    const timer = window.setTimeout(advance, touches ? HELD : dwell);
    return () => window.clearTimeout(timer);
  }, [waiting, active, touches, dwell]);

  /** Goes to slide `i`. */
  const goTo = (i: number) => {
    if (paged) return step(i);
    const { top, range } = span.current;
    window.scrollTo({
      // Some way into the slide, so it is unambiguously the active one.
      top: top + ((i + 0.3) / count) * range,
      behavior: reduced ? "auto" : "smooth",
    });
  };

  return {
    sectionRef,
    stageRef,
    active,
    onStage,
    reduced,
    goTo,
    paged,
    timed,
    dwell,
  };
}
