-- SAMPLE PHOTOS ONLY. These do not show the named grounds.
insert into public.ground_images (ground_id, storage_path, alt_text, credit, is_primary, publication_status, is_sample)
select g.id,
       'sample/' || lower(g.ground_code) || '-field-' || (((g.rn - 1) % 8) + 1) || '.webp',
       'Sample photo of a cricket field, not this ground',
       'Project design reference',
       true, 'published', true
from (select id, ground_code, row_number() over (order by ground_code) as rn from public.ground_facilities where is_sample) g
on conflict (storage_path) do nothing;
