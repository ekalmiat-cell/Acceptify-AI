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
};

export default nextConfig;
