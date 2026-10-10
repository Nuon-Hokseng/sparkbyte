// Traces the hand that holds the phone in the app tour.
//
//   npm run hand
//
// Source:  design/hand-source.jpg (1024 x 1024), a photo of a hand holding a
//          phone against white. "Female Hand Holding Smartphone With Blank
//          Screen" by personalgraphic.official, released under CC0:
//          https://www.flickr.com/photos/198895458@N04/53097224746
// Writes:  components/apps/hand-art.ts
//
// The hand is not shipped as a picture. Its skin is sorted into a few bands
// from shadow to highlight, and each band's outline is traced into a path, so
// the page draws the hand itself and can move its parts: the palm and wrist
// behind the phone, the fingertips in front of it, and the thumb, which swings
// in to press it. The phone in the photo is only measured: the page draws its
// own phone in the same place.

import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "design", "hand-source.jpg");
const target = path.join(root, "components", "apps", "hand-art.ts");

// Trace at twice the photo's size, for smoother outlines.
const UP = 2;
// Where the bands of skin divide, as percentiles of its brightness. The first
// band is the whole hand.
const BANDS = [0, 7, 18, 32, 48, 64, 80, 92];
// Outline points closer than this to the line between their neighbours are
// dropped, in px of the traced size.
const DETAIL = 1.6;
// How far the outline is smoothed before it is traced, in px of the photo.
const SMOOTH = 7;
// How far the hand is carried on under the phone's edge, in px of the photo,
// so no gap can open between the two, and the widest crack between hand and
// phone that is filled in. The photo has deep shadow there, not skin.
const TUCK = 12;
const GAP = 16;
// Dents in the outline of the thumb and palm narrower than twice this are
// filled in, in px of the photo: they are where the photo's light fooled the
// search for skin, not the shape of the hand.
const DENT = 12;
// The thumb, in px of the photo. It is cut from the palm along the row `cut`
// and overlaps it below: the page fades it out between the two rows of `fade`,
// counted from the cut. It turns about a point a row or two into that fade,
// `pivot` below the cut, so that where it is fading it hardly moves, and its
// outline cannot part from the palm's there.
//
// In the photo the phone hides the side of the thumb that lies along it, which
// traced as it is would be a dead straight edge. So that side is drawn in: at
// each of `side`'s stops, a share of the way from the thumb's tip to the cut,
// it stands that many px clear of the phone. It comes nearest at the pad of
// the thumb, draws back at the joint, and all but meets the phone at the palm.
const THUMB = {
  cut: 790,
  fade: [21, 61],
  pivot: 32,
  side: [
    [0, 9],
    [0.2, 5],
    [0.44, 9.5],
    [0.74, 6],
    [1, 1.5],
  ],
  // How much darker than the skin beside it the shadow down the thumb's side
  // is, at the least, out of 255.
  shadow: 12,
};
// Two things the bands are too soft to show, put in from the photo by eye, in
// its px. The thumb's nail, seen from the side: a pale strip down the back of
// the thumb, starting `from` below its tip. And the fold under the pad of the
// thumb, where it bends.
const NAIL = { from: 7, length: 66, width: 11 };
// And the nails of the three fingers whose tips curl round the phone, each
// [x, y] of its middle, its width and length, and how far it is turned, in
// degrees. They run off the fingertip's edge, where the page clips them.
const FINGER_NAILS = [
  [763, 523, 25, 42, -8],
  [758, 641, 26, 42, -5],
  [740, 757, 26, 40, -10],
];
const FOLD = "M268 543Q284 557 307 552";
// The fingertips, in px of the photo: how far onto the phone's face one may
// reach, and how tall one can be before it must be two that have run together.
// The topmost, the forefinger's, is mostly behind the phone in the photo and
// comes out small beside the rest, so it is drawn `first` times its size.
const FINGER = { reach: 18, tall: 130, first: 1.5 };

const meta = await sharp(source).metadata();
const W = meta.width * UP;
const H = meta.height * UP;
const { data } = await sharp(source)
  .resize(W, H, { kernel: "lanczos3" })
  .removeAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const N = W * H;

