// Shared, mutable state between the pieces of the hero that play together:
// the mark (BlackHole), the space behind it (SpaceBackdrop) and the headline
// whose letters can be fed to it (HeroHeadline). Each reads or writes this
// once per animation frame, so plain fields are enough; nothing here needs to
// trigger a React render.

export const hole = {
  /** Centre of the mark, client px. */
  x: 0,
  y: 0,
  /** Client px per mark unit. */
  unit: 0,
  /** 0..1. Zero while the mark is docked in the header, hidden or unavailable. */
  strength: 0,
  /** Bumped each time something is swallowed. */
  fed: 0,
  /** A packet shot out along the pole: which end, and when (performance.now()). */
  jetDir: 1 as 1 | -1,
  jetAt: -1e9,
};

/**
 * Rendering quality shared by the hero's canvases. The mark watches the frame
 * rate while it animates; when frames run long it lowers `scale`, which
 * multiplies each canvas's resolution, and once that is at its floor it sets
 * `lite`, which sheds the least noticeable layers.
 */
export const quality = { scale: 1, lite: false };
export const QUALITY_STEP = 0.15;
export const QUALITY_FLOOR = 0.55;

/** A rough guess at a weaker device, used to start at a lower resolution. */
export function isLowEnd() {
  const nav = navigator as Navigator & { deviceMemory?: number };
  return (nav.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 4;
}

/**
 * The ring around the pole is a circle seen at an angle, so along the pole it
 * appears this much narrower than across it.
 */
export const DISC_TILT = 0.397;

/** How far along the pole (mark units) a jet packet travels before it fades. */
export const POLE_REACH = 3.5;
export const JET_SECONDS = 0.45;

const R2 = Math.SQRT1_2;

/**
 * Screen offset from the hole (mark units, y up) to polar coordinates in the
 * plane of the disc. Things that orbit or fall in move in this plane.
 */
export function toDisc(dx: number, dyUp: number) {
  const s = (dx + dyUp) * R2; // along the pole
  const n = (dyUp - dx) * R2; // across it
  const X = s / DISC_TILT;
  return { rho: Math.hypot(X, n), phi: Math.atan2(n, X) };
}

export function fromDisc(rho: number, phi: number) {
  const s = DISC_TILT * rho * Math.cos(phi);
  const n = rho * Math.sin(phi);
  return { dx: (s - n) * R2, dyUp: (s + n) * R2 };
}
