"use client";

import Link from "next/link";
import { useActionState } from "react";
import { saveRecord } from "@/lib/actions";
import type { FormState, FormValues } from "@/lib/form";
import type { RelationOptions } from "@/lib/relations";
import { getResource, type Field, type FieldType } from "@/lib/resources";

const control = "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-action-600 focus:ring-2 focus:ring-action-600/20 focus:outline-none aria-[invalid=true]:border-red-600";
const inputType: Partial<Record<FieldType, string>> = { url: "url", number: "number", integer: "number", date: "date", datetime: "datetime-local" };
const pretty = (value: string) => value.replaceAll("_", " ").replace(/^./, (c) => c.toUpperCase());

function FieldControl({ field, value, options, invalid, describedBy }: { field: Field; value: string; options: RelationOptions; invalid: boolean; describedBy?: string }) {
  const shared = { id: field.name, name: field.name, "aria-invalid": invalid, "aria-describedby": describedBy };
  if (field.type === "textarea") return <textarea {...shared} key={value} defaultValue={value} rows={4} className={`${control} py-2`} />;
  if (field.type === "select" || field.type === "relation" || field.type === "tristate") {
    const list = field.type === "tristate"
      ? [{ value: "true", label: "Yes" }, { value: "false", label: "No" }]
      : field.type === "relation" ? (options[field.relation!] ?? []) : (field.options ?? []).map((item) => ({ value: item, label: pretty(item) }));
    const blank = field.type === "tristate" ? "Not yet verified" : field.required ? "Choose..." : "None";
    return (
      <select {...shared} key={value} defaultValue={value} required={field.required} className={`${control} h-11`}>
        {!(field.type === "select" && field.required) && <option value="">{blank}</option>}
        {list.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    );
  }
  return (
    <input {...shared} key={value} type={inputType[field.type] ?? "text"} step={field.type === "number" ? "any" : undefined}
      defaultValue={value} required={field.required} className={`${control} h-11`} />
  );
}

export function RecordForm({ resourceKey, id, initial, options, imageUrl }: { resourceKey: string; id: string | null; initial: FormValues; options: RelationOptions; imageUrl?: string }) {
  // Field definitions contain RegExp values, which cannot cross the server-client boundary.
  const resource = getResource(resourceKey);
  if (!resource) throw new Error("Unknown resource");
  const [state, action, pending] = useActionState<FormState, FormData>(saveRecord.bind(null, resourceKey, id), {});
  const values = state.values ?? initial;
  const errors = state.errors ?? {};

  return (
    <form action={action} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
      {state.message && <p role="alert" className="mb-5 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-900">{state.message}</p>}
      {resource.key === "photos" && (
        <div className="mb-5">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt={initial.alt_text} className="h-48 w-full max-w-md rounded-xl object-cover" />
          ) : (
            <label className="block text-sm font-semibold">Photo file
              <input name="file" type="file" accept="image/webp,image/jpeg,image/png" required aria-invalid={Boolean(errors.file)} className={`${control} py-2`} />
              <span className="mt-1 block text-xs font-normal text-slate-600">WebP, JPEG or PNG, up to 4 MB.</span>
              {errors.file && <span className="mt-1 block text-sm font-medium text-red-700">{errors.file}</span>}
            </label>
          )}
        </div>
      )}
      <div className="grid gap-x-6 gap-y-5 md:grid-cols-2 2xl:grid-cols-3">
        {resource.fields.map((field) => {
          const error = errors[field.name];
          const descriptionId = error || field.help ? `${field.name}-description` : undefined;
          if (field.type === "flag") {
            return (
              <div key={field.name} className="self-center">
                <label className="flex min-h-11 items-center gap-2.5 text-sm font-semibold">
                  <input key={values[field.name]} type="checkbox" name={field.name} defaultChecked={values[field.name] === "on"} aria-describedby={descriptionId} className="size-5 accent-green-700" />
                  {field.label}
                </label>
                {field.help && <p id={descriptionId} className="text-xs text-slate-600">{field.help}</p>}
              </div>
            );
          }
          return (
            <div key={field.name} className={field.type === "textarea" ? "md:col-span-2 2xl:col-span-3" : undefined}>
              <label htmlFor={field.name} className="text-sm font-semibold">{field.label}{field.required && <span className="text-red-700"> *</span>}</label>
              <FieldControl field={field} value={values[field.name] ?? ""} options={options} invalid={Boolean(error)} describedBy={descriptionId} />
              {(error || field.help) && <p id={descriptionId} className={`mt-1 text-xs ${error ? "font-medium text-red-700" : "text-slate-600"}`}>{error ?? field.help}</p>}
            </div>
          );
        })}
      </div>
      <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-5">
        <button disabled={pending} className="h-11 rounded-lg bg-action-600 px-6 font-semibold text-white hover:bg-blue-800 disabled:opacity-60">{pending ? "Saving..." : "Save"}</button>
        <Link href={`/${resource.key}`} className="inline-flex h-11 items-center rounded-lg border border-slate-300 px-5 font-semibold hover:bg-slate-50">Cancel</Link>
      </div>
    </form>
  );
}
