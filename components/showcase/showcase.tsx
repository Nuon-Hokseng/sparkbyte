"use client";

import type { ComponentType, CSSProperties } from "react";
import { BusinessType } from "./demos/business-type";
import { Fields } from "./demos/fields";
import { FloorPlan } from "./demos/floor-plan";
import type { DemoProps } from "./demos/kit";
import { TableOrder } from "./demos/table-order";
import { TableSizes } from "./demos/table-sizes";
import { Tabs } from "./demos/tabs";
import { Paper } from "./paper";
import { slides, type SlideId } from "./slides";
import { useScrollStage } from "@/hooks/use-scroll-stage";

const COUNT = slides.length;
// How much scrolling moves the carousel on by one slide, in svh. Short, so
// the whole set passes in under two screens.
const STEP = 28;

const demos: Record<SlideId, ComponentType<DemoProps>> = {
  type: BusinessType,
  fields: Fields,
  tabs: Tabs,
  order: TableOrder,
  seats: TableSizes,
  floor: FloorPlan,
};

// On a wide screen the text and the demo swap sides from one slide to the
// next: [text, demo] for even slides, then for odd ones.
const SIDES = [
  ["lg:col-start-1", "lg:col-start-6"],
  ["lg:col-start-8", "lg:col-start-1"],
];

const two = (n: number) => String(n).padStart(2, "0");

/**
 * A carousel driven by scrolling: the stage sticks to the viewport while the
 * page scrolls through the section, and every slide plays again each time it
 * returns.
 *
 * Each slide brings its own text and its own live demo: a piece of the POS
 * that shows itself off, then is the visitor's to try. The scroll itself is
 * always on show: the step being filled in the progress row, the paper
 * sliding behind, the demo easing past.
 */
