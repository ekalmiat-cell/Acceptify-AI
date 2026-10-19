/**
 * Builds db/seed/us-scorecard.json — the US universities added from the
 * U.S. Department of Education's College Scorecard (public domain) — from its
 * institution file:
 *
 *   node scripts/import-scorecard.mjs path/to/Most-Recent-Cohorts-Institution.csv
 *
 * Download the file from https://collegescorecard.ed.gov/data/ ("Most Recent
 * Institution-Level Data"). Only real figures are carried over; what the
 * Scorecard does not publish (minimum GPA, IELTS/TOEFL, deadlines, world
 * ranking, scholarships for international students) stays null and the site
 * shows "no data" instead of a guess.
 *
 * Kept: operating, main-campus, public or private nonprofit institutions that
 * mainly award bachelor's degrees and report an admission rate, with at least
 * 1,000 undergraduates and a six-year graduation rate of 55% or more — or
 * smaller colleges that graduate 85% or more. That leaves out for-profits,
 * branch campuses and places most students never finish.
 *
 * Universities already in the hand-curated catalog (src/data/universities.json)
 * are skipped, matched by website or name.
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = process.argv[2];
if (!source) {
  console.error("usage: node scripts/import-scorecard.mjs <Most-Recent-Cohorts-Institution.csv>");
  process.exit(1);
}

/** RFC 4180 CSV: quoted fields may hold commas, quotes ("") and newlines. */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += char;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  const [header, ...body] = rows;
  return body.filter((r) => r.length === header.length).map((r) => Object.fromEntries(header.map((h, i) => [h, r[i]])));
}

const num = (value) => {
  if (value === undefined || value === "" || value === "NA" || value === "NULL" || value === "PrivacySuppressed") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const STATES = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California", CO: "Colorado", CT: "Connecticut",
  DE: "Delaware", DC: "Washington, D.C.", FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois",
  IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri", MT: "Montana",
  NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NY: "New York",
  NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania",
  RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah",
  VT: "Vermont", VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
  PR: "Puerto Rico", GU: "Guam", VI: "U.S. Virgin Islands",
};

/** Colours the curated catalog already uses, so new cards look like the old ones. */
const GRADIENTS = [
  ["#1F4E79", "#3B7DD8"], ["#8C1515", "#B83A4B"], ["#00356B", "#286DC0"], ["#4B2E83", "#7A5CB8"],
  ["#00274C", "#2F65A7"], ["#7A0019", "#B3364C"], ["#154734", "#2E7D5B"], ["#C5050C", "#E04A4F"],
  ["#003262", "#3B7EA1"], ["#B31B1B", "#D9534F"], ["#002855", "#4A6FA5"], ["#500000", "#8C2B2B"],
];

const slugify = (text) =>
  text
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const host = (url) =>
  (url || "")
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .split("/")[0]
    .toLowerCase();

const hash = (text) => [...text].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7);

/** IPEDS names main campuses like "…-Main Campus" or "… Campus Immersion". */
const cleanName = (name) =>
  name
    .replace(/\s+Campus Immersion$/, "")
    .replace(/-Main Campus$/, "")
    .replace(/\s{2,}/g, " ")
    .trim();

/** Shorter, never cut mid-word: cards truncate with an ellipsis where they must. */
function shortNameFor(name) {
  return name
    .replace(/^The /, "")
    .replace(/^University of /, "U of ")
    .replace(/ University$/, "")
    .replace(/ University-/, "-");
}

function initialsFor(name) {
  const words = name
    .replace(/[-–,]/g, " ")
    .split(/\s+/)
    .filter((w) => w && !/^(of|the|and|at|in|for|de|la|&)$/i.test(w));
  return words
    .slice(0, 3)
    .map((w) => w[0].toUpperCase())
    .join("");
}

function selectivity(rate) {
  if (rate < 10) return "Most Selective";
  if (rate < 25) return "Highly Selective";
  if (rate < 50) return "Selective";
  if (rate < 75) return "Moderately Selective";
  return "Less Selective";
}

const fmt = (n) => Math.round(n).toLocaleString("en-US");

