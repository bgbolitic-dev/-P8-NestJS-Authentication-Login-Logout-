
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["2.3.1.3","192.168.1.144","2.1.1.25","2.1.1.25","10.122.126.186","10.0.3.100","192.168.1.159","http://localhost:3000"],
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
