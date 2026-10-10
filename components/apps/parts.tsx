"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { KIND, price, type Listing } from "./listings";
import type { TourId } from "./tour";

// What the app's screens share. Inside the phone 1em is 10pt of the app's own
// design, which is 440pt wide: a screen is 44em across, and every position
// and colour here is the app's, measured from its screens.

export type ScreenProps = {
  /** Play the opening moves. Remount (change `key`) to play them again. */
  play: boolean;
  /** Start from the finished state, for visitors who asked for less motion. */
  settled: boolean;
  /** Moves the tour, and so the phone, to another screen. */
  go: (to: TourId) => void;
};

// Each icon is an SVG path on a 24 × 24 grid, drawn as a stroke.
const ICONS = {
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-3.9-3.9",
  sliders:
    "M4 7h2M10 7h10M4 12h10M18 12h2M4 17h4M12 17h8M8 5a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM16 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM10 15a2 2 0 1 0 0 4 2 2 0 0 0 0-4z",
  scan: "M4 9V6a2 2 0 0 1 2-2h3M15 4h3a2 2 0 0 1 2 2v3M20 15v3a2 2 0 0 1-2 2h-3M9 20H6a2 2 0 0 1-2-2v-3M8 9h8M8 12h5M8 15h8",
  heart:
    "M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.2 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z",
  map: "M9 4.5L3.5 7v12.5L9 17l6 2.5 5.5-2.5V4.5L15 7zM9 4.5V17M15 7v12.5",
  chat: "M12 4.5c4.7 0 8.5 3 8.5 6.8s-3.8 6.8-8.5 6.8c-1 0-2-.1-2.9-.4L4.5 19.5l1.1-3.5c-1.3-1.2-2.1-2.8-2.1-4.7 0-3.8 3.8-6.8 8.5-6.8zM8.5 10h7M8.5 13h4",
  mine: "M9 4.5L3.5 7v12.5L9 17l2.5 1M9 4.5V17M9 4.5L15 7l5.5-2.5V11M15 7v4M17.5 21s-3-2.7-3-5a3 3 0 0 1 6 0c0 2.3-3 5-3 5z",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM5 20a7 7 0 0 1 14 0",
  lock: "M7 11V8a5 5 0 0 1 10 0v3M6 11h12a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1z",
  back: "M20 12H4M10 6l-6 6 6 6",
  send: "M4 12l16-7-6 16-3-6.5z",
  phone:
    "M6 4h3l1.5 4-2 1.5a11 11 0 0 0 6 6l1.5-2 4 1.5v3a1.5 1.5 0 0 1-1.6 1.5A15.5 15.5 0 0 1 4.5 5.6 1.5 1.5 0 0 1 6 4z",
  sort: "M4 6h9l-3.5 4.5V15l-2 1v-5.5zM16 8h4M16 12h4M14 16h6",
  locate:
    "M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 3v3M12 18v3M3 12h3M18 12h3M12 12h.01",
  shape:
    "M6.5 8v8M8 6.5h8M17.5 8l-2 4 2 4M8 17.5h8M5 5h3v3H5zM16 5h3v3h-3zM5 16h3v3H5zM16 16h3v3h-3z",
  house: "M4 11l8-7 8 7v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zM10 20v-6h4v6",
  land: "M3 19l6-10 4 6 2.5-3L21 19zM17 6.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z",
  condo:
    "M5 20V6h9v14M14 10h5v10M3 20h18M8 9h1M11 9h1M8 12h1M11 12h1M8 15h1M11 15h1",
  bed: "M3 18v-7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7M3 15h18M7 9V7h10v2",
  bath: "M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4zM7 12V6a2 2 0 0 1 4 0",
  area: "M4 4h16v16H4zM4 9h3M4 14h3M9 20v-3M14 20v-3",
};

export type IconName = keyof typeof ICONS;

export function Icon({
  name,
  filled = false,
  className = "size-[2.4em]",
}: {
  name: IconName;
  filled?: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      <path d={ICONS[name]} />
    </svg>
  );
}

