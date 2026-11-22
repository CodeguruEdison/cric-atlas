import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "./supabase";

/** Must run in every admin page and action. The proxy alone is not an authorization check. */
export const requireAdmin = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: isAdmin, error } = await supabase.rpc("is_admin");
  if (error || isAdmin !== true) redirect("/login?error=not_admin");
  return { supabase, user };
});
