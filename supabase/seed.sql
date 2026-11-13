create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
select
  '00000000-0000-0000-0000-000000000000',
  uuid_generate_v4(),
  'authenticated',
  'authenticated',
  u.name || '@gmail.com',
  crypt('password123', gen_salt('bf')),
  current_timestamp,
  current_timestamp,
  current_timestamp,
  '{"provider":"email","providers":["email"]}',
  u.meta,
  current_timestamp,
  current_timestamp,
  '', '', '', ''
from (
  values
    (
      'alice',
      json_build_object(
        'username', 'alice',
        'full_name', 'Alice Gator',
        'majors', json_build_array('Computer Science', 'Mathematics'),
        'minors', json_build_array('Digital Arts and Sciences'),
        'grad_time', '2029',
        'discord_handle', 'alice.gator',
        'instagram_handle', 'alice.gator',
        'linkedin_url', 'https://www.linkedin.com/in/alice-gator',
        'bio', 'Hi! I am a Computer Science major at UF. I love building things and meeting new people through SASE.',
        'avatar_url', 'sase-shark'
      )
    ),
    (
      'bob',
      json_build_object(
        'username', 'bob',
        'full_name', 'Bob Gator',
        'majors', json_build_array('Mechanical Engineering'),
        'grad_time', '2028',
        'avatar_url', 'sase-cat'
      )
    )
) as u(name, meta)
where not exists (
  select 1 from auth.users where email = u.name || '@gmail.com'
);

insert into auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
select
  uuid_generate_v4(),
  id,
  format('{"sub":"%s","email":"%s"}', id::text, email)::jsonb,
  'email',
  id::text,
  current_timestamp,
  current_timestamp,
  current_timestamp
from auth.users
where email in ('alice@gmail.com', 'bob@gmail.com')
on conflict (provider_id, provider) do nothing;

update public.profiles
set full_name = 'Alice Gator',
    majors = array['Computer Science', 'Mathematics'],
    minors = array['Digital Arts and Sciences'],
    grad_time = '2029',
    discord_handle = 'alice.gator',
    instagram_handle = 'alice.gator',
    linkedin_url = 'https://www.linkedin.com/in/alice-gator',
    bio = 'Hi! I am a Computer Science major at UF. I love building things and meeting new people through SASE.',
    avatar_url = 'sase-shark'
where username = 'alice';

update public.profiles
set majors = array['Mechanical Engineering'],
    grad_time = '2028',
    instagram_handle = null,
    linkedin_url = null,
    bio = null,
    avatar_url = 'sase-cat'
where username = 'bob';

-- Alice has finished onboarding. Bob has no UFID yet, so signing in as Bob
-- shows the onboarding flow.
insert into public.profile_private (user_id, ufid)
select id, '12345678' from public.profiles where username = 'alice'
on conflict (user_id) do nothing;

insert into public.events (title, type, starts_at, ends_at, location_name, checkin_code, points_value)
select 'Test Event', 'other', now() - interval '30 minutes', now() + interval '2 hours', 'LIT 223', '111111', 1
where not exists (
  select 1 from public.events where title = 'Test Event'
);

insert into public.event_links (event_id, title, url, display_order)
select id, 'Carpool form', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 0
from public.events
where title = 'Test Event'
  and not exists (
    select 1 from public.event_links el where el.event_id = events.id and el.title = 'Carpool form'
  );

