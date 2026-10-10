// GLSL for the hero mark. Kept free of backticks and ${} so a test harness can
// extract the strings without compiling TypeScript.
//
// Geometry is measured from public/image.png. One mark unit is 167.5 px of the
// 2048 px source. In the logo's own frame, s runs along the long straight pole
// and n across it.
//
// The S is read as a black hole seen at an angle: the pole is its axis, and
// the two arms are two half-turns of the disc around it. At rest (uAlpha = 0)
// the picture is the logo exactly; uAlpha turns the disc about the pole, and
// as it turns the arms stop being solid shapes and become light.

/** Sparks the cursor can feed the hole at once. Must match the shader loop. */
export const SPARKS = 14;

/** The square that frames the mark (the icon crop) is this many units wide. */
export const UNITS_PER_BOX = 5.97;

/**
 * Nothing is drawn further than this many units from the centre, left/right or
 * up/down. The canvas is sized to it, so keep it as small as the picture
 * allows: the pole's tips reach 2.65 and the dust 2.8.
 */
export const DRAW_REACH = 3.15;

export const VERTEX = `
attribute vec2 aPos;
void main() {
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

export const FRAGMENT = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2 uCenter;     // mark centre, device px, origin bottom-left
uniform float uUnit;      // device px per mark unit
uniform float uTime;      // seconds
uniform float uFlow;      // seconds of disc motion; runs faster when excited
uniform float uPx;        // device pixel ratio
uniform float uAmbient;   // 0..1: dust and sparks around the mark
uniform float uMark;      // 0..1: the mark itself
uniform float uPulse;     // 1 -> 0 after something is swallowed
uniform float uAlpha;     // how far the disc has turned about the pole, radians
uniform float uWobble;    // 0..1: how much the disc rocks at rest
uniform float uLite;      // 1 on devices that cannot keep up: fewer layers
uniform vec2 uJet;        // x = position along the pole, y = brightness
uniform float uSparkN;    // how many of uSparks are in use
uniform vec3 uSparks[14]; // xy in mark units, z = brightness

const float PI = 3.14159265;
const float TAU = 6.2831853;
const float TILT = 0.397; // see DISC_TILT in ../hole.ts

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

// Dust on log-spiral paths in the plane of the disc. Each grain keeps its cell
// while time carries the cell inward and around, so grains shrink and speed up
// toward the centre. lr = log(radius), th = angle, both in the disc's plane.
float dust(float lr, float th, float n, float t, float seed) {
  float k = n / TAU;
  float u = lr * k + t * 0.9;
  float w = (th + 1.6 * lr - t * 0.18) * k;
  vec2 id = floor(vec2(u, w));
  vec2 f = fract(vec2(u, w)) - 0.5;
  id.y = mod(id.y, n);
  float h = hash12(id + seed);
  if (h < 0.62) return 0.0;
  vec2 o = (vec2(hash12(id + seed + 3.1), hash12(id + seed + 9.7)) - 0.5) * 0.6;
  vec2 dd = f - o;
  dd.y *= 0.45; // stretched along the direction of travel
  float size = 0.05 + 0.07 * hash12(id + seed + 5.5);
  return smoothstep(size, 0.0, length(dd)) * (h - 0.62) / 0.38;
}

// One arm: half a turn of the disc, thin at its tail and thick at its head.
// At rest the head stands on the pole and flares into it, a solid shape. As it
// turns away it becomes light: soft-edged, with a bright point at its head and
// a trail behind its tail.
// q = (s, n). alpha turns it about the pole; rest is 1 at the logo's pose and
// falls to 0 as it turns away. Returns (solid coverage, glow, brightness).
vec3 arm(vec2 q, float aa, float alpha, float rest, float hw) {
  const float c = 0.113;   // the arm's orbit sits this far along the pole
  const float H = 1.94;    // radius of the orbit, across the pole
  const float k = -0.06;   // lean of the apex

  float away = 1.0 - rest;
  float Y = q.y / H;
  float X = (q.x - c - k * Y) / hw;
  float g = length(vec2(X, Y));
  vec2 grad = vec2(X / hw, -k * X / (H * hw) + Y / H) / max(g, 0.0001);
  float d = abs(g - 1.0) / max(length(grad), 0.0001);

  // u: 0 at the tail, 1 at the head, 1..2 the empty half of the orbit.
  float u = mod(atan(Y, X) - alpha, TAU) / PI;
  // Near the pose the head reaches for the pole, so no gap opens between them.
  // Only on the arm's own side of the pole: the far side stays clear.
  float near = step(0.0, q.y);
  float inArm = step(u, 1.0 + 0.2 * rest * near);
  float pl = min(u, 1.0) * PI;

  // Half-thickness, measured along the logo's arm: it grows steadily from the
  // tail to just past the apex, then more slowly down to the head.
  float h = 0.0527 * clamp(pl - 0.12, 0.0, 1.48) + 0.02 * max(pl - 1.6, 0.0);
  // Matter moving along it toward the head.
  h *= 1.0 + 0.10 * sin(u * 20.0 - uFlow * 2.6) * smoothstep(0.12, 0.45, u) * (1.0 - smoothstep(0.78, 0.95, u));
  // The half of the orbit behind the pole looks thinner and dimmer, which is
  // what makes it read as a disc turning in depth.
  float behind = smoothstep(-0.2, 0.8, X / max(g, 0.0001)) * away;
  h *= 1.0 - 0.2 * behind;
  // In flight the leading end narrows to a point instead of ending bluntly.
  float nose = smoothstep(0.84, 1.0, u) * away;
  h *= 1.0 - 0.72 * nose;

  // Where the head meets the pole it flares: a long fillet outward along the
  // pole, a short one inward. Both are measured from the logo.
  float nn = max(q.y, 0.0);
  float foot = smoothstep(0.75, 0.95, u) * inArm * rest * near;
  float outward = max(0.0677 / (nn + 0.009) - 0.0567, 0.0) * (1.0 - smoothstep(2.6, 3.3, abs(q.x)));
  float inward = 0.40 * exp(-nn / 0.27);
  h += foot * (g > 1.0 ? outward : inward);

  // Crisp at the pose. In flight it is light, not a solid: its edge softens
  // and it fades out toward both ends. Nothing here may switch on or off
  // along a line, or that line shows as a hard edge in the glow.
  float soft = mix(aa, max(aa, 0.5 * h), away);
  float cover = (1.0 - smoothstep(h - soft, h + aa, d)) * inArm;
  cover *= mix(1.0, smoothstep(0.0, 0.3, u) * (1.0 - smoothstep(0.88, 1.0, u)), away);

  // At the pose the head ends in a rounded cap, whose far half would poke
  // through the pole and so is dropped. In flight there is no cap: the head
  // is a point of light.
  float ha = alpha + PI;
  vec2 head = vec2(c + hw * cos(ha) + k * sin(ha), H * sin(ha));
  float toHead = length(q - head);
  cover = max(cover, (1.0 - smoothstep(0.109 - aa, 0.109 + aa, toHead)) * near * rest);

  // Its light. A bloom hugs the arm, strongest where the arm is thickest, and
  // fades out just past the head. The wide part of it ends at a set distance,
  // so nothing is left to be cut off at the edge of the canvas.
  float edge = max(d - h, 0.0);
  float past = (u - 1.0) / 0.04;
  float body = u <= 1.0 ? smoothstep(0.02, 0.4, u) : exp(-past * past);
  float wide = exp(-edge * 3.4) * 0.13 * (1.0 - smoothstep(0.6, 1.1, edge));
  float glow = (exp(-edge * 11.0) * 0.5 + wide) * body * mix(0.4, 1.0, away);
  // A hot point leads it...
  glow += (exp(-toHead * toHead / 0.035) * 0.75 + exp(-toHead * toHead / 0.004) * 0.6) * away;
  // ...and a trail of light follows its tail round the orbit. t runs along the
  // orbit from the tail: negative behind it, positive into the arm. The trail
  // is brightest at the tail, thins out behind it, and blends into the arm.
  float t = u <= 1.0 ? u : u - 2.0;
  float trail = t < 0.0
    ? exp(t * 2.4) * smoothstep(-1.0, -0.7, t)
    : 1.0 - smoothstep(0.0, 0.35, t);
  glow += exp(-d * 13.0) * trail * 0.42 * away;
  // A faint ring marks the whole orbit.
  glow += exp(-d * 16.0) * 0.04;

  // The white is not flat: fine filaments run the length of the arm and drift
  // across it as matter flows toward the head. They show more in flight.
  float across = sign(g - 1.0) * d / max(h, 0.001);
  float filaments = 0.5 + 0.5 * sin(across * 7.0 + u * 9.0 - uFlow * 4.0);
  float tone = 1.0 - mix(0.10, 0.22, away) * filaments * smoothstep(0.1, 0.35, u) - 0.14 * behind;
  // In flight its core is white-hot; the filaments only show toward the edges.
  tone = mix(tone, 1.0, away * (1.0 - smoothstep(0.0, 0.65, abs(across))));

  return vec3(cover, glow, tone);
}

void main() {
  vec2 v = (gl_FragCoord.xy - uCenter) / uUnit; // mark units, y up
  // (s, n): s runs along the pole (up-right), n across it (up-left).
  vec2 l = vec2(v.x + v.y, v.y - v.x) * 0.70710678;
  // The disc, seen at the same angle as the arms.
  vec2 dp = vec2(l.x / TILT, l.y);
  float rho = length(dp);
  float r = length(v);

  // The corners of the canvas hold nothing (unless a spark is on its way in),
  // so skip the work there. The test must only pass where every term below is
  // exactly zero, or its outline would show: beyond the arms' bloom along the
  // pole and clear of the pole's own glow, or beyond the dust across it.
  bool empty = (abs(l.x) > 2.2 && abs(l.y) > 0.6) || abs(l.y) > 3.95;
  if (uSparkN < 0.5 && empty && rho > 3.95 && r > 2.45) {
    gl_FragColor = vec4(0.0);
    return;
  }

  float aa = 1.2 * uPx / uUnit;

  // Close to the logo's pose the disc snaps into it, as if the pole caught it.
  float da = mod(uAlpha + PI, TAU) - PI;
  float alpha = da * smoothstep(0.05, 0.6, abs(da));
  float rest = 1.0 - smoothstep(0.0, 0.25, abs(alpha));
  // At rest the disc rocks a little, as a tilted disc would.
  float hw = 0.77 * (1.0 + 0.06 * uWobble * rest * sin(uTime * 0.55));

  // The two arms are point-mirrored.
  vec3 a1 = arm(l, aa, alpha, rest, hw);
  vec3 a2 = arm(-l, aa, alpha, rest, hw);

  // The pole: a hairline that fades out at both ends, with light running out
  // along it, and whatever was last thrown back out.
  float as = abs(l.x);
  float taper = 1.0 - smoothstep(3.2, 3.75, as);
  float sw = 0.015 * taper;
  float pole = (1.0 - smoothstep(sw - aa, sw + aa, abs(l.y))) * smoothstep(0.0, 0.25, taper);
  float beam = exp(-abs(l.y) * 30.0) * taper * (0.14 + 0.08 * sin(as * 5.0 - uFlow * 3.2));
  float jet = uJet.y * exp(-pow((l.x - uJet.x) / 0.3, 2.0)) * exp(-abs(l.y) * 16.0);

  float mark = max(max(a1.x, a2.x), pole);

  // Thin orbit with one slow satellite. It sits slightly below the centre of
  // the S, as in the logo.
  vec2 ov = v + vec2(0.0, 0.14);
  vec2 o = vec2(0.95534 * ov.x + 0.29552 * ov.y, -0.29552 * ov.x + 0.95534 * ov.y);
  vec2 ab = vec2(2.27, 0.57);
  float od = (length(o / ab) - 1.0) * ab.y;
  float orbit = 1.0 - smoothstep(0.0, 1.1 * uPx / uUnit, abs(od));
  float ang = uFlow * 0.45;
  vec2 sat = vec2(cos(ang), sin(ang)) * ab;
  float satGlow = exp(-dot(o - sat, o - sat) * 220.0);

  // Matter in the disc.
  float grains = 0.0;
  float shock = 0.0;
  if (rho < 3.95 && uAmbient > 0.01) {
    float lr = log(max(rho, 0.001));
    float th = atan(dp.y, dp.x);
    float inner = smoothstep(0.25, 0.8, rho);
    float outer = 1.0 - smoothstep(2.6, 3.9, rho);
    float lane = 0.6 + 0.8 * exp(-pow((rho - 1.94) / 0.55, 2.0));
    grains = dust(lr, th, 26.0, uFlow, 1.0);
    if (uLite < 0.5) grains += 0.7 * dust(lr, th, 44.0, uFlow * 1.25 + 7.0, 5.0);
    grains *= inner * outer * lane;
    // A ripple runs out through the disc when something is swallowed.
    shock = exp(-pow((rho - (1.0 - uPulse) * 3.2) / 0.16, 2.0)) * uPulse * (1.0 - smoothstep(2.4, 3.6, rho));
  }

  // Sparks peeled off the cursor.
  float sparks = 0.0;
  for (int i = 0; i < 14; i++) {
    if (float(i) >= uSparkN) break;
    vec3 sp = uSparks[i];
    vec2 dv = v - sp.xy;
    float sig = 0.022 + 0.03 * length(sp.xy);
    sparks += sp.z * exp(-dot(dv, dv) / (sig * sig));
  }

  float core = exp(-r * r * 9.0) * (0.08 + 0.9 * uPulse);

  vec3 cool = vec3(0.78, 0.84, 1.0);
  vec3 bloom = vec3(0.62, 0.76, 1.0);
  vec3 col = vec3(0.0);
  col += cool * (grains * 0.8 + shock * 0.5) * uAmbient;
  col += vec3(0.9, 0.94, 1.0) * sparks * uAmbient;
  col += bloom * (a1.y + a2.y) * uMark;
  col += cool * (core + beam * uAmbient + jet) * uMark;
  col += vec3(0.7, 0.76, 0.9) * (orbit * 0.42 + satGlow * 0.8 * uAmbient) * uMark;
  // Light adds up. Ease it toward white rather than letting it clip, which
  // would leave flat, hard-edged patches wherever several glows overlap.
  col = 1.0 - exp(-col * 1.15);
  float tone =mix((a1.x * a1.z + a2.x * a2.z) / max(a1.x + a2.x, 0.001), 1.0, pole);
  col = mix(col, vec3(0.97, 0.98, 1.0) * tone, mark * uMark);

  // The canvas floats above the page, so it only ever adds light.
  float opacity = clamp(max(col.r, max(col.g, col.b)), 0.0, 1.0);
  gl_FragColor = vec4(col, opacity);
}
`;
