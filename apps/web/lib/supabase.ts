import { createPublicClient } from "@cric-atlas/db";

export function publicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase environment variables are not set");
  return createPublicClient(url, key);
}