insert into public.programs (
  name, slug, category, display_order,
  short_description, description, image_url,
  application_url, opens_at, closes_at
)
values
  (
    'Interns', 'interns', 'events_and_committees', 10,
    $$Plan SASE events, shadow the board, and build leadership skills$$,
    $$SASE Interns collaborate directly with board members in committees to plan events for the SASE community. Interns gain a behind-the-scenes look at how SASE operates and, in the process, are given the opportunity to develop their professional and leadership skills$$,
    'programs/interns.jpg',
    null, null, null
  ),
  (
    'Banquet', 'banquet', 'events_and_committees', 20,
    $$Join one of four committees at SASE's annual Winter or Spring banquets.$$,
    $$There are four committees to choose from: Programming, Logistics, Decorations, and Marketing! More details of each committee are listed within the application form.$$,
    'programs/banquet.jpg',
    'https://docs.google.com/forms/d/e/1FAIpQLSf8OD4MnelC-gTpInHFe13yentfdKlLaDrSV5kGSRdY-gnoMA/viewform?usp=header',
    null,
    '2026-10-19 23:59:00 America/New_York'
  ),
  (
    'SASEHacks', 'sasehacks', 'events_and_committees', 30,
    $$Join the organizing team for SASE's annual hackathon.$$,
    $$SASEHacks is a 24-hour hackathon where students from any university can learn new skills, network, attend workshops, build innovative projects, and compete for exciting category prizes.$$,
    'programs/sasehacks.jpg',
    null, null, null
  ),
  (
    'SASE Projects', 'projects', 'technical_and_research', 10,
    $$Pitch or join a technical or research project and build hands-on skills in a small team.$$,
    $$SASE Projects brings together small, multidisciplinary groups of 5–6 students to design and execute approachable technical and research initiatives. Members of all majors and skill levels "learn by doing," building hands-on technical and project management experience to highlight on their resumes.$$,
    'programs/projects.jpg',
    null, null, null
  ),
  (
    'Gator Rover', 'gator-rover', 'technical_and_research', 20,
    $$Build a robot for NASA’s Lunabotics competition$$,
    $$The SASE Engineering Team works together on a year-long project to explore technical creativity and problem-solving. Members gain hands-on experience, sharpen engineering and collaboration skills, and build impactful projects while growing in a supportive team environment.$$,
    'programs/gator-rover.jpg',
    null, null, null
  ),
  (
    'SWEET', 'sweet', 'technical_and_research', 30,
    $$SASE's software engineering experience teams$$,
    $$Beginner Team: For everyone interested in learning how to build software and gain foundational skills!
Mobile Team: For those that want to create the Live UF SASE mobile app!
Externship Team: For those who want to get mentorship and connect with a startup/company while building projects!$$,
    'programs/sweet.jpg',
    null, null, null
  ),
  (
    'SASE PCR', 'sase-pcr', 'technical_and_research', 40,
    $$SASE's program for collaborative research.$$,
    $$SASE PCR is a semester-long research development program designed to provide new undergraduate students to research with an accessible, structured pathway into the research process.

Accepted participants will be organized into small Research Cohorts according to their broader areas of interest. Within these cohorts, each participant will develop and pursue an individual research project with guidance from program facilitators.$$,
    'programs/pcr.jpg',
    null, null, null
  ),
  (
    'Mentor Mentee', 'mentor-mentee', 'community', 10,
    $$Get paired with a mentor, complete challenges together, and earn points.$$,
    $$SASE's Mentor-Mentee Program allows underclassmen to build a close-knit community within SASE through their mentor and mentee groups. By participating in M&M challenges, socials, and professional development, mentorship provides underclassmen the chance to find their footing in SASE and college life.$$,
    'programs/mentor-mentee.jpg',
    null, null, null
  ),
  (
    'Community Outreach', 'community-outreach', 'community', 20,
    $$Volunteer with SASE at local schools and community organizations.$$,
    $$Join our student-led science volunteering group and help bring hands-on STEM experiences to young students at local schools!

As a volunteer, you will work with other students to design and prepare fun science demonstrations and share them with kids in a fun way! Our goal is to make science feel creative, approachable, and fun!$$,
    'programs/community-outreach.jpg',
    'https://discord.gg/G6bYG6gkd2',
    null, null
  ),
  (
    'Sports', 'sports', 'community', 30,
    $$Play UF intramurals and casual pick-up games with SASE.$$,
    $$SASE Intramurals offer sports like Volleyball, Soccer, Basketball, Ultimate Frisbee, and Pickleball year-round. It’s a fun way to meet new people, stay active, and enjoy friendly competition—no experience needed!$$,
    'programs/sports.jpg',
    null, null, null
  ),
  (
    'SASE Board', 'board', null, 0,
    null, null, null,
    null, null, null
  )
on conflict (slug) do update set
  name              = excluded.name,
  category          = excluded.category,
  display_order     = excluded.display_order,
  short_description = excluded.short_description,
  description       = excluded.description,
  image_url         = excluded.image_url;

