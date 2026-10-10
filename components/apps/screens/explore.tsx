"use client";

import { useRef, useState } from "react";
import { listings } from "../listings";
import {
  Icon,
  ListingCard,
  ROUND,
  SearchField,
  StatusBar,
  TabBar,
  type ScreenProps,
} from "../parts";
import { useScript } from "@/hooks/use-script";

// In the list the house comes first, as in the app.
const order = [listings[1], listings[0], listings[2]];

/**
 * The Explore tab as a list: the map's listings, one under another, with a
 * button floating over them that goes back to the map.
 */
export function Explore({ play, go }: ScreenProps) {
  const [saved, setSaved] = useState<string[]>([]);
  const list = useRef<HTMLDivElement>(null);

  // A nudge down the list, to show there is more of it.
  const stop = useScript(play, () => [
    [
      1500,
      () => {
        const el = list.current;
        if (el) el.scrollTo({ top: el.clientHeight * 0.4, behavior: "smooth" });
      },
    ],
  ]);

  return (
    <div className="relative size-full bg-white">
      <StatusBar />
      <SearchField className="absolute left-[1.7em] top-[6em] w-[30.4em]" />
      <span className={`absolute left-[33em] top-[5.9em] ${ROUND}`}>
        <Icon name="scan" className="size-[2.4em]" />
      </span>
      <span className={`absolute left-[38em] top-[5.9em] ${ROUND}`}>
        <Icon name="sliders" className="size-[2.4em]" />
      </span>
      <span className="absolute left-[1.5em] top-[11em] flex h-[3em] items-center gap-[0.7em] rounded-full border-[0.15em] border-mock-line bg-mock-fog px-[1.4em] text-mock-mute">
        <Icon name="sort" className="size-[1.9em]" />
        <span className="text-[1.4em] font-semibold leading-none">Sort by</span>
      </span>

      <div
        ref={list}
        onPointerDown={stop}
        onWheel={stop}
        className="absolute inset-x-0 bottom-[9.6em] top-[14.7em] overflow-y-auto bg-mock-fog px-[1.6em] pb-[6em] scrollbar-none pt-[1.2em]"
      >
        {order.map((listing, i) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            saved={saved.includes(listing.id)}
            onSave={() => {
              stop();
              setSaved((ids) =>
                ids.includes(listing.id)
                  ? ids.filter((id) => id !== listing.id)
                  : [...ids, listing.id],
              );
            }}
            onOpen={() => go("detail")}
            style={{ animationDelay: `${i * 120}ms` }}
            className="mb-[1.2em] animate-[mock-in_0.5s_ease-out_backwards]"
          />
        ))}
      </div>

      <button
        type="button"
        onClick={() => go("map")}
        className="absolute bottom-[12.4em] left-1/2 z-10 flex h-[4.1em] -translate-x-1/2 items-center gap-[1em] rounded-[0.8em] bg-mock-accent px-[1.7em] text-white shadow-[0_0.3em_0.8em_rgba(0,0,0,0.25)]"
      >
        <Icon name="map" className="size-[2.2em]" />
        <span className="text-[1.4em] font-semibold leading-none">Map</span>
      </button>
      <TabBar on="Explore" go={go} />
    </div>
  );
}
