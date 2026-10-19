/**
 * Builds db/seed/fr-parcoursup.json — French universities and grandes écoles
 * from the Ministry of Higher Education's open data (Licence Ouverte 2.0,
 * data.enseignementsup-recherche.gouv.fr) — from two exports:
 *
 *   node scripts/import-parcoursup.mjs parcoursup-2025.csv etablissements.json
 *
 * - parcoursup-2025.csv: dataset "fr-esr-parcoursup" (Parcoursup 2025), CSV
 *   with ";" — per programme: places (capa_fin), applications (voe_tot),
 *   offers made (prop_tot).
 * - etablissements.json: dataset "fr-esr-principaux-etablissements-
 *   enseignement-superieur", JSON — official names, websites, sector.
 *
 * A university is one Parcoursup establishment with its campuses folded in
 * ("Aix-Marseille Université - Site de Gap" counts as Aix-Marseille
 * Université). Its admission rate is the share of all its first-year
 * applications that received an offer. Components that are not institutions
 * of their own (IUT, UFR, faculties, prépas, antennas) are left out.
 *
 * Kept: universities with 300+ first-year places, engineering schools with
 * 100+, business schools with 200+ — so tiny private schools stay out. Only
 * real figures are carried over; tuition, tests, deadlines and rankings stay
 * null ("no data").
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [csvPath, directoryPath] = process.argv.slice(2);
if (!csvPath || !directoryPath) {
  console.error("usage: node scripts/import-parcoursup.mjs <parcoursup-2025.csv> <etablissements.json>");
  process.exit(1);
}

function parseCsv(text, delimiter) {
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
    else if (char === delimiter) {
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

const int = (value) => {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : 0;
};

const fold = (text) =>
  (text || "")
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();

const slugify = (text) =>
  fold(text)
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const hash = (text) => [...text].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7);

const GRADIENTS = [
  ["#002395", "#3B5BDB"], ["#8C1515", "#B83A4B"], ["#1F4E79", "#3B7DD8"], ["#4B2E83", "#7A5CB8"],
  ["#154734", "#2E7D5B"], ["#7A0019", "#B3364C"], ["#003262", "#3B7EA1"], ["#500000", "#8C2B2B"],
];

/** Tracks that are higher education proper (no BTS, CPGE, nursing institutes). */
const TRACKS = new Set(["Licence", "Licence_Las", "PASS", "BUT", "Ecole d'Ingénieur", "Ecole de Commerce"]);

/** Parts of an institution, not institutions of their own. */
const COMPONENT =
  /^(IUT|I\.U\.T|Iut |Institut universitaire de technologie|Unité de Formation|UFR|U\.F\.R|Faculté|Facultés|Ecole Universitaire de premier cycle|La Prépa|Campus |Antenne|Site )/i;

