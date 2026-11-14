-- 03_programs.sql
-- Baseline UF SASE programs, sub-programs, and points of contact

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
    'https://lbauzxflhubvbnrkbprp.supabase.co/storage/v1/object/public/public-assets/programs/interns.webp',
    null, null, null
  ),
  (
    'Banquet', 'banquet', 'events_and_committees', 20,
    $$Join one of four committees at SASE's annual Winter or Spring banquets.$$,
    $$There are four committees to choose from: Programming, Logistics, Decorations, and Marketing! More details of each committee are listed within the application form.$$,
    'https://lbauzxflhubvbnrkbprp.supabase.co/storage/v1/object/public/public-assets/programs/banquet.webp',
    'https://docs.google.com/forms/d/e/1FAIpQLSf8OD4MnelC-gTpInHFe13yentfdKlLaDrSV5kGSRdY-gnoMA/viewform?usp=header',
    null,
    '2026-10-19 23:59:00 America/New_York'
  ),
  (
    'SASEHacks', 'sasehacks', 'events_and_committees', 30,
    $$Join the organizing team for SASE's annual hackathon.$$,
    $$SASEHacks is a 24-hour hackathon where students from any university can learn new skills, network, attend workshops, build innovative projects, and compete for exciting category prizes.$$,
    'https://lbauzxflhubvbnrkbprp.supabase.co/storage/v1/object/public/public-assets/programs/sasehacks.webp',
    null, null, null
  ),
  (
    'SASE Projects', 'projects', 'technical_and_research', 10,
    $$Pitch or join a technical or research project and build hands-on skills in a small team.$$,
    $$SASE Projects brings together small, multidisciplinary groups of 5–6 students to design and execute approachable technical and research initiatives. Members of all majors and skill levels "learn by doing," building hands-on technical and project management experience to highlight on their resumes.$$,
    'https://lbauzxflhubvbnrkbprp.supabase.co/storage/v1/object/public/public-assets/programs/projects.webp',
    null, null, null
  ),
  (
    'Gator Rover', 'gator-rover', 'technical_and_research', 20,
    $$Build a robot for NASA’s Lunabotics competition$$,
    $$The SASE Engineering Team works together on a year-long project to explore technical creativity and problem-solving. Members gain hands-on experience, sharpen engineering and collaboration skills, and build impactful projects while growing in a supportive team environment.$$,
    'https://lbauzxflhubvbnrkbprp.supabase.co/storage/v1/object/public/public-assets/programs/gator-rover.webp',
    null, null, null
  ),
  (
    'SWEET', 'sweet', 'technical_and_research', 30,
    $$SASE's software engineering experience teams$$,
    $$Beginner Team: For everyone interested in learning how to build software and gain foundational skills!
Mobile Team: For those that want to create the Live UF SASE mobile app!
Externship Team: For those who want to get mentorship and connect with a startup/company while building projects!$$,
    'https://lbauzxflhubvbnrkbprp.supabase.co/storage/v1/object/public/public-assets/programs/sweet.webp',
    null, null, null
  ),
  (
    'SASE PCR', 'sase-pcr', 'technical_and_research', 40,
    $$SASE's program for collaborative research.$$,
    $$SASE PCR is a semester-long research development program designed to provide new undergraduate students to research with an accessible, structured pathway into the research process.

Accepted participants will be organized into small Research Cohorts according to their broader areas of interest. Within these cohorts, each participant will develop and pursue an individual research project with guidance from program facilitators.$$,
    'https://lbauzxflhubvbnrkbprp.supabase.co/storage/v1/object/public/public-assets/programs/pcr.webp',
    null, null, null
  ),
  (
    'Mentor Mentee', 'mentor-mentee', 'community', 10,
    $$Get paired with a mentor, complete challenges together, and earn points.$$,
    $$SASE's Mentor-Mentee Program allows underclassmen to build a close-knit community within SASE through their mentor and mentee groups. By participating in M&M challenges, socials, and professional development, mentorship provides underclassmen the chance to find their footing in SASE and college life.$$,
    'https://lbauzxflhubvbnrkbprp.supabase.co/storage/v1/object/public/public-assets/programs/mentor-mentee.webp',
    null, null, null
  ),
  (
    'Community Outreach', 'community-outreach', 'community', 20,
    $$Volunteer with SASE at local schools and community organizations.$$,
    $$Join our student-led science volunteering group and help bring hands-on STEM experiences to young students at local schools!

As a volunteer, you will work with other students to design and prepare fun science demonstrations and share them with kids in a fun way! Our goal is to make science feel creative, approachable, and fun!$$,
    'https://lbauzxflhubvbnrkbprp.supabase.co/storage/v1/object/public/public-assets/programs/community-outreach.webp',
    'https://discord.gg/G6bYG6gkd2',
    null, null
  ),
  (
    'Sports', 'sports', 'community', 30,
    $$Play UF intramurals and casual pick-up games with SASE.$$,
    $$SASE Intramurals offer sports like Volleyball, Soccer, Basketball, Ultimate Frisbee, and Pickleball year-round. It’s a fun way to meet new people, stay active, and enjoy friendly competition—no experience needed!$$,
    'https://lbauzxflhubvbnrkbprp.supabase.co/storage/v1/object/public/public-assets/programs/sports.webp',
    null, null, null
  ),
  (
    'SASE Board', 'board', null, 0,
    null, null, null,
    null, null, null
  )
on conflict (slug) do update set
  image_url = excluded.image_url;

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
on conflict (slug) do nothing;

-- Points of contact for SASE Interns (links to profiles if seeded)
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
on conflict (program_id, user_id, academic_term) do nothing;
