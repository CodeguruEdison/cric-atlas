import { describe, expect, it } from "vitest";
import {
  displayValue,
  effectiveAvailability,
  filterGrounds,
  formatSlot,
  NOT_VERIFIED,
  permitRequirement,
  type GroundCard,
} from "./index";

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

describe("permitRequirement", () => {
  it("is unknown with no policies", () => expect(permitRequirement([])).toBe("unknown"));
  it("is unknown when a value is missing", () =>
    expect(permitRequirement([{ permit_required: false }, { permit_required: null }])).toBe("unknown"));
  it("treats any required policy as required", () =>
    expect(permitRequirement([{ permit_required: false }, { permit_required: true }])).toBe("required"));
  it("needs every policy to say not required", () =>
    expect(permitRequirement([{ permit_required: false }])).toBe("not_required"));
});

describe("filterGrounds", () => {
  const base: GroundCard = {
    id: "1", groundCode: "FT-005", slug: "colonial", name: "Colonial Park Cricket Ground",
    municipality: "Franklin Township", county: "Somerset", state: "NJ", cricketStatus: "unverified",
    permit: "required", nextVerifiedSlot: null, isSample: true,
  };
  const other: GroundCard = { ...base, id: "2", groundCode: "FT-010", name: "Broadway Field", municipality: "Montgomery Township", permit: "unknown" };
  const all = { query: "", municipality: "all", permit: "all" } as const;

  it("matches terms in any order across fields", () =>
    expect(filterGrounds([base, other], { ...all, query: "franklin colonial" }).map((g) => g.id)).toEqual(["1"]));
  it("combines filters", () =>
    expect(filterGrounds([base, other], { ...all, municipality: "Montgomery Township", permit: "required" })).toEqual([]));
});

describe("formatSlot", () => {
  it("uses Eastern time", () => expect(formatSlot("2026-12-01T14:00:00Z")).toContain("9:00"));
});
