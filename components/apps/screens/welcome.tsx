"use client";

import { useState } from "react";
import { Mark, StatusBar, type ScreenProps } from "../parts";
import { useScript } from "@/hooks/use-script";

const LATER = "transition-[opacity,translate] duration-700";

/**
 * The first screen: the logo alone, as the app loads, then the welcome with
 * its three ways in.
 */
export function Welcome({ play, settled, go }: ScreenProps) {
  const [loaded, setLoaded] = useState(settled);

  useScript(play, () => [[1100, () => setLoaded(true)]]);

  const hidden = loaded ? "" : "translate-y-[1.5em] opacity-0";

  return (
    <div className="relative size-full bg-white text-center">
      <StatusBar />

      {/* The logo waits lower and larger while the app loads. */}
      <div
        className={`absolute inset-x-0 top-[24em] flex flex-col items-center text-[#142b4a] transition-[translate,scale] duration-700 ease-[cubic-bezier(0.2,0.7,0.2,1)] ${
          loaded ? "" : "translate-y-[11em] scale-110"
        }`}
      >
        <Mark className="h-[11.5em]" />
        <p lang="km" className="font-khmer text-[3.6em] font-bold leading-tight">
          ទីលំនៅ
        </p>
      </div>

      <p
        className={`absolute inset-x-0 top-[15.1em] text-[2.8em] font-bold leading-tight delay-150 ${LATER} ${hidden}`}
      >
        Welcome to the app
      </p>
      <p
        className={`absolute inset-x-0 top-[30em] text-[1.6em] font-semibold leading-tight text-mock-mute delay-200 ${LATER} ${hidden}`}
      >
        Find and share properties with exact map location
      </p>

      <div className={`absolute inset-x-[1.8em] top-[73.5em] delay-300 ${LATER} ${hidden}`}>
        <span className="grid h-[4.1em] place-items-center rounded-[1em] bg-mock-accent text-white shadow-[0_0_0_0.15em_#e4e6f5]">
          <span className="text-[1.4em] font-bold">Login</span>
        </span>
        <button
          type="button"
          onClick={() => go("map")}
          className="mt-[2.7em] grid h-[4.1em] w-full place-items-center rounded-[1em] border-[0.15em] border-mock-line bg-white transition-colors hover:border-mock-mute"
        >
          <span className="text-[1.4em] font-bold">Explore without account</span>
        </button>
        <span className="mt-[2.85em] block text-[1.4em] font-bold leading-none text-mock-accent">
          Create a Account
        </span>
      </div>
    </div>
  );
}
