/**
 * Rough map positions ([longitude, latitude]) for the flight animation from
 * Almaty to a university. Precise enough for a world map: Kazakh cities and
 * US states individually (both span thousands of kilometres), every other
 * country by its main university city.
 */

export type LonLat = readonly [number, number];

export const ALMATY: LonLat = [76.95, 43.24];

const KAZAKHSTAN: Record<string, LonLat> = {
  Almaty: ALMATY,
  Kaskelen: [76.62, 43.2],
  Astana: [71.45, 51.17],
  Aktobe: [57.2, 50.3],
  Karaganda: [73.1, 49.8],
  Oskemen: [82.6, 49.95],
  Pavlodar: [76.95, 52.3],
  Shymkent: [69.6, 42.3],
};

const US_STATES: Record<string, LonLat> = {
  AZ: [-111.5, 33],
  CA: [-119.4, 36],
  CO: [-105.3, 40],
  CT: [-72.9, 41.3],
  DC: [-77, 38.9],
  FL: [-82, 28.5],
  GA: [-84.4, 33.8],
  IA: [-91.5, 41.7],
  IL: [-88, 41.5],
  IN: [-86.5, 39.8],
  MA: [-71.1, 42.4],
  MD: [-76.6, 39.3],
  MI: [-83.7, 42.3],
  MN: [-93.3, 45],
  NC: [-79, 35.9],
  NJ: [-74.7, 40.3],
  NY: [-75.5, 42.5],
  OH: [-82.9, 40],
  OR: [-123.1, 44],
  PA: [-77.5, 40.5],
  RI: [-71.4, 41.8],
  TN: [-86.8, 36.2],
  TX: [-97.7, 30.3],
  UT: [-111.9, 40.8],
  VA: [-78.5, 38],
  WA: [-122.3, 47.6],
  WI: [-89.4, 43.1],
};

const COUNTRIES: Record<string, LonLat> = {
  "United States": [-98, 39],
  Canada: [-79.4, 43.7],
  "United Kingdom": [-0.13, 51.5],
  Singapore: [103.8, 1.35],
  Switzerland: [8.54, 47.37],
  Australia: [144.96, -37.8],
  Japan: [139.7, 35.7],
  China: [116.4, 39.9],
  Germany: [10, 51],
  Italy: [12.5, 42.5],
  "South Korea": [127, 37.5],
  Kazakhstan: [71.45, 51.17],
  France: [2.35, 48.85],
  Netherlands: [4.9, 52.37],
  "Hong Kong": [114.17, 22.3],
  Russia: [37.6, 55.75],
  Turkey: [28.97, 41],
  "Czech Republic": [14.42, 50.08],
  Hungary: [19.04, 47.5],
  Poland: [21, 52.23],
  Spain: [-3.7, 40.4],
  Sweden: [18.07, 59.33],
  Finland: [24.94, 60.17],
  Austria: [16.37, 48.2],
  Ireland: [-6.26, 53.35],
  "United Arab Emirates": [55.27, 25.2],
  Malaysia: [101.7, 3.14],
};

/** The city without its state or region: "Boston, MA" → "Boston". */
export function cityName(city: string): string {
  return city.split(",")[0].trim();
}

/** Where a university is on the map, or null for a country we have no position for. */
export function placeOf(country: string, city: string): LonLat | null {
  if (country === "Kazakhstan") return KAZAKHSTAN[cityName(city)] ?? COUNTRIES.Kazakhstan;
  if (country === "United States") {
    const state = city.split(",")[1]?.trim();
    return (state && US_STATES[state]) || COUNTRIES["United States"];
  }
  return COUNTRIES[country] ?? null;
}