-- Sub-programs for SWEET
insert into public.programs (
  parent_id, name, slug, category, display_order,
  short_description, description
)
select
  p.id,
  sub.name,
  sub.slug,
  null,
  sub.display_order,
  sub.short_description,
  sub.description
from public.programs p
cross join (
  values
    (
      'SWEET Beginner Team',
      'sweet-beginner-team',
      10,
      $$Introductory team for software development.$$,
      $$For everyone interested in learning how to build software and gain foundational skills!$$
    ),
    (
      'SASE Mobile Team',
      'sase-mobile-team',
      20,
      $$UF SASE official mobile app team.$$,
      $$For those that want to create the Live UF SASE mobile app!$$
    )
) as sub(name, slug, display_order, short_description, description)
where p.slug = 'sweet'
on conflict (slug) do update set
  parent_id         = excluded.parent_id,
  name              = excluded.name,
  category          = excluded.category,
  display_order     = excluded.display_order,
  short_description = excluded.short_description,
  description       = excluded.description;

-- Points of contact for SASE Interns
insert into public.program_members (
  program_id, user_id, display_name, academic_term, is_poc
)
select
  prog.id,
  prof.id,
  prof.full_name,
  term.id,
  true
from public.programs prog
cross join public.profiles prof
cross join (
  select id from public.academic_terms where is_current = true limit 1
) term
where prog.slug = 'interns'
  and prof.username in ('alice', 'bob')
on conflict (program_id, user_id, academic_term) do update set
  is_poc = excluded.is_poc,
  display_name = excluded.display_name;

-- image_url values are paths inside the `public-assets` storage bucket; the app
-- resolves them against the Supabase project it is configured for.
insert into public.resources (name, category, url, is_top, image_url)
values
  (
    'Linktree', 'general',
    'https://linktr.ee/ufsase',
    true,
    'resources/linktree.png'
  ),
  (
    'Discord', 'general',
    'http://discord.gg/q3HBeC5',
    false,
    null
  ),
  (
    'SASE''s Gcal', 'general',
    'https://calendar.google.com/calendar/u/3?cid=ZTI0YTQ0ZWUyMDBlZjc3OTc2NjY5ZWQzNGIxNTM2NDk4NTIzNTcwNjZhMjEzN2M5YTlmYjZlMDg4OGZhZDAwY0Bncm91cC5jYWxlbmRhci5nb29nbGUuY29t',
    true,
    'resources/gcal.png'
  ),
  (
    'Photo Albums', 'general',
    'https://docs.google.com/spreadsheets/d/1LNNINwA_oXcNuKiVTpikccGX-QcF5Gnp_KB00j1lG1Y/edit?usp=sharing',
    false,
    null
  ),
  (
    'Freshmen FAQs', 'sase',
    'ufsasemobile://resources/freshman-faqs',
    true,
    'resources/freshman-faq.png'
  ),
  (
    'Pi Room Booking', 'sase',
    'https://docs.google.com/spreadsheets/d/1ERqFWhNp5rtnSTy3aD8WhlVVRAJlHl7X-MUFAAVtxhA/edit?gid=892345678#gid=892345678',
    false,
    'resources/marston-booking.png'
  ),
  (
    'Board OH', 'sase',
    'https://docs.google.com/spreadsheets/d/1QlZsZNBDsmBO8gRVXnzLHra_at9kqfQmmSVV4i827lU/edit?usp=sharing',
    false,
    'resources/board-office-hours.png'
  ),
  (
    'Class Connector Form', 'sase',
    'https://docs.google.com/forms/d/e/1FAIpQLSfmL0xHfKMK-7x-ACH3ea98V0F1JS7lyK8s3v62eygY4105uQ/viewform',
    false,
    'resources/class-connector-form.png'
  ),
  (
    'Class Connector Finder', 'sase',
    'https://docs.google.com/spreadsheets/d/1pGzTTaZK6Xc1MoQFwOWRms8l5K2zeIn2_K_K_KZ5XrE/edit?usp=sharing',
    false,
    'resources/class-connector-sheet.png'
  ),
  (
    'Research Resources', 'academic',
    'https://docs.google.com/spreadsheets/d/1QlZsZNBDsmBO8gRVXnzLHra_at9kqfQmmSVV4i827lU/edit?usp=sharing',
    false,
    'resources/research.png'
  ),
  (
    'Pre-Med Resources', 'academic',
    'https://drive.google.com/drive/folders/1nFlB8M0RVqi5e0s7QtOsnJ4gSEWwaJvA',
    false,
    'resources/premed.png'
  ),
  (
    'Design Team List', 'academic',
    'https://docs.google.com/document/d/1gcITx3IKn6HnJ1bcA4TVTlh27wP6jSFf/edit#heading=h.o9rwupa35f1a',
    false,
    'resources/design-teams.png'
  ),
  (
    'SASE Resume Template', 'professional',
    'https://drive.google.com/drive/folders/1EcDL-qyRxkPOfUxYuQGBNKkDVh7ylray',
    true,
    'resources/resume-template.png'
  ),
  (
    'Internship Resources', 'professional',
    'https://drive.google.com/drive/folders/1ODgUWyr_5Zl3oLwiXUSgbKVggyx8Qxjq',
    false,
    'resources/internship.png'
  ),
  (
    'Interview Resources', 'professional',
    'https://drive.google.com/drive/folders/1Ziv21RfRcjXxGj84_feg1Y3JUVRCdjnX',
    false,
    'resources/interview.png'
  ),
  (
    'Networking Resources', 'professional',
    'https://drive.google.com/drive/folders/14FTXWDmX-X-FlNe5mEfM0C5D-xf9oN2d',
    false,
    'resources/networking.png'
  ),
  (
    'Experience Tracker', 'professional',
    'https://docs.google.com/document/d/1rxYm5SCaX--ANEcCqRQFCgHLKbwZPqwU/edit',
    false,
    'resources/experiences-tracker.png'
  )
