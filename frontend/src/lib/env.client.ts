/**
 * Browser-safe environment. Only `NEXT_PUBLIC_*` values may live here: they
 * are inlined into the JavaScript bundle that every visitor downloads.
 */
function resolveAppUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (typeof window !== "undefined") return window.location.origin;
  if (process.env.NEXT_PUBLIC_VERCEL_URL) return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  return "http://localhost:3000";
}

export const clientEnv = {
  NEXT_PUBLIC_APP_URL: resolveAppUrl(),
};
