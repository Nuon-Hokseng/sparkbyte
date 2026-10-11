"use client";

import { useEffect, useRef } from "react";
import type { ReactNode, RefObject } from "react";
import { handArt, type HandLayer } from "./hand-art";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

const { size, body, screen, tilt, thumbJoint } = handArt;

// The hand is measured in px of the photo it was traced from. On the page
// 1em is 10pt of the app's design, and the phone's screen is that design's
// 440pt across, which fixes how many em each of those px is.
const EM = 44 / (screen.right - screen.left);
const em = (px: number) => `${(px * EM).toFixed(3)}em`;

// The whole drawing, placed so that the phone's body in it lies exactly under
// the phone drawn here, and turned by the little the photo's phone was held
// off upright.
const DRAWING = {
  left: em(-body.left),
  top: em(-body.top),
  width: em(size),
  height: em(size),
  rotate: `${tilt}deg`,
  transformOrigin: `${((screen.left + screen.right) / 2 / size) * 100}% ${
    ((screen.top + screen.bottom) / 2 / size) * 100
  }%`,
};

// How far past its outline a part's shading and shadow may reach, in px of
// the photo.
const SPILL = 16;
// Where the wrist starts to fade out, and where it is gone, in px of the
// photo: before the drawing's lower edge can show.
const WRIST = [0.88 * size, 0.99 * size];

type Box = { x: number; y: number; width: number; height: number };

/** The box a part's outline fits in, with room for what spills out of it. */
function boxOf([shape]: HandLayer[]): Box {
  // The outlines are made of M and C alone, so their numbers come in pairs.
  const at = shape.d.match(/-?\d+(?:\.\d+)?/g)!.map(Number);
  const xs = at.filter((_, i) => i % 2 === 0);
  const ys = at.filter((_, i) => i % 2 === 1);
  const x = Math.floor(Math.min(...xs)) - SPILL;
  const y = Math.floor(Math.min(...ys)) - SPILL;
  return {
    x,
    y,
    width: Math.ceil(Math.max(...xs)) + SPILL - x,
    height: Math.ceil(Math.max(...ys)) + SPILL - y,
  };
}

const BOXES = {
  behind: boxOf(handArt.behind),
  thumb: boxOf(handArt.thumb),
  front: boxOf(handArt.front),
};

/** A point of the photo, as percentages of a part's box. */
const within = (box: Box, x: number, y: number) =>
  `${(((x - box.x) / box.width) * 100).toFixed(2)}% ${(
    ((y - box.y) / box.height) *
    100
  ).toFixed(2)}%`;

/**
 * One part of the hand. Its outline is drawn crisp, and the bands of lighter
 * skin are blurred into one another inside it, so the shading is soft but the
 * edge is not.
 *
 * That blur is the costly thing on the page to draw, so each part is drawn
 * once, into a layer of its own no bigger than the part, and from then on is
 * only ever moved: by whatever animates `moving`, which is that layer, and by
 * the hand as a whole. Nothing that changes on the phone's screen makes it be
 * drawn again.
 *
 * The thumb is `jointed`: it fades out where it overlaps the palm, so no seam
 * shows between the two, and turns about its joint. `nails` and `fold` are
 * drawn on over the shading, which is too soft to show them; `nailTint` is
 * how strongly, less for the fingertips, which are in shadow, than for the
 * thumb. `soft` is how far the bands are blurred, in px of the photo: more
 * for the broad palm than for the thumb and the fingertips. `mask` is a CSS
 * mask over the whole part.
 */
function Hand({
  part,
  moving,
  jointed = false,
  nails,
  nailTint = 0.8,
  fold,
  soft = 4,
  mask,
  className = "",
}: {
  part: keyof typeof BOXES;
  moving?: RefObject<HTMLDivElement | null>;
  jointed?: boolean;
  nails?: string;
  nailTint?: number;
  fold?: string;
  soft?: number;
  mask?: string;
  className?: string;
}) {
  const [shape, ...bands] = handArt[part];
  const box = BOXES[part];
  const pct = (v: number) => `${(v / size) * 100}%`;

  const drawn = (
    <>
      <path d={shape.d} fill={shape.fill} fillRule="evenodd" />
      <g clipPath={`url(#hand-${part})`}>
        <g filter={`url(#hand-${part}-soft)`}>
          {bands.map((band) => (
            <path
              key={band.fill}
              d={band.d}
              fill={band.fill}
              fillRule="evenodd"
            />
          ))}
        </g>
        <g filter={`url(#hand-${part}-fine)`}>
          {nails && (
            <path
              d={nails}
              fill="#fdeae2"
              fillOpacity={nailTint}
              stroke={shape.fill}
              strokeOpacity={nailTint / 2}
              strokeWidth="1.2"
            />
          )}
          {fold && (
            <path
              d={fold}
              fill="none"
              stroke={shape.fill}
              strokeOpacity="0.45"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          )}
        </g>
      </g>
    </>
  );

  return (
    <div
      aria-hidden="true"
      style={DRAWING}
      className="pointer-events-none absolute"
    >
      <div
        ref={moving}
        style={{
          left: pct(box.x),
          top: pct(box.y),
          width: pct(box.width),
          height: pct(box.height),
          transformOrigin: jointed
            ? within(box, thumbJoint.pivot[0], thumbJoint.pivot[1])
            : undefined,
        }}
        className="absolute will-change-transform"
      >
        <svg
          viewBox={`${box.x} ${box.y} ${box.width} ${box.height}`}
          style={mask ? { maskImage: mask, WebkitMaskImage: mask } : undefined}
          className={`block size-full ${className}`}
        >
          <defs>
            <clipPath id={`hand-${part}`}>
              <path d={shape.d} fillRule="evenodd" />
            </clipPath>
            <filter
              id={`hand-${part}-soft`}
              x="-10%"
              y="-10%"
              width="120%"
              height="120%"
            >
              <feGaussianBlur stdDeviation={soft} />
            </filter>
            <filter id={`hand-${part}-fine`}>
              <feGaussianBlur stdDeviation="0.8" />
            </filter>
            {jointed && (
              <>
                <linearGradient
                  id={`hand-${part}-fade`}
                  gradientUnits="userSpaceOnUse"
                  x1="0"
                  y1={thumbJoint.from}
                  x2="0"
                  y2={thumbJoint.to}
                >
                  <stop offset="0" stopColor="#fff" />
                  <stop offset="1" stopColor="#000" />
                </linearGradient>
                <mask
                  id={`hand-${part}-mask`}
                  maskUnits="userSpaceOnUse"
                  x={box.x}
                  y={box.y}
                  width={box.width}
                  height={box.height}
                >
                  <rect
                    x={box.x}
                    y={box.y}
                    width={box.width}
                    height={box.height}
                    fill={`url(#hand-${part}-fade)`}
                  />
                </mask>
              </>
            )}
          </defs>
          {jointed ? (
            // The shadow it casts on the phone is drawn before the fade, in
            // px of the photo, so it cannot show through where the thumb
            // thins out over the palm.
            <g mask={`url(#hand-${part}-mask)`}>
              <g style={{ filter: "drop-shadow(3px 2px 4px rgba(0, 0, 0, 0.4))" }}>
                {drawn}
              </g>
            </g>
          ) : (
            drawn
          )}
        </svg>
      </div>
    </div>
  );
}

