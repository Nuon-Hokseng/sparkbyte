"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";

// What to call each part of the page while on the way to it.
const NAMES: Record<string, string> = {
  top: "SparkByte",
  pos: "POS systems",
  apps: "Mobile apps",
  process: "How we work",
  contact: "Contact",
};

/** Anything nearer than this many screens is simply scrolled to. */
const FAR = 1.6;
// The three parts of a trip, in ms: the dark closing over the page, the pause
// while the page moves underneath it, and the dark lifting off again.
const COVER = 460;
const HOLD = 560;
const REVEAL = 520;

// The streaks of light that fly past on the way: the angle each leaves at,
// and how long after the others it sets off.
const STREAKS = Array.from({ length: 24 }, (_, i) => ({
  turn: i * 15 + (i % 2 ? 5 : -4),
  delay: (i * 137) % 420,
  long: i % 3 === 0,
}));

type Trip = {
  phase: "cover" | "hold" | "reveal";
  /** Where the dark spreads from, and how far it must reach, in px. */
  x: number;
  y: number;
  reach: number;
  name: string;
};

/**
 * Carries the visitor to a distant part of the page. A link to somewhere on
 * this page that is more than a screen or so away would otherwise scroll
 * there past everything in between, carousels and all, in a blur. Instead
 * the dark spreads out from the link over the page, the page moves underneath
 * while the mark and a few streaks of light say that it is moving, and the
 * dark lifts on the place asked for.
 *
 * Nearby links scroll as they always did, and so does everything for a
 * visitor who has asked for less motion. Renders nothing between trips.
 */
export function Travel() {
  const [trip, setTrip] = useState<Trip | null>(null);
  const busy = useRef(false);

  useEffect(() => {
    let timers: number[] = [];

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as Element | null)?.closest?.("a[href]");
      if (!(link instanceof HTMLAnchorElement)) return;
      const url = new URL(link.href);
      if (
        url.origin !== window.location.origin ||
        url.pathname !== window.location.pathname ||
        url.hash.length < 2
      ) {
        return;
      }
      const id = decodeURIComponent(url.hash.slice(1));
      const target = document.getElementById(id);
      if (!target) return;
      // A second link pressed on the way is ignored.
      if (busy.current) return e.preventDefault();
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const away = Math.abs(target.getBoundingClientRect().top);
      if (away < window.innerHeight * FAR) return;

      e.preventDefault();
      busy.current = true;

      // From the link itself: where it was pressed, or its middle if it was
      // pressed from the keyboard.
      const box = link.getBoundingClientRect();
      const x = e.clientX || box.left + box.width / 2;
      const y = e.clientY || box.top + box.height / 2;
      const reach = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y),
      );
      setTrip({ phase: "cover", x, y, reach, name: NAMES[id] ?? "" });

      const after = (ms: number, run: () => void) =>
        timers.push(window.setTimeout(run, ms));
      after(COVER, () => {
        // The address first, so that the browser's Back button remembers
        // where the visitor was and can take them there again. Then the
        // move: under cover, so at once. It honours the page's own allowance
        // for the header, as a link would.
        window.history.pushState(null, "", url.hash);
        target.scrollIntoView({ behavior: "instant", block: "start" });
        // Reading on, and tabbing on, carry on from the new place.
        if (!target.hasAttribute("tabindex")) target.tabIndex = -1;
        target.focus({ preventScroll: true });
        setTrip((now) => now && { ...now, phase: "hold" });
      });
      after(COVER + HOLD, () =>
        setTrip((now) => now && { ...now, phase: "reveal" }),
      );
      after(COVER + HOLD + REVEAL, () => {
        setTrip(null);
        busy.current = false;
      });
    };

    // Ahead of the links' own handling, which would start scrolling.
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      timers.forEach((timer) => window.clearTimeout(timer));
      timers = [];
    };
  }, []);

  if (!trip) return null;
  const { phase, x, y, reach, name } = trip;
  const leaving = phase === "reveal";

  return (
    <div
      style={{ transitionDuration: `${REVEAL}ms` }}
      className={`fixed inset-0 z-70 touch-none overflow-hidden transition-opacity ease-out ${
        leaving ? "pointer-events-none opacity-0" : ""
      }`}
    >
      <p role="status" className="sr-only">
        {name ? `Going to ${name}` : "Moving down the page"}
      </p>

      {/* The dark, spreading from where the link was pressed. It is one disc
          that only ever grows, so nothing has to be painted again. */}
      <div
        aria-hidden="true"
        style={{
          left: x,
          top: y,
          width: reach * 2,
          height: reach * 2,
          animationDuration: `${COVER}ms`,
        }}
        className="absolute -translate-x-1/2 -translate-y-1/2 animate-[travel-cover_cubic-bezier(0.4,0,0.2,1)_both] rounded-full bg-ink will-change-transform"
      />

      <div
        aria-hidden="true"
        style={{ transitionDuration: `${REVEAL}ms` }}
        className={`absolute inset-0 grid place-items-center transition-[scale,opacity] ease-in ${
          leaving ? "scale-150 opacity-0" : ""
        }`}
      >
        {/* Streaks of light going by, out from the middle. */}
        {STREAKS.map((streak) => (
          <span
            key={streak.turn}
            style={{ rotate: `${streak.turn}deg` }}
            className="absolute left-1/2 top-1/2 h-0.5 w-[46vmax] origin-left"
          >
            <span
              style={
                {
                  animationDelay: `${COVER * 0.5 + streak.delay}ms`,
                  "--streak": streak.long ? "22vmax" : "12vmax",
                } as CSSProperties
              }
              className="block h-full w-(--streak) animate-[travel-streak_0.7s_ease-in_infinite_both] rounded-full bg-linear-to-r from-transparent to-glow"
            />
          </span>
        ))}

        <div
          style={{ animationDelay: `${COVER * 0.6}ms` }}
          className="relative grid animate-[travel-in_0.45s_cubic-bezier(0.2,0.7,0.2,1)_both] place-items-center"
        >
          {/* An orbit round the mark, seen at an angle. */}
          <span className="absolute size-44 -rotate-24 scale-y-[0.36]">
            <span className="absolute inset-0 animate-[travel-spin_1.1s_linear_infinite] rounded-full border border-glow/35">
              <span className="absolute -top-1 left-1/2 size-2 -translate-x-1/2 rounded-full bg-white shadow-[0_0_0.75rem_0.25rem_rgba(199,214,255,0.6)]" />
            </span>
          </span>
          <Image
            src="/icon-192.png"
            alt=""
            width={72}
            height={72}
            className="relative size-18 rounded-[1.125rem] border border-line"
          />
          {name && (
            <p className="absolute top-full mt-10 whitespace-nowrap font-display text-lg font-light tracking-tight text-mist">
              {name}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
