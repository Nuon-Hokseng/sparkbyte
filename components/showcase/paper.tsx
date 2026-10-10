import type { CSSProperties } from "react";

// Where each piece lies, in % of a square much larger than the stage and
// tilted across it, and how far it slides per slide scrolled: `dx` along the
// tilt, `dy` across it, in px.

/** Overlapping sheets. Their upper edges read as folds in the paper. */
const SHEETS = [
  { left: 0, top: 17, width: 58, height: 17, dx: 34, dy: -20, cool: false },
  { left: 42, top: 31, width: 58, height: 20, dx: -26, dy: 14, cool: true },
  { left: 4, top: 51, width: 60, height: 18, dx: 22, dy: -12, cool: false },
  { left: 48, top: 66, width: 52, height: 17, dx: -30, dy: 20, cool: true },
];

/** Short strokes that slip along the tilt faster than the sheets do. */
const STREAKS = [
  { left: 50, top: 15, width: 4, dx: -48, cool: false },
  { left: 30, top: 24, width: 7, dx: 62, cool: false },
  { left: 60, top: 22, width: 5, dx: 88, cool: true },
  { left: 23, top: 40, width: 4, dx: -40, cool: true },
  { left: 71, top: 38, width: 8, dx: 70, cool: false },
  { left: 41, top: 47, width: 3, dx: -64, cool: false },
  { left: 17, top: 58, width: 6, dx: 80, cool: false },
  { left: 63, top: 61, width: 5, dx: -52, cool: true },
  { left: 35, top: 72, width: 9, dx: 58, cool: false },
  { left: 75, top: 77, width: 4, dx: 92, cool: true },
];

const pct = (v: number) => `${v}%`;

/**
 * The showcase's backdrop: sheets of black paper lying at a tilt, their folds
 * catching the light, with a few loose strokes between them like the streaks
 * in the hero's sky. Each piece carries its own --dx and --dy, and
 * `.paper-drift` moves it by those for every slide the stage's --at counts,
 * so the paper shifts as the page scrolls.
 */
export function Paper() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden bg-[radial-gradient(110%_80%_at_50%_0%,rgba(199,214,255,0.07),transparent_70%)]"
    >
      <div className="absolute left-1/2 top-1/2 size-[150vmax] -translate-x-1/2 -translate-y-1/2 -rotate-[24deg]">
        {SHEETS.map((s, i) => (
          <div
            key={i}
            style={
              {
                left: pct(s.left),
                top: pct(s.top),
                width: pct(s.width),
                height: pct(s.height),
                "--dx": `${s.dx}px`,
                "--dy": `${s.dy}px`,
              } as CSSProperties
            }
            className={`paper-drift absolute rounded-[3rem] bg-linear-to-b to-transparent to-85% shadow-[0_-1px_0_rgba(255,255,255,0.09)] ${
              s.cool ? "from-glow/8" : "from-white/5"
            }`}
          />
        ))}
        {STREAKS.map((s, i) => (
          <div
            key={i}
            style={
              {
                left: pct(s.left),
                top: pct(s.top),
                width: `${s.width}rem`,
                "--dx": `${s.dx}px`,
              } as CSSProperties
            }
            className={`paper-drift absolute h-1.5 rounded-full bg-linear-to-r from-transparent ${
              s.cool ? "to-glow/45" : "to-white/20"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