// ── The phone: its dark body, and the pale screen inside it ─────────────────
const dark = (k) => Math.max(data[k * 3], data[k * 3 + 1], data[k * 3 + 2]) < 70;
const span = (count, isOn) => {
  let lo = 0;
  let hi = count - 1;
  while (!isOn(lo)) lo++;
  while (!isOn(hi)) hi--;
  return [lo, hi];
};
// The body's box, from the dark pixels along a row above the fingers and a
// column clear of the notch.
const col = (W * 0.37) | 0;
const [bodyL, bodyR] = span(W, (x) => dark(((H * 0.25) | 0) * W + x));
const [bodyT, bodyB] = span(H, (y) => dark(y * W + col));
const inBody = (x, y) => x >= bodyL && x <= bodyR && y >= bodyT && y <= bodyB;

// The screen's box, from the pale run through the same middle lines.
const mid = ((H >> 1) * W + (W >> 1)) * 3;
const pale = (k) =>
  Math.abs(data[k * 3] - data[mid]) +
    Math.abs(data[k * 3 + 1] - data[mid + 1]) +
    Math.abs(data[k * 3 + 2] - data[mid + 2]) <
  40;
const reach = (x, y, dx, dy) => {
  while (pale((y + dy) * W + x + dx)) {
    x += dx;
    y += dy;
  }
  return dx ? x : y;
};
const screen = {
  left: reach(W >> 1, H >> 1, -1, 0),
  right: reach(W >> 1, H >> 1, 1, 0),
  top: reach(col, H >> 1, 0, -1),
  bottom: reach(col, H >> 1, 0, 1),
};
// The phone is held a touch off upright: how far its left edge drifts.
const drift =
  reach(W >> 1, (H * 0.7) | 0, -1, 0) - reach(W >> 1, (H * 0.3) | 0, -1, 0);
const tilt = (Math.atan2(drift, H * 0.4) * 180) / Math.PI;

// ── The skin ────────────────────────────────────────────────────────────────
// Warm pixels are skin. The phone's glossy edge mirrors the thumb, so on the
// phone only the fingertips that curl round its right edge count.
const skin = new Uint8Array(N);
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const k = y * W + x;
    const r = data[k * 3];
    const g = data[k * 3 + 1];
    const b = data[k * 3 + 2];
    const warm = r - b >= 22 && r >= 80 && r >= g && g >= b - 6;
    if (warm && (!inBody(x, y) || x > bodyR - 27 * UP)) skin[k] = 1;
  }
}

/** Grows (`grow`) or shrinks a mask by `r` px, with a square brush. */
function morph(mask, r, grow) {
  const pass = (src, dx, dy) => {
    const out = new Uint8Array(N);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        let hit = !grow;
        for (let d = -r; d <= r; d++) {
          const xx = x + d * dx;
          const yy = y + d * dy;
          const on = xx >= 0 && yy >= 0 && xx < W && yy < H && src[yy * W + xx];
          if (grow ? on : !on) {
            hit = grow;
            break;
          }
        }
        out[y * W + x] = hit ? 1 : 0;
      }
    }
    return out;
  };
  return pass(pass(mask, 1, 0), 0, 1);
}

/** Labels a mask's connected pieces. Returns the labels and each piece's size. */
function pieces(mask) {
  const label = new Int32Array(N);
  const sizes = [0];
  for (let start = 0; start < N; start++) {
    if (!mask[start] || label[start]) continue;
    const id = sizes.length;
    let size = 0;
    const stack = [start];
    label[start] = id;
    while (stack.length) {
      const k = stack.pop();
      size++;
      const x = k % W;
      for (const n of [k - 1, k + 1, k - W, k + W]) {
        if (n < 0 || n >= N || !mask[n] || label[n]) continue;
        if (Math.abs((n % W) - x) > 1) continue;
        label[n] = id;
        stack.push(n);
      }
    }
    sizes.push(size);
  }
  return { label, sizes };
}

/** A box blur of radius `R`, run twice for a rounder falloff. */
function blur(src, R) {
  const once = (from) => {
    const tmp = new Float32Array(N);
    const out = new Float32Array(N);
    const span = 2 * R + 1;
    for (let y = 0; y < H; y++) {
      let acc = 0;
      for (let x = -R; x < W; x++) {
        if (x + R < W) acc += from[y * W + x + R];
        if (x - R - 1 >= 0) acc -= from[y * W + x - R - 1];
        if (x >= 0) tmp[y * W + x] = acc / span;
      }
    }
    for (let x = 0; x < W; x++) {
      let acc = 0;
      for (let y = -R; y < H; y++) {
        if (y + R < H) acc += tmp[(y + R) * W + x];
        if (y - R - 1 >= 0) acc -= tmp[(y - R - 1) * W + x];
        if (y >= 0) out[y * W + x] = acc / span;
      }
    }
    return out;
  };
  return once(once(src));
}

