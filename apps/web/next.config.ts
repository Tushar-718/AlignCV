import type { NextConfig } from "next";

// On Vercel a missing API_URL would silently point the live site at localhost, so fail the deploy.
// Locally and in CI, fall back to the dev API.
const apiUrl = process.env.API_URL ?? (process.env.VERCEL ? undefined : "http://localhost:4000");
if (!apiUrl) {
  throw new Error("API_URL must be set on Vercel");
}

const nextConfig: NextConfig = {
  // packages/shared exports raw TypeScript, so Next must compile it.
  transpilePackages: ["@aligncv/shared"],
  // Proxy /api/* to Express so auth cookies are first-party (same origin as the site).
  rewrites() {
    return Promise.resolve([{ source: "/api/:path*", destination: `${apiUrl}/api/:path*` }]);
  },
};

export default nextConfig;
