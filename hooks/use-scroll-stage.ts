"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "./use-reduced-motion";

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

/**
 * Drives a carousel by scrolling. Give `sectionRef` to a section several
 * screens tall and `stageRef` to a sticky, screen-high stage inside it: how
 * far the page has scrolled through the section decides which of `count`
 * slides is `active`. So scrolling down steps forward, scrolling up steps
 * back.
 *
 * The stage also gets two custom properties to hang motion on. --at runs
 * 0..count: the whole part is the slide, the fraction how far through it the
 * page has scrolled. --through is that fraction alone.
 */
export function useScrollStage(count: number) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  // Where the section starts and how much scrolling it spans, page px.
  const span = useRef({ top: 0, range: 1 });

  const [active, setActive] = useState(0);
  const [onStage, setOnStage] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    if (!section || !stage) return;

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
      stage.style.setProperty("--at", at.toFixed(3));
      stage.style.setProperty("--through", (at - slide).toFixed(3));
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
    // Whatever plays on the stage should only play while it is properly in
    // view.
    const staged = new IntersectionObserver(
      ([entry]) => setOnStage(entry.isIntersecting),
      { threshold: 0.4 },
    );
    const resized = new ResizeObserver(onResize);

    nearby.observe(section);
    staged.observe(stage);
    resized.observe(section);
    window.addEventListener("resize", onResize);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      nearby.disconnect();
      staged.disconnect();
      resized.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [count]);

  /** Scrolls the page to slide `i`. */
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
