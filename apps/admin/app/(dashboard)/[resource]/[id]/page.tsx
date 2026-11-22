import { notFound } from "next/navigation";
import { RecordForm } from "@/components/record-form";
import { requireAdmin } from "@/lib/auth";
import { toFormValues } from "@/lib/form";
import { loadRelationOptions } from "@/lib/relations";
import { getResource } from "@/lib/resources";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EditRecordPage({ params }: { params: Promise<{ resource: string; id: string }> }) {
  const { resource: key, id } = await params;
  const resource = getResource(key);
  if (!resource || !UUID.test(id)) notFound();
  const { supabase } = await requireAdmin();
  const [{ data, error }, options] = await Promise.all([
    supabase.from(resource.table).select("*").eq("id", id).maybeSingle(),
    loadRelationOptions(supabase, resource),
  ]);
  if (error) throw new Error(`Could not load ${resource.singular}`);
  if (!data) notFound();
  const row = data as Record<string, unknown>;
  const imageUrl = key === "photos" ? supabase.storage.from("ground-images").getPublicUrl(String(row.storage_path)).data.publicUrl : undefined;
  return (
    <>
      <h1 className="mb-5 text-2xl font-bold sm:text-3xl">Edit {resource.singular}</h1>
      <RecordForm resourceKey={resource.key} id={id} initial={toFormValues(resource, row)} options={options} imageUrl={imageUrl} />
    </>
  );
}
