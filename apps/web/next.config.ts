import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

const config: NextConfig = {
  images: {
    qualities: [75, 90],
    remotePatterns: supabaseUrl
      ? [{ protocol: "https", hostname: new URL(supabaseUrl).hostname, pathname: "/storage/v1/object/public/ground-images/**" }]
      : [],
  },
  transpilePackages: ["@cric-atlas/db", "@cric-atlas/domain", "@cric-atlas/ui"],
};

export default config;
