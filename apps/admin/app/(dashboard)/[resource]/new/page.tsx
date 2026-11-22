import { notFound } from "next/navigation";
import { RecordForm } from "@/components/record-form";
import { requireAdmin } from "@/lib/auth";
import { toFormValues } from "@/lib/form";
import { loadRelationOptions } from "@/lib/relations";
import { getResource } from "@/lib/resources";

export default async function NewRecordPage({ params }: { params: Promise<{ resource: string }> }) {
  const { resource: key } = await params;
  const resource = getResource(key);
  if (!resource) notFound();
  const { supabase } = await requireAdmin();
  const options = await loadRelationOptions(supabase, resource);
  return (
    <>
      <h1 className="mb-5 text-2xl font-bold sm:text-3xl">Add {resource.singular}</h1>
      <RecordForm resourceKey={resource.key} id={null} initial={toFormValues(resource)} options={options} />
    </>
  );
}
