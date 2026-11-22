import { z } from "zod";

export const NOT_VERIFIED = "Not yet verified";
export const AVAILABILITY_UNKNOWN_MESSAGE =
  "Availability not yet verified. Please contact the permit authority.";

export const availabilityStatuses = ["verified_available", "limited", "verified_unavailable", "unknown"] as const;
export const availabilityStatusSchema = z.enum(availabilityStatuses);
export type AvailabilityStatus = z.infer<typeof availabilityStatusSchema>;

export const availabilityLabels: Record<AvailabilityStatus, string> = {
  verified_available: "Verified Available",
  limited: "Limited",
  verified_unavailable: "Verified Unavailable",
  unknown: "Unknown",
};

/** Null, undefined and blank values are unknown, never a default. */
export function displayValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return NOT_VERIFIED;
  const text = String(value).trim();
  return text === "" ? NOT_VERIFIED : text;
}

/** An expired availability check can no longer be presented as verified. */
export function effectiveAvailability(
  status: AvailabilityStatus,
  expiresAt: string | Date | null,
  now: Date = new Date(),
): AvailabilityStatus {
  if (!expiresAt) return "unknown";
  return new Date(expiresAt).getTime() > now.getTime() ? status : "unknown";
}

export const cricketStatuses = ["permitted", "restricted", "not_permitted", "unverified"] as const;
export type CricketStatus = (typeof cricketStatuses)[number];

export const cricketStatusLabels: Record<CricketStatus, string> = {
  permitted: "Cricket permitted",
  restricted: "Cricket restricted",
  not_permitted: "Cricket not permitted",
  unverified: "Cricket not yet verified",
};

export type PermitRequirement = "required" | "not_required" | "unknown";

export const permitRequirementLabels: Record<PermitRequirement, string> = {
  required: "Permit required",
  not_required: "No permit required",
  unknown: "Permit not yet verified",
};

/** Any required policy wins. "Not required" needs every policy to say so explicitly. */
export function permitRequirement(policies: ReadonlyArray<{ permit_required: boolean | null }>): PermitRequirement {
  if (policies.some((policy) => policy.permit_required === true)) return "required";
  if (policies.length > 0 && policies.every((policy) => policy.permit_required === false)) return "not_required";
  return "unknown";
}

export type GroundCard = {
  id: string;
  groundCode: string;
  slug: string;
  name: string;
  municipality: string;
  county: string;
  state: string;
  cricketStatus: CricketStatus;
  permit: PermitRequirement;
  nextVerifiedSlot: string | null;
  isSample: boolean;
};

export type GroundFilters = {
  query: string;
  municipality: string;
  permit: PermitRequirement | "all";
};

export function filterGrounds(grounds: readonly GroundCard[], filters: GroundFilters): GroundCard[] {
  const terms = filters.query.toLowerCase().split(/\s+/).filter(Boolean);
  return grounds.filter((ground) => {
    if (filters.municipality !== "all" && ground.municipality !== filters.municipality) return false;
    if (filters.permit !== "all" && ground.permit !== filters.permit) return false;
    const haystack = `${ground.name} ${ground.municipality} ${ground.county} ${ground.groundCode}`.toLowerCase();
    return terms.every((term) => haystack.includes(term));
  });
}

/** Grounds are in New Jersey, so slots always display in Eastern time. */
export function formatSlot(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}
