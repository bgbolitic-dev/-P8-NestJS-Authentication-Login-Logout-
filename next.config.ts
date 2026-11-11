
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["2.1.1.246"],
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
