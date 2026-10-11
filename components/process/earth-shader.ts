// GLSL for the Earth in the "How we work" section: one pass over a square
// canvas that holds the globe and the glow of its air.
//
// Each pixel inside the disc is a point on a sphere seen from far away. The
// point is turned back by the planet's lean and by how far it has spun, which
// gives a longitude and a latitude to look up in the map (an ordinary
// equirectangular photo: public/process/earth.webp). The rest is light: a sun
// up and to the left, a soft edge between day and night, a glint on the sea,
// thin cloud drifting a little faster than the ground, and air that turns
// blue towards the limb and spills a little past it.
//
// Cambodia, where we are, is lit: the country itself glows, and a ring of
// light spreads out from it every few seconds.

/** How far the axis leans from upright, and nods towards us, in radians. */
export const LEAN = 0.41;
export const NOD = 0.3;

/** The middle of Cambodia: degrees east, degrees north. */
export const HOME: [lon: number, lat: number] = [105, 12.55];

/**
 * Cambodia's border, much simplified, as degrees east and north, going round
 * from the north-west. The planet is small on the page and the country a
 * dozen pixels across, so this is all the detail that can be seen.
 */
export const BORDER: [lon: number, lat: number][] = [
  [102.35, 13.57],
  [102.9, 14.2],
  [103.5, 14.4],
  [104.8, 14.4],
  [105.2, 14.3],
  [106.0, 14.35],
  [106.5, 14.6],
  [107.5, 14.7],
  [107.6, 13.5],
  [107.5, 12.3],
  [106.4, 11.7],
  [105.9, 11.0],
  [105.1, 10.9],
  [104.45, 10.42],
  [103.6, 10.5],
  [103.1, 11.0],
  [102.9, 11.7],
  [102.55, 12.2],
  [102.5, 12.7],
];

export const VERTEX = /* glsl */ `
attribute vec2 aPos;
void main() {
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

export const FRAGMENT = /* glsl */ `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2 uRes;       // canvas size, px
uniform float uRadius;   // the globe's radius, px
uniform float uSpin;     // how far the planet has turned, radians
uniform float uDrift;    // how far the cloud has moved over it, radians
uniform float uTime;     // seconds, for the ring of light from Cambodia
// Cambodia's border, with its first point again at the end.
uniform vec2 uBorder[${BORDER.length + 1}];
uniform sampler2D uMap;

const float PI = 3.14159265;
const vec3 SUN = vec3(-0.5571, 0.3900, 0.7334);
const vec3 AIR = vec3(0.32, 0.55, 1.0);
// The axis leans away from upright, and the north pole a little towards us.
const float LEAN = ${LEAN.toFixed(4)};
const float NOD = ${NOD.toFixed(4)};
const vec2 HOME = vec2(${HOME[0].toFixed(2)}, ${HOME[1].toFixed(2)});
const vec3 LAMP = vec3(1.0, 0.84, 0.5);

float hash(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float noise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash(i), hash(i + vec3(1, 0, 0)), f.x),
        mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
    mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x),
        mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y),
    f.z);
}

// 1 inside Cambodia's border, 0 outside: how many of its sides lie to the
// east of the point decides it.
float inBorder(vec2 q) {
  float inside = 0.0;
  for (int i = 0; i < ${BORDER.length}; i++) {
    vec2 a = uBorder[i];
    vec2 b = uBorder[i + 1];
    if ((a.y > q.y) != (b.y > q.y) &&
        q.x < (b.x - a.x) * (q.y - a.y) / (b.y - a.y) + a.x) {
      inside = 1.0 - inside;
    }
  }
  return inside;
}

vec3 turnY(vec3 p, float a) {
  float c = cos(a);
  float s = sin(a);
  return vec3(c * p.x + s * p.z, p.y, c * p.z - s * p.x);
}

