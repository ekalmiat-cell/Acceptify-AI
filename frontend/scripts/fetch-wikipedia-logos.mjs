// Fills in university logos from Wikipedia/Wikidata where the site-icon
// fetch (fetch-university-logos.mjs) found nothing or only a small, blurry
// icon. Uses each university's Wikidata "logo image" (P154) or "seal image"
// (P158) — files on Wikimedia Commons — rendered as a 256px PNG.
//
//   node scripts/fetch-wikipedia-logos.mjs            # missing, blurry or too wide
//   node scripts/fetch-wikipedia-logos.mjs --all      # every university
//
// Run fetch-university-logos.mjs first; this one rewrites the manifest.

import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "university-logos");
const manifestPath = join(root, "src", "data", "university-logos.json");
const all = process.argv.includes("--all");

const universities = JSON.parse(
  readFileSync(join(root, "src", "data", "universities.json"), "utf8"),
);

/** English Wikipedia article titles where the catalog name differs. */
const TITLES = {
  "uni-eth": "ETH Zurich",
  "uni-penn-state-university": "Pennsylvania State University",
  "uni-lmu-munich": "Ludwig Maximilian University of Munich",
  "uni-tu-berlin": "Technical University of Berlin",
  "uni-tu-dresden": "TU Dresden",
  "uni-kbtu-kazakh-british-technical-university": "Kazakh-British Technical University",
  "uni-sdu-university": "Suleyman Demirel University (Kazakhstan)",
  "uni-city-university-of-london": "City, University of London",
  "uni-university-of-california-los-angeles": "University of California, Los Angeles",
  "uni-university-of-california-davis": "University of California, Davis",
  "uni-university-of-california-santa-barbara": "University of California, Santa Barbara",
  "uni-university-of-erlangen-nuremberg": "University of Erlangen–Nuremberg",
  "uni-indiana-university-bloomington": "Indiana University Bloomington",
  "uni-university-of-illinois-urbana-champaign": "University of Illinois Urbana-Champaign",
  "uni-texas-a-m-university": "Texas A&M University",
  "uni-m-auezov-south-kazakhstan-university": "South Kazakhstan University",
  "uni-s-toraighyrov-pavlodar-state-university": "Toraighyrov University",
};

const UA = "AcceptifyAI-logo-fetch/1.0 (https://acceptify-ai.vercel.app)";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(url) {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(20_000) });
      if (res.status === 429 || res.status >= 500) {
        await sleep(2000 * (attempt + 1));
        continue;
      }
      return res.ok ? res.json() : null;
    } catch {
      await sleep(1000);
    }
  }
  return null;
}

const wiki = (params) =>
  getJson(`https://en.wikipedia.org/w/api.php?format=json&${new URLSearchParams(params)}`);

/** The English Wikipedia article (title + Wikidata id) for this university. */
async function findArticle(university) {
  const title = TITLES[university.id] ?? university.name;
  const direct = await wiki({ action: "query", titles: title, redirects: "1", prop: "pageprops", ppprop: "wikibase_item" });
  const page = direct && Object.values(direct.query?.pages ?? {})[0];
  if (page?.pageprops?.wikibase_item) return { title: page.title, qid: page.pageprops.wikibase_item };

  // Fall back to the top search hit, if it is clearly an institution.
  const search = await wiki({ action: "query", list: "search", srsearch: `${university.name} ${university.country}`, srlimit: "1" });
  const hit = search?.query?.search?.[0]?.title;
  if (!hit || !/universit|institut|college|school|polytechn|academy/i.test(hit)) return null;
  const found = await wiki({ action: "query", titles: hit, prop: "pageprops", ppprop: "wikibase_item" });
  const qid = Object.values(found?.query?.pages ?? {})[0]?.pageprops?.wikibase_item;
  return qid ? { title: hit, qid } : null;
}

/**
 * The logo, seal or crest named in the article's infobox — for universities
 * whose mark is not on Wikidata (often because the file is hosted on English
 * Wikipedia rather than Commons).
 */
