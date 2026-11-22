import { describe, expect, it } from "vitest";
import { displayValue, effectiveAvailability, NOT_VERIFIED } from "./index";

describe("displayValue", () => {
  it("labels missing values", () => {
    for (const v of [null, undefined, "", "  "]) expect(displayValue(v)).toBe(NOT_VERIFIED);
  });
  it("keeps a real zero", () => expect(displayValue(0)).toBe("0"));
});

describe("effectiveAvailability", () => {
  const now = new Date("2026-11-22T12:00:00Z");
  it("keeps an unexpired status", () =>
    expect(effectiveAvailability("verified_available", "2026-11-23T00:00:00Z", now)).toBe("verified_available"));
  it("downgrades expired status", () =>
    expect(effectiveAvailability("verified_available", "2026-11-21T00:00:00Z", now)).toBe("unknown"));
  it("downgrades a missing expiry", () =>
    expect(effectiveAvailability("limited", null, now)).toBe("unknown"));
});
