import type { NextConfig } from "next";

const config: NextConfig = {
  // Allows 4 MB photo uploads plus the form, within Vercel's 4.5 MB request limit.
  experimental: { serverActions: { bodySizeLimit: "4.5mb" } },
  transpilePackages: ["@cric-atlas/db", "@cric-atlas/domain", "@cric-atlas/ui"],
};

export default config;
