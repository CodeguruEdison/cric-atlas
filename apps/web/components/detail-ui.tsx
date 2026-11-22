import { displayValue, formatDate, type SourceRef } from "@cric-atlas/domain";
import { ExternalLink } from "lucide-react";
import type { ReactNode } from "react";

export function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
      <h2 className="text-xl font-bold">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function Facts({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label} className="border-b border-slate-100 pb-3">
          <dt className="text-sm text-slate-600">{item.label}</dt>
          <dd className="mt-0.5 font-semibold break-words">
            {typeof item.value === "string" || typeof item.value === "number" || item.value === null ? <Fact value={item.value} /> : item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Fact({ value }: { value: string | number | null }) {
  const text = displayValue(value);
  return <span className={text === "Not yet verified" ? "font-medium text-slate-500 italic" : undefined}>{text}</span>;
}

export function SourceList({ sources }: { sources: SourceRef[] }) {
  if (sources.length === 0) return <p className="text-slate-600 italic">No source attached yet.</p>;
  return (
    <ul className="space-y-2">
      {sources.map((source) => (
        <li key={source.id} className="text-sm">
          {source.source_url ? (
            <a href={source.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-action-600 hover:underline">
              {source.source_name} <ExternalLink aria-hidden className="size-3.5" />
            </a>
          ) : (
            <span className="font-semibold">{source.source_name}</span>
          )}
          {source.is_sample && <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-950">Sample</span>}
          {source.retrieved_at && <span className="ml-2 text-slate-600">Retrieved {formatDate(source.retrieved_at)}</span>}
        </li>
      ))}
    </ul>
  );
}
