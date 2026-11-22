import type { NextConfig } from "next";

const config: NextConfig = {
  // Allows 5 MB photo uploads plus the rest of the form.
  experimental: { serverActions: { bodySizeLimit: "6mb" } },
  transpilePackages: ["@cric-atlas/db", "@cric-atlas/domain", "@cric-atlas/ui"],
};

export default config;