/** "Université de Montpellier, Antenne de Nîmes" and "… - Site de Gap" are campuses of one university. */
const institutionName = (name) =>
  name
    .split(/\s+-\s+|,\s+|\s+\(/)[0]
    .replace(/-\s+/g, "-")
    .replace(/\s{2,}/g, " ")
    .trim();

/** "KEDGE BUSINESS SCHOOL" reads as shouting on a card. */
const titleCase = (name) =>
  // A one-word name in capitals is an acronym (ISTEC, MBS): leave it.
  name === name.toUpperCase() && /\s/.test(name)
    ? name.toLowerCase().replace(/(^|[\s'-])(\p{L})/gu, (m, sep, letter) => sep + letter.toUpperCase())
    : name;

const STOP = new Set(["universite", "de", "du", "des", "la", "le", "les", "l", "d", "et", "en", "school", "ecole", "institut"]);
const tokens = (text) => new Set(fold(text).split(/[^a-z0-9]+/).filter((t) => t && !STOP.has(t)));

const directory = JSON.parse(readFileSync(directoryPath, "utf8"));
const byUai = new Map();
for (const e of directory) for (const code of [e.uai, ...(e.anciens_codes_uai ?? [])]) if (code) byUai.set(code, e);

/** The directory entry whose name shares most of its distinctive words with `name`. */
function findInDirectory(name, uais) {
  for (const code of uais) if (byUai.has(code)) return byUai.get(code);
  const want = tokens(name);
  let best = null;
  let bestScore = 0;
  for (const e of directory) {
    for (const label of [e.uo_lib, e.uo_lib_officiel, e.nom_court, e.sigle].filter(Boolean)) {
      const have = tokens(label);
      if (!have.size || !want.size) continue;
      const shared = [...want].filter((t) => have.has(t)).length;
      const score = shared / Math.max(want.size, have.size);
      if (score > bestScore) {
        bestScore = score;
        best = e;
      }
    }
  }
  return bestScore >= 0.6 ? best : null;
}

/** Old names Parcoursup still lists that the directory knows under the new one. */
const RENAMED = { "Université de Cergy-Pontoise": "CY Cergy Paris Université" };

/** "Paris 5e" or "Lyon 7e  Arrondissement" is the city. */
const cleanCity = (city) =>
  city
    .replace(/\s+\d+(e|er)(\s+Arrondissement)?$/i, "")
    .replace(/\s{2,}/g, " ")
    .trim();

const rows = parseCsv(readFileSync(csvPath, "utf8").replace(/^﻿/, ""), ";").filter((r) => TRACKS.has(r.fili));
const groups = new Map();
for (const r of rows) {
  const name = institutionName(r.g_ea_lib_vx);
  if (COMPONENT.test(name)) continue;
  const g = groups.get(name) ?? { name, rows: [] };
  g.rows.push(r);
  groups.set(name, g);
}

// Campuses Parcoursup lists under different names ("Université Lyon 2" in
// Bron, "Université Lumière - Lyon 2") are one institution in the directory.
const merged = new Map();
for (const g of groups.values()) {
  const entry = findInDirectory(RENAMED[g.name] ?? g.name, [...new Set(g.rows.map((r) => r.cod_uai))]);
  const key = entry ? `dir:${entry.uai}` : `name:${g.name}`;
  const into = merged.get(key);
  if (into) into.rows.push(...g.rows);
  else merged.set(key, { name: g.name, rows: [...g.rows], entry });
}

const fmt = (n) => Math.round(n).toLocaleString("en-US");
const curated = JSON.parse(readFileSync(path.join(root, "src", "data", "universities.json"), "utf8"));
const takenSlugs = new Set(curated.map((u) => u.slug));
const out = [];

for (const g of merged.values()) {
  const isUniversity = /universit/i.test(g.entry?.uo_lib ?? g.name);
  const places = (fili) => g.rows.filter((r) => fili.includes(r.fili)).reduce((s, r) => s + int(r.capa_fin), 0);
  const engineering = places(["Ecole d'Ingénieur"]);
  const business = places(["Ecole de Commerce"]);
  const kind = isUniversity ? "university" : engineering >= business ? "engineering" : "business";
  const keep = isUniversity
    ? places([...TRACKS]) >= 300
    : kind === "engineering"
      ? engineering >= 100
      : business >= 200;
  if (!keep) continue;

  const counted = isUniversity
    ? g.rows
    : g.rows.filter((r) => r.fili === (kind === "engineering" ? "Ecole d'Ingénieur" : "Ecole de Commerce"));
  const applications = counted.reduce((s, r) => s + int(r.voe_tot), 0);
  const offers = counted.reduce((s, r) => s + int(r.prop_tot), 0);
  const capacity = counted.reduce((s, r) => s + int(r.capa_fin), 0);
  if (applications < 200) continue;

  const entry = g.entry;
  const name = titleCase(entry?.uo_lib ?? g.name);
  const isPublic = entry
    ? fold(entry.secteur_d_etablissement) === "public"
    : g.rows.some((r) => r.contrat_etab === "Public");
  const cities = new Map();
  for (const r of counted) cities.set(r.ville_etab, (cities.get(r.ville_etab) ?? 0) + 1);
  const city = cleanCity(entry?.com_nom ?? [...cities.entries()].sort((a, b) => b[1] - a[1])[0][0]);

  let slug = slugify(name);
  if (takenSlugs.has(slug)) continue; // the same institution under two Parcoursup names
  takenSlugs.add(slug);

  const rate = Math.round((offers / applications) * 1000) / 10;
  const short = entry?.sigle && entry.sigle.length <= 12 ? entry.sigle : entry?.nom_court ?? name;
  const what = kind === "university" ? "university" : kind === "engineering" ? "engineering school" : "business school";
  const [from, to] = GRADIENTS[Math.abs(hash(name)) % GRADIENTS.length];

  out.push({
    id: `fr-${slug}`,
    slug,
    name,
    shortName: short.length <= 32 ? short : name,
    country: "France",
    city,
    logoInitials:
      entry?.sigle && /^[\p{L}\d]{2,5}$/u.test(entry.sigle)
        ? entry.sigle.toUpperCase()
        : !/\s/.test(name)
          ? name.slice(0, 4).toUpperCase()
          : name
            .split(/[\s'-]+/)
            .filter((w) => w && !/^(de|du|des|la|le|les|l|d|et|en)$/i.test(w))
            .slice(0, 3)
            .map((w) => w[0].toUpperCase())
            .join(""),
    worldRanking: null,
    nationalRanking: null,
    acceptanceRate: rate,
    selectivityLevel:
      rate < 10 ? "Most Selective" : rate < 25 ? "Highly Selective" : rate < 50 ? "Selective" : rate < 75 ? "Moderately Selective" : "Less Selective",
    minGpa: null,
    satLow: null,
    satHigh: null,
    actMin: null,
    actMax: null,
    ieltsMin: null,
    toeflMin: null,
    tuitionPerYearUsd: null,
    livingCostPerYearUsd: null,
    scholarshipAvailable: null,
    scholarshipCoverage: null,
    applicationDeadline: null,
    decisionType: null,
    tags: [
      isPublic ? "Public" : "Private",
      ...(kind === "engineering" ? ["Engineering"] : kind === "business" ? ["Business"] : []),
      "Parcoursup",
    ],
    description: `${name} is a ${isPublic ? "public" : "private"} ${what} in ${city}, France; in Parcoursup 2025 it offered ${fmt(capacity)} first-year places and ${rate}% of its ${fmt(applications)} applications received an offer.`,
    requirements: [
      {
        label: "How to apply",
        value: "Parcoursup; students from outside the EU apply through Études en France (Campus France)",
      },
    ],
    acceptRateTrend: [],
    gradientFrom: from,
    gradientTo: to,
    website: entry?.url ?? "",
  });
}

out.sort((a, b) => a.acceptanceRate - b.acceptanceRate);
mkdirSync(path.join(root, "db", "seed"), { recursive: true });
writeFileSync(path.join(root, "db", "seed", "fr-parcoursup.json"), `${JSON.stringify(out, null, 1)}\n`);
const count = (k) => out.filter((u) => u.tags.includes(k)).length;
console.log(
  `[parcoursup] ${out.length} institutions: ${out.length - count("Engineering") - count("Business")} universities, ${count("Engineering")} engineering, ${count("Business")} business; ${out.filter((u) => u.website).length} with a website`,
);