// Drop specks and close pinholes, then keep only the real pieces of hand.
let hand = morph(morph(skin, 2, false), 2, true);
hand = morph(morph(hand, 3, true), 3, false);
{
  const { label, sizes } = pieces(hand);
  for (let k = 0; k < N; k++) if (sizes[label[k]] < 500 * UP * UP) hand[k] = 0;
}

// Carry the hand on under the phone, except where the fingertips lie on it.
{
  const grown = morph(hand, TUCK * UP, true);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++)
      if (inBody(x, y) && x < bodyR - 27 * UP && grown[y * W + x])
        hand[y * W + x] = 1;
}

// Fill the dents in the outline to the phone's left: grow the shape, shrink
// it back, and keep whatever that added.
{
  const filled = morph(morph(hand, DENT * UP, true), DENT * UP, false);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < bodyL; x++)
      if (filled[y * W + x]) hand[y * W + x] = 1;
}

// Fill the cracks between the hand and the phone: to the phone's left, where
// the thumb lies against it, and under it, where the palm does.
for (let y = bodyT; y <= bodyB; y++) {
  for (let x = bodyL - 1; x >= bodyL - GAP * UP; x--) {
    if (!hand[y * W + x]) continue;
    for (let fill = x; fill < bodyL; fill++) hand[y * W + fill] = 1;
    break;
  }
}
for (let x = bodyL; x <= bodyR; x++) {
  for (let y = bodyB + 1; y <= bodyB + GAP * UP; y++) {
    if (!hand[y * W + x]) continue;
    for (let fill = bodyB + 1; fill < y; fill++) hand[fill * W + x] = 1;
    break;
  }
}

// The thumb's side: nothing of it is tucked under the phone, and it keeps
// THUMB.side's distance from the phone's edge.
const thumbCut = THUMB.cut * UP;
// Where the thumb's side ends, on each row above the cut.
const sideEnd = new Int32Array(H).fill(W);
{
  let top = bodyT;
  while (!hand[top * W + bodyL - 1]) top++;
  const half = (bodyL + bodyR) >> 1;
  const clear = (along) => {
    const next = Math.max(1, THUMB.side.findIndex(([stop]) => stop >= along));
    const [from, a] = THUMB.side[next - 1];
    const [to, b] = THUMB.side[next];
    // Eased from one stop to the next, so the side is one flowing line.
    const t = Math.min(1, Math.max(0, (along - from) / (to - from)));
    return a + (b - a) * (0.5 - 0.5 * Math.cos(Math.PI * t));
  };
  // Lower down the photo shows more than the thumb here: past the shadow down
  // the thumb's side there is a strip of the palm behind it, and then the
  // phone. The thumb is ended at that shadow, so the gap between it and the
  // phone is open to whatever is behind the hand. On each row the strip is
  // the brightest skin near the phone, and the shadow the darkest spot to its
  // left, if it is `THUMB.shadow` darker.
  const luma = blur(
    Float32Array.from(
      { length: N },
      (_, k) => 0.3 * data[k * 3] + 0.59 * data[k * 3 + 1] + 0.11 * data[k * 3 + 2],
    ),
    UP,
  );
  const bottom = thumbCut + THUMB.fade[1] * UP;
  const ends = [];
  for (let y = bodyT; y < bottom; y++) {
    const along = Math.min(1, (y - top) / (thumbCut - top));
    const edge = Math.round(bodyL - clear(along) * UP);
    let strip = -1;
    for (let x = edge - 1; x >= edge - 16 * UP && along > 0.4; x--) {
      const k = y * W + x;
      if (hand[k] && skin[k] && (strip < 0 || luma[k] > luma[y * W + strip])) strip = x;
    }
    let shadow = strip;
    for (let x = strip; x >= 0 && x >= strip - 40 * UP && hand[y * W + x]; x--)
      if (luma[y * W + x] < luma[y * W + shadow]) shadow = x;
    const found = strip >= 0 && luma[y * W + strip] - luma[y * W + shadow] > THUMB.shadow;
    ends.push(found ? Math.min(edge, shadow + 2 * UP) : edge);
  }
  // Each row takes the furthest end among its neighbours, and those are then
  // averaged, so the side stays one flowing line that is nowhere short of the
  // shadow. Below the cut, what lies under the phone is left alone.
  const reach = 14 * UP;
  const near = (list, i) => list.slice(Math.max(0, i - reach), i + reach + 1);
  const furthest = ends.map((_, i) => Math.min(...near(ends, i)));
  ends.forEach((_, i) => {
    const around = near(furthest, i);
    const end = Math.round(around.reduce((sum, x) => sum + x, 0) / around.length);
    const y = bodyT + i;
    if (y < thumbCut) sideEnd[y] = end;
    for (let x = end; x < (y < thumbCut ? half : bodyL); x++) hand[y * W + x] = 0;
  });
}

