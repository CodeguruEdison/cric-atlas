-- SAMPLE DATA ONLY. Ground names and municipalities come from the project brief.
-- Authorities, contacts, fees, rules, coordinates and availability are invented for the demo.
-- Every row has is_sample = true. Remove with: delete from ground_facilities where is_sample; etc.

insert into public.sources (id, source_name, source_type, source_url, evidence_notes, publication_status, is_sample)
values ('00000000-0000-4000-8000-000000000001', 'Sample demo dataset', 'sample', 'https://example.org/sample-source',
        'Invented for product demonstration. Not evidence of any real permit or availability.', 'published', true);

insert into public.permit_authorities (authority_name, authority_type, jurisdiction, phone, email, website, application_portal, application_instructions, publication_status, is_sample)
select 'Sample Authority: ' || m, 'Municipal (sample)', m, '908-555-01' || lpad(row_number() over ()::text, 2, '0'),
       'permits@example.org', 'https://example.org/authority', 'https://example.org/sample-permit',
       'Sample instructions only. Confirm the real process with the municipality.', 'published', true
from unnest(array['Franklin Township', 'Hillsborough Township', 'Montgomery Township', 'Bridgewater Township', 'Bernards Township']) as m;

insert into public.ground_facilities
  (ground_code, slug, ground_name, municipality, county, latitude, longitude, pitch_type, surface_type, amenities, publication_status, is_sample)
values
  ('FT-001', 'weston-cricket-field-one', 'Weston Cricket Field One', 'Franklin Township', 'Somerset', 40.5120, -74.5480, 'Sample: matting', 'Sample: grass', '["Parking"]', 'published', true),
  ('FT-002', 'weston-cricket-field-two', 'Weston Cricket Field Two', 'Franklin Township', 'Somerset', 40.5140, -74.5440, 'Sample: matting', 'Sample: grass', '["Parking"]', 'published', true),
  ('FT-003', 'consolata-cricket-field', 'Consolata Cricket Field', 'Franklin Township', 'Somerset', 40.4980, -74.5300, null, null, null, 'published', true),
  ('FT-004', 'naaman-williams-park-cricket-area', 'Naaman Williams Park Cricket Area', 'Franklin Township', 'Somerset', 40.4890, -74.5200, null, null, null, 'published', true),
  ('FT-005', 'colonial-park-cricket-ground', 'Colonial Park Cricket Ground', 'Franklin Township', 'Somerset', 40.5060, -74.5660, 'Sample: turf', 'Sample: grass', '["Parking", "Restrooms"]', 'published', true),
  ('FT-006', 'howe-athletic-complex-cricket-pitch', 'Howe Athletic Complex Cricket Pitch', 'Franklin Township', 'Somerset', 40.4800, -74.5400, null, null, null, 'published', true),
  ('FT-007', 'pine-grove-manor-school-cricket-ground', 'Pine Grove Manor School Cricket Ground', 'Franklin Township', 'Somerset', 40.4720, -74.5100, null, null, null, 'published', true),
  ('FT-008', 'mountain-view-park-cricket-field', 'Mountain View Park Cricket Field', 'Hillsborough Township', 'Somerset', 40.5000, -74.6600, null, null, null, 'published', true),
  ('FT-009', 'hillsborough-cricket-ground', 'Hillsborough Cricket Ground', 'Hillsborough Township', 'Somerset', 40.4850, -74.6300, null, null, null, 'published', true),
  ('FT-010', 'broadway-field', 'Broadway Field', 'Montgomery Township', 'Somerset', 40.4200, -74.6700, null, null, null, 'published', true),
  ('FT-011', 'montgomery-veterans-park-cricket-pitch', 'Montgomery Veterans Park Cricket Pitch', 'Montgomery Township', 'Somerset', 40.4050, -74.6500, null, null, null, 'published', true),
  ('FT-012', 'north-branch-park-cricket-pitches', 'North Branch Park Cricket Pitches', 'Bridgewater Township', 'Somerset', 40.5900, -74.6800, null, null, null, 'published', true),
  ('FT-013', 'pleasant-valley-park-cricket-pitch', 'Pleasant Valley Park Cricket Pitch', 'Bernards Township', 'Somerset', 40.6800, -74.5700, null, null, null, 'published', true);

-- Only some grounds get sample permits, so the UI can be exercised with missing data.
with new_permits as (
  insert into public.permits (ground_id, permit_authority_id, permit_required, permit_type, application_method, application_url,
                              advance_notice_days, booking_duration_hours, roster_required, insurance_required, is_sample)
  select g.id, a.id, true, 'Sample field-use permit', 'Online (sample)', 'https://example.org/sample-permit', 14, 4, true, true, true
  from public.ground_facilities g
  join public.permit_authorities a on a.jurisdiction = g.municipality
  where g.ground_code in ('FT-001', 'FT-002', 'FT-005', 'FT-008', 'FT-012')
  returning id
)
insert into public.source_links (source_id, permit_id)
select '00000000-0000-4000-8000-000000000001', id from new_permits;

update public.permits set publication_status = 'published', permit_status = 'active' where is_sample;

insert into public.permit_fees (permit_id, applicant_category, duration_hours, amount)
select p.id, c.category, 4, c.amount
from public.permits p
cross join (values ('Resident (sample)', 50.00), ('Non-resident (sample)', 100.00)) as c(category, amount)
where p.is_sample;

insert into public.availability (ground_id, start_datetime, end_datetime, availability_status, verification_method, source_id, last_checked_at, expires_at, publication_status, is_sample)
select g.id,
       ((current_date + d)::timestamp + time '09:00') at time zone 'America/New_York',
       ((current_date + d)::timestamp + time '13:00') at time zone 'America/New_York',
       (array['verified_available', 'limited', 'verified_unavailable'])[1 + d % 3]::public.availability_status,
       'Sample data', '00000000-0000-4000-8000-000000000001', now(), now() + interval '30 days', 'published', true
from public.ground_facilities g
cross join generate_series(1, 21) as d
where g.ground_code in ('FT-001', 'FT-005');
