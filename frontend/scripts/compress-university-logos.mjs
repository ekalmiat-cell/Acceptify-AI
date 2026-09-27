// Shrinks every logo in public/university-logos to fit 128×128 (twice the
// largest tile the site draws) and re-encodes it as a palette PNG, so a page
// full of logos stays light on phones. Safe to run again after fetching.
//
//   node scripts/compress-university-logos.mjs

import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "university-logos");

let before = 0;
let after = 0;
for (const file of readdirSync(dir).filter((f) => f.endsWith(".png"))) {
  const path = join(dir, file);
  before += statSync(path).size;
  const output = await sharp(readFileSync(path))
    .resize(128, 128, { fit: "inside", withoutEnlargement: true })
    .png({ palette: true, quality: 90, compressionLevel: 9 })
    .toBuffer();
  writeFileSync(path, output);
  after += output.length;
}

const kb = (n) => `${Math.round(n / 1024)} KB`;
console.log(`Logos: ${kb(before)} → ${kb(after)}`);