// The thumb's tip, rounded off: a half circle as wide as the thumb is just
// below its tip.
{
  const edge = bodyL - 90 * UP;
  let tip = bodyT;
  const row = (y) => {
    let left = -1;
    let right = -1;
    let count = 0;
    for (let x = edge; x < (bodyL + bodyR) >> 1; x++) {
      if (!hand[y * W + x]) continue;
      if (left < 0) left = x;
      right = x;
      count++;
    }
    return [left, right, count];
  };
  // The tip is the first row with a thumb's width of skin in it: above it
  // there is only the thumb's reflection in the phone's edge.
  while (row(tip)[2] < 12 * UP) tip++;
  const [left, right] = row(tip + 30 * UP);
  const r = (right - left) / 2;
  const cx = (left + right) / 2;
  const cy = tip + r;
  for (let y = bodyT; y < cy; y++)
    for (let x = edge; x < (bodyL + bodyR) >> 1; x++)
      hand[y * W + x] = Math.hypot(x - cx, y - cy) <= r ? 1 : 0;
}

// Fill any hole the hand shuts in: whatever is not hand and cannot be reached
// from the photo's border.
{
  const open = new Uint8Array(N);
  const stack = [];
  const visit = (k) => {
    if (hand[k] || open[k]) return;
    open[k] = 1;
    stack.push(k);
  };
  for (let x = 0; x < W; x++) {
    visit(x);
    visit((H - 1) * W + x);
  }
  for (let y = 0; y < H; y++) {
    visit(y * W);
    visit(y * W + W - 1);
  }
  while (stack.length) {
    const k = stack.pop();
    const x = k % W;
    if (x > 0) visit(k - 1);
    if (x < W - 1) visit(k + 1);
    if (k >= W) visit(k - W);
    if (k < N - W) visit(k + W);
  }
  for (let k = 0; k < N; k++) if (!open[k]) hand[k] = 1;
}

// Smooth the outline: blur the shape and take it where it is half there.
{
  const soft = blur(Float32Array.from(hand), SMOOTH * UP);
  for (let k = 0; k < N; k++) hand[k] = soft[k] >= 0.5 ? 1 : 0;
  // Just above the cut the smoothing rounds the corner between the thumb's
  // side and the palm under the phone into a little spur on the thumb. The
  // side is put back as it was there.
  for (let y = thumbCut - 2 * SMOOTH * UP; y < thumbCut; y++)
    for (let x = sideEnd[y]; x < (bodyL + bodyR) >> 1; x++) hand[y * W + x] = 0;
}

// The fingers in front of the phone are the pieces to the right of its middle.
const front = new Uint8Array(N);
{
  const { label } = pieces(hand);
  const seen = new Map();
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const id = label[y * W + x];
      if (!id) continue;
      const s = seen.get(id) ?? { sum: 0, n: 0, maxX: 0 };
      s.sum += x;
      s.n++;
      s.maxX = Math.max(s.maxX, x);
      seen.set(id, s);
    }
  for (let k = 0; k < N; k++) {
    const s = seen.get(label[k]);
    if (!s || s.sum / s.n < (bodyL + bodyR) / 2) continue;
    // A piece that never leaves the phone is a reflection in its edge.
    if (s.maxX > bodyR) front[k] = 1;
    else hand[k] = 0;
  }
}

