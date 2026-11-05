import type { MetadataRoute } from "next";

import { publicOrigin } from "@/lib/site-url";

/** Public pages are open to search engines; the app itself and the API are not. */
export default function robots(): MetadataRoute.Robots {
  const origin = publicOrigin();
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/dashboard", "/api/"] }],
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  };
}
