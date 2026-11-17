-- 07_check_ins.sql
-- Sample Fall 2026 check-ins for the reviewer accounts so the points log and
-- semester leaderboard have data locally. Alice leads Bob.

insert into public.check_ins (event_id, user_id, method, checked_in_at)
select e.id, u.id, 'code', e.starts_at + interval '10 minutes'
from (
  values
    ('alice', '2deee3b6-2777-42c9-a125-35cf0e07b1ca'::uuid), -- FES Field Day
    ('alice', '0d43b217-cf3c-4f72-a383-2750dc2b1af1'::uuid), -- Midtown Munch & Mingle
    ('alice', '259ea87e-bf2f-4e71-a00f-9f15d2f49f1b'::uuid), -- GBM 1
    ('alice', '03698351-2165-4b60-a211-b9549ffea707'::uuid), -- ExxonMobil Info Session
    ('bob',   '259ea87e-bf2f-4e71-a00f-9f15d2f49f1b'::uuid), -- GBM 1
    ('bob',   '0223d6d6-0407-4b66-a236-5056091aaa2f'::uuid)  -- Resume/Career Fair Workshop
) as s(name, event_id)
join auth.users u on u.email = s.name || '@gmail.com'
join public.events e on e.id = s.event_id
on conflict (event_id, user_id) do nothing;
