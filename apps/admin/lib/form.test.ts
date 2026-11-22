import { describe, expect, it } from "vitest";
import { errorCode, parseRecord, toFormValues } from "./form";
import { getResource } from "./resources";
import { easternInputToIso, isoToEasternInput } from "./time";

const res = (key: string) => getResource(key)!;
const id = "11111111-1111-4111-8111-111111111111";

describe("Eastern time", () => {
  it("handles winter", () => expect(easternInputToIso("2026-12-01T09:00")).toBe("2026-12-01T14:00:00.000Z"));
  it("handles summer", () => expect(easternInputToIso("2026-07-01T09:00")).toBe("2026-07-01T13:00:00.000Z"));
  it("round trips", () => expect(isoToEasternInput("2026-07-01T13:00:00.000Z")).toBe("2026-07-01T09:00"));
  it("rejects impossible dates", () => expect(easternInputToIso("2026-02-31T09:00")).toBeNull());
});

describe("parseRecord", () => {
  it("keeps blank optional values unknown", () => {
    const parsed = parseRecord(res("permits"), { ...toFormValues(res("permits")), ground_id: id });
    expect(parsed.ok && parsed.data.permit_required).toBeNull();
    expect(parsed.ok && parsed.data.insurance_required).toBeNull();
  });
  it("keeps an explicit no", () => {
    const parsed = parseRecord(res("permits"), { ...toFormValues(res("permits")), ground_id: id, permit_required: "false" });
    expect(parsed.ok && parsed.data.permit_required).toBe(false);
  });
  it("rejects insecure links", () => {
    const parsed = parseRecord(res("permits"), { ...toFormValues(res("permits")), ground_id: id, application_url: "javascript:alert(1)" });
    expect(!parsed.ok && parsed.errors.application_url).toBeTruthy();
  });
  it("rejects unlisted options", () => {
    const parsed = parseRecord(res("permits"), { ...toFormValues(res("permits")), ground_id: id, publication_status: "live" });
    expect(!parsed.ok && parsed.errors.publication_status).toBeTruthy();
  });
  it("requires one source link target", () => {
    expect(parseRecord(res("source-links"), { source_id: id }).ok).toBe(false);
    expect(parseRecord(res("source-links"), { source_id: id, permit_id: id }).ok).toBe(true);
    expect(parseRecord(res("source-links"), { source_id: id, permit_id: id, ground_id: id }).ok).toBe(false);
  });
  it("requires end after start", () => {
    const parsed = parseRecord(res("availability"), { ...toFormValues(res("availability")), ground_id: id, start_datetime: "2026-12-01T10:00", end_datetime: "2026-12-01T09:00" });
    expect(!parsed.ok && parsed.errors.end_datetime).toBeTruthy();
  });
  it("requires paired coordinates", () => {
    const values = { ...toFormValues(res("grounds")), ground_code: "FT-014", slug: "new-ground", ground_name: "New", municipality: "Town", latitude: "40.5" };
    const parsed = parseRecord(res("grounds"), values);
    expect(!parsed.ok && parsed.errors.longitude).toBeTruthy();
  });
  it("splits amenities", () => {
    const values = { ...toFormValues(res("grounds")), ground_code: "FT-014", slug: "new-ground", ground_name: "New", municipality: "Town", amenities: "Parking, Restrooms," };
    const parsed = parseRecord(res("grounds"), values);
    expect(parsed.ok && parsed.data.amenities).toEqual(["Parking", "Restrooms"]);
  });
});

describe("errorCode", () => {
  it("explains missing permit evidence", () =>
    expect(errorCode("permits", { code: "23514", message: "Permit x cannot be published without a published source" })).toBe("publish_source"));
  it("explains availability evidence", () => expect(errorCode("availability", { code: "23514" })).toBe("availability_evidence"));
});
