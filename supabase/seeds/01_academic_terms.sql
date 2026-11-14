-- 01_academic_terms.sql
-- Baseline academic terms and active semester designation

insert into public.academic_terms (id, name, start_date, is_current)
values
  ('fall-2026',   'Fall 2026',   '2026-08-18', true),
  ('spring-2027', 'Spring 2027', '2027-01-07', false),
  ('summer-2027', 'Summer 2027', '2027-05-06', false)
on conflict (id) do update set
  name       = excluded.name,
  start_date = excluded.start_date;

-- Ensure exactly one current term is set, avoiding partial unique index conflicts
update public.academic_terms
set is_current = (id = 'fall-2026')
where is_current is distinct from (id = 'fall-2026');
