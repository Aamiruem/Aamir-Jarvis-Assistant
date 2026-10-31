import type { NextConfig } from "next";

// Where the Express gateway runs. The browser never calls it directly: every /api/* request
// that isn't one of our own route handlers (like /api/graphql) is proxied there, so the
// httpOnly refresh cookie stays same-origin and no CORS setup is needed.
const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4000";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Docker / AWS images need a self-contained server; Vercel and Netlify build their own.
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
  turbopack: {
    rules: {
      // Only the global stylesheet uses Tailwind. A broader "*.css" rule also caught compiled
      // Sass modules and dropped them (jarvis-orb.module.scss rendered with no styles).
      "globals.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    // afterFiles: our own route handlers (app/api/graphql) win; everything else goes to Express.
    return [{ source: "/api/:path*", destination: `${BACKEND_URL}/api/:path*` }];
  },
};

export default nextConfig;
