// Downloads each catalog university's site icon once, into
// public/university-logos/<id>.png, and records which ones exist in
// src/data/university-logos.json. The site then serves them itself — no
// third-party request from a student's browser.
//
//   node scripts/fetch-university-logos.mjs          # only missing logos
//   node scripts/fetch-university-logos.mjs --force  # re-download all
//
// Icons come from Google's favicon service (the logo each university
// publishes for its own website). A university without one keeps its
// initials badge.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "university-logos");
const manifestPath = join(root, "src", "data", "university-logos.json");
const force = process.argv.includes("--force");

const universities = JSON.parse(
  readFileSync(join(root, "src", "data", "universities.json"), "utf8"),
);
mkdirSync(outDir, { recursive: true });

function domainOf(website) {
  try {
    return new URL(website).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

/** Width from a PNG header; 0 if the bytes are not a PNG. */
function pngWidth(bytes) {
  const signature = [0x89, 0x50, 0x4e, 0x47];
  if (!signature.every((b, i) => bytes[i] === b)) return 0;
  return bytes.readUInt32BE(16);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** GET with a timeout and a few patient retries when rate-limited. */
async function get(url) {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const response = await fetch(url, {
        redirect: "follow",
        signal: AbortSignal.timeout(15_000),
        headers: { "User-Agent": "Mozilla/5.0 (Acceptify logo fetch)" },
      });
      if (response.status === 429 || response.status >= 500) {
        await sleep(1500 * (attempt + 1));
        continue;
      }
      if (!response.ok) return null;
      return Buffer.from(await response.arrayBuffer());
    } catch {
      await sleep(500);
    }
  }
  return null;
}

async function fetchLogo(university) {
  const file = join(outDir, `${university.id}.png`);
  if (!force && existsSync(file)) return true;

  const domain = domainOf(university.website);
  if (!domain) return false;

  // 1. Google's copy of the site icon, when it has a large one.
  const google = await get(
    `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`,
  );
  let best = google && pngWidth(google) >= 48 ? google : null;

  // 2. The university's own touch icon (usually 180px) when Google only has
  //    a tiny favicon.
  if (!best) {
    for (const host of [`www.${domain}`, domain]) {
      const touch = await get(`https://${host}/apple-touch-icon.png`);
      if (touch && pngWidth(touch) >= 48) {
        best = touch;
        break;
      }
    }
  }

  // 3. A smaller Google icon is still better than initials from 32px up.
  if (!best && google && pngWidth(google) >= 32) best = google;
  if (!best) return false;

  writeFileSync(file, best);
  return true;
}

const withLogo = [];
const queue = [...universities];
async function worker() {
  while (queue.length > 0) {
    const university = queue.shift();
    try {
      if (await fetchLogo(university)) withLogo.push(university.id);
    } catch (error) {
      console.warn(`  ${university.id}: ${error.message}`);
    }
  }
}
await Promise.all(Array.from({ length: 3 }, worker));

withLogo.sort();
writeFileSync(manifestPath, `${JSON.stringify(withLogo, null, 2)}\n`);
console.log(`Logos: ${withLogo.length} of ${universities.length} universities.`);
