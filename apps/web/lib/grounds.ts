import { getGroundDetail } from "@cric-atlas/db";
import { notFound } from "next/navigation";
import { cache } from "react";
import { publicClient } from "./supabase";

/** Shared by the layout and tabs so one render makes one set of queries. */
export const loadGround = cache(async (slug: string) => {
  const ground = await getGroundDetail(publicClient(), slug);
  if (!ground) notFound();
  return ground;
});
