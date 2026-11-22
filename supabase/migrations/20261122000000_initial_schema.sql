-- CricketAtlas GroundIQ core schema.
-- NULL means "not yet verified"; application code must never replace it with a default.

create extension if not exists btree_gist;

create type public.publication_status as enum ('draft', 'published', 'archived');
create type public.verification_status as enum ('unverified', 'needs_review', 'verified', 'conflicting');
create type public.cricket_status as enum ('permitted', 'restricted', 'not_permitted', 'unverified');
create type public.facility_status as enum ('open', 'seasonal', 'temporarily_closed', 'closed', 'unknown');
create type public.permit_status as enum ('active', 'suspended', 'expired', 'unknown');
create type public.availability_status as enum ('verified_available', 'limited', 'verified_unavailable', 'unknown');
create type public.source_type as enum ('official_website', 'official_document', 'phone_call', 'email', 'site_visit', 'workbook', 'sample', 'other');

create table public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()));
$$;

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.ground_facilities (
  id uuid primary key default gen_random_uuid(),
  ground_code text not null unique check (ground_code ~ '^[A-Z]{2}-[0-9]{3}$'),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  ground_name text not null check (length(trim(ground_name)) > 0),
  parent_facility text,
  municipality text not null,
  county text not null,
  state char(2) not null default 'NJ',
  address text,
  latitude numeric(9, 6) check (latitude between -90 and 90),
  longitude numeric(9, 6) check (longitude between -180 and 180),
  location_is_approximate boolean not null default true,
  pitch_type text,
  surface_type text,
  boundary_size text,
  amenities jsonb check (amenities is null or jsonb_typeof(amenities) = 'array'),
  cricket_status public.cricket_status not null default 'unverified',
  facility_status public.facility_status not null default 'unknown',
  verification_status public.verification_status not null default 'unverified',
  publication_status public.publication_status not null default 'draft',
  is_sample boolean not null default false,
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((latitude is null) = (longitude is null))
);
create index ground_facilities_public_idx on public.ground_facilities (publication_status, county, municipality);

