"use client";

import { useCallback, useEffect, useEffectEvent, useRef } from "react";

/** How long to wait after the previous step, in ms, then what to do. */
export type Step = [wait: number, run: () => void];

/**
 * Plays a demo's opening moves, one step after another. Returns a function
 * that stops them, for when the visitor starts using the demo themselves.
 */
export function useScript(play: boolean, steps: () => Step[]) {
  const stop = useRef(() => {});
  const build = useEffectEvent(steps);

  useEffect(() => {
    if (!play) return;
    const timers: number[] = [];
    let at = 0;
    for (const [wait, run] of build()) {
      at += wait;
      timers.push(window.setTimeout(run, at));
    }
    const cancel = () => timers.forEach((t) => window.clearTimeout(t));
    stop.current = cancel;
    return cancel;
  }, [play]);

  return useCallback(() => stop.current(), []);
}

/** Steps that type `text` one character at a time. */
export const typed = (
  text: string,
  show: (soFar: string) => void,
  gap = 70,
): Step[] =>
  Array.from(text, (_, i): Step => [gap, () => show(text.slice(0, i + 1))]);
