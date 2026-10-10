// GLSL for the space behind the hero. Two passes:
//
//   NEBULA  the slow, expensive part (clouds, dust lanes, distant galaxies).
//           Rendered once into a half-resolution texture, and again on resize.
//   SKY     the cheap per-frame part: that texture plus drifting, twinkling
//           stars, an occasional shooting star, and the way all of it bends
//           around the hole.

export const VERTEX = `
attribute vec2 aPos;
void main() {
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

const NOISE = `
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

// A soft band across the sky through the focus, where stars and clouds gather.
float band(vec2 f) {
  float across = dot(f, vec2(-0.342, 0.940)); // band rises 20 degrees to the right
  return exp(-across * across / 0.16);
}
`;

export const NEBULA = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2 uRes;   // texture size, px
uniform vec2 uFocus; // where the hole rests, px in this texture
uniform float uScale; // px per sky unit (the shorter side of the hero)
${NOISE}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash12(i), hash12(i + vec2(1.0, 0.0)), f.x),
             mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), f.x), f.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = p * 2.03 + vec2(17.1, 9.3);
    a *= 0.5;
  }
  return v;
}

// A small, far-off galaxy: a bright core with two faint spiral arms.
vec3 galaxy(vec2 p, vec2 at, float size, float angle, float squash, vec3 tint) {
  vec2 d = (p - at) / size;
  float c = cos(angle);
  float s = sin(angle);
  d = vec2(c * d.x + s * d.y, (-s * d.x + c * d.y) / squash);
  float r = length(d);
  if (r > 3.0) return vec3(0.0);
  float arms = 0.5 + 0.5 * cos(2.0 * atan(d.y, d.x) + 5.5 * log(r + 0.08));
  float disc = exp(-r * 1.9) * (0.35 + 0.65 * arms);
  float core = exp(-r * r * 14.0);
  return tint * (disc * 0.55 + core * 0.9);
}

void main() {
  vec2 p = gl_FragCoord.xy / uScale;
  vec2 f = (gl_FragCoord.xy - uFocus) / uScale;
  float b = band(f);

  // Clouds, folded through themselves so they look like gas rather than fog.
  vec2 w = vec2(fbm(p * 1.3 + vec2(1.7, 9.2)), fbm(p * 1.3 + vec2(8.3, 2.8)));
  float n1 = fbm(p * 1.7 + 2.4 * w);
  float n2 = fbm(p * 3.3 - 1.5 * w + 5.0);

  float cloud = smoothstep(0.38, 0.9, n1) * (0.22 + 0.78 * b);
  cloud += exp(-dot(f, f) / 0.5) * 0.35 * n2; // a little more around the hole
  vec3 gas = mix(vec3(0.07, 0.13, 0.36), vec3(0.30, 0.15, 0.42), smoothstep(0.3, 0.75, n2));
  gas = mix(gas, vec3(0.52, 0.60, 0.86), smoothstep(0.55, 1.0, cloud));
  vec3 col = gas * cloud * 0.42;

  // Dark dust lanes cutting through the band.
  float lanes = smoothstep(0.5, 0.72, fbm(p * 4.3 + 3.0 * w + 11.0)) * b;
  col *= 1.0 - 0.65 * lanes;

  // The unresolved glow of the band's stars.
  col += vec3(0.20, 0.23, 0.32) * b * (0.25 + 0.75 * n2) * 0.16;

  vec2 size = uRes / uScale;
  col += galaxy(p, size * vec2(0.14, 0.80), 0.060, 0.6, 0.45, vec3(0.80, 0.84, 1.0));
  col += galaxy(p, size * vec2(0.52, 0.16), 0.042, 2.1, 0.60, vec3(1.0, 0.90, 0.80));
  col += galaxy(p, size * vec2(0.90, 0.90), 0.034, 1.2, 0.35, vec3(0.86, 0.88, 1.0));
  col += galaxy(p, size * vec2(0.30, 0.42), 0.022, 2.7, 0.70, vec3(0.90, 0.86, 1.0));
  col += galaxy(p, size * vec2(0.74, 0.30), 0.018, 0.2, 0.50, vec3(1.0, 0.94, 0.86));

  gl_FragColor = vec4(col, 1.0);
}
`;

