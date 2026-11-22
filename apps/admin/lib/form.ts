import type { Field, Resource } from "./resources";
import { easternInputToIso, isoToEasternInput } from "./time";

export type FormValues = Record<string, string>;
export type FormState = { message?: string; errors?: Record<string, string>; values?: FormValues };
export type ParseResult = { ok: true; data: Record<string, unknown> } | { ok: false; errors: Record<string, string> };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function readValues(resource: Resource, formData: FormData): FormValues {
  return Object.fromEntries(resource.fields.map((field) => {
    const raw = formData.get(field.name);
    return [field.name, field.type === "flag" ? (raw ? "on" : "") : typeof raw === "string" ? raw.trim() : ""];
  }));
}

function parseField(field: Field, value: string): { value?: unknown; error?: string } {
  if (field.type === "flag") return { value: value === "on" };
  if (value === "") return field.required ? { error: `${field.label} is required.` } : { value: null };
  if (field.pattern && !field.pattern.test(value)) return { error: field.help ?? `${field.label} has an invalid format.` };
  switch (field.type) {
    case "url":
      try {
        return new URL(value).protocol === "https:" ? { value } : { error: "Use a secure https:// URL." };
      } catch {
        return { error: "Enter a valid https:// URL." };
      }
    case "number":
      return Number.isFinite(Number(value)) ? { value: Number(value) } : { error: "Enter a number." };
    case "integer":
      return /^-?\d+$/.test(value) ? { value: Number(value) } : { error: "Enter a whole number." };
    case "select":
      return field.options?.includes(value) ? { value } : { error: "Choose a listed option." };
    case "relation":
      return UUID.test(value) ? { value } : { error: "Choose a listed record." };
    case "tristate":
      return value === "true" || value === "false" ? { value: value === "true" } : { error: "Choose a listed option." };
    case "date":
      return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) ? { value } : { error: "Enter a valid date." };
    case "datetime": {
      const iso = easternInputToIso(value);
      return iso ? { value: iso } : { error: "Enter a valid date and time." };
    }
    case "list": {
      const items = value.split(",").map((item) => item.trim()).filter(Boolean);
      return { value: items.length ? items : null };
    }
    default:
      return { value };
  }
}

export function parseRecord(resource: Resource, values: FormValues): ParseResult {
  const data: Record<string, unknown> = {};
  const errors: Record<string, string> = {};
  for (const field of resource.fields) {
    const result = parseField(field, values[field.name] ?? "");
    if (result.error) errors[field.name] = result.error;
    else data[field.name] = result.value;
  }
  if (resource.key === "source-links" && ["ground_id", "permit_id", "authority_id"].filter((name) => data[name]).length !== 1 && !errors.ground_id) {
    errors.ground_id = "Choose exactly one ground, permit or authority.";
  }
  if (typeof data.start_datetime === "string" && typeof data.end_datetime === "string" && data.end_datetime <= data.start_datetime) {
    errors.end_datetime = "End must be after start.";
  }
  if ((data.latitude === null) !== (data.longitude === null) && "latitude" in data) {
    errors.longitude = "Enter both latitude and longitude, or neither.";
  }
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, data };
}

export function toFormValues(resource: Resource, row?: Record<string, unknown> | null): FormValues {
  return Object.fromEntries(resource.fields.map((field) => {
    if (!row) return [field.name, field.defaultValue ?? ""];
    const value = row[field.name];
    if (field.type === "flag") return [field.name, value ? "on" : ""];
    if (value === null || value === undefined) return [field.name, ""];
    if (field.type === "datetime") return [field.name, isoToEasternInput(String(value))];
    if (field.type === "list" && Array.isArray(value)) return [field.name, value.join(", ")];
    return [field.name, String(value)];
  }));
}

export const errorMessages = {
  duplicate: "A record with the same unique value already exists.",
  overlap: "This time overlaps another availability slot for the ground.",
  in_use: "Other records still depend on this one.",
  publish_source: "Link a published source to this permit before publishing it.",
  availability_evidence: "A known availability status needs a source, last-checked time and expiry.",
  rule: "This change breaks a data rule. Check the values and try again.",
  forbidden: "You do not have permission to make this change.",
  upload: "The photo could not be uploaded. Use a WebP, JPEG or PNG under 4 MB.",
  generic: "The change could not be saved. Please try again.",
} as const;
export type ErrorCode = keyof typeof errorMessages;

export function errorCode(resourceKey: string, error: { code?: string; message?: string }): ErrorCode {
  if (error.message?.includes("without a published source")) return "publish_source";
  switch (error.code) {
    case "23505": return "duplicate";
    case "23P01": return "overlap";
    case "23503": return "in_use";
    case "42501": return "forbidden";
    case "23514": return resourceKey === "availability" ? "availability_evidence" : "rule";
    default: return "generic";
  }
}
