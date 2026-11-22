import type { NextConfig } from "next";

const config: NextConfig = {
  transpilePackages: ["@cric-atlas/db", "@cric-atlas/domain", "@cric-atlas/ui"],
};

export default config;