export const SKY = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform sampler2D uNebula;
uniform vec2 uRes;    // canvas size, device px
uniform vec2 uFocus;  // where the hole rests, device px
uniform float uScale; // device px per sky unit
uniform float uTime;  // seconds
uniform float uPx;    // device pixel ratio
uniform vec2 uShift;  // pointer parallax, device px
uniform vec2 uHole;   // the hole right now, device px
uniform float uPull;  // its lensing radius, device px (0 when it is away)
uniform float uStreak; // 1 to allow shooting stars

const vec3 INK = vec3(0.01961, 0.01961, 0.02353);
${NOISE}
vec3 stars(vec2 p, float cell, float density, float size, float t) {
  vec2 id = floor(p / cell);
  vec2 f = fract(p / cell) - 0.5;
  float h = hash12(id);
  if (h > density) return vec3(0.0);
  vec2 o = (vec2(hash12(id + 7.1), hash12(id + 13.7)) - 0.5) * 0.8;
  float d = length(f - o) * cell;
  // Most pixels of a cell are nowhere near its star: stop here for those.
  if (d > size * 9.0) return vec3(0.0);
  float mag = pow(hash12(id + 3.3), 3.0); // most are faint, a few are bright
  float twinkle = 0.72 + 0.28 * sin(t * (0.8 + 2.6 * hash12(id + 5.1)) + h * 90.0);
  float r = size * (0.6 + mag);
  float core = smoothstep(r, 0.0, d);
  float glow = exp(-d * d / (r * r * 9.0)) * 0.3 * mag;
  vec3 tint = mix(vec3(0.72, 0.80, 1.0), vec3(1.0, 0.90, 0.78), hash12(id + 11.9));
  return tint * (core * (0.3 + 0.7 * mag) + glow) * twinkle;
}

void main() {
  vec2 p = gl_FragCoord.xy;

  // Light bends around the hole, so the sky behind it is pushed outward.
  vec2 d = p - uHole;
  float r2 = dot(d, d) + 1.0;
  float e2 = uPull * uPull;
  float reach = 1.0 - smoothstep(uPull * 2.0, uPull * 6.0, sqrt(r2));
  vec2 q = p - d * (e2 / (r2 + e2 * 0.6)) * reach;

  vec3 col = texture2D(uNebula, (q + uShift * 0.25) / uRes).rgb;

  float b = band((q - uFocus) / uScale);
  float crowd = 0.5 + 0.9 * b;
  // Three depths of stars; nearer ones are larger and drift a little faster.
  vec2 drift = uTime * vec2(-1.6, 0.5) * uPx;
  col += stars(q + drift * 0.5 + uShift * 0.4, 24.0 * uPx, 0.55, 0.75 * uPx, uTime) * 0.55 * crowd;
  col += stars(q + drift * 1.0 + uShift * 0.7, 62.0 * uPx, 0.5, 1.15 * uPx, uTime + 4.0) * 0.8 * crowd;
  col += stars(q + drift * 1.7 + uShift * 1.0, 170.0 * uPx, 0.5, 1.9 * uPx, uTime + 9.0);

  // Now and then a shooting star crosses the upper sky.
  float period = 8.0;
  float cycle = floor(uTime / period);
  float progress = fract(uTime / period) * period / 0.9;
  if (uStreak > 0.5 && progress < 1.0) {
    vec2 from = vec2(0.25 + 0.7 * hash12(vec2(cycle, 1.0)), 0.6 + 0.38 * hash12(vec2(cycle, 2.0))) * uRes;
    vec2 dir = normalize(vec2(-0.8 - 0.4 * hash12(vec2(cycle, 3.0)), -0.42));
    vec2 head = from + dir * progress * uRes.y * 0.55;
    float along = dot(p - head, -dir);
    float off = length(p - head + dir * along);
    float len = 140.0 * uPx;
    if (along > 0.0 && along < len) {
      col += vec3(0.85, 0.9, 1.0) * (1.0 - along / len) * exp(-off * off / (1.6 * uPx * uPx)) * sin(3.14159 * progress);
    }
  }

  gl_FragColor = vec4(INK + col, 1.0);
}
`;
