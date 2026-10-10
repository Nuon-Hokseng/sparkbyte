import type { ReactNode } from "react";
import { handArt, type HandLayer } from "./hand-art";

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

/**
 * One part of the hand. Its outline is drawn crisp, and the bands of lighter
 * skin are blurred into one another inside it, so the shading is soft but the
 * edge is not.
 *
 * The thumb is `jointed`: it fades out where it overlaps the palm, so no seam
 * shows between the two, and it swings about its joint to press the phone.
 * `nails` and `fold` are drawn on over the shading, which is too soft to show
 * them; `nailTint` is how strongly, less for the fingertips, which are in
 * shadow, than for the thumb. `soft` is how far the bands are blurred, in px of the photo: more for
 * the broad palm than for the thumb and the fingertips.
 */
function Hand({
  part,
  layers,
  jointed = false,
  nails,
  nailTint = 0.8,
  fold,
  soft = 4,
  className = "",
}: {
  part: string;
  layers: HandLayer[];
  jointed?: boolean;
  nails?: string;
  nailTint?: number;
  fold?: string;
  soft?: number;
  className?: string;
}) {
  const [shape, ...bands] = layers;
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
    <svg
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
      style={DRAWING}
      className={`pointer-events-none absolute max-w-none ${className}`}
    >
      <defs>
        <clipPath id={`hand-${part}`}>
          <path d={shape.d} fillRule="evenodd" />
        </clipPath>
        <filter id={`hand-${part}-soft`} x="-10%" y="-10%" width="120%" height="120%">
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
              x="0"
              y="0"
              width={size}
              height={size}
            >
              <rect width={size} height={size} fill={`url(#hand-${part}-fade)`} />
            </mask>
          </>
        )}
      </defs>
      {jointed ? (
        <g
          style={{
            transformOrigin: `${thumbJoint.pivot[0]}px ${thumbJoint.pivot[1]}px`,
          }}
          className="transform-view animate-[thumb-press_0.8s_ease-in-out]"
        >
          {/* The shadow it casts on the phone is drawn before the fade, in
              px of the photo, so it cannot show through where the thumb
              thins out over the palm. */}
          <g mask={`url(#hand-${part}-mask)`}>
            <g style={{ filter: "drop-shadow(3px 2px 4px rgba(0, 0, 0, 0.4))" }}>
              {drawn}
            </g>
          </g>
        </g>
      ) : (
        drawn
      )}
    </svg>
  );
}

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
  return (
    <div
      style={{
        width: em(body.right - body.left),
        height: em(body.bottom - body.top),
      }}
      // Nudged right, so that hand and phone together sit in the middle.
      className="phone-rig relative left-[4.9em] mx-auto"
    >
      {/* The wrist fades out before the drawing's lower edge can show. */}
      <Hand
        part="behind"
        layers={handArt.behind}
        soft={7}
        className="mask-[linear-gradient(#000_88%,transparent_99%)]"
      />

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

      {/* Remounting on each tap replays the press and the grip. */}
      <Hand
        key={`thumb-${tap}`}
        part="thumb"
        layers={handArt.thumb}
        jointed
        nails={handArt.nail}
        fold={handArt.fold}
      />
      <Hand
        key={tap}
        part="front"
        layers={handArt.front}
        nails={handArt.fingerNails}
        nailTint={0.38}
        className="animate-[grip_0.5s_ease-out] drop-shadow-[-0.3em_0.4em_0.5em_rgba(0,0,0,0.35)]"
      />
    </div>
  );
}
