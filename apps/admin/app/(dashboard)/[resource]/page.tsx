import { Plus } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RowActions } from "@/components/row-actions";
import { requireAdmin } from "@/lib/auth";
import { errorMessages, type ErrorCode } from "@/lib/form";
import { loadRelationOptions } from "@/lib/relations";
import { getResource, type Field } from "@/lib/resources";
import { formatEastern } from "@/lib/time";

const LIST_LIMIT = 200;
const pretty = (value: string) => value.replaceAll("_", " ").replace(/^./, (c) => c.toUpperCase());
const statusClass: Record<string, string> = {
  published: "bg-green-100 text-green-900", verified: "bg-green-100 text-green-900", permitted: "bg-green-100 text-green-900", verified_available: "bg-green-100 text-green-900",
  draft: "bg-slate-100 text-slate-700", unverified: "bg-slate-100 text-slate-700", unknown: "bg-slate-100 text-slate-700",
  needs_review: "bg-orange-100 text-orange-900", limited: "bg-orange-100 text-orange-900", restricted: "bg-orange-100 text-orange-900",
  conflicting: "bg-red-100 text-red-900", not_permitted: "bg-red-100 text-red-900", verified_unavailable: "bg-red-100 text-red-900", archived: "bg-red-100 text-red-900",
};

function Cell({ field, value, labels }: { field?: Field; value: unknown; labels: Map<string, string> }) {
  if (value === null || value === undefined || value === "") return <span className="text-slate-400">-</span>;
  if (field?.type === "relation") return <>{labels.get(String(value)) ?? "Unknown"}</>;
  if (field?.type === "datetime") return <span className="whitespace-nowrap">{formatEastern(String(value))}</span>;
  if (typeof value === "boolean") return <>{value ? "Yes" : "No"}</>;
  if (field?.type === "select") return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${statusClass[String(value)] ?? "bg-slate-100 text-slate-700"}`}>{pretty(String(value))}</span>;
  return <>{String(value)}</>;
}

export default async function ResourceListPage({ params, searchParams }: { params: Promise<{ resource: string }>; searchParams: Promise<{ error?: string }> }) {
  const [{ resource: key }, { error: errorKey }] = await Promise.all([params, searchParams]);
  const resource = getResource(key);
  if (!resource) notFound();
  const { supabase } = await requireAdmin();
  const [{ data, error, count }, options] = await Promise.all([
    supabase.from(resource.table).select("*", { count: "exact" }).order(resource.orderBy, { ascending: resource.ascending ?? false }).limit(LIST_LIMIT),
    loadRelationOptions(supabase, resource),
  ]);
  if (error) throw new Error(`Could not load ${resource.label}`);
  const rows = (data ?? []) as Record<string, unknown>[];
  const labels = new Map(Object.values(options).flat().map((option) => [option.value, option.label]));
  const fieldFor = (name: string) => resource.fields.find((field) => field.name === name);
  const message = errorKey && errorKey in errorMessages ? errorMessages[errorKey as ErrorCode] : null;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">{resource.label}</h1>
          <p className="mt-1 text-sm text-slate-600">{(count ?? rows.length) > LIST_LIMIT ? `Showing the first ${LIST_LIMIT} of ${count}` : `${rows.length} record${rows.length === 1 ? "" : "s"}`}</p>
        </div>
        <Link href={`/${resource.key}/new`} className="inline-flex h-11 items-center gap-2 rounded-lg bg-action-600 px-4 font-semibold text-white hover:bg-blue-800"><Plus aria-hidden className="size-4" /> Add {resource.singular}</Link>
      </div>
      {message && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-900">{message}</p>}
      <div className="mt-5 overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
            <tr>
              {resource.columns.map((column) => <th key={column} scope="col" className="px-4 py-3">{column === "storage_path" ? "Photo" : (fieldFor(column)?.label ?? pretty(column))}</th>)}
              <th scope="col" className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const id = String(row.id);
              const title = String((resource.titleField && row[resource.titleField]) || resource.singular);
              return (
                <tr key={id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  {resource.columns.map((column) => (
                    <td key={column} className="px-4 py-2.5">
                      {column === "storage_path" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={supabase.storage.from("ground-images").getPublicUrl(String(row.storage_path)).data.publicUrl} alt={String(row.alt_text)} loading="lazy" className="h-12 w-20 rounded-md bg-slate-200 object-cover" />
                      ) : <Cell field={fieldFor(column)} value={row[column]} labels={labels} />}
                    </td>
                  ))}
                  <td className="px-4 py-1.5"><RowActions resourceKey={resource.key} id={id} title={title} status={resource.hasPublication ? String(row.publication_status) : undefined} /></td>
                </tr>
              );
            })}
            {rows.length === 0 && <tr><td colSpan={resource.columns.length + 1} className="px-4 py-10 text-center text-slate-600">No records yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
