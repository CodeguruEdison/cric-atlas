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