export function Showcase() {
  const { sectionRef, stageRef, active, onStage, reduced, goTo } =
    useScrollStage(COUNT);

  const slide = slides[active];
  const Demo = demos[slide.id];
  const [textSide, demoSide] = SIDES[active % 2];

  return (
    <section
      ref={sectionRef}
      id="pos"
      aria-label="What you can set up in the POS"
      // One screen for the stage, plus a stretch of scrolling per slide.
      style={{ height: `${100 + COUNT * STEP}svh` }}
      className="relative bg-ink"
    >
      <div ref={stageRef} className="sticky top-0 h-svh overflow-hidden">
        <Paper />

        <div className="relative mx-auto grid h-full w-full max-w-360 grid-cols-1 content-center gap-y-3 px-5 pb-6 pt-[calc(4.5rem+env(safe-area-inset-top))] sm:gap-y-5 sm:px-8 lg:grid-cols-12 lg:gap-x-12 lg:gap-y-7 lg:px-16 lg:pt-[calc(5rem+env(safe-area-inset-top))]">
          <h2 className="sr-only">One POS, set up for the way you sell.</h2>

          {/* The progress row: which slide this is, and how far through it
              the page has scrolled. It sits above whichever side the text is
              on. */}
          <div
            className={`row-start-1 flex items-center gap-3 sm:gap-4 lg:col-span-5 ${textSide}`}
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/5 ring-1 ring-white/12 sm:size-12 sm:rounded-2xl">
              <svg
                key={slide.id}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="size-5 animate-[mock-pop_0.4s_ease-out] motion-reduce:animate-none sm:size-6"
              >
                <path d={slide.icon} />
              </svg>
            </span>
            <p className="font-display text-sm font-semibold tabular-nums tracking-wide sm:text-base">
              <span className="sr-only">Slide </span>
              <span>{two(active + 1)}</span>
              <span aria-hidden="true" className="text-silver/70">
                /
              </span>
              <span className="sr-only"> of </span>
              <span className="text-silver/70">{two(COUNT)}</span>
            </p>
            <nav aria-label="What you can set up" className="flex items-center">
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  aria-label={s.tab}
                  aria-current={i === active ? "true" : undefined}
                  onClick={() => goTo(i)}
                  className="group flex h-10 items-center px-1"
                >
                  <span
                    className={`block h-0.75 overflow-hidden rounded-full bg-white/15 transition-[width,background-color] duration-500 group-hover:bg-white/30 motion-reduce:transition-none ${
                      i === active ? "w-10" : "w-3.5"
                    }`}
                  >
                    {/* Fills as the page scrolls through this slide. */}
                    <span
                      style={{
                        transform: `scaleX(clamp(0, calc(var(--at, 0) - ${i}), 1))`,
                      }}
                      className="block h-full origin-left rounded-full bg-white"
                    />
                  </span>
                </button>
              ))}
            </nav>
          </div>

          {/* The slides' text shares one row, so the tallest sets its height. */}
          {slides.map((s, i) => {
            const state = i === active ? "active" : i < active ? "past" : "next";
            return (
              <div
                key={s.id}
                className={`col-start-1 row-start-2 transition-[opacity,transform] duration-500 motion-reduce:transition-none lg:col-span-5 ${
                  SIDES[i % 2][0]
                } ${
                  state === "active"
                    ? "delay-150"
                    : `pointer-events-none opacity-0 ${
                        state === "past" ? "-translate-y-6" : "translate-y-6"
                      }`
                }`}
              >
                {/* Set like the hero's headline; the opening half is dimmed
                    so the second carries it. */}
                <h3 className="text-balance font-display text-[1.75rem] font-light leading-[1.06] tracking-[-0.035em] text-silver sm:text-[2.75rem] lg:text-[clamp(2.75rem,3.9vw,3.75rem)] lg:leading-[1.02]">
                  {s.lead} <span className="text-white">{s.accent}</span>
                </h3>
                <p className="mt-2 max-w-120 text-pretty text-sm leading-relaxed text-mist sm:mt-4 sm:text-lg">
                  {s.body}
                </p>
                <dl className="mt-8 hidden grid-cols-3 xl:grid">
                  {s.points.map(([name, text], p) => (
                    <div
                      key={name}
                      className={
                        p ? "border-l border-line pl-4 pr-2" : "pr-2"
                      }
                    >
                      <dt className="flex items-center gap-1.5 text-[0.9375rem] font-medium">
                        <Tick />
                        {name}
                      </dt>
                      <dd className="mt-1 text-sm leading-snug text-silver">
                        {text}
                      </dd>
                    </div>
                  ))}
                </dl>
                {/* A line of text on a phone, a pill from there up. */}
                <p className="mt-2 flex w-fit items-center gap-2 text-sm font-medium sm:mt-6 sm:h-11 sm:rounded-full sm:bg-white/5 sm:px-5 sm:text-[0.9375rem] sm:ring-1 sm:ring-white/15 xl:mt-8">
                  <Pointer />
                  {s.hint}
                </p>
              </div>
            );
          })}

          <div
            role="group"
            aria-label={`Live demo: ${slide.tab}`}
            className={`demo-frame row-start-3 lg:col-span-7 lg:row-span-2 lg:row-start-1 lg:self-center ${demoSide}`}
          >
            {/* Remounting restarts the demo: on each slide, and each time the
                stage comes back into view. It arrives from its own side. */}
            <div
              key={`${slide.id}-${onStage}`}
              style={
                { "--enter-x": active % 2 ? "-2.5rem" : "2.5rem" } as CSSProperties
              }
              className="demo-canvas mx-auto animate-[screen-in_0.6s_cubic-bezier(0.2,0.7,0.2,1)] text-left text-mock-ink"
            >
              <Demo play={onStage && !reduced} settled={reduced} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Tick() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className="size-4 shrink-0 text-silver"
    >
      <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M5.4 8.2l1.8 1.8 3.4-3.7"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Pointer() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className="size-4 shrink-0 text-silver"
    >
      <path
        d="M3.5 2.5l9.5 5-4 1.4-1.5 4z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}