// The fingertips come out of the photo ragged: shadow eats into them, two of
// them run together, and the phone's glossy edge mirrors one. Each is cleaned
// up into the rounded shape a fingertip is.
{
  /** Each piece of a mask: its rows, as [first x, last x], top to bottom. */
  const shapes = (mask) => {
    const { label, sizes } = pieces(mask);
    const found = sizes.map(() => new Map());
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const id = label[y * W + x];
        if (!id) continue;
        const row = found[id].get(y);
        if (row) row[1] = x;
        else found[id].set(y, [x, x]);
      }
    }
    return found.slice(1).map((rows) => [...rows].map(([y, [a, b]]) => [y, a, b]));
  };

  for (let k = 0; k < N; k++) if (front[k]) hand[k] = 0;

  // Drop whatever is too thin to be a finger, and whatever lies far onto the
  // phone: both are reflections.
  let tips = morph(morph(front, 5 * UP, false), 5 * UP, true);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < bodyR - FINGER.reach * UP; x++) tips[y * W + x] = 0;

  // Part the fingers that run together, at the narrowest row between them.
  for (const rows of shapes(tips)) {
    if (rows.length < FINGER.tall * UP) continue;
    const middle = rows.slice(rows.length * 0.3, rows.length * 0.7);
    const [neck] = middle.reduce((best, row) =>
      row[2] - row[1] < best[2] - best[1] ? row : best,
    );
    for (let y = neck - 3 * UP; y <= neck + 3 * UP; y++)
      for (let x = 0; x < W; x++) tips[y * W + x] = 0;
  }

  // Fill each out to its convex outline: a fingertip has no dents.
  const turn = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const round = new Uint8Array(N);
  for (const rows of shapes(tips)) {
    if (rows.length < 20 * UP) continue;
    const points = rows
      .flatMap(([y, a, b]) => [[a, y], [b, y]])
      .sort((p, q) => p[0] - q[0] || p[1] - q[1]);
    const half = (list) => {
      const out = [];
      for (const p of list) {
        while (out.length > 1 && turn(out.at(-2), out.at(-1), p) <= 0) out.pop();
        out.push(p);
      }
      return out.slice(0, -1);
    };
    const hull = [...half(points), ...half(points.toReversed())];
    for (const [y] of rows) {
      let from = W;
      let to = -1;
      hull.forEach(([ax, ay], i) => {
        const [bx, by] = hull[(i + 1) % hull.length];
        if (Math.min(ay, by) > y || Math.max(ay, by) < y) return;
        const xs = ay === by ? [ax, bx] : [ax + ((y - ay) * (bx - ax)) / (by - ay)];
        from = Math.min(from, ...xs);
        to = Math.max(to, ...xs);
      });
      for (let x = Math.ceil(from); x <= to; x++) round[y * W + x] = 1;
    }
  }

  // Enlarge the topmost fingertip, about the middle of its edge by the phone,
  // so that it grows outwards and stays where it is on the phone.
  {
    const [first] = shapes(round);
    const cy = (first[0][0] + first.at(-1)[0]) / 2;
    const cx = Math.min(...first.map(([, from]) => from));
    for (const [y, from, to] of first)
      for (let x = from; x <= to; x++) round[y * W + x] = 0;
    for (const [y, from, to] of first) {
      const top = Math.round(cy + (y - cy) * FINGER.first);
      const end = Math.round(cx + (to - cx) * FINGER.first);
      // Each row of it becomes as many rows as it is enlarged by.
      for (let row = top; row < top + FINGER.first; row++)
        for (let x = Math.round(cx + (from - cx) * FINGER.first); x <= end; x++)
          round[row * W + x] = 1;
    }
  }

  const soft = blur(Float32Array.from(round), 5 * UP);
  for (let k = 0; k < N; k++) {
    front[k] = soft[k] >= 0.5 ? 1 : 0;
    if (front[k]) hand[k] = 1;
  }
}

// ── Brightness, smoothed a little so the bands come out as clean shapes ─────
const light = new Float32Array(N);
{
  const sum = new Float32Array(N);
  const weight = new Float32Array(N);
  for (let k = 0; k < N; k++) {
    if (!hand[k] || !skin[k]) continue;
    sum[k] = 0.3 * data[k * 3] + 0.59 * data[k * 3 + 1] + 0.11 * data[k * 3 + 2];
    weight[k] = 1;
  }
  // The brightness of the skin within `R` px, or 0 where there is none.
  const within = (R) => {
    const s = blur(sum, R);
    const w = blur(weight, R);
    return (k) => (w[k] > 0.02 ? s[k] / w[k] : 0);
  };
  const close = within(2.5 * UP);
  const wide = within(8 * UP);
  // Parts of the shape that are not skin in the photo take the brightness of
  // the skin near them, or failing that 0: the darkest band.
  for (let k = 0; k < N; k++) light[k] = close(k) || wide(k);
}