async function infoboxImage(title, { squareOnly = false } = {}) {
  const data = await wiki({ action: "parse", page: title, prop: "wikitext", section: "0", redirects: "1" });
  const text = data?.parse?.wikitext?.["*"] ?? "";
  // Crests and seals first when only a squarish mark will do.
  const fields = squareOnly ? ["seal", "image_name", "image", "logo"] : ["logo", "seal", "image_name", "image"];
  for (const field of fields) {
    const pattern = String.raw`\|\s*${field}\s*=\s*(?:\[\[)?(?:File:|Image:)?([^|\]\n{}<]+?\.(?:svg|png))`;
    const match = text.match(new RegExp(pattern, "i"));
    if (match) {
      const info = await wiki({ action: "query", titles: `File:${match[1].trim()}`, prop: "imageinfo", iiprop: "size|url", iiurlwidth: "256" });
      const ii = Object.values(info?.query?.pages ?? {})[0]?.imageinfo?.[0];
      if (ii?.thumburl && (!squareOnly || ii.width / ii.height <= 1.6)) {
        return { url: ii.thumburl, ratio: ii.width / ii.height };
      }
    }
  }
  return null;
}

function claimFile(entity, property) {
  return entity?.claims?.[property]?.[0]?.mainsnak?.datavalue?.value ?? null;
}

async function commonsImage(file) {
  const data = await getJson(
    `https://commons.wikimedia.org/w/api.php?format=json&${new URLSearchParams({
      action: "query",
      titles: `File:${file}`,
      prop: "imageinfo",
      iiprop: "size|url",
      iiurlwidth: "256",
    })}`,
  );
  const info = Object.values(data?.query?.pages ?? {})[0]?.imageinfo?.[0];
  if (!info?.thumburl) return null;
  return { url: info.thumburl, ratio: info.width / info.height };
}

async function fetchLogo(university) {
  const article = await findArticle(university);
  if (!article) return "no article";
  const { qid } = article;

  const entity = (
    await getJson(`https://www.wikidata.org/w/api.php?format=json&action=wbgetentities&props=claims&ids=${qid}`)
  )?.entities?.[qid];
  const logoFile = claimFile(entity, "P154");
  const sealFile = claimFile(entity, "P158");

  // A square tile needs a squarish mark: a long wordmark shrinks to a
  // sliver, so a seal wins over a logo that is much wider than tall.
  const logo = logoFile ? await commonsImage(logoFile) : null;
  const seal = sealFile ? await commonsImage(sealFile) : null;
  let pick = logo && (logo.ratio <= 1.6 || !seal) ? logo : (seal ?? logo);
  if (!pick || !/\.png$/i.test(new URL(pick.url).pathname)) {
    pick = await infoboxImage(article.title);
  }
  if (!pick) return "no logo in Wikidata or the infobox";
  // A wide wordmark shrinks to an unreadable sliver in a square tile; the
  // article's crest or seal reads better when there is one.
  if (pick.ratio > 1.6) {
    const square = await infoboxImage(article.title, { squareOnly: true });
    if (square && /\.png$/i.test(new URL(square.url).pathname)) pick = square;
  }
  if (!/\.png$/i.test(new URL(pick.url).pathname)) return "not a PNG rendering";

  const res = await fetch(pick.url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(20_000) });
  if (!res.ok) return `download ${res.status}`;
  writeFileSync(join(outDir, `${university.id}.png`), Buffer.from(await res.arrayBuffer()));
  return "ok";
}

/** Pixel size from the stored PNG's header, or null when there is none. */
function storedSize(id) {
  const file = join(outDir, `${id}.png`);
  if (!existsSync(file)) return null;
  const bytes = readFileSync(file);
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

// Missing, blurry (under 128px) or a wide wordmark (squashed in the tile).
const targets = universities.filter((u) => {
  const size = storedSize(u.id);
  return all || !size || size.width < 128 || size.width / size.height > 1.6;
});
console.log(`Looking up ${targets.length} universities on Wikipedia…`);

const failures = [];
let done = 0;
const queue = [...targets];
await Promise.all(
  Array.from({ length: 3 }, async () => {
    while (queue.length > 0) {
      const university = queue.shift();
      const result = await fetchLogo(university).catch((e) => e.message);
      if (result === "ok") done++;
      else failures.push(`${university.name}: ${result}`);
    }
  }),
);

const ids = readdirSync(outDir)
  .filter((f) => f.endsWith(".png"))
  .map((f) => f.slice(0, -4))
  .sort();
writeFileSync(manifestPath, `${JSON.stringify(ids, null, 2)}\n`);

console.log(`Updated from Wikipedia: ${done}. Logos now: ${ids.length} of ${universities.length}.`);
if (failures.length) console.log(`Not found (${failures.length}):\n  ${failures.join("\n  ")}`);
