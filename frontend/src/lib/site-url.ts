import { siteConfig } from "@/config/site";

/**
 * The public origin search engines should index. Falls back to Vercel's
 * production domain when NEXT_PUBLIC_APP_URL is unset (siteConfig.url is then
 * localhost, which must never end up in a sitemap).
 */
export function publicOrigin(): string {
  const configured = new URL(siteConfig.url);
  if (configured.hostname !== "localhost" && configured.hostname !== "127.0.0.1") {
    return configured.origin;
  }
  const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return vercelHost ? `https://${vercelHost}` : configured.origin;
}
