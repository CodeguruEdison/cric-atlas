"use client";

import { Trash2 } from "lucide-react";
import Link from "next/link";
import { deleteRecord, setPublication } from "@/lib/actions";

export function RowActions({ resourceKey, id, status, title }: { resourceKey: string; id: string; status?: string; title: string }) {
  const next = status === "published" ? "draft" : "published";
  return (
    <div className="flex items-center justify-end gap-1">
      <Link href={`/${resourceKey}/${id}`} aria-label={`Edit ${title}`} className="inline-flex h-9 items-center rounded-md px-3 text-sm font-semibold text-action-600 hover:bg-blue-50">Edit</Link>
      {status && (
        <form action={setPublication.bind(null, resourceKey, id, next)}>
          <button aria-label={`${next === "published" ? "Publish" : "Unpublish"} ${title}`} className="h-9 rounded-md px-3 text-sm font-semibold text-slate-700 hover:bg-slate-100">
            {next === "published" ? "Publish" : "Unpublish"}
          </button>
        </form>
      )}
      <form action={deleteRecord.bind(null, resourceKey, id)} onSubmit={(event) => { if (!window.confirm(`Delete ${title}? Linked records may also be removed. This cannot be undone.`)) event.preventDefault(); }}>
        <button aria-label={`Delete ${title}`} className="grid size-9 place-items-center rounded-md text-red-700 hover:bg-red-50"><Trash2 aria-hidden className="size-4" /></button>
      </form>
    </div>
  );
}
