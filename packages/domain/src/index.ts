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
  latitude: number | null;
  longitude: number | null;
  locationIsApproximate: boolean;
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

export type VerificationStatus = "unverified" | "needs_review" | "verified" | "conflicting";

export const verificationLabels: Record<VerificationStatus, string> = {
  unverified: "Not yet verified",
  needs_review: "Needs review",
  verified: "Verified",
  conflicting: "Conflicting information",
};

export const facilityStatusLabels: Record<string, string> = {
  open: "Open",
  seasonal: "Seasonal",
  temporarily_closed: "Temporarily closed",
  closed: "Closed",
  unknown: NOT_VERIFIED,
};

export type SourceRef = {
  id: string;
  source_name: string;
  source_type: string;
  source_url: string | null;
  issuing_authority: string | null;
  retrieved_at: string | null;
  is_sample: boolean;
};

export type PermitAuthority = {
  id: string;
  authority_name: string;
  authority_type: string | null;
  jurisdiction: string | null;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  application_portal: string | null;
  application_instructions: string | null;
  verification_status: VerificationStatus;
  is_sample: boolean;
};

export type PermitFee = {
  id: string;
  applicant_category: string;
  duration_hours: number | null;
  amount: number;
  currency: string;
  effective_from: string | null;
  effective_until: string | null;
};

export type PermitDetail = {
  id: string;
  permit_required: boolean | null;
  permit_type: string | null;
  application_method: string | null;
  application_url: string | null;
  advance_notice_days: number | null;
  booking_duration_hours: number | null;
  roster_required: boolean | null;
  insurance_required: boolean | null;
  special_event_rules: string | null;
  verification_status: VerificationStatus;
  last_verified_at: string | null;
  is_sample: boolean;
  authority: PermitAuthority | null;
  fees: PermitFee[];
  sources: SourceRef[];
};

export type AvailabilitySlot = {
  id: string;
  start_datetime: string;
  end_datetime: string;
  availability_status: AvailabilityStatus;
  verification_method: string | null;
  last_checked_at: string | null;
  source: SourceRef | null;
};

export type GroundDetail = {
  id: string;
  ground_code: string;
  slug: string;
  ground_name: string;
  parent_facility: string | null;
  municipality: string;
  county: string;
  state: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  location_is_approximate: boolean;
  pitch_type: string | null;
  surface_type: string | null;
  boundary_size: string | null;
  amenities: string[] | null;
  cricket_status: CricketStatus;
  facility_status: string;
  verification_status: VerificationStatus;
  last_verified_at: string | null;
  is_sample: boolean;
  permits: PermitDetail[];
  sources: SourceRef[];
  slots: AvailabilitySlot[];
};

export function yesNo(value: boolean | null | undefined): string {
  if (value === null || value === undefined) return NOT_VERIFIED;
  return value ? "Yes" : "No";
}

const EASTERN = "America/New_York";

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return NOT_VERIFIED;
  return new Intl.DateTimeFormat("en-US", { timeZone: EASTERN, month: "short", day: "numeric", year: "numeric" }).format(new Date(iso));
}

export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: EASTERN, hour: "numeric", minute: "2-digit" }).format(new Date(iso));
}

export function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

/** The YYYY-MM-DD calendar day in New Jersey for an instant. */
export function easternDateKey(value: string | Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: EASTERN, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value));
}

/** Sunday-first month cells; null pads the first week. */
export function monthGrid(year: number, monthIndex: number): (string | null)[] {
  const leading = new Date(Date.UTC(year, monthIndex, 1)).getUTCDay();
  const days = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const prefix = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
  return [
    ...Array<null>(leading).fill(null),
    ...Array.from({ length: days }, (_, i) => `${prefix}-${String(i + 1).padStart(2, "0")}`),
  ];
}

/** A day shows its best bookable state; days with no records stay unknown. */
export function dayStatus(slots: ReadonlyArray<{ availability_status: AvailabilityStatus }>): AvailabilityStatus {
  for (const status of ["verified_available", "limited", "verified_unavailable"] as const) {
    if (slots.some((slot) => slot.availability_status === status)) return status;
  }
  return "unknown";
}

export function currentFees(fees: readonly PermitFee[], todayKey: string): PermitFee[] {
  return fees.filter(
    (fee) => (!fee.effective_from || fee.effective_from <= todayKey) && (!fee.effective_until || fee.effective_until >= todayKey),
  );
}

/** Only a verified permit may send people to an application link. */
export function verifiedApplicationUrl(permit: PermitDetail): string | null {
  if (permit.verification_status !== "verified") return null;
  return permit.application_url ?? (permit.authority?.verification_status === "verified" ? permit.authority.application_portal : null);
}

/** Unverified real contacts stay hidden; labeled demo contacts can be shown. */
export function canShowAuthorityContact(authority: PermitAuthority | null): authority is PermitAuthority {
  return authority !== null && (authority.verification_status === "verified" || authority.is_sample);
}
