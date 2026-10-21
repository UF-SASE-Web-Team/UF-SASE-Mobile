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
  json_build_object(
    'username', u.name,
    'full_name', initcap(u.name) || ' Gator'
  ),
  current_timestamp,
  current_timestamp,
  '', '', '', ''
from (
  values ('alice'), ('bob')
) as u(name)
on conflict (id) do nothing;

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
  id,
  id,
  format('{"sub":"%s","email":"%s"}', id::text, email)::jsonb,
  'email',
  id::text,
  current_timestamp,
  current_timestamp,
  current_timestamp
from auth.users
on conflict (id) do nothing;

insert into public.events (title, type, starts_at, ends_at, location_name, checkin_code, points_value) values
  ('General Body Meeting', 'gbm', now() + interval '1 day', now() + interval '1 day 2 hours', 'Little Hall', '123456', 1),
  ('Other SASE Event', 'other', now() + interval '3 day', now() + interval '3 days 2 hours', 'Reitz Union', '654321', 1);

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
    'https://yoazhfliefswktpszaob.supabase.co/storage/v1/object/public/public-assets/programs/interns.jpg',
    null, null, null
  ),
  (
    'Banquet', 'banquet', 'events_and_committees', 20,
    $$Join one of four committees at SASE's annual Winter or Spring banquets.$$,
    $$There are four committees to choose from: Programming, Logistics, Decorations, and Marketing! More details of each committee are listed within the application form.$$,
    'https://yoazhfliefswktpszaob.supabase.co/storage/v1/object/public/public-assets/programs/banquet.jpg',
    'https://docs.google.com/forms/d/e/1FAIpQLSf8OD4MnelC-gTpInHFe13yentfdKlLaDrSV5kGSRdY-gnoMA/viewform?usp=header',
    null,
    '2026-10-19 23:59:00 America/New_York'
  ),
  (
    'SASEHacks', 'sasehacks', 'events_and_committees', 30,
    $$Join the organizing team for SASE's annual hackathon.$$,
    $$SASEHacks is a 24-hour hackathon where students from any university can learn new skills, network, attend workshops, build innovative projects, and compete for exciting category prizes.$$,
    'https://yoazhfliefswktpszaob.supabase.co/storage/v1/object/public/public-assets/programs/sasehacks.jpg',
    null, null, null
  ),
  (
    'SASE Projects', 'projects', 'technical_and_research', 10,
    $$Pitch or join a technical or research project and build hands-on skills in a small team.$$,
    $$SASE Projects brings together small, multidisciplinary groups of 5–6 students to design and execute approachable technical and research initiatives. Members of all majors and skill levels "learn by doing," building hands-on technical and project management experience to highlight on their resumes.$$,
    'https://yoazhfliefswktpszaob.supabase.co/storage/v1/object/public/public-assets/programs/projects.jpg',
    null, null, null
  ),
  (
    'Gator Rover', 'gator-rover', 'technical_and_research', 20,
    $$Build a robot for NASA’s Lunabotics competition$$,
    $$The SASE Engineering Team works together on a year-long project to explore technical creativity and problem-solving. Members gain hands-on experience, sharpen engineering and collaboration skills, and build impactful projects while growing in a supportive team environment.$$,
    'https://yoazhfliefswktpszaob.supabase.co/storage/v1/object/public/public-assets/programs/gator-rover.jpg',
    null, null, null
  ),
  (
    'SWEET', 'sweet', 'technical_and_research', 30,
    $$SASE's software engineering experience teams$$,
    $$Beginner Team: For everyone interested in learning how to build software and gain foundational skills!
Mobile Team: For those that want to create the Live UF SASE mobile app!
Externship Team: For those who want to get mentorship and connect with a startup/company while building projects!$$,
    'https://yoazhfliefswktpszaob.supabase.co/storage/v1/object/public/public-assets/programs/sweet.jpg',
    null, null, null
  ),
  (
    'SASE PCR', 'sase-pcr', 'technical_and_research', 40,
    $$SASE's program for collaborative research.$$,
    $$SASE PCR is a semester-long research development program designed to provide new undergraduate students to research with an accessible, structured pathway into the research process.

Accepted participants will be organized into small Research Cohorts according to their broader areas of interest. Within these cohorts, each participant will develop and pursue an individual research project with guidance from program facilitators.$$,
    'https://yoazhfliefswktpszaob.supabase.co/storage/v1/object/public/public-assets/programs/pcr.jpg',
    null, null, null
  ),
  (
    'Mentor Mentee', 'mentor-mentee', 'community', 10,
    $$Get paired with a mentor, complete challenges together, and earn points.$$,
    $$SASE's Mentor-Mentee Program allows underclassmen to build a close-knit community within SASE through their mentor and mentee groups. By participating in M&M challenges, socials, and professional development, mentorship provides underclassmen the chance to find their footing in SASE and college life.$$,
    'https://yoazhfliefswktpszaob.supabase.co/storage/v1/object/public/public-assets/programs/mentor-mentee.jpg',
    null, null, null
  ),
  (
    'Community Outreach', 'community-outreach', 'community', 20,
    $$Volunteer with SASE at local schools and community organizations.$$,
    $$Join our student-led science volunteering group and help bring hands-on STEM experiences to young students at local schools!

As a volunteer, you will work with other students to design and prepare fun science demonstrations and share them with kids in a fun way! Our goal is to make science feel creative, approachable, and fun!$$,
    'https://yoazhfliefswktpszaob.supabase.co/storage/v1/object/public/public-assets/programs/community-outreach.jpg',
    'https://forms.gle/DuGVNQ3X1RcEb6F18',
    null, null
  ),
  (
    'Sports', 'sports', 'community', 30,
    $$Play UF intramurals and casual pick-up games with SASE.$$,
    $$SASE Intramurals offer sports like Volleyball, Soccer, Basketball, Ultimate Frisbee, and Pickleball year-round. It’s a fun way to meet new people, stay active, and enjoy friendly competition—no experience needed!$$,
    'https://yoazhfliefswktpszaob.supabase.co/storage/v1/object/public/public-assets/programs/sports.jpg',
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

insert into public.resources (name, category, url, display_order, image_url)
values
  (
    'Linktree', 'general',
    'https://linktr.ee/ufsase',
    10,
    'https://yoazhfliefswktpszaob.supabase.co/storage/v1/object/public/public-assets/resources/linktree.png'
  ),
  (
    'Discord', 'general',
    'http://discord.gg/q3HBeC5',
    20,
    null
  ),
  (
    '26-27 Google Calendar', 'general',
    'https://calendar.google.com/calendar/u/3?cid=ZTI0YTQ0ZWUyMDBlZjc3OTc2NjY5ZWQzNGIxNTM2NDk4NTIzNTcwNjZhMjEzN2M5YTlmYjZlMDg4OGZhZDAwY0Bncm91cC5jYWxlbmRhci5nb29nbGUuY29t',
    30,
    'https://yoazhfliefswktpszaob.supabase.co/storage/v1/object/public/public-assets/resources/gcal.png'
  ),
  (
    'Photo Albums', 'general',
    'https://docs.google.com/spreadsheets/d/1LNNINwA_oXcNuKiVTpikccGX-QcF5Gnp_KB00j1lG1Y/edit?usp=sharing',
    40,
    null
  ),
  (
    'Freshman FAQs', 'sase',
    'https://ufsase.com/freshman-faq',
    10,
    'https://yoazhfliefswktpszaob.supabase.co/storage/v1/object/public/public-assets/resources/freshman-faq.png'
  ),
  (
    'Marston Study Room Booking', 'sase',
    'https://docs.google.com/spreadsheets/d/1ERqFWhNp5rtnSTy3aD8WhlVVRAJlHl7X-MUFAAVtxhA/edit?gid=892345678#gid=892345678',
    20,
    'https://yoazhfliefswktpszaob.supabase.co/storage/v1/object/public/public-assets/resources/marston-booking.png'
  ),
  (
    'Board Office Hours', 'sase',
    'https://docs.google.com/spreadsheets/d/1QlZsZNBDsmBO8gRVXnzLHra_at9kqfQmmSVV4i827lU/edit?usp=sharing',
    30,
    'https://yoazhfliefswktpszaob.supabase.co/storage/v1/object/public/public-assets/resources/board-office-hours.png'
  ),
  (
    'F26 Class Connector Form', 'sase',
    'https://docs.google.com/forms/d/e/1FAIpQLSfmL0xHfKMK-7x-ACH3ea98V0F1JS7lyK8s3v62eygY4105uQ/viewform',
    40,
    'https://yoazhfliefswktpszaob.supabase.co/storage/v1/object/public/public-assets/resources/class-connector-form.png'
  ),
  (
    'F26 Class Connector Sheet', 'sase',
    'https://docs.google.com/spreadsheets/d/1pGzTTaZK6Xc1MoQFwOWRms8l5K2zeIn2_K_K_KZ5XrE/edit?usp=sharing',
    50,
    'https://yoazhfliefswktpszaob.supabase.co/storage/v1/object/public/public-assets/resources/class-connector-sheet.png'
  ),
  (
    'Research Resources', 'academic',
    'https://docs.google.com/spreadsheets/d/1QlZsZNBDsmBO8gRVXnzLHra_at9kqfQmmSVV4i827lU/edit?usp=sharing',
    10,
    'https://yoazhfliefswktpszaob.supabase.co/storage/v1/object/public/public-assets/resources/research.png'
  ),
  (
    'Pre-med Resources', 'academic',
    'https://drive.google.com/drive/folders/1nFlB8M0RVqi5e0s7QtOsnJ4gSEWwaJvA',
    20,
    'https://yoazhfliefswktpszaob.supabase.co/storage/v1/object/public/public-assets/resources/premed.png'
  ),
  (
    'Design Team List', 'academic',
    'https://docs.google.com/document/d/1gcITx3IKn6HnJ1bcA4TVTlh27wP6jSFf/edit#heading=h.o9rwupa35f1a',
    30,
    'https://yoazhfliefswktpszaob.supabase.co/storage/v1/object/public/public-assets/resources/design-teams.png'
  ),
  (
    'Resume Template', 'professional',
    'https://drive.google.com/drive/folders/1EcDL-qyRxkPOfUxYuQGBNKkDVh7ylray',
    10,
    'https://yoazhfliefswktpszaob.supabase.co/storage/v1/object/public/public-assets/resources/resume-template.png'
  ),
  (
    'Internship Guide', 'professional',
    'https://drive.google.com/drive/folders/1ODgUWyr_5Zl3oLwiXUSgbKVggyx8Qxjq',
    20,
    'https://yoazhfliefswktpszaob.supabase.co/storage/v1/object/public/public-assets/resources/internship.png'
  ),
  (
    'Interview Prep', 'professional',
    'https://drive.google.com/drive/folders/1Ziv21RfRcjXxGj84_feg1Y3JUVRCdjnX',
    30,
    'https://yoazhfliefswktpszaob.supabase.co/storage/v1/object/public/public-assets/resources/interview.png'
  ),
  (
    'Networking Resources', 'professional',
    'https://drive.google.com/drive/folders/14FTXWDmX-X-FlNe5mEfM0C5D-xf9oN2d',
    40,
    'https://yoazhfliefswktpszaob.supabase.co/storage/v1/object/public/public-assets/resources/networking.png'
  ),
  (
    'Experiences Tracker', 'professional',
    'https://docs.google.com/document/d/1rxYm5SCaX--ANEcCqRQFCgHLKbwZPqwU/edit',
    50,
    'https://yoazhfliefswktpszaob.supabase.co/storage/v1/object/public/public-assets/resources/experiences-tracker.png'
  )
on conflict (name) do update set
  category      = excluded.category,
  url           = excluded.url,
  display_order = excluded.display_order,
  image_url     = coalesce(excluded.image_url, resources.image_url);

