export type RelationKey = "grounds" | "authorities" | "permits" | "sources";
export type FieldType =
  | "text" | "textarea" | "url" | "number" | "integer" | "select" | "relation"
  | "tristate" | "flag" | "date" | "datetime" | "list";

export type Field = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: readonly string[];
  relation?: RelationKey;
  pattern?: RegExp;
  help?: string;
  defaultValue?: string;
};

export type Resource = {
  key: string;
  label: string;
  singular: string;
  table: string;
  orderBy: string;
  ascending?: boolean;
  titleField?: string;
  columns: string[];
  fields: Field[];
  hasPublication: boolean;
};

const verification = ["unverified", "needs_review", "verified", "conflicting"] as const;
const publication = ["draft", "published", "archived"] as const;

const publicationField: Field = { name: "publication_status", label: "Publication", type: "select", options: publication, required: true, defaultValue: "draft", help: "Only published records appear on the public site." };
const verificationField: Field = { name: "verification_status", label: "Verification", type: "select", options: verification, required: true, defaultValue: "unverified" };
const sampleField: Field = { name: "is_sample", label: "Sample data", type: "flag", help: "Keep on for demo records. Turn off only for verified real data." };

export const resources: Resource[] = [
  {
    key: "grounds", label: "Grounds", singular: "Ground", table: "ground_facilities", orderBy: "ground_code", ascending: true, titleField: "ground_name",
    columns: ["ground_code", "ground_name", "municipality", "cricket_status", "verification_status", "publication_status"],
    hasPublication: true,
    fields: [
      { name: "ground_code", label: "Ground code", type: "text", required: true, pattern: /^[A-Z]{2}-\d{3}$/, help: "Stable ID, for example FT-014." },
      { name: "slug", label: "URL slug", type: "text", required: true, pattern: /^[a-z0-9]+(-[a-z0-9]+)*$/, help: "Lowercase words joined by hyphens." },
      { name: "ground_name", label: "Ground name", type: "text", required: true },
      { name: "parent_facility", label: "Parent facility", type: "text" },
      { name: "municipality", label: "Municipality", type: "text", required: true },
      { name: "county", label: "County", type: "text", required: true, defaultValue: "Somerset" },
      { name: "state", label: "State", type: "text", required: true, pattern: /^[A-Z]{2}$/, defaultValue: "NJ" },
      { name: "address", label: "Address", type: "text" },
      { name: "latitude", label: "Latitude", type: "number" },
      { name: "longitude", label: "Longitude", type: "number" },
      { name: "location_is_approximate", label: "Location is approximate", type: "flag", defaultValue: "on", help: "Turn off only when the exact location is verified. This enables directions." },
      { name: "pitch_type", label: "Pitch type", type: "text" },
      { name: "surface_type", label: "Surface", type: "text" },
      { name: "boundary_size", label: "Boundary size", type: "text" },
      { name: "amenities", label: "Amenities", type: "list", help: "Separate with commas." },
      { name: "cricket_status", label: "Cricket status", type: "select", options: ["permitted", "restricted", "not_permitted", "unverified"], required: true, defaultValue: "unverified" },
      { name: "facility_status", label: "Facility status", type: "select", options: ["open", "seasonal", "temporarily_closed", "closed", "unknown"], required: true, defaultValue: "unknown" },
      verificationField,
      { name: "last_verified_at", label: "Last verified (ET)", type: "datetime" },
      publicationField,
      sampleField,
    ],
  },
  {
    key: "permits", label: "Permits", singular: "Permit", table: "permits", orderBy: "updated_at",
    columns: ["ground_id", "permit_type", "permit_authority_id", "permit_required", "verification_status", "publication_status"],
    hasPublication: true,
    fields: [
      { name: "ground_id", label: "Ground", type: "relation", relation: "grounds", required: true },
      { name: "permit_authority_id", label: "Permit authority", type: "relation", relation: "authorities" },
      { name: "permit_required", label: "Permit required", type: "tristate" },
      { name: "permit_type", label: "Permit type", type: "text" },
      { name: "application_method", label: "Application method", type: "text" },
      { name: "application_url", label: "Application URL", type: "url", help: "Shown as Apply for Permit only when this permit is verified." },
      { name: "advance_notice_days", label: "Advance notice (days)", type: "integer" },
      { name: "booking_duration_hours", label: "Booking duration (hours)", type: "number" },
      { name: "roster_required", label: "Roster required", type: "tristate" },
      { name: "insurance_required", label: "Insurance required", type: "tristate" },
      { name: "special_event_rules", label: "Special-event rules", type: "textarea" },
      { name: "permit_status", label: "Permit status", type: "select", options: ["active", "suspended", "expired", "unknown"], required: true, defaultValue: "unknown" },
      verificationField,
      { name: "effective_from", label: "Effective from", type: "date" },
      { name: "effective_until", label: "Effective until", type: "date" },
      { name: "last_verified_at", label: "Last verified (ET)", type: "datetime" },
      { ...publicationField, help: "Publishing requires a linked, published source." },
      sampleField,
    ],
  },
  {
    key: "fees", label: "Permit Fees", singular: "Fee", table: "permit_fees", orderBy: "updated_at",
    columns: ["permit_id", "applicant_category", "duration_hours", "amount", "currency"],
    hasPublication: false,
    fields: [
      { name: "permit_id", label: "Permit", type: "relation", relation: "permits", required: true },
      { name: "applicant_category", label: "Applicant category", type: "text", required: true },
      { name: "duration_hours", label: "Duration (hours)", type: "number" },
      { name: "amount", label: "Amount", type: "number", required: true },
      { name: "currency", label: "Currency", type: "text", required: true, pattern: /^[A-Z]{3}$/, defaultValue: "USD" },
      { name: "effective_from", label: "Effective from", type: "date" },
      { name: "effective_until", label: "Effective until", type: "date" },
    ],
  },
  {
    key: "authorities", label: "Authorities", singular: "Authority", table: "permit_authorities", orderBy: "authority_name", ascending: true, titleField: "authority_name",
    columns: ["authority_name", "jurisdiction", "phone", "verification_status", "publication_status"],
    hasPublication: true,
    fields: [
      { name: "authority_name", label: "Authority name", type: "text", required: true },
      { name: "authority_type", label: "Authority type", type: "text" },
      { name: "jurisdiction", label: "Jurisdiction", type: "text" },
      { name: "contact_name", label: "Contact name", type: "text" },
      { name: "phone", label: "Phone", type: "text" },
      { name: "email", label: "Email", type: "text" },
      { name: "website", label: "Website", type: "url" },
      { name: "application_portal", label: "Application portal", type: "url" },
      { name: "application_instructions", label: "Application instructions", type: "textarea" },
      verificationField,
      publicationField,
      sampleField,
    ],
  },
  {
    key: "availability", label: "Availability", singular: "Availability Slot", table: "availability", orderBy: "start_datetime", ascending: true,
    columns: ["ground_id", "start_datetime", "end_datetime", "availability_status", "expires_at", "publication_status"],
    hasPublication: true,
    fields: [
      { name: "ground_id", label: "Ground", type: "relation", relation: "grounds", required: true },
      { name: "start_datetime", label: "Start (ET)", type: "datetime", required: true },
      { name: "end_datetime", label: "End (ET)", type: "datetime", required: true },
      { name: "availability_status", label: "Status", type: "select", options: ["verified_available", "limited", "verified_unavailable", "unknown"], required: true, defaultValue: "unknown", help: "Any known status needs a source, last-checked time and expiry." },
      { name: "verification_method", label: "Verification method", type: "text" },
      { name: "source_id", label: "Evidence source", type: "relation", relation: "sources" },
      { name: "last_checked_at", label: "Last checked (ET)", type: "datetime" },
      { name: "expires_at", label: "Expires (ET)", type: "datetime", help: "After this time the public site shows Unknown." },
      publicationField,
      sampleField,
    ],
  },
  {
    key: "sources", label: "Sources", singular: "Source", table: "sources", orderBy: "created_at", titleField: "source_name",
    columns: ["source_name", "source_type", "issuing_authority", "verification_status", "publication_status"],
    hasPublication: true,
    fields: [
      { name: "source_name", label: "Source name", type: "text", required: true },
      { name: "source_type", label: "Source type", type: "select", options: ["official_website", "official_document", "phone_call", "email", "site_visit", "workbook", "sample", "other"], required: true, defaultValue: "official_website" },
      { name: "source_url", label: "Source URL", type: "url" },
      { name: "issuing_authority", label: "Issuing authority", type: "text" },
      { name: "published_at", label: "Published (ET)", type: "datetime" },
      { name: "retrieved_at", label: "Retrieved (ET)", type: "datetime" },
      { name: "evidence_notes", label: "Evidence notes", type: "textarea", help: "Visible to the public when this source is published." },
      verificationField,
      publicationField,
      sampleField,
    ],
  },
  {
    key: "source-links", label: "Source Links", singular: "Source Link", table: "source_links", orderBy: "created_at",
    columns: ["source_id", "ground_id", "permit_id", "authority_id"],
    hasPublication: false,
    fields: [
      { name: "source_id", label: "Source", type: "relation", relation: "sources", required: true },
      { name: "ground_id", label: "Link to ground", type: "relation", relation: "grounds", help: "Choose exactly one ground, permit or authority." },
      { name: "permit_id", label: "Link to permit", type: "relation", relation: "permits" },
      { name: "authority_id", label: "Link to authority", type: "relation", relation: "authorities" },
    ],
  },
  {
    key: "photos", label: "Photos", singular: "Photo", table: "ground_images", orderBy: "updated_at",
    columns: ["storage_path", "ground_id", "alt_text", "is_primary", "publication_status"],
    hasPublication: true,
    fields: [
      { name: "ground_id", label: "Ground", type: "relation", relation: "grounds", required: true },
      { name: "alt_text", label: "Image description", type: "text", required: true, help: "Describe the photo for screen readers." },
      { name: "credit", label: "Credit", type: "text" },
      { name: "is_primary", label: "Main photo for this ground", type: "flag" },
      { name: "sort_order", label: "Sort order", type: "integer", required: true, defaultValue: "0" },
      publicationField,
      sampleField,
    ],
  },
];

export const getResource = (key: string) => resources.find((resource) => resource.key === key);
