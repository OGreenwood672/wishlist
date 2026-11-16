import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Every page is per-session (reads the auth cookie), so we use the classic
  // dynamic rendering model rather than Cache Components.
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
