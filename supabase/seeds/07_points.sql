-- 07_points.sql
-- Ensure point_rules baseline is seeded

insert into public.point_rules (id, category, name, description, points, is_active)
values
  ('account_created', 'digital_engagement', 'Create SASE Account', 'Awarded for creating a UF SASE account', 1, true),
  ('event_attendance', 'attendance', 'Event Attendance', 'Awarded for attending a SASE event', 1, true),
  ('gbm_attendance', 'attendance', 'GBM Attendance', 'Awarded for attending a General Body Meeting', 1, true)
on conflict (id) do update set
  category = excluded.category,
  name = excluded.name,
  description = excluded.description,
  points = excluded.points,
  is_active = excluded.is_active;

-- Seed sample point transactions for reviewer accounts
insert into public.point_transactions (
  user_id,
  amount,
  category,
  rule_id,
  title,
  description,
  academic_term,
  reference_type,
  reference_id
)
select
  p.id,
  t.amount,
  t.category::public.point_category,
  t.rule_id,
  t.title,
  t.description,
  t.academic_term,
  'seed',
  t.rule_id || '_' || p.id
from public.profiles p
cross join (
  values
    (1, 'attendance', 'gbm_attendance', 'SASE GBM 1: Avatar the Last SASEBender', 'Attended GBM 1', 'fall-2026')
) as t(amount, category, rule_id, title, description, academic_term)
where p.full_name in ('Alice Gator', 'Bob Gator')
on conflict (user_id, reference_type, reference_id) do nothing;
