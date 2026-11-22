import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { btree_gist } from "@electric-sql/pglite/contrib/btree_gist";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const supabaseDir = join(import.meta.dirname, "../../../supabase");
const adminId = "11111111-1111-4111-8111-111111111111";
const otherUserId = "22222222-2222-4222-8222-222222222222";
let db: PGlite;

// Minimal stand-in for the parts of Supabase that the migration depends on.
const supabaseStub = `
  create role anon nologin;
  create role authenticated nologin;
  create schema auth;
  create table auth.users (id uuid primary key);
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.sub', true), '')::uuid $$;
  grant usage on schema auth to anon, authenticated;
  grant execute on function auth.uid() to anon, authenticated;
  create schema storage;
  create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
  create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
  alter table storage.objects enable row level security;
  grant usage on schema storage to anon, authenticated;
  grant select, insert, update, delete on storage.objects to anon, authenticated;
`;

async function as<T>(role: "anon" | "authenticated", userId: string, sql: string) {
  await db.exec(`set request.jwt.sub = '${userId}'; set role ${role};`);
  try {
    return (await db.query<T>(sql)).rows;
  } finally {
    await db.exec(`reset role; reset request.jwt.sub;`);
  }
}

beforeAll(async () => {
  db = new PGlite({ extensions: { btree_gist } });
  await db.exec(supabaseStub);
  for (const file of readdirSync(join(supabaseDir, "migrations")).sort()) {
    await db.exec(readFileSync(join(supabaseDir, "migrations", file), "utf8"));
  }
  await db.exec(readFileSync(join(supabaseDir, "seed.sql"), "utf8"));
  await db.exec(readFileSync(join(supabaseDir, "sample-images.sql"), "utf8"));
  await db.exec(`
    insert into auth.users values ('${adminId}'), ('${otherUserId}');
    insert into public.admin_users (user_id) values ('${adminId}');
    insert into public.ground_facilities (ground_code, slug, ground_name, municipality, county)
    values ('ZZ-999', 'hidden-draft', 'Hidden Draft', 'Nowhere', 'Somerset');
    insert into public.admin_notes (entity_table, entity_id, note)
    values ('ground_facilities', gen_random_uuid(), 'private');
  `);
}, 60_000);

afterAll(() => db.close());

describe("seed", () => {
  it("loads all 13 grounds, all flagged as samples", async () => {
    const rows = await as<{ code: string }>("anon", "", "select ground_code as code from ground_facilities where is_sample");
    expect(rows).toHaveLength(13);
  });

  it("links every permit to a published source", async () => {
    const { rows } = await db.query(`
      select p.id from permits p
      where not exists (select 1 from source_links l where l.permit_id = p.id)`);
    expect(rows).toHaveLength(0);
  });
});

describe("row-level security", () => {
  it("hides drafts from the public", async () => {
    expect(await as("anon", "", "select 1 from ground_facilities where ground_code = 'ZZ-999'")).toHaveLength(0);
  });

  it("shows drafts to admins", async () => {
    expect(await as("authenticated", adminId, "select 1 from ground_facilities where ground_code = 'ZZ-999'")).toHaveLength(1);
  });

  it("blocks anonymous writes", async () => {
    await expect(as("anon", "", "update ground_facilities set ground_name = 'x'")).rejects.toThrow(/permission denied/);
  });

  it("makes non-admin updates affect no rows", async () => {
    await as("authenticated", otherUserId, "update ground_facilities set ground_name = 'hacked'");
    const { rows } = await db.query("select 1 from ground_facilities where ground_name = 'hacked'");
    expect(rows).toHaveLength(0);
  });

  it("lets admins update", async () => {
    await as("authenticated", adminId, "update ground_facilities set boundary_size = '60m' where ground_code = 'FT-003'");
    const { rows } = await db.query("select 1 from ground_facilities where ground_code = 'FT-003' and boundary_size = '60m'");
    expect(rows).toHaveLength(1);
  });

  it("records admin edits in the audit log", async () => {
    const { rows } = await db.query(`select 1 from audit_log where table_name = 'ground_facilities' and actor_id = '${adminId}'`);
    expect(rows.length).toBeGreaterThan(0);
  });

  it("keeps private notes and the audit log from the public", async () => {
    await expect(as("anon", "", "select * from admin_notes")).rejects.toThrow(/permission denied/);
    await expect(as("anon", "", "select * from audit_log")).rejects.toThrow(/permission denied/);
    expect(await as("authenticated", otherUserId, "select * from admin_notes")).toHaveLength(0);
  });

  it("stops a non-admin from granting themselves admin", async () => {
    await expect(
      as("authenticated", otherUserId, `insert into admin_users (user_id) values ('${otherUserId}')`),
    ).rejects.toThrow(/permission denied/);
  });
});

