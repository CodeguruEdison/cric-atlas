import type { SupabaseClient } from "@supabase/supabase-js";
import type { RelationKey, Resource } from "./resources";

type Row = Record<string, unknown>;
export type RelationOptions = Partial<Record<RelationKey, { value: string; label: string }[]>>;

const relations: Record<RelationKey, { table: string; select: string; order: string; label: (row: Row) => string }> = {
  grounds: { table: "ground_facilities", select: "id, ground_code, ground_name", order: "ground_code", label: (r) => `${r.ground_code} · ${r.ground_name}` },
  authorities: { table: "permit_authorities", select: "id, authority_name", order: "authority_name", label: (r) => String(r.authority_name) },
  permits: {
    table: "permits", select: "id, permit_type, ground_facilities(ground_code, ground_name)", order: "created_at",
    label: (r) => {
      const ground = r.ground_facilities as { ground_code: string; ground_name: string } | null;
      return `${ground?.ground_code ?? "Ground"} · ${r.permit_type ?? "Untitled permit"}`;
    },
  },
  sources: { table: "sources", select: "id, source_name", order: "source_name", label: (r) => String(r.source_name) },
};

export async function loadRelationOptions(supabase: SupabaseClient, resource: Resource): Promise<RelationOptions> {
  const keys = [...new Set(resource.fields.flatMap((field) => (field.relation ? [field.relation] : [])))];
  const entries = await Promise.all(keys.map(async (key) => {
    const relation = relations[key];
    const { data, error } = await supabase.from(relation.table).select(relation.select).order(relation.order);
    if (error) throw new Error(`Could not load ${key}: ${error.message}`);
    const rows = (data ?? []) as unknown as Row[];
    return [key, rows.map((row) => ({ value: String(row.id), label: relation.label(row) }))] as const;
  }));
  return Object.fromEntries(entries);
}
