import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http",  hostname: "**" },
    ],
  },
  // native/server-only modules — don't bundle
  serverExternalPackages: ["better-sqlite3", "playwright"],
};

export default nextConfig;