const sorted = Float32Array.from(light.filter((_, k) => hand[k] && skin[k])).sort();
const cuts = BANDS.map((p) => sorted[Math.floor((sorted.length - 1) * (p / 100))]);

// Each band's colour is the average of the skin that falls in it.
const colours = BANDS.map((_, i) => {
  const lo = cuts[i];
  const hi = cuts[i + 1] ?? Infinity;
  const sum = [0, 0, 0];
  let n = 0;
  for (let k = 0; k < N; k++) {
    if (!hand[k] || !skin[k] || light[k] < lo || light[k] >= hi) continue;
    for (let c = 0; c < 3; c++) sum[c] += data[k * 3 + c];
    n++;
  }
  return "#" + sum.map((v) => Math.round(v / n).toString(16).padStart(2, "0")).join("");
});

// ── Outlines ────────────────────────────────────────────────────────────────
/** The closed outlines of a mask, as lists of [x, y] corner points. */
function outlines(mask) {
  const on = (x, y) => x >= 0 && y >= 0 && x < W && y < H && mask[y * W + x];
  // Every edge between an on pixel and an off one, walked with the on pixel
  // on its right, keyed by where it starts.
  const next = new Map();
  const add = (x1, y1, x2, y2) => {
    const key = y1 * (W + 1) + x1;
    const list = next.get(key);
    if (list) list.push([x2, y2]);
    else next.set(key, [[x2, y2]]);
  };
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (!mask[y * W + x]) continue;
      if (!on(x, y - 1)) add(x, y, x + 1, y);
      if (!on(x + 1, y)) add(x + 1, y, x + 1, y + 1);
      if (!on(x, y + 1)) add(x + 1, y + 1, x, y + 1);
      if (!on(x - 1, y)) add(x, y + 1, x, y);
    }
  }
  const loops = [];
  for (const [key, list] of next) {
    while (list.length) {
      const loop = [];
      let x = key % (W + 1);
      let y = (key - x) / (W + 1);
      for (;;) {
        const out = next.get(y * (W + 1) + x);
        if (!out || !out.length) break;
        loop.push([x, y]);
        [x, y] = out.pop();
      }
      if (loop.length > 8) loops.push(loop);
    }
  }
  return loops;
}

const area = (loop) =>
  Math.abs(
    loop.reduce((sum, [x, y], i) => {
      const [nx, ny] = loop[(i + 1) % loop.length];
      return sum + x * ny - nx * y;
    }, 0) / 2,
  );

/** Drops the points that add nothing to an outline's shape. */
function simplify(loop) {
  const keep = new Uint8Array(loop.length);
  const far = (a, b) => {
    let best = 0;
    let at = -1;
    const [ax, ay] = loop[a];
    const [bx, by] = loop[b];
    const len = Math.hypot(bx - ax, by - ay) || 1;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs((bx - ax) * (ay - loop[i][1]) - (ax - loop[i][0]) * (by - ay)) / len;
      if (d > best) {
        best = d;
        at = i;
      }
    }
    return best > DETAIL ? at : -1;
  };
  const half = loop.length >> 1;
  keep[0] = keep[half] = 1;
  const stack = [[0, half], [half, loop.length - 1]];
  keep[loop.length - 1] = 1;
  while (stack.length) {
    const [a, b] = stack.pop();
    const at = far(a, b);
    if (at < 0) continue;
    keep[at] = 1;
    stack.push([a, at], [at, b]);
  }
  return loop.filter((_, i) => keep[i]);
}