on conflict (name) do update set
  category      = excluded.category,
  url           = excluded.url,
  is_top        = excluded.is_top,
  image_url     = coalesce(excluded.image_url, resources.image_url);

insert into public.events (title, type, starts_at, ends_at, location_name, checkin_code, points_value, flyer_url)
select 'General Body Meeting', 'gbm', now() + interval '1 day', now() + interval '1 day 2 hours', 'Little Hall', '123456', 1, 'https://flyer.com'
where not exists (
  select 1 from public.events where title = 'General Body Meeting'
);

-- The GBM takes RSVPs: give it an RSVP link and point events.rsvp at it.
insert into public.event_links (event_id, title, url, display_order)
select id, 'RSVP form', 'https://forms.gle/example', 0
from public.events
where title = 'General Body Meeting'
  and not exists (
    select 1 from public.event_links el where el.event_id = events.id and el.title = 'RSVP form'
  );

update public.events e
set rsvp = el.id
from public.event_links el
where el.event_id = e.id
  and el.title = 'RSVP form'
  and e.title = 'General Body Meeting'
  and e.rsvp is null;

-- One event for each of the newer categories so the type filter has matches.
insert into public.events (title, type, starts_at, ends_at, location_name, points_value)
select v.title, v.type::public.event_type, now() + v.starts_in, now() + v.starts_in + interval '2 hours', v.location_name, 1
from (values
  ('Beach Cleanup', 'service', interval '3 days', 'Crescent Beach'),
  ('Intramural Volleyball', 'sports', interval '5 days', 'Southwest Recreation Center')
) as v(title, type, starts_in, location_name)
where not exists (
  select 1 from public.events e where e.title = v.title
);

-- A sample open report so the officer review queue is not empty locally.
-- No profile_blocks are seeded: a block would hide a seeded profile in the app.
insert into public.profile_reports (reporter_id, reported_id, reason, details)
select reporter.id, reported.id, 'spam', 'Bio is only promotional links.'
from public.profiles reporter, public.profiles reported
where reporter.username = 'bob' and reported.username = 'alice';

insert into public.app_settings (key, value)
values ('checkin_qr_url', 'https://forms.gle/CBEEdo8zP8hjqHdc6')
on conflict (key) do update set value = excluded.value;

