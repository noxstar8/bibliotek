import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    /**
     * Book covers come from Open Library. Kept as narrow as the format allows
     * — the one host, the one path that serves covers by ISBN, and the exact
     * query `lib/covers.ts` builds — so the image optimiser cannot be pointed
     * at anything else. `search` is an exact match, so it has to spell out the
     * `default=false` that turns a missing cover into a 404.
     */
    remotePatterns: [
      {
        protocol: "https",
        hostname: "covers.openlibrary.org",
        port: "",
        pathname: "/b/isbn/**",
        search: "?default=false",
      },
    ],
  },
};

export default nextConfig;
