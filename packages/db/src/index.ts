import {
  pickPrimaryImage,
  permitRequirement,
  type AvailabilitySlot,
  type CricketStatus,
  type GroundCard,
  type GroundDetail,
  type PermitAuthority,
  type PermitDetail,
  type PermitFee,
  type SourceRef,
} from "@cric-atlas/domain";
import { createClient } from "@supabase/supabase-js";

export type PublicClient = ReturnType<typeof createPublicClient>;

/** Read-only public client. Row-level security limits it to published records. */
export function createPublicClient(url: string, anonKey: string) {
  return createClient(url, anonKey, { auth: { persistSession: false } });
}

type GroundImageRow = { storage_path: string; alt_text: string; is_primary: boolean; sort_order: number; is_sample: boolean };

export const GROUND_IMAGE_BUCKET = "ground-images";

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
  latitude: number | null;
  longitude: number | null;
  location_is_approximate: boolean;
  permits: { permit_required: boolean | null }[];
  ground_images: GroundImageRow[];
};

export async function listGroundCards(client: PublicClient, now: Date = new Date()): Promise<GroundCard[]> {
  const [grounds, slots] = await Promise.all([
    client
      .from("ground_facilities")
      .select("id, ground_code, slug, ground_name, municipality, county, state, cricket_status, is_sample, latitude, longitude, location_is_approximate, permits(permit_required), ground_images(storage_path, alt_text, is_primary, sort_order, is_sample)")
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

  return (grounds.data as unknown as GroundRow[]).map((row) => {
    const image = pickPrimaryImage(row.ground_images);
    return {
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
    latitude: row.latitude === null ? null : Number(row.latitude),
    longitude: row.longitude === null ? null : Number(row.longitude),
    locationIsApproximate: row.location_is_approximate,
    image: image
      ? {
          url: client.storage.from(GROUND_IMAGE_BUCKET).getPublicUrl(image.storage_path).data.publicUrl,
          alt: image.alt_text,
          isSample: image.is_sample,
        }
      : null,
    };
  });
}

type SourceLinkRow = { sources: SourceRef | null };
type PermitRow = Omit<PermitDetail, "authority" | "fees" | "sources"> & {
  permit_authorities: PermitAuthority | null;
  permit_fees: PermitFee[];
  source_links: SourceLinkRow[];
};
type GroundDetailRow = Omit<GroundDetail, "permits" | "sources" | "slots"> & {
  permits: PermitRow[];
  source_links: SourceLinkRow[];
};
type SlotRow = Omit<AvailabilitySlot, "source"> & { source_id: string | null };

const AVAILABILITY_WINDOW_DAYS = 90;

function linkedSources(links: SourceLinkRow[]): SourceRef[] {
  const unique = new Map<string, SourceRef>();
  for (const link of links) if (link.sources) unique.set(link.sources.id, link.sources);
  return [...unique.values()];
}

export async function getGroundDetail(client: PublicClient, slug: string, now: Date = new Date()): Promise<GroundDetail | null> {
  const ground = await client
    .from("ground_facilities")
    .select("*, source_links(sources(*)), permits(*, permit_authorities(*), permit_fees(*), source_links(sources(*)))")
    .eq("slug", slug)
    .maybeSingle();
  if (ground.error) throw new Error(`Could not load ground: ${ground.error.message}`);
  if (!ground.data) return null;
  const row = ground.data as unknown as GroundDetailRow;

  const until = new Date(now.getTime() + AVAILABILITY_WINDOW_DAYS * 86_400_000);
  const slots = await client
    .from("public_availability")
    .select("id, start_datetime, end_datetime, availability_status, verification_method, last_checked_at, source_id")
    .eq("ground_id", row.id)
    .gte("end_datetime", now.toISOString())
    .lte("start_datetime", until.toISOString())
    .order("start_datetime");
  if (slots.error) throw new Error(`Could not load availability: ${slots.error.message}`);
  const slotRows = slots.data as SlotRow[];

  const sourceIds = [...new Set(slotRows.flatMap((slot) => (slot.source_id ? [slot.source_id] : [])))];
  const slotSources = sourceIds.length ? await client.from("sources").select("*").in("id", sourceIds) : { data: [], error: null };
  if (slotSources.error) throw new Error(`Could not load sources: ${slotSources.error.message}`);
  const sourceById = new Map((slotSources.data as SourceRef[]).map((source) => [source.id, source]));

  const { source_links: groundLinks, permits, ...facts } = row;
  return {
    ...facts,
    sources: linkedSources(groundLinks),
    permits: permits.map(({ permit_authorities, permit_fees, source_links, ...permit }) => ({
      ...permit,
      authority: permit_authorities,
      fees: permit_fees.map((fee) => ({ ...fee, amount: Number(fee.amount) })),
      sources: linkedSources(source_links),
    })),
    slots: slotRows.map(({ source_id, ...slot }) => ({ ...slot, source: source_id ? (sourceById.get(source_id) ?? null) : null })),
  };
}
