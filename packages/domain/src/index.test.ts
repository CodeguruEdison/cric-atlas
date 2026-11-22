import { describe, expect, it } from "vitest";
import {
  canShowAuthorityContact,
  currentFees,
  dayStatus,
  displayValue,
  easternDateKey,
  effectiveAvailability,
  filterGrounds,
  formatSlot,
  monthGrid,
  NOT_VERIFIED,
  permitRequirement,
  pickPrimaryImage,
  type GroundCard,
  type PermitAuthority,
  type PermitDetail,
  type PermitFee,
  verifiedApplicationUrl,
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
    latitude: 40.5, longitude: -74.5, locationIsApproximate: true, image: null,
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

describe("calendar helpers", () => {
  it("uses the New Jersey day near midnight UTC", () => expect(easternDateKey("2026-12-02T03:00:00Z")).toBe("2026-12-01"));
  it("pads a month to its first weekday", () => {
    const grid = monthGrid(2026, 11);
    expect(grid.slice(0, 3)).toEqual([null, null, "2026-12-01"]);
    expect(grid.at(-1)).toBe("2026-12-31");
  });
  it("defaults an empty day to unknown", () => expect(dayStatus([])).toBe("unknown"));
  it("prefers an available slot", () =>
    expect(dayStatus([{ availability_status: "verified_unavailable" }, { availability_status: "verified_available" }])).toBe("verified_available"));
});

describe("permit trust rules", () => {
  const authority = { verification_status: "unverified", is_sample: false, application_portal: "https://example.org/p" } as PermitAuthority;
  const permit = { verification_status: "unverified", application_url: "https://example.org/a", authority } as PermitDetail;
  it("hides links on unverified permits", () => expect(verifiedApplicationUrl(permit)).toBeNull());
  it("opens a verified permit link", () =>
    expect(verifiedApplicationUrl({ ...permit, verification_status: "verified" })).toBe("https://example.org/a"));
  it("ignores an unverified authority portal", () =>
    expect(verifiedApplicationUrl({ ...permit, verification_status: "verified", application_url: null })).toBeNull());
  it("hides unverified real contacts", () => expect(canShowAuthorityContact(authority)).toBe(false));
  it("drops expired fees", () => {
    const fee = { effective_until: "2026-01-01", effective_from: null } as PermitFee;
    expect(currentFees([fee], "2026-11-22")).toEqual([]);
  });
});

describe("pickPrimaryImage", () => {
  it("prefers the primary image", () =>
    expect(pickPrimaryImage([{ is_primary: false, sort_order: 0 }, { is_primary: true, sort_order: 5 }])?.sort_order).toBe(5));
  it("falls back to sort order", () =>
    expect(pickPrimaryImage([{ is_primary: false, sort_order: 2 }, { is_primary: false, sort_order: 1 }])?.sort_order).toBe(1));
  it("returns null with no images", () => expect(pickPrimaryImage([])).toBeNull());
});
