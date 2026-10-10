"use client";

import Image from "next/image";
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

/**
 * The home screen: every listing a pin on the map, and the same listings as
 * cards to swipe through along the bottom. The pin and the card in front
 * always belong to the same listing.
 *
 * The map is a picture of the app's own, pins and all (public/apps/map.webp).
 * Three of its pins are live: each has a button laid over it, and the one in
 * front is redrawn darker on top.
 */
export function MapScreen({ play, settled, go }: ScreenProps) {
  const [front, setFront] = useState(0);
  const [saved, setSaved] = useState<string[]>([]);
  const strip = useRef<HTMLDivElement>(null);

  /** How far apart the cards are, in px as laid out. */
  const pitch = () => {
    const el = strip.current;
    if (!el) return 1;
    const [first, second] = el.children as unknown as HTMLElement[];
    return second.offsetLeft - first.offsetLeft;
  };

  /** Brings a listing's card to the front. Its pin follows from the scroll. */
  const show = (i: number) =>
    strip.current?.scrollTo({
      left: i * pitch(),
      behavior: settled ? "auto" : "smooth",
    });

  const stop = useScript(play, () => [
    [1900, () => show(1)],
    [1700, () => show(2)],
  ]);

  return (
    <div className="relative size-full">
      <div className="absolute inset-x-0 top-0 h-[85.8em]">
        <Image
          src="/apps/map.webp"
          alt=""
          width={660}
          height={1287}
          sizes="(min-width: 64rem) 360px, 280px"
          className="size-full object-cover"
        />
      </div>
      <StatusBar light />

      {listings.map((listing, i) => (
        <button
          key={listing.id}
          type="button"
          aria-label={`${listing.title}, ${listing.address}`}
          aria-pressed={i === front}
          onClick={() => {
            stop();
            show(i);
          }}
          style={{ left: `${listing.at[0]}em`, top: `${listing.at[1]}em` }}
          className={`absolute grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-[0.15em] border-white transition-[scale,background-color,opacity] duration-300 ${
            listing.fresh ? "h-[2em] w-[3.8em]" : "size-[2.3em]"
          } ${
            i === front
              ? "z-10 scale-125 bg-[#055032] opacity-100 shadow-[0_0_0_0.5em_rgba(5,80,50,0.3)]"
              : "bg-transparent opacity-0"
          }`}
        >
          {listing.fresh && (
            <span className="text-[1.1em] font-bold leading-none text-white">
              New
            </span>
          )}
        </button>
      ))}

      <SearchField className="absolute left-[1.7em] top-[6em] w-[35.05em]" />
      <span className={`absolute left-[38em] top-[5.9em] ${ROUND}`}>
        <Icon name="sliders" className="size-[2.4em]" />
      </span>
      {/* The button that changes the map's style wears a scrap of map. */}
      <span
        className={`absolute left-[38em] top-[11.5em] overflow-hidden border-white bg-[linear-gradient(135deg,#bfe6c8_45%,#9ad3e8_45%_60%,#e8eef2_60%)] ${ROUND}`}
      />
      <span className={`absolute left-[1.6em] top-[55em] ${ROUND}`}>
        <Icon name="shape" className="size-[2.4em]" />
      </span>
      <span className={`absolute left-[38em] top-[55em] ${ROUND}`}>
        <Icon name="locate" className="size-[2.4em]" />
      </span>

      <div
        ref={strip}
        onScroll={(e) =>
          setFront(Math.round(e.currentTarget.scrollLeft / pitch()))
        }
        onPointerDown={stop}
        onWheel={stop}
        className="absolute inset-x-0 top-[60.6em] flex snap-x snap-mandatory gap-[1.2em] overflow-x-auto px-[2.8em] scrollbar-none pb-[1.2em]"
      >
        {listings.map((listing) => (
          <ListingCard
            key={listing.id}
            panel
            listing={listing}
            saved={saved.includes(listing.id)}
            onSave={() =>
              setSaved((ids) =>
                ids.includes(listing.id)
                  ? ids.filter((id) => id !== listing.id)
                  : [...ids, listing.id],
              )
            }
            onOpen={() => go("detail")}
            className="w-[38.4em] shrink-0 snap-center"
          />
        ))}
      </div>

      <TabBar on="Explore" go={go} />
    </div>
  );
}
