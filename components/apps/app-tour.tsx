"use client";

import { useState } from "react";
import type { ComponentType, CSSProperties } from "react";
import { Mark, type ScreenProps } from "./parts";
import { Phone } from "./phone";
import { Rings } from "./rings";
import { Chat } from "./screens/chat";
import { Detail } from "./screens/detail";
import { Explore } from "./screens/explore";
import { MapScreen } from "./screens/map";
import { Welcome } from "./screens/welcome";
import { tour, type TourId } from "./tour";
import { useScrollStage } from "@/hooks/use-scroll-stage";

const COUNT = tour.length;
// How much scrolling moves the tour on by one screen, in svh.
const STEP = 30;

const screens: Record<TourId, ComponentType<ScreenProps>> = {
  welcome: Welcome,
  map: MapScreen,
  chat: Chat,
  explore: Explore,
  detail: Detail,
};

const two = (n: number) => String(n).padStart(2, "0");

/**
 * A tour of TilomNov, the property app, on a phone held in a hand. Like the
 * POS showcase it is a carousel driven by scrolling, but here one phone stays
 * put and its screen changes. The screens are wired to one another as in the
 * app: its tabs, its cards and its back buttons move the tour too.
 */
export function AppTour() {
  const { sectionRef, stageRef, active, onStage, reduced, goTo } =
    useScrollStage(COUNT);

  // How many times the visitor has pressed the phone's screen. The hand
  // presses along with them, as it does when the tour moves on.
  const [presses, setPresses] = useState(0);

  const slide = tour[active];
  const Screen = screens[slide.id];
  const go = (to: TourId) => goTo(tour.findIndex((s) => s.id === to));

  return (
    <section
      ref={sectionRef}
      id="apps"
      aria-label="TilomNov, a mobile app we are releasing soon"
      // One screen for the stage, plus a stretch of scrolling per slide.
      style={{ height: `${100 + COUNT * STEP}svh` }}
      className="relative bg-ink"
    >
      <div
        ref={stageRef}
        className="sticky top-0 h-svh overflow-hidden border-t border-line"
      >
        <Rings />

        <div className="relative mx-auto grid h-full w-full max-w-360 grid-cols-1 grid-rows-[auto_minmax(0,1fr)] gap-y-4 px-5 pt-[calc(4.5rem+env(safe-area-inset-top))] sm:gap-y-6 sm:px-8 lg:grid-cols-12 lg:grid-rows-1 lg:gap-x-12 lg:px-16 lg:pt-[calc(5rem+env(safe-area-inset-top))]">
          <h2 className="sr-only">Mobile apps</h2>

          <div className="lg:col-span-4 lg:self-center lg:pb-12">
            <div className="flex items-center gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white sm:size-12 sm:rounded-2xl">
                <Mark className="h-5.5 sm:h-7" />
              </span>
              <p className="font-display text-lg font-medium tracking-tight sm:text-xl">
                TilomNov
              </p>
              <span className="whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium text-mist ring-1 ring-white/20">
                Release soon
              </span>
              <Steps active={active} goTo={goTo} />
            </div>

            {/* The slides' text shares one cell, so the tallest sets its
                height. */}
            <div className="mt-3 grid sm:mt-6 lg:mt-9">
              {tour.map((s, i) => {
                const state =
                  i === active ? "active" : i < active ? "past" : "next";
                return (
                  <div
                    key={s.id}
                    className={`col-start-1 row-start-1 transition-[opacity,transform] duration-500 motion-reduce:transition-none ${
                      state === "active"
                        ? "delay-150"
                        : `pointer-events-none opacity-0 ${
                            state === "past" ? "-translate-y-6" : "translate-y-6"
                          }`
                    }`}
                  >
                    <h3 className="text-balance font-display text-[1.75rem] font-light leading-[1.06] tracking-[-0.035em] text-silver sm:text-[2.75rem] lg:text-[clamp(2.5rem,3.4vw,3.25rem)] lg:leading-[1.04]">
                      {s.lead} <span className="text-white">{s.accent}</span>
                    </h3>
                    {/* On a phone the room goes to the phone in the hand. */}
                    <p className="mt-4 max-w-120 text-pretty text-lg leading-relaxed text-mist max-sm:hidden">
                      {s.body}
                    </p>
                    <p className="mt-2 flex w-fit items-center gap-2 text-sm font-medium sm:mt-6 sm:h-11 sm:rounded-full sm:bg-white/5 sm:px-5 sm:text-[0.9375rem] sm:ring-1 sm:ring-white/15">
                      <Pointer />
                      {s.hint}
                    </p>
                  </div>
                );
              })}
            </div>

            <p className="mt-10 hidden max-w-80 border-t border-line pt-5 text-sm leading-relaxed text-silver lg:block">
              TilomNov is still in development and will be released soon.
              This is a look at a few of its screens, not the whole app.
            </p>
          </div>

          <div className="phone-frame min-h-0 lg:col-span-4 lg:pt-6">
            {/* The hand comes up from below as the stage arrives, then leans
                a little with the scroll and never quite holds still. */}
            <div
              className={`transition-[translate,opacity] duration-1000 ease-[cubic-bezier(0.2,0.7,0.2,1)] motion-reduce:transition-none ${
                onStage || reduced ? "" : "translate-y-[14%] opacity-0"
              }`}
            >
              <div className="phone-lean">
                <div className="animate-[hand-float_7s_ease-in-out_infinite] motion-reduce:animate-none">
                  <Phone tap={`${active}-${presses}`}>
                    {/* Remounting restarts the screen: on each slide, and
                        each time the stage comes back into view. */}
                    <div
                      key={`${slide.id}-${onStage}`}
                      role="group"
                      aria-label={`The app's ${slide.tab} screen`}
                      onPointerDown={() => setPresses((n) => n + 1)}
                      className="absolute inset-0 animate-[app-in_0.45s_cubic-bezier(0.2,0.7,0.2,1)]"
                    >
                      <Screen
                        play={onStage && !reduced}
                        settled={reduced}
                        go={go}
                      />
                    </div>
                  </Phone>
                </div>
              </div>
            </div>
          </div>

          <Steps active={active} goTo={goTo} listed />
        </div>
      </div>
    </section>
  );
}