const curated = JSON.parse(readFileSync(path.join(root, "src", "data", "universities.json"), "utf8"));
const curatedHosts = new Set(curated.map((u) => host(u.website)).filter(Boolean));
const curatedNames = new Set(curated.map((u) => slugify(u.name)));
const takenSlugs = new Set(curated.map((u) => u.slug));

const rows = parseCsv(readFileSync(source, "utf8").replace(/^﻿/, ""));
const out = [];
let skippedCurated = 0;

for (const r of rows) {
  if (r.CURROPER !== "1" || r.PREDDEG !== "3" || !["1", "2"].includes(r.CONTROL) || r.MAIN !== "1") continue;
  const admission = num(r.ADM_RATE);
  const undergrads = num(r.UGDS) ?? 0;
  const graduation = num(r.C150_4) ?? 0;
  if (admission === null) continue;
  if (!((undergrads >= 1000 && graduation >= 0.55) || (undergrads >= 500 && graduation >= 0.85))) continue;

  const name = cleanName(r.INSTNM);
  const site = host(r.INSTURL);
  if ((site && curatedHosts.has(site)) || curatedNames.has(slugify(name))) {
    skippedCurated++;
    continue;
  }

  let slug = slugify(name);
  if (takenSlugs.has(slug)) slug = `${slug}-${r.STABBR.toLowerCase()}`;
  if (takenSlugs.has(slug)) slug = `${slug}-${r.UNITID}`;
  takenSlugs.add(slug);

  const sat = ["SATVR25", "SATVR75", "SATMT25", "SATMT75"].map((k) => num(r[k]));
  const satLow = sat[0] !== null && sat[2] !== null ? sat[0] + sat[2] : null;
  const satHigh = sat[1] !== null && sat[3] !== null ? sat[1] + sat[3] : null;
  const actMin = num(r.ACTCM25);
  const actMax = num(r.ACTCM75);
  const rate = Math.round(admission * 1000) / 10;
  const isPublic = r.CONTROL === "1";
  const research = ["15", "16"].includes(r.CCBASIC);
  const state = STATES[r.STABBR] ?? r.STABBR;

  const tests = [
    satLow && satHigh ? `SAT ${satLow}-${satHigh}` : null,
    actMin && actMax ? `ACT ${actMin}-${actMax}` : null,
  ].filter(Boolean);

  const [from, to] = GRADIENTS[Math.abs(hash(name)) % GRADIENTS.length];
  out.push({
    id: `us-${r.UNITID}`,
    slug,
    name,
    shortName: shortNameFor(name),
    country: "United States",
    city: `${r.CITY}, ${r.STABBR}`,
    logoInitials: initialsFor(name),
    worldRanking: null,
    nationalRanking: null,
    acceptanceRate: rate,
    selectivityLevel: selectivity(rate),
    minGpa: null,
    satLow,
    satHigh,
    actMin,
    actMax,
    ieltsMin: null,
    toeflMin: null,
    tuitionPerYearUsd: num(r.TUITIONFEE_OUT) ?? num(r.TUITIONFEE_IN),
    livingCostPerYearUsd: num(r.ROOMBOARD_ON) ?? num(r.ROOMBOARD_OFF),
    scholarshipAvailable: null,
    scholarshipCoverage: null,
    applicationDeadline: null,
    decisionType: null,
    tags: [isPublic ? "Public" : "Private", ...(research ? ["Research"] : [])],
    description: `${name} is a ${isPublic ? "public" : "private nonprofit"} university in ${r.CITY}, ${state}, with about ${fmt(undergrads)} undergraduates; ${Math.round(graduation * 100)}% of students graduate within six years.`,
    requirements: [
      {
        label: "SAT/ACT of admitted students (middle 50%)",
        value: tests.length ? tests.join(", ") : "Not reported (often test-optional)",
      },
    ],
    acceptRateTrend: [],
    gradientFrom: from,
    gradientTo: to,
    website: site ? `https://${site}` : "",
  });
}

out.sort((a, b) => a.acceptanceRate - b.acceptanceRate);
mkdirSync(path.join(root, "db", "seed"), { recursive: true });
writeFileSync(path.join(root, "db", "seed", "us-scorecard.json"), `${JSON.stringify(out, null, 1)}\n`);
console.log(`[scorecard] ${out.length} universities written, ${skippedCurated} already in the curated catalog`);
