"use client";

import Link from "next/link";
import { useState } from "react";
import { Orbit } from "./orbit";
import { STEPS, STONES } from "./stones";

const two = (n: number) => String(n).padStart(2, "0");

// A scatter of faint stars behind the planet. They are worked out, not
// random, so that the server and the browser draw the same sky.
const STARS = Array.from({ length: 46 }, (_, i) => {
  const at = (n: number) => ((Math.sin(i * n) * 43758.5453) % 1 + 1) % 1;
  return {
    left: `${(at(12.9898) * 100).toFixed(2)}%`,
    top: `${(at(78.233) * 100).toFixed(2)}%`,
    opacity: Number((0.15 + at(39.425) * 0.5).toFixed(2)),
    big: at(93.989) > 0.82,
  };
});

/** Where a stone has got to, in words. */
function progress(done: number) {
  if (done >= STEPS.length) return "all four steps done";
  if (done === 0) return "starts at step 1, with you";
  return `at step ${done + 1} of ${STEPS.length}`;
}

/**
 * How we work: the four steps everything we make goes through, beside the
 * Earth and the stones in orbit round it, one for each thing made or still to
 * be made. Picking a stone says what it is and marks, on the steps, how far
 * it has come.
 */
export function Process() {
  const [picked, setPicked] = useState<number | null>(null);
  const stone = picked === null ? null : STONES[picked];
  const made = STONES.filter((s) => s.made).length;

  return (
    <section
      id="process"
      aria-labelledby="process-title"
      className="relative overflow-hidden border-t border-line bg-ink"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {STARS.map((star, i) => (
          <span
            key={i}
            style={{ left: star.left, top: star.top, opacity: star.opacity }}
            className={`absolute rounded-full bg-white ${
              star.big ? "size-0.5" : "size-px"
            }`}
          />
        ))}
      </div>

      <div className="relative mx-auto grid w-full max-w-360 gap-y-10 px-5 py-20 sm:px-8 lg:grid-cols-12 lg:gap-x-12 lg:gap-y-12 lg:px-16 lg:py-28">
        <div className="lg:col-span-5 lg:self-end">
          <h2
            id="process-title"
            className="font-display text-xl font-normal tracking-tight text-mist sm:text-2xl"
          >
            How we work
          </h2>
          <p className="mt-4 text-balance font-display text-[1.75rem] font-light leading-[1.06] tracking-[-0.035em] text-silver sm:mt-6 sm:text-[2.75rem] lg:text-[clamp(2.75rem,3.9vw,3.75rem)] lg:leading-[1.02]">
            Your business is the world.{" "}
            <span className="text-white sm:block">We build around it.</span>
          </p>
          <p className="mt-4 max-w-120 text-pretty text-sm leading-relaxed text-mist sm:text-lg">
            Everything we make starts from how a business really runs, and
            goes through the same four steps. Each stone in orbit is one of
            those things: {made} made so far, {STONES.length - made} still dark.
          </p>
        </div>

        <div className="lg:col-span-7 lg:col-start-6 lg:row-span-2 lg:row-start-1 lg:self-center">
          <Orbit
            picked={picked}
            onPick={(i) => setPicked((now) => (now === i ? null : i))}
          />

          {/* What the picked stone is. The hint and each stone's card share
              one cell, so picking never moves the page. */}
          <div aria-live="polite" className="mx-auto mt-2 grid max-w-136">
            <p
              className={`col-start-1 row-start-1 flex h-11 w-fit items-center gap-2 self-start justify-self-center rounded-full bg-white/5 px-5 text-[0.9375rem] font-medium ring-1 ring-white/15 transition-opacity duration-300 motion-reduce:transition-none ${
                stone ? "invisible opacity-0" : ""
              }`}
            >
              <Pointer />
              Try it: drag the ring, or click a stone
            </p>
            {STONES.map((s, i) => (
              <div
                key={s.id}
                inert={i !== picked}
                className={`col-start-1 row-start-1 rounded-2xl bg-white/5 p-5 ring-1 ring-white/12 transition-[opacity,transform] duration-300 motion-reduce:transition-none sm:p-6 ${
                  i === picked ? "" : "invisible translate-y-3 opacity-0"
                }`}
              >
                <div className="flex items-center gap-3">
                  <p className="font-display text-2xl font-normal tracking-tight">
                    {s.name}
                  </p>
                  <span className="whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium text-mist ring-1 ring-white/20">
                    {s.status}
                  </span>
                  <button
                    type="button"
                    aria-label="Let the stone go"
                    onClick={() => setPicked(null)}
                    className="-mr-2 ml-auto grid size-11 place-items-center rounded-full text-silver transition-colors hover:text-white"
                  >
                    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="size-4">
                      <path
                        d="M3.5 3.5l9 9M12.5 3.5l-9 9"
                        stroke="currentColor"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </div>
                <p className="mt-2 text-pretty text-[0.9375rem] leading-relaxed text-mist">
                  {s.text}
                </p>
                <Link
                  href={s.link.href}
                  className={
                    s.made
                      ? "mt-4 inline-block border-b border-silver/60 pb-1 text-[0.9375rem] font-medium transition-colors hover:border-white"
                      : "mt-4 inline-flex h-11 items-center rounded-full bg-white px-5 text-[0.9375rem] font-semibold text-ink transition-colors hover:bg-mist"
                  }
                >
                  {s.link.label}
                </Link>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 lg:self-start">
          <p className="text-sm text-silver sm:text-[0.9375rem]">
            {stone
              ? `${stone.name}: ${progress(stone.done)}.`
              : "The same four steps, every time."}
          </p>
          <ol className="mt-3">
            {STEPS.map((step, i) => {
              // With a stone picked, each step is behind it, under way or
              // still ahead of it.
              const state = !stone
                ? "plain"
                : i < stone.done
                  ? "done"
                  : i === stone.done
                    ? "now"
                    : "ahead";
              return (
                <li
                  key={step.name}
                  className="grid grid-cols-[2.5rem_1fr] border-t border-line py-4"
                >
                  <span className="pt-1.5 font-display text-xs font-semibold tabular-nums tracking-wide text-silver/70">
                    {two(i + 1)}
                  </span>
                  <div>
                    <p className="flex items-center gap-3">
                      <span
                        className={`font-display text-2xl font-light tracking-tight transition-colors duration-300 ${
                          state === "ahead" ? "text-silver/50" : "text-white"
                        }`}
                      >
                        {step.name}
                      </span>
                      {state === "done" && <Tag>Done</Tag>}
                      {state === "now" && (
                        <Tag lit>{stone?.done ? "Under way" : "Starts here"}</Tag>
                      )}
                    </p>
                    <p
                      className={`mt-1 max-w-104 text-pretty text-[0.9375rem] leading-snug transition-colors duration-300 ${
                        state === "ahead" ? "text-silver/50" : "text-silver"
                      }`}
                    >
                      {step.text}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}

/** Where a step stands for the picked stone. `lit` marks the one in hand. */
function Tag({ lit = false, children }: { lit?: boolean; children: string }) {
  return (
    <span
      className={`flex animate-[mock-in_0.3s_ease-out] items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 motion-reduce:animate-none ${
        lit ? "text-glow ring-glow/50" : "text-mist ring-white/20"
      }`}
    >
      {!lit && (
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="size-3">
          <path
            d="M3.5 8.4l2.8 2.8 6.2-6.6"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      {children}
    </span>
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
