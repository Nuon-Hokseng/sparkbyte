// Generates every icon and share image from the logo artwork.
//
//   npm run icons
//
// Source:  design/logo-source.png (2048 x 2048)
// Writes:  app/favicon.ico            browser tab (16, 32 and 48 px)
//          app/icon.png               512 px, modern browsers
//          app/apple-icon.png         180 px, iOS and Safari
//          app/opengraph-image.png    1200 x 630, link previews
//          app/twitter-image.png      the same image, for X
//          public/icon-192.png        web app manifest
//          public/icon-512.png        web app manifest, and the no-WebGL hero
//
// The five files in app/ are picked up by Next.js from their names and
// location, so they have to stay directly inside app/.

import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "design", "logo-source.png");
const out = (...parts) => path.join(root, ...parts);

// The mark is not centred in the artwork. This is its centre, measured as the
// centroid of the white shape, and the square around it that every icon uses.
// The hero's shader assumes the same framing (UNITS_PER_BOX in
// components/hero/black-hole/shader.ts), so change them together.
const CENTER_X = 1024;
const CENTER_Y = 1002;
const SIDE = 1000;

const square = (size) =>
  sharp(source)
    .extract({
      left: CENTER_X - SIDE / 2,
      top: CENTER_Y - SIDE / 2,
      width: SIDE,
      height: SIDE,
    })
    .resize(size, size)
    .ensureAlpha() // the .ico decoder in Next.js requires RGBA
    .png({ compressionLevel: 9 })
    .toBuffer();

/** Packs PNGs into a single .ico file. */
function ico(sizes, pngs) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(sizes.length, 4);
  let offset = header.length + 16 * sizes.length;
  const entries = sizes.map((size, i) => {
    const entry = Buffer.alloc(16);
    entry[0] = size;
    entry[1] = size;
    entry.writeUInt16LE(1, 4); // colour planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(pngs[i].length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += pngs[i].length;
    return entry;
  });
  return Buffer.concat([header, ...entries, ...pngs]);
}

/** The share image: the mark on the left, the wordmark on the right. */
async function shareImage() {
  const backdrop = Buffer.from(
    `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="630" fill="#000"/>
      <text x="640" y="350" font-family="Helvetica, Arial, sans-serif" font-size="96" font-weight="700" fill="#fff">SparkByte</text>
    </svg>`,
  );
  return sharp(backdrop)
    .composite([{ input: await square(520), left: 60, top: 55 }])
    .png()
    .toBuffer();
}

const icoSizes = [16, 32, 48];
const share = await shareImage();

await Promise.all([
  writeFile(out("app", "icon.png"), await square(512)),
  writeFile(out("app", "apple-icon.png"), await square(180)),
  writeFile(
    out("app", "favicon.ico"),
    ico(icoSizes, await Promise.all(icoSizes.map(square))),
  ),
  writeFile(out("app", "opengraph-image.png"), share),
  writeFile(out("app", "twitter-image.png"), share),
  writeFile(out("public", "icon-192.png"), await square(192)),
  writeFile(out("public", "icon-512.png"), await square(512)),
]);

console.log("Icons and share images written.");