create table public.permit_authorities (
  id uuid primary key default gen_random_uuid(),
  authority_name text not null unique,
  authority_type text,
  jurisdiction text,
  contact_name text,
  phone text,
  email text,
  website text check (website is null or website ~ '^https://'),
  application_portal text check (application_portal is null or application_portal ~ '^https://'),
  application_instructions text,
  verification_status public.verification_status not null default 'unverified',
  publication_status public.publication_status not null default 'draft',
  is_sample boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.permits (
  id uuid primary key default gen_random_uuid(),
  ground_id uuid not null references public.ground_facilities (id) on delete cascade,
  permit_authority_id uuid references public.permit_authorities (id) on delete restrict,
  permit_required boolean,
  permit_type text,
  application_method text,
  application_url text check (application_url is null or application_url ~ '^https://'),
  advance_notice_days integer check (advance_notice_days >= 0),
  booking_duration_hours numeric(5, 2) check (booking_duration_hours > 0),
  roster_required boolean,
  insurance_required boolean,
  special_event_rules text,
  permit_status public.permit_status not null default 'unknown',
  verification_status public.verification_status not null default 'unverified',
  publication_status public.publication_status not null default 'draft',
  is_sample boolean not null default false,
  effective_from date,
  effective_until date,
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (effective_until is null or effective_from is null or effective_until >= effective_from)
);
create index permits_ground_idx on public.permits (ground_id);
create index permits_authority_idx on public.permits (permit_authority_id);

create table public.permit_fees (
  id uuid primary key default gen_random_uuid(),
  permit_id uuid not null references public.permits (id) on delete cascade,
  applicant_category text not null,
  duration_hours numeric(5, 2) check (duration_hours > 0),
  amount numeric(10, 2) not null check (amount >= 0),
  currency char(3) not null default 'USD',
  effective_from date,
  effective_until date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (effective_until is null or effective_from is null or effective_until >= effective_from)
);
create index permit_fees_permit_idx on public.permit_fees (permit_id);

create table public.sources (
  id uuid primary key default gen_random_uuid(),
  source_name text not null,
  source_type public.source_type not null,
  source_url text check (source_url is null or source_url ~ '^https://'),
  issuing_authority text,
  published_at timestamptz,
  retrieved_at timestamptz,
  evidence_notes text,
  verification_status public.verification_status not null default 'unverified',
  publication_status public.publication_status not null default 'draft',
  is_sample boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.source_links (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.sources (id) on delete cascade,
  ground_id uuid references public.ground_facilities (id) on delete cascade,
  permit_id uuid references public.permits (id) on delete cascade,
  authority_id uuid references public.permit_authorities (id) on delete cascade,
  created_at timestamptz not null default now(),
  check (num_nonnulls(ground_id, permit_id, authority_id) = 1)
);
create unique index source_links_ground_uq on public.source_links (source_id, ground_id) where ground_id is not null;
create unique index source_links_permit_uq on public.source_links (source_id, permit_id) where permit_id is not null;
create unique index source_links_authority_uq on public.source_links (source_id, authority_id) where authority_id is not null;
create index source_links_ground_idx on public.source_links (ground_id);
create index source_links_permit_idx on public.source_links (permit_id);
create index source_links_authority_idx on public.source_links (authority_id);

create table public.availability (
  id uuid primary key default gen_random_uuid(),
  ground_id uuid not null references public.ground_facilities (id) on delete cascade,
  start_datetime timestamptz not null,
  end_datetime timestamptz not null,
  availability_status public.availability_status not null default 'unknown',
  verification_method text,
  source_id uuid references public.sources (id) on delete restrict,
  last_checked_at timestamptz,
  expires_at timestamptz,
  publication_status public.publication_status not null default 'draft',
  is_sample boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_datetime > start_datetime),
  -- A verified claim needs evidence, a check time and an expiry.
  check (
    availability_status = 'unknown'
    or (source_id is not null and last_checked_at is not null and expires_at is not null)
  ),
  exclude using gist (ground_id with =, tstzrange(start_datetime, end_datetime) with &&)
);
create index availability_ground_time_idx on public.availability (ground_id, start_datetime);

-- Private notes live apart from public rows so they cannot leak through a select.
create table public.admin_notes (
  id uuid primary key default gen_random_uuid(),
  entity_table text not null,
  entity_id uuid not null,
  note text not null,
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
create index admin_notes_entity_idx on public.admin_notes (entity_table, entity_id);

create table public.audit_log (
  id bigint generated always as identity primary key,
  table_name text not null,
  record_id uuid,
  action text not null,
  actor_id uuid,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);
create index audit_log_record_idx on public.audit_log (table_name, record_id, created_at desc);

create function public.write_audit_log()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  old_row jsonb := case when tg_op = 'INSERT' then null else to_jsonb(old) end;
  new_row jsonb := case when tg_op = 'DELETE' then null else to_jsonb(new) end;
begin
  insert into public.audit_log (table_name, record_id, action, actor_id, old_data, new_data)
  values (tg_table_name, (coalesce(new_row, old_row) ->> 'id')::uuid, tg_op, auth.uid(), old_row, new_row);
  return coalesce(new, old);
end;
$$;

-- A permit cannot go public without at least one published source.
create function public.enforce_permit_evidence()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.publication_status = 'published' and not exists (
    select 1
    from public.source_links l
    join public.sources s on s.id = l.source_id
    where l.permit_id = new.id and s.publication_status = 'published'
  ) then
    raise exception 'Permit % cannot be published without a published source', new.id
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger permits_require_evidence
before insert or update of publication_status on public.permits
for each row execute function public.enforce_permit_evidence();

do $$
declare
  t text;
begin
  foreach t in array array['ground_facilities', 'permit_authorities', 'permits', 'permit_fees', 'sources', 'availability'] loop
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t);
    execute format('create trigger audit_changes after insert or update or delete on public.%I for each row execute function public.write_audit_log()', t);
  end loop;
end;
$$;

-- Expired checks are served as unknown, regardless of the stored status.
create view public.public_availability
with (security_invoker = true)
as
select
  a.id,
  a.ground_id,
  a.start_datetime,
  a.end_datetime,
  case when a.expires_at > now() then a.availability_status else 'unknown'::public.availability_status end as availability_status,
  a.verification_method,
  a.source_id,
  a.last_checked_at,
  a.expires_at,
  a.is_sample
from public.availability a;

alter table public.admin_users enable row level security;
alter table public.ground_facilities enable row level security;
alter table public.permit_authorities enable row level security;
alter table public.permits enable row level security;
alter table public.permit_fees enable row level security;
alter table public.sources enable row level security;
alter table public.source_links enable row level security;
alter table public.availability enable row level security;
alter table public.admin_notes enable row level security;
alter table public.audit_log enable row level security;

create policy "public reads published grounds" on public.ground_facilities
for select to anon, authenticated using (publication_status = 'published');

create policy "public reads published authorities" on public.permit_authorities
for select to anon, authenticated using (publication_status = 'published');

create policy "public reads published sources" on public.sources
for select to anon, authenticated using (publication_status = 'published');

create policy "public reads published permits" on public.permits
for select to anon, authenticated using (
  publication_status = 'published'
  and exists (select 1 from public.ground_facilities g where g.id = ground_id and g.publication_status = 'published')
);

-- These policies rely on the parent table's RLS through the nested select.
create policy "public reads fees of visible permits" on public.permit_fees
for select to anon, authenticated using (exists (select 1 from public.permits p where p.id = permit_id));

create policy "public reads links of visible records" on public.source_links
for select to anon, authenticated using (
  exists (select 1 from public.sources s where s.id = source_id)
  and (
    exists (select 1 from public.ground_facilities g where g.id = ground_id)
    or exists (select 1 from public.permits p where p.id = permit_id)
    or exists (select 1 from public.permit_authorities a where a.id = authority_id)
  )
);

create policy "public reads published availability" on public.availability
for select to anon, authenticated using (
  publication_status = 'published'
  and exists (select 1 from public.ground_facilities g where g.id = ground_id)
);

do $$
declare
  t text;
begin
  foreach t in array array['ground_facilities', 'permit_authorities', 'permits', 'permit_fees', 'sources', 'source_links', 'availability', 'admin_notes'] loop
    execute format('create policy "admins manage %1$s" on public.%1$I for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()))', t);
  end loop;
end;
$$;

create policy "admins read admin list" on public.admin_users
for select to authenticated using ((select public.is_admin()));

create policy "admins read audit log" on public.audit_log
for select to authenticated using ((select public.is_admin()));

revoke all on all tables in schema public from anon, authenticated;
revoke execute on function public.write_audit_log() from public, anon, authenticated;

grant usage on schema public to anon, authenticated;
grant select on public.ground_facilities, public.permit_authorities, public.permits, public.permit_fees,
  public.sources, public.source_links, public.availability, public.public_availability to anon, authenticated;
grant insert, update, delete on public.ground_facilities, public.permit_authorities, public.permits, public.permit_fees,
  public.sources, public.source_links, public.availability to authenticated;
grant select, insert, update, delete on public.admin_notes to authenticated;
grant select on public.admin_users, public.audit_log to authenticated;
grant execute on function public.is_admin() to anon, authenticated;
