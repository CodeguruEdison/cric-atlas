import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { resources } from "@/lib/resources";

export default async function DashboardPage() {
  const { supabase } = await requireAdmin();
  const count = async (table: string, filter?: [string, string | boolean]) => {
    let query = supabase.from(table).select("id", { count: "exact", head: true });
    if (filter) query = query.eq(filter[0], filter[1]);
    const { count: total, error } = await query;
    return error ? null : (total ?? 0);
  };
  const cards = await Promise.all(resources.map(async (resource) => ({
    resource,
    total: await count(resource.table),
    drafts: resource.hasPublication ? await count(resource.table, ["publication_status", "draft"]) : null,
  })));
  const [sampleGrounds, unverifiedGrounds, unverifiedPermits] = await Promise.all([
    count("ground_facilities", ["is_sample", true]),
    count("ground_facilities", ["verification_status", "unverified"]),
    count("permits", ["verification_status", "unverified"]),
  ]);
  const attention = [
    { label: "Sample grounds to replace", value: sampleGrounds, href: "/grounds" },
    { label: "Grounds not verified", value: unverifiedGrounds, href: "/grounds" },
    { label: "Permits not verified", value: unverifiedPermits, href: "/permits" },
  ];
  return (
    <>
      <h1 className="text-2xl font-bold sm:text-3xl">Dashboard</h1>
      <p className="mt-1 text-slate-600">Manage what appears on the public CricketAtlas site.</p>
      <section aria-labelledby="attention" className="mt-6">
        <h2 id="attention" className="text-lg font-bold">Needs attention</h2>
        <div className="mt-3 grid gap-4 md:grid-cols-3">
          {attention.map((item) => (
            <Link key={item.label} href={item.href} className="rounded-2xl bg-amber-50 p-5 ring-1 ring-amber-200 hover:ring-amber-400">
              <p className="text-3xl font-bold text-amber-950">{item.value ?? "?"}</p>
              <p className="mt-1 text-sm font-medium text-amber-950">{item.label}</p>
            </Link>
          ))}
        </div>
      </section>
      <section aria-labelledby="records" className="mt-8">
        <h2 id="records" className="text-lg font-bold">Records</h2>
        <div className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(min(100%,220px),1fr))] gap-4">
          {cards.map(({ resource, total, drafts }) => (
            <Link key={resource.key} href={`/${resource.key}`} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 hover:shadow-md">
              <p className="text-sm font-semibold text-slate-600">{resource.label}</p>
              <p className="mt-1 text-3xl font-bold">{total ?? "?"}</p>
              {drafts !== null && <p className="mt-1 text-xs text-slate-600">{drafts} draft{drafts === 1 ? "" : "s"}</p>}
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
