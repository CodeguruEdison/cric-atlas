import { createClient } from "@supabase/supabase-js";

/** Read-only public client. Row-level security limits it to published records. */
export function createPublicClient(url: string, anonKey: string) {
  return createClient(url, anonKey, { auth: { persistSession: false } });
}
