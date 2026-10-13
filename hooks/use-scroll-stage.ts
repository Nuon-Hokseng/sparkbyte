"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "./use-reduced-motion";

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

/**
 * Drives a carousel of `count` slides on a stage: give `sectionRef` to the
 * section and `stageRef` to the screen-high stage inside it.
 *
 * The section is several screens tall and the stage sticks to the top of it,
 * so the stage holds its place while the page scrolls through the section:
 * how far the page has scrolled through decides which slide is `active`, so
 * scrolling down steps forward and scrolling up steps back, and when the last
 * slide has had its turn the stage lets go and the page carries on.
 *
 * That is all it does. It listens to the scroll and never holds, redirects or
 * captures it: the wheel, the trackpad and a finger all scroll the page as
 * they would anywhere else, on a phone as much as with a mouse.
 *
 * The scroll is never written to the stage as a whole, which would restyle
 * everything on it every frame. Only what moves with it is told, by custom
 * properties set on the elements marked for them:
 *   [data-at]       --at, 0..count: the slide, plus how far through it
 *   [data-through]  --through, 0..1: how far through the slide
 *   [data-fill=i]   --fill, 0..1: how much of slide i has gone by
 */
export function useScrollStage(count: number) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  // Where the section starts and how much scrolling it spans, page px.
  const span = useRef({ top: 0, range: 1 });

  const [active, setActive] = useState(0);
  const [onStage, setOnStage] = useState(false);
  const reduced = useReducedMotion();

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

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    if (!section || !stage) return;

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
  }, [count]);

  /** Scrolls to slide `i`: the page moves, and the slide follows it. */
  const goTo = (i: number) => {
    const { top, range } = span.current;
    window.scrollTo({
      // Some way into the slide, so it is unambiguously the active one.
      top: top + ((i + 0.3) / count) * range,
      behavior: reduced ? "auto" : "smooth",
    });
  };

  return { sectionRef, stageRef, active, onStage, reduced, goTo };
}
