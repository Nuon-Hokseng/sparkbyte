"use client";

import Image from "next/image";
import { useState } from "react";
import { listings, price } from "../listings";
import {
  Dots,
  Icon,
  KindTag,
  Photo,
  PriceCut,
  StatusBar,
  type IconName,
  type ScreenProps,
} from "../parts";

const listing = listings[1];
const FACTS: [icon: IconName, value: string, label: string][] = [
  ["bed", "4", "Bedrooms"],
  ["bath", "5", "Bathrooms"],
  ["area", "115.5 m²", "Floor area"],
];

const ROUND = "grid shrink-0 place-items-center rounded-full bg-white";

/**
 * One listing in full: its photo, then the price, the facts, where it is on
 * the map, and the seller, with nothing else on the screen. The app's design
 * for this screen was not to hand, so it is laid out from the parts of the
 * screens that were.
 */
export function Detail({ go }: ScreenProps) {
  const [saved, setSaved] = useState(false);

  return (
    <div className="relative flex size-full flex-col bg-white">
      <StatusBar light />
      <div className="relative h-[19em] shrink-0 bg-mock-fog">
        <Photo listing={listing} />
        <span className="pointer-events-none absolute inset-x-0 top-0 h-[7em] bg-linear-to-b from-black/45 to-transparent" />
        <button
          type="button"
          aria-label="Back to the list"
          onClick={() => go("explore")}
          className={`absolute left-[1.7em] top-[5.6em] size-[4em] text-mock-ink ${ROUND}`}
        >
          <Icon name="back" className="size-[2.1em]" />
        </button>
        <button
          type="button"
          aria-label="Save this house"
          aria-pressed={saved}
          onClick={() => setSaved(!saved)}
          className={`absolute right-[1.7em] top-[5.6em] size-[4em] transition-[scale] active:scale-90 ${ROUND} ${
            saved ? "text-[#e5484d]" : "text-mock-mute"
          }`}
        >
          <Icon name="heart" filled={saved} className="size-[2.1em]" />
        </button>
        <Dots className="absolute bottom-[1em] left-1/2 -translate-x-1/2" />
      </div>

      <div className="flex min-h-0 flex-1 animate-[mock-in_0.5s_ease-out] flex-col px-[1.8em] pt-[1.8em]">
        <div className="flex items-center gap-[0.8em]">
          <KindTag kind={listing.kind} />
          <PriceCut />
        </div>
        <p className="mt-[0.5em] text-[3em] font-bold leading-tight tabular-nums">
          {price(listing.price)}
        </p>
        <p className="mt-[0.3em] text-[1.4em] leading-snug">
          {listing.specs} |{" "}
          <span className="font-semibold">{listing.title}</span>
        </p>
        <p className="text-[1.4em] leading-snug">{listing.address}</p>

        <div className="mt-[1.6em] grid grid-cols-3 gap-[1em]">
          {FACTS.map(([icon, value, label]) => (
            <div
              key={label}
              className="rounded-[1.2em] border-[0.1em] border-mock-line px-[1.1em] py-[1em]"
            >
              <Icon name={icon} className="size-[2.2em] text-mock-accent" />
              <p className="mt-[0.4em] text-[1.5em] font-semibold leading-tight">
                {value}
              </p>
              <p className="text-[1.1em] leading-tight text-mock-mute">{label}</p>
            </div>
          ))}
        </div>

        {/* The app's map, moved so that this listing's pin is in the frame. */}
        <div className="relative mt-[1.4em] min-h-0 flex-1 overflow-hidden rounded-[1.2em] border-[0.1em] border-mock-line">
          <Image
            src="/apps/map.webp"
            alt=""
            width={660}
            height={1287}
            sizes="(min-width: 64rem) 360px, 280px"
            className="absolute left-[-4em] top-[-17.6em] h-[85.8em] w-[44em] max-w-none"
          />
          <span className="absolute left-[26.05em] top-[11.55em] size-[2.6em] -translate-x-1/2 -translate-y-1/2 rounded-full border-[0.15em] border-white bg-[#055032] shadow-[0_0_0_0.5em_rgba(5,80,50,0.3)]" />
          <span className="absolute left-[1em] top-[1em] rounded-full bg-white px-[1.1em] py-[0.6em]">
            <span className="block text-[1.15em] font-semibold leading-none">
              Exact map location
            </span>
          </span>
        </div>

        <div className="flex items-center gap-[1em] pb-[3.6em] pt-[1.4em]">
          <span className="grid size-[4.4em] shrink-0 place-items-center rounded-full bg-[#e9ebf0] text-mock-mute">
            <span className="text-[1.5em] font-semibold">
              {listing.by.charAt(0)}
            </span>
          </span>
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block text-[1.1em] text-mock-mute">Listing by</span>
            <span className="block text-[1.5em] font-semibold">
              {listing.by}
            </span>
          </span>
          <span
            className={`size-[4.4em] border-[0.15em] border-mock-line text-mock-mute ${ROUND}`}
          >
            <Icon name="phone" className="size-[2em]" />
          </span>
          <button
            type="button"
            onClick={() => go("chat")}
            className="flex h-[4.4em] items-center gap-[0.7em] rounded-[1em] bg-mock-accent px-[1.6em] text-white"
          >
            <Icon name="chat" className="size-[2.1em]" />
            <span className="whitespace-nowrap text-[1.4em] font-bold leading-none">
              Chat with seller
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
