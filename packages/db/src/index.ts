import { permitRequirement, type CricketStatus, type GroundCard } from "@cric-atlas/domain";
import { createClient } from "@supabase/supabase-js";

export type PublicClient = ReturnType<typeof createPublicClient>;

/** Read-only public client. Row-level security limits it to published records. */
export function createPublicClient(url: string, anonKey: string) {
  return createClient(url, anonKey, { auth: { persistSession: false } });
}

type GroundRow = {
  id: string;
  ground_code: string;
  slug: string;
  ground_name: string;
  municipality: string;
  county: string;
  state: string;
  cricket_status: CricketStatus;
  is_sample: boolean;
  permits: { permit_required: boolean | null }[];
};

export async function listGroundCards(client: PublicClient, now: Date = new Date()): Promise<GroundCard[]> {
  const [grounds, slots] = await Promise.all([
    client
      .from("ground_facilities")
      .select("id, ground_code, slug, ground_name, municipality, county, state, cricket_status, is_sample, permits(permit_required)")
      .order("ground_name"),
    client
      .from("public_availability")
      .select("ground_id, start_datetime")
      .eq("availability_status", "verified_available")
      .gte("start_datetime", now.toISOString())
      .order("start_datetime"),
  ]);
  if (grounds.error) throw new Error(`Could not load grounds: ${grounds.error.message}`);
  if (slots.error) throw new Error(`Could not load availability: ${slots.error.message}`);

  const nextSlot = new Map<string, string>();
  for (const slot of slots.data as { ground_id: string; start_datetime: string }[]) {
    if (!nextSlot.has(slot.ground_id)) nextSlot.set(slot.ground_id, slot.start_datetime);
  }

  return (grounds.data as unknown as GroundRow[]).map((row) => ({
    id: row.id,
    groundCode: row.ground_code,
    slug: row.slug,
    name: row.ground_name,
    municipality: row.municipality,
    county: row.county,
    state: row.state,
    cricketStatus: row.cricket_status,
    permit: permitRequirement(row.permits),
    nextVerifiedSlot: nextSlot.get(row.id) ?? null,
    isSample: row.is_sample,
  }));
}