// The wrist's fade, down the box of the part behind the phone.
const WRIST_FADE = `linear-gradient(#000 ${(
  ((WRIST[0] - BOXES.behind.y) / BOXES.behind.height) *
  100
).toFixed(2)}%, transparent ${(
  ((WRIST[1] - BOXES.behind.y) / BOXES.behind.height) *
  100
).toFixed(2)}%)`;

// The thumb lifts off the phone's edge, then presses it; the fingers tighten
// on the phone. Each stretch of a move eases in and out.
const PRESS = [
  { transform: "rotate(0deg)", easing: "ease-in-out" },
  { transform: "rotate(-3deg)", offset: 0.25, easing: "ease-in-out" },
  { transform: "rotate(5deg)", offset: 0.6, easing: "ease-in-out" },
  { transform: "rotate(0deg)" },
];
const GRIP = [
  { translate: "0 0", easing: "ease-out" },
  { translate: "-0.7em 0.15em", offset: 0.4, easing: "ease-out" },
  { translate: "0 0" },
];

/**
 * A phone held in a hand. `children` is the screen, 44em wide. Changing `tap`
 * makes the hand use the phone: the thumb lifts and presses its edge, and the
 * fingers tighten on it.
 *
 * The hand is a drawing traced from a photo (see scripts/trace-hand.mjs): the
 * palm and wrist go behind the phone, the thumb lies along its side, a little
 * clear of it, and the fingertips curl round its other edge.
 */
export function Phone({
  tap,
  children,
}: {
  tap: string | number;
  children: ReactNode;
}) {
  const thumb = useRef<HTMLDivElement>(null);
  const fingers = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  // The parts are moved where they are, not mounted afresh, so that none of
  // them has to be drawn again.
  useEffect(() => {
    if (reduced) return;
    const press = thumb.current?.animate(PRESS, { duration: 800 });
    const grip = fingers.current?.animate(GRIP, { duration: 500 });
    return () => {
      press?.cancel();
      grip?.cancel();
    };
  }, [tap, reduced]);

  return (
    <div
      style={{
        width: em(body.right - body.left),
        height: em(body.bottom - body.top),
      }}
      // Nudged right, so that hand and phone together sit in the middle.
      className="phone-rig relative left-[4.9em] mx-auto"
    >
      <Hand part="behind" soft={7} mask={WRIST_FADE} />

      {/* The phone's body. Its rim is light enough to be seen across the gap
          the thumb leaves beside it. */}
      <div className="absolute inset-0 rounded-[5.8em] bg-[#0b0b0d] shadow-[0_4em_8em_-2em_rgba(0,0,0,0.9),inset_0_0_0_0.2em_#44464f,inset_0_0_0_0.5em_#050506]" />
      <div
        style={{
          left: em(screen.left - body.left),
          top: em(screen.top - body.top),
          height: em(screen.bottom - screen.top),
        }}
        className="absolute isolate w-[44em] overflow-hidden rounded-[4.2em] bg-white text-left font-app text-mock-ink"
      >
        {children}
        {/* The notch, and the bar the phone draws along its bottom edge. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-[10.9em] top-0 z-40 h-[3.4em] w-[23.4em] rounded-b-[1.7em] bg-[#0b0b0d]"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-[0.9em] left-1/2 z-40 h-[0.5em] w-[14em] -translate-x-1/2 rounded-full bg-[#111]"
        />
      </div>

      <Hand
        part="thumb"
        moving={thumb}
        jointed
        nails={handArt.nail}
        fold={handArt.fold}
      />
      <Hand
        part="front"
        moving={fingers}
        nails={handArt.fingerNails}
        nailTint={0.38}
        className="drop-shadow-[-0.3em_0.4em_0.5em_rgba(0,0,0,0.35)]"
      />
    </div>
  );
}