/**
 * The tour's steps. Beside the phone on a wide screen they are a list of the
 * screens' names, each with a line that fills as the page scrolls through it;
 * elsewhere there is only room for the lines, in a row.
 */
function Steps({
  active,
  goTo,
  listed = false,
}: {
  active: number;
  goTo: (i: number) => void;
  listed?: boolean;
}) {
  return (
    <nav
      aria-label="Screens of the app"
      className={
        listed
          ? "hidden flex-col lg:col-span-3 lg:col-start-10 lg:flex lg:self-center lg:pb-12"
          : "ml-auto flex items-center lg:hidden"
      }
    >
      {tour.map((s, i) => (
        <button
          key={s.id}
          type="button"
          aria-label={listed ? undefined : s.tab}
          aria-current={i === active ? "true" : undefined}
          onClick={() => goTo(i)}
          className={
            listed ? "group flex gap-5 text-left" : "flex h-10 items-center px-1"
          }
        >
          <span
            className={`block shrink-0 overflow-hidden rounded-full bg-white/15 ${
              listed
                ? "w-0.5"
                : `h-0.75 transition-[width] duration-500 motion-reduce:transition-none ${
                    i === active ? "w-8" : "w-3"
                  }`
            }`}
          >
            <span
              style={
                {
                  "--fill": `clamp(0, calc(var(--at, 0) - ${i}), 1)`,
                } as CSSProperties
              }
              className={`block size-full rounded-full bg-white ${
                listed
                  ? "origin-top [scale:1_var(--fill)]"
                  : "origin-left [scale:var(--fill)_1]"
              }`}
            />
          </span>
          {listed && (
            <span className="block py-3.5">
              <span className="block font-display text-xs font-semibold tabular-nums tracking-wide text-silver/70">
                {two(i + 1)}
              </span>
              <span
                className={`mt-0.5 block font-display text-2xl font-light tracking-tight transition-colors duration-300 ${
                  i === active
                    ? "text-white"
                    : "text-silver/60 group-hover:text-silver"
                }`}
              >
                {s.tab}
              </span>
              <span
                className={`block text-sm transition-colors duration-300 ${
                  i === active ? "text-mist" : "text-silver/50"
                }`}
              >
                {s.caption}
              </span>
            </span>
          )}
        </button>
      ))}
    </nav>
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
