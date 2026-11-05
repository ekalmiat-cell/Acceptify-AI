import type { MetadataRoute } from "next";

import { publicOrigin } from "@/lib/site-url";

/** The pages anyone can open without signing in. */
const PUBLIC_PAGES: { path: string; priority: number }[] = [
  { path: "/", priority: 1 },
  { path: "/pricing", priority: 0.7 },
  { path: "/sign-up", priority: 0.6 },
  { path: "/sign-in", priority: 0.4 },
  { path: "/privacy", priority: 0.3 },
  { path: "/terms", priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = publicOrigin();
  return PUBLIC_PAGES.map(({ path, priority }) => ({
    url: `${origin}${path === "/" ? "" : path}`,
    changeFrequency: "monthly",
    priority,
  }));
}