void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRadius;
  float d = length(p);
  float px = 1.0 / uRadius;

  // Past the limb there is only the glow of the air, brighter on the sunlit
  // side.
  float lit = 0.3 + 0.7 * smoothstep(-0.6, 0.7, dot(p / max(d, 0.001), SUN.xy));
  float halo = clamp(1.0 - (d - 1.0) / 0.2, 0.0, 1.0);
  vec4 glow = vec4(AIR, 1.0) * halo * halo * halo * 0.5 * lit;
  if (d >= 1.0) {
    gl_FragColor = glow;
    return;
  }

  vec3 n = vec3(p, sqrt(1.0 - d * d));

  // The same point on the planet before it leant and nodded.
  float cl = cos(LEAN);
  float sl = sin(LEAN);
  vec3 m = vec3(cl * n.x + sl * n.y, cl * n.y - sl * n.x, n.z);
  float cn = cos(NOD);
  float sn = sin(NOD);
  m = vec3(m.x, cn * m.y - sn * m.z, cn * m.z + sn * m.y);

  float lon = atan(m.x, m.z) - uSpin;
  float lat = asin(clamp(m.y, -1.0, 1.0));
  vec3 ground = texture2D(uMap, vec2(lon / (2.0 * PI) + 0.5, 0.5 - lat / PI)).rgb;

  // The map's sea is one flat navy. Give it depth, and keep the land.
  float sea = 1.0 - smoothstep(0.1, 0.24, max(ground.r, ground.g));
  ground = mix(ground, vec3(0.012, 0.07, 0.2) + 0.5 * ground, sea);

  float sun = dot(n, SUN);
  float day = smoothstep(-0.22, 0.7, sun);
  vec3 col = ground * (0.035 + 1.25 * day);

  // The sun's glint, on water only.
  vec3 halfway = normalize(SUN + vec3(0.0, 0.0, 1.0));
  col += vec3(1.0, 0.95, 0.85) * pow(max(dot(n, halfway), 0.0), 48.0) * sea * 0.55 * day;

  vec3 c = turnY(m, -uSpin - uDrift) * 2.6;
  float cloud = noise(c) * 0.55 + noise(c * 2.3 + 4.1) * 0.3 + noise(c * 5.1 + 9.7) * 0.15;
  // Thicker in the bands where weather gathers than over the deserts.
  cloud = smoothstep(0.5, 0.78, cloud + 0.1 * cos(lat * 6.0));
  col = mix(col, vec3(0.04 + 1.1 * day), cloud * 0.6);

  // Cambodia. Only the part of the planet near it does any of this work.
  vec2 at = vec2(degrees(mod(lon + PI, 2.0 * PI) - PI), degrees(lat));
  vec2 off = (at - HOME) * vec2(0.976, 1.0);
  float far = length(off); // degrees from the middle of the country
  if (far < 16.0) {
    // The country, with its edge softened by looking at four points around
    // this one, about a pixel apart.
    float land = 0.0;
    if (far < 4.0) {
      float e = degrees(px) * 0.4 / max(n.z, 0.35);
      land = 0.25 * (inBorder(at + vec2(e, e)) + inBorder(at + vec2(-e, e)) +
                     inBorder(at + vec2(e, -e)) + inBorder(at - vec2(e, e)));
    }
    float halo = exp(-far * far / 6.0);
    // A ring of light going out from it, fading as it goes.
    float beat = fract(uTime / 2.8);
    float ring = (1.0 - beat) * smoothstep(1.0, 0.0, abs(far - beat * 13.0));
    col = mix(col, LAMP, land * 0.8);
    col += LAMP * (halo * 0.3 + ring * 0.45);
  }

  // Air: bluer and brighter the more of it there is to look through.
  col += AIR * pow(1.0 - n.z, 2.6) * (0.12 + 0.88 * day);

  // A soft edge, over the glow that carries on outside it.
  float inside = smoothstep(1.0, 1.0 - 2.0 * px, d);
  gl_FragColor = mix(glow, vec4(col, 1.0), inside);
}
`;