/** TilomNov's mark: the navy house with its gold door. */
export function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 112" aria-hidden="true" className={className}>
      <path
        d="M50 9c3 0 6 1 8 3l30 29c4 4 6 9 6 14v23c0 9-7 16-16 16H22c-9 0-16-7-16-16V55c0-5 2-10 6-14l30-29c2-2 5-3 8-3z"
        fill="#142b4a"
        stroke="#f7f5ef"
        strokeWidth="5"
        paintOrder="stroke"
      />
      <rect x="41" y="70" width="18" height="36" rx="4" fill="#d7a84b" />
    </svg>
  );
}

/**
 * The clock, signal and battery either side of the phone's notch. `light`
 * is for a screen with a dark picture under them.
 */
export function StatusBar({ light = false }: { light?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-x-0 top-0 z-30 flex h-[4.4em] items-center justify-between px-[3.4em] ${
        light
          ? "text-white [text-shadow:0_0_0.4em_rgba(0,0,0,0.6)]"
          : "text-[#111]"
      }`}
    >
      <span className="text-[1.5em] font-semibold tabular-nums">9:41</span>
      <span className="flex items-center gap-[0.5em]">
        <span className="flex items-end gap-[0.2em]">
          {[0.5, 0.75, 1, 1.25].map((h) => (
            <span
              key={h}
              style={{ height: `${h}em` }}
              className="w-[0.3em] rounded-full bg-current"
            />
          ))}
        </span>
        <span className="h-[1.2em] w-[2.4em] rounded-[0.35em] border border-current p-[0.12em]">
          <span className="block h-full w-3/4 rounded-[0.2em] bg-current" />
        </span>
      </span>
    </div>
  );
}

const TABS: { name: string; icon: IconName; to?: TourId }[] = [
  { name: "Explore", icon: "map", to: "map" },
  { name: "Saved", icon: "heart" },
  { name: "Chat", icon: "chat", to: "chat" },
  { name: "My Properties", icon: "mine" },
  { name: "User", icon: "user" },
];

/**
 * The app's tab bar. Explore and Chat move the tour to their screens; the
 * rest are parts of the app this tour does not show.
 */
export function TabBar({
  on,
  go,
}: {
  on: "Explore" | "Chat";
  go: (to: TourId) => void;
}) {
  return (
    <div className="absolute inset-x-0 bottom-0 z-20 grid h-[9.6em] grid-cols-5 items-start bg-white px-[1.5em] pt-[1.3em]">
      {TABS.map((tab) => {
        const look = `flex flex-col items-center gap-[0.5em] ${
          tab.name === on ? "text-[#3e49c7]" : "text-mock-mute"
        }`;
        const inside = (
          <>
            <Icon name={tab.icon} className="size-[2.6em]" />
            <span className="whitespace-nowrap text-[1.1em] font-semibold leading-none">
              {tab.name}
            </span>
          </>
        );
        const to = tab.to;
        return to ? (
          <button
            key={tab.name}
            type="button"
            aria-current={tab.name === on ? "page" : undefined}
            onClick={() => go(to)}
            className={look}
          >
            {inside}
          </button>
        ) : (
          <span key={tab.name} className={look}>
            {inside}
          </span>
        );
      })}
    </div>
  );
}

/** The round white control the map and the lists are dotted with. */
export const ROUND =
  "grid size-[4.4em] shrink-0 place-items-center rounded-full border-[0.15em] border-mock-line bg-white text-mock-mute";

/** The search field at the top of the map and of the list. */
export function SearchField({ className = "" }: { className?: string }) {
  return (
    <span
      className={`flex h-[4.25em] min-w-0 items-center gap-[1.1em] rounded-full border-[0.15em] border-mock-line bg-white pl-[1em] pr-[1.4em] text-mock-mute ${className}`}
    >
      <Icon name="search" className="size-[2.5em]" />
      <span className="truncate text-[1.2em]">
        Search by area, road, village...
      </span>
    </span>
  );
}

/** The red tag on a listing whose price has come down. */
export function PriceCut() {
  return (
    <span className="shrink-0 rounded-full border-[0.1em] border-[#f2b9bb] bg-[#f8e9ea] px-[1.1em] py-[0.6em] text-[1.15em] font-semibold leading-none text-[#e5484d]">
      Price Cut: 20%
    </span>
  );
}

/** The grey tag naming a listing's kind. */
export function KindTag({
  kind,
  className = "",
}: {
  kind: Listing["kind"];
  className?: string;
}) {
  return (
    <span
      className={`flex h-[2.3em] items-center gap-[0.5em] rounded-full border-[0.1em] border-mock-line bg-mock-fog pl-[0.9em] pr-[1.2em] text-mock-mute ${className}`}
    >
      <Icon name={kind} className="size-[1.5em]" />
      <span className="text-[1.1em] font-medium leading-none">{KIND[kind]}</span>
    </span>
  );
}

/** The dots of a listing's gallery, the first of them the photo on show. */
export function Dots({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`flex items-center gap-[0.2em] rounded-full bg-white px-[0.25em] py-[0.2em] ${className}`}
    >
      <span className="h-[0.6em] w-[1.2em] rounded-full bg-mock-mute" />
      {[1, 2, 3, 4, 5].map((dot) => (
        <span key={dot} className="size-[0.6em] rounded-full bg-mock-mute" />
      ))}
    </span>
  );
}

/** A listing's photo, filling whatever box it is put in. */
export function Photo({ listing }: { listing: Listing }) {
  return (
    <Image
      src={`/apps/${listing.photo}.webp`}
      alt=""
      width={listing.photoSize[0]}
      height={listing.photoSize[1]}
      sizes="(min-width: 64rem) 360px, 280px"
      className="size-full object-cover"
    />
  );
}

/**
 * A listing as a card: its photo with its kind, a heart and the gallery's
 * dots laid over it, then the price, the size and the address. On the map
 * the card is a white panel; in the list it lies straight on the page and
 * shows a price cut. Tapping anywhere but the heart opens it.
 */
export function ListingCard({
  listing,
  saved,
  onSave,
  onOpen,
  panel = false,
  className = "",
  style,
}: {
  listing: Listing;
  saved: boolean;
  onSave: () => void;
  onOpen: () => void;
  panel?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    // The heart is a button, so the card cannot be one too: the photo and the
    // text are each a button that opens it.
    <div
      style={style}
      className={`relative ${
        panel ? "overflow-hidden rounded-[1.2em] bg-white" : ""
      } ${className}`}
    >
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        onClick={onOpen}
        className={`block h-[14em] w-full overflow-hidden bg-mock-fog ${
          panel ? "" : "rounded-t-[1.2em]"
        }`}
      >
        <Photo listing={listing} />
      </button>
      <KindTag
        kind={listing.kind}
        className="pointer-events-none absolute left-[1.2em] top-[1.3em]"
      />
      <button
        type="button"
        aria-label={`Save ${listing.title.toLowerCase()}`}
        aria-pressed={saved}
        onClick={onSave}
        className={`absolute right-[1.2em] top-[1.2em] grid size-[2.4em] place-items-center rounded-full bg-white transition-[scale] active:scale-90 ${
          saved ? "text-[#e5484d]" : "text-mock-mute"
        }`}
      >
        <Icon name="heart" filled={saved} className="size-[1.6em]" />
      </button>
      <Dots className="pointer-events-none absolute left-1/2 top-[12.3em] -translate-x-1/2" />

      <button
        type="button"
        onClick={onOpen}
        className={`block w-full px-[1.2em] text-left text-mock-ink ${
          panel ? "pb-[1.5em] pt-[1.2em]" : "pb-[1em] pt-[1.5em]"
        }`}
      >
        <span className="flex items-center justify-between gap-[1em]">
          <span className="text-[1.7em] font-semibold leading-tight tabular-nums">
            {price(listing.price)}
          </span>
          {!panel && <PriceCut />}
        </span>
        <span
          className={`block truncate text-[1.4em] leading-snug ${
            panel ? "mt-[0.5em]" : "mt-[0.7em]"
          }`}
        >
          {listing.specs} |{" "}
          <span className="font-semibold">{listing.title}</span>
        </span>
        <span className="block truncate text-[1.4em] leading-snug">
          {listing.address}
        </span>
        <span className="mt-[0.7em] block text-[1.1em] leading-none text-mock-mute">
          Listing by: {listing.by}
        </span>
      </button>
    </div>
  );
}
