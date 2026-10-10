"use client";

import { useSyncExternalStore } from "react";

const REDUCE = "(prefers-reduced-motion: reduce)";

const subscribe = (onChange: () => void) => {
  const mq = window.matchMedia(REDUCE);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};

/** True if the visitor has asked their device for less motion. */
export function useReducedMotion() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(REDUCE).matches,
    () => false,
  );
}