describe("ground images", () => {
  it("gives each sample ground one published sample photo", async () => {
    const rows = await as("anon", "", "select 1 from ground_images where is_primary and is_sample");
    expect(rows).toHaveLength(13);
  });

  it("hides draft images from the public", async () => {
    await db.exec(`
      insert into ground_images (ground_id, storage_path, alt_text)
      select id, 'draft/hidden.webp', 'Draft' from ground_facilities where ground_code = 'FT-001'`);
    expect(await as("anon", "", "select 1 from ground_images where storage_path = 'draft/hidden.webp'")).toHaveLength(0);
    expect(await as("authenticated", adminId, "select 1 from ground_images where storage_path = 'draft/hidden.webp'")).toHaveLength(1);
  });

  it("allows one primary image per ground", async () => {
    await expect(db.query(`
      insert into ground_images (ground_id, storage_path, alt_text, is_primary)
      select id, 'draft/second.webp', 'Second', true from ground_facilities where ground_code = 'FT-001'`)).rejects.toThrow(/unique/);
  });

  it("blocks public and non-admin writes", async () => {
    await expect(as("anon", "", "delete from ground_images")).rejects.toThrow(/permission denied/);
    await as("authenticated", otherUserId, "delete from ground_images");
    const { rows } = await db.query("select 1 from ground_images where is_sample");
    expect(rows).toHaveLength(13);
  });

  it("limits file uploads to admins", async () => {
    const upload = "insert into storage.objects (bucket_id, name) values ('ground-images', 'x.webp')";
    await expect(as("anon", "", upload)).rejects.toThrow(/row-level security/);
    await expect(as("authenticated", otherUserId, upload)).rejects.toThrow(/row-level security/);
    expect(await as("authenticated", adminId, `${upload} returning name`)).toHaveLength(1);
  });
});

describe("data-trust rules", () => {
  it("refuses to publish a permit without a source", async () => {
    await expect(db.query(`
      insert into permits (ground_id, publication_status)
      select id, 'published' from ground_facilities where ground_code = 'FT-003'`)).rejects.toThrow(/without a published source/);
  });

  it("refuses verified availability without evidence", async () => {
    await expect(db.query(`
      insert into availability (ground_id, start_datetime, end_datetime, availability_status)
      select id, now() + interval '90 days', now() + interval '91 days', 'verified_available'
      from ground_facilities where ground_code = 'FT-003'`)).rejects.toThrow(/check constraint/);
  });

  it("refuses overlapping availability", async () => {
    await expect(db.query(`
      insert into availability (ground_id, start_datetime, end_datetime)
      select ground_id, start_datetime, end_datetime from availability limit 1`)).rejects.toThrow(/exclusion constraint|conflicting key/);
  });

  it("serves expired availability as unknown", async () => {
    await db.exec(`
      update availability set expires_at = now() - interval '1 day'
      where id = (select id from availability where availability_status = 'verified_available' limit 1)`);
    const rows = await as<{ availability_status: string }>("anon", "",
      "select availability_status from public_availability where expires_at < now()");
    expect(rows).toEqual([{ availability_status: "unknown" }]);
  });
});
