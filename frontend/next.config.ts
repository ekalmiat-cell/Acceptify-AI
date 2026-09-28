import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets a production build run side by side with `next dev` (which owns
  // `.next`), e.g. `NEXT_DIST_DIR=.next-prod next build`. Unset in normal use.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  async headers() {
    return [
      {
        // The service worker must never be served from a cache, or a fix to
        // it would take days to reach installed apps.
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
        ],
      },
    ];
  },
};

export default nextConfig;
