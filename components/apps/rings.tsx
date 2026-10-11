import type { CSSProperties } from "react";

// Each ring's width in vmin, and how much wider it grows per slide scrolled.
const RINGS = [
  { size: 48, grow: 0.03 },
  { size: 76, grow: 0.045 },
  { size: 108, grow: 0.06 },
  { size: 144, grow: 0.075 },
];

/**
 * The app tour's backdrop: rings spreading from where the phone is held, like
 * a place being found on a map. `.ring-drift` widens each by its --grow for
 * every slide --at counts, which the stage sets here (`data-at`), and one
 * more pulses outwards on its own while there is someone to `play` to.
 */
export function Rings({ play }: { play: boolean }) {
  return (
    <div
      aria-hidden="true"
      data-at=""
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div className="absolute left-1/2 top-[68%] lg:top-[56%]">
        <div className="absolute size-[90vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(199,214,255,0.13),transparent)]" />
        {RINGS.map((ring) => (
          <div
            key={ring.size}
            style={
              {
                width: `${ring.size}vmin`,
                height: `${ring.size}vmin`,
                "--grow": ring.grow,
              } as CSSProperties
            }
            className="ring-drift absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/8"
          />
        ))}
        <div
          className={`absolute size-[48vmin] -translate-x-1/2 -translate-y-1/2 animate-[ring-out_6s_ease-out_infinite] rounded-full border border-glow/40 motion-reduce:hidden ${
            play ? "" : "[animation-play-state:paused]"
          }`}
        />
      </div>
    </div>
  );
}
