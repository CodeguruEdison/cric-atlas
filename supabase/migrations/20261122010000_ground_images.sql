-- Ground photos live in Storage; this table controls which ones are public.
create table public.ground_images (
  id uuid primary key default gen_random_uuid(),
  ground_id uuid not null references public.ground_facilities (id) on delete cascade,
  storage_path text not null unique check (storage_path ~ '^[a-z0-9][a-z0-9/_-]*\.(webp|jpg|jpeg|png)$'),
  alt_text text not null check (length(trim(alt_text)) > 0),
  credit text,
  is_primary boolean not null default false,
  sort_order integer not null default 0,
  publication_status public.publication_status not null default 'draft',
  is_sample boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index ground_images_ground_idx on public.ground_images (ground_id, sort_order);
create unique index ground_images_one_primary_uq on public.ground_images (ground_id) where is_primary;

create trigger set_updated_at before update on public.ground_images
for each row execute function public.set_updated_at();
create trigger audit_changes after insert or update or delete on public.ground_images
for each row execute function public.write_audit_log();

alter table public.ground_images enable row level security;

create policy "public reads published ground images" on public.ground_images
for select to anon, authenticated using (
  publication_status = 'published'
  and exists (select 1 from public.ground_facilities g where g.id = ground_id)
);
create policy "admins manage ground_images" on public.ground_images
for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

grant select on public.ground_images to anon, authenticated;
grant insert, update, delete on public.ground_images to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ground-images', 'ground-images', true, 5242880, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

-- Public files are served by URL, so no public policy is needed and the bucket cannot be listed.
create policy "admins read ground image files" on storage.objects
for select to authenticated using (bucket_id = 'ground-images' and (select public.is_admin()));
create policy "admins upload ground image files" on storage.objects
for insert to authenticated with check (bucket_id = 'ground-images' and (select public.is_admin()));
create policy "admins update ground image files" on storage.objects
for update to authenticated using (bucket_id = 'ground-images' and (select public.is_admin()))
with check (bucket_id = 'ground-images' and (select public.is_admin()));
create policy "admins delete ground image files" on storage.objects
for delete to authenticated using (bucket_id = 'ground-images' and (select public.is_admin()));
