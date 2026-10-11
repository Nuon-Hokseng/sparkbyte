"use client";

import { useEffect } from "react";
import { paceZone } from "@/lib/pace";
import { hole } from "./hole";

/**
 * Lets the mark's flight into the header play out at its own speed: scrolling
 * down from the top of the page makes one step, to the point where the mark
 * has landed, and the next scroll carries on down the page. Renders nothing.
 *
 * The distance is the mark's own (`hole.dockRange`, which is zero until it
 * knows it, or if it does not fly at all), so a zone with no length is not
 * paced.
 */
export function HeroPace() {
  useEffect(
    () =>
      paceZone({
        span: {
          top: 0,
          get range() {
            return hole.dockRange;
          },
        },
        count: 2,
      }),
    [],
  );
  return null;
}