/** A smooth closed path through an outline's points, in px of the photo. */
function curve(loop) {
  const n = loop.length;
  const p = (i) => loop[((i % n) + n) % n];
  const f = (v) => (v / UP).toFixed(1).replace(/\.0$/, "");
  // The direction the curve passes through a point in: along the line between
  // its neighbours. Where the outline turns sharply the point is a corner, and
  // the curve goes straight into and out of it.
  const through = (i) => {
    const [ax, ay] = p(i - 1);
    const [bx, by] = p(i);
    const [cx, cy] = p(i + 1);
    const along =
      ((bx - ax) * (cx - bx) + (by - ay) * (cy - by)) /
      (Math.hypot(bx - ax, by - ay) * Math.hypot(cx - bx, cy - by) || 1);
    const span = Math.hypot(cx - ax, cy - ay) || 1;
    return along < 0.6 ? [0, 0] : [(cx - ax) / span, (cy - ay) / span];
  };
  let d = `M${f(p(0)[0])} ${f(p(0)[1])}`;
  for (let i = 0; i < n; i++) {
    const [x1, y1] = p(i);
    const [x2, y2] = p(i + 1);
    // Each handle is a third of its own stretch of outline. Sized from the
    // neighbouring stretches instead, a long straight run would throw the
    // curve wide of the short ones beside it.
    const reach = Math.hypot(x2 - x1, y2 - y1) / 3;
    const [ox, oy] = through(i);
    const [ix, iy] = through(i + 1);
    d += `C${f(x1 + ox * reach)} ${f(y1 + oy * reach)} ${f(x2 - ix * reach)} ${f(y2 - iy * reach)} ${f(x2)} ${f(y2)}`;
  }
  return d + "Z";
}

/**
 * The path of everything in `part` at least as bright as band `i`. The bands
 * above the first may be taken from a larger shape, `shade`, so that an edge
 * `part` was given by trimming is not shaded as if the hand ended there.
 */
function trace(part, i, shade = part) {
  const mask = new Uint8Array(N);
  for (let k = 0; k < N; k++)
    if (i === 0 ? part[k] : shade[k] && light[k] >= cuts[i]) mask[k] = 1;
  return outlines(mask)
    .filter((loop) => area(loop) > 60 * UP * UP)
    .map((loop) => curve(simplify(loop)))
    .join("");
}

/**
 * The path of the thumb's nail: the strip of `thumb` along its back edge,
 * rounded off at both ends.
 */
function nail(thumb) {
  let tip = 0;
  while (!thumb.subarray(tip * W, tip * W + bodyL).includes(1)) tip++;
  const mask = new Uint8Array(N);
  const rows = NAIL.length * UP;
  for (let i = 0; i < rows; i++) {
    const y = tip + NAIL.from * UP + i;
    const back = thumb.indexOf(1, y * W) - y * W;
    const width = NAIL.width * UP * Math.min(1, 2.4 * Math.sin((Math.PI * i) / rows));
    for (let x = back; x < back + width; x++) mask[y * W + x] = thumb[y * W + x];
  }
  return outlines(mask)
    .map((loop) => curve(simplify(loop)))
    .join("");
}

// Everything else is behind the phone, but for the thumb: what lies to the
// phone's left above the cut, and a strip below the cut for the page to fade
// it out over, which stops just short of the phone. The palm runs on a little
// above the cut too, under the thumb, so that neither part's edge falls where
// the other fades.
const behind = new Uint8Array(N);
const thumb = new Uint8Array(N);
const overlap = 30 * UP;
const solid = thumbCut + THUMB.fade[0] * UP;
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const k = y * W + x;
    if (!hand[k] || front[k]) continue;
    const above = y < thumbCut && x <= bodyL + UP;
    const below =
      y >= thumbCut && y < thumbCut + THUMB.fade[1] * UP && x < bodyL - UP;
    if (above || below) thumb[k] = 1;
    if (!above || y >= thumbCut - overlap) behind[k] = 1;
  }
}

// As far down as the thumb is solid, the palm under it stops short of the
// hand's outline, by more the further it is from the thumb's pivot: more than
// the thumb ever moves there. Otherwise, as the thumb turned, a corner of the
// palm would show beside it. It keeps its untrimmed shape for its shading.
const behindWhole = behind.slice();
for (let y = thumbCut - overlap; y < solid; y++) {
  const by = Math.round(Math.min(9 * UP, 0.25 * (solid - y)));
  let from = 0;
  let to = bodyL + UP;
  while (from <= to && !behind[y * W + from]) from++;
  while (to >= from && !behind[y * W + to]) to--;
  for (let x = from; x < from + by; x++) behind[y * W + x] = 0;
  for (let x = to; x > to - by; x--) behind[y * W + x] = 0;
}

// The pivot: the middle of the thumb, on its row.
const pivot = (() => {
  const y = thumbCut + THUMB.pivot * UP;
  const from = thumb.indexOf(1, y * W) - y * W;
  const to = thumb.lastIndexOf(1, y * W + bodyL) - y * W;
  return [Math.round((from + to) / 2 / UP), Math.round(y / UP)];
})();

/** A fingernail's path: a rectangle rounded almost to an oval, turned. */
function fingerNail([cx, cy, w, h, turn]) {
  const r = w * 0.42;
  const cos = Math.cos((turn * Math.PI) / 180);
  const sin = Math.sin((turn * Math.PI) / 180);
  const at = (x, y) =>
    `${(cx + x * cos - y * sin).toFixed(1)} ${(cy + x * sin + y * cos).toFixed(1)}`;
  const arc = `A${r.toFixed(1)} ${r.toFixed(1)} 0 0 1 `;
  const [x, y] = [w / 2, h / 2];
  return (
    `M${at(r - x, -y)}L${at(x - r, -y)}${arc}${at(x, r - y)}` +
    `L${at(x, y - r)}${arc}${at(x - r, y)}` +
    `L${at(r - x, y)}${arc}${at(-x, y - r)}` +
    `L${at(-x, r - y)}${arc}${at(r - x, -y)}Z`
  );
}

const px = (v) => +(v / UP).toFixed(1);
const art = {
  size: meta.width,
  tilt: +tilt.toFixed(2),
  body: { left: px(bodyL), top: px(bodyT), right: px(bodyR + 1), bottom: px(bodyB + 1) },
  screen: { left: px(screen.left), top: px(screen.top), right: px(screen.right + 1), bottom: px(screen.bottom + 1) },
  behind: BANDS.map((_, i) => ({ fill: colours[i], d: trace(behind, i, behindWhole) })),
  thumb: BANDS.map((_, i) => ({ fill: colours[i], d: trace(thumb, i) })),
  front: BANDS.map((_, i) => ({ fill: colours[i], d: trace(front, i) })),
  nail: nail(thumb),
};

const box = (b) =>
  `{ left: ${b.left}, top: ${b.top}, right: ${b.right}, bottom: ${b.bottom} }`;
const lines = (layers) =>
  layers.map((l) => `    { fill: "${l.fill}", d: "${l.d}" },`).join("\n");

await writeFile(
  target,
  `// Written by scripts/trace-hand.mjs from design/hand-source.jpg. Do not edit:
// change the script and run \`npm run hand\`.

/** One band of the hand's skin: everything at least this bright. */
export type HandLayer = { fill: string; d: string };

/**
 * A hand holding a phone, traced from a photo. All measurements are in px of
 * that photo, which is \`size\` square.
 */
export const handArt = {
  size: ${art.size},
  /** How far off upright the photo's phone is held, in degrees. */
  tilt: ${art.tilt},
  /** The phone's body in the photo, and the screen inside it. */
  body: ${box(art.body)},
  screen: ${box(art.screen)},
  /** The palm and wrist, which go behind the phone. */
  behind: [
${lines(art.behind)}
  ] as HandLayer[],
  /**
   * The thumb, which lies along the phone's side, just clear of it. It turns
   * about \`pivot\`, and is to be faded out from the row \`from\` to nothing
   * at the row \`to\`, where it overlaps the palm.
   */
  thumb: [
${lines(art.thumb)}
  ] as HandLayer[],
  thumbJoint: { from: ${THUMB.cut + THUMB.fade[0]}, to: ${THUMB.cut + THUMB.fade[1]}, pivot: [${pivot.join(", ")}] },
  /** The thumb's nail: a paler strip down its back edge. */
  nail: "${art.nail}",
  /** The fold under the pad of the thumb: a line, to be stroked. */
  fold: "${FOLD}",
  /** The nails of the fingertips in front of the phone. */
  fingerNails: "${FINGER_NAILS.map(fingerNail).join("")}",
  /** The fingertips that curl round the phone's edge, in front of it. */
  front: [
${lines(art.front)}
  ] as HandLayer[],
};
`,
);

const bytes = [...art.behind, ...art.thumb, ...art.front].reduce((n, l) => n + l.d.length, 0);
console.log(`hand-art.ts: ${BANDS.length} bands, ${(bytes / 1024).toFixed(1)} KB of paths`);
console.log("colours", colours.join(" "), "tilt", art.tilt);
console.log("body", art.body, "screen", art.screen);
