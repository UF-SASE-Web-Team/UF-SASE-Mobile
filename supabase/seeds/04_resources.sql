-- 04_resources.sql
-- Baseline UF SASE resources, external tools, and guides
-- image_url values are absolute URLs hosted on the production CDN.

insert into public.resources (name, category, url, is_top, image_url)
values
  (
    'Linktree', 'general',
    'https://linktr.ee/ufsase',
    true,
    'https://lbauzxflhubvbnrkbprp.supabase.co/storage/v1/object/public/public-assets/resources/linktree.webp'
  ),
  (
    'Discord', 'general',
    'http://discord.gg/q3HBeC5',
    false,
    null
  ),
  (
    '26-27 Google Calendar', 'general',
    'https://calendar.google.com/calendar/u/3?cid=ZTI0YTQ0ZWUyMDBlZjc3OTc2NjY5ZWQzNGIxNTM2NDk4NTIzNTcwNjZhMjEzN2M5YTlmYjZlMDg4OGZhZDAwY0Bncm91cC5jYWxlbmRhci5nb29nbGUuY29t',
    true,
    'https://lbauzxflhubvbnrkbprp.supabase.co/storage/v1/object/public/public-assets/resources/gcal.webp'
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
    'https://lbauzxflhubvbnrkbprp.supabase.co/storage/v1/object/public/public-assets/resources/freshman-faq.webp'
  ),
  (
    'Marston Study Room Booking', 'sase',
    'https://docs.google.com/spreadsheets/d/1ERqFWhNp5rtnSTy3aD8WhlVVRAJlHl7X-MUFAAVtxhA/edit?gid=892345678#gid=892345678',
    false,
    'https://lbauzxflhubvbnrkbprp.supabase.co/storage/v1/object/public/public-assets/resources/marston-booking.webp'
  ),
  (
    'Board Office Hours', 'sase',
    'https://docs.google.com/spreadsheets/d/1QlZsZNBDsmBO8gRVXnzLHra_at9kqfQmmSVV4i827lU/edit?usp=sharing',
    false,
    'https://lbauzxflhubvbnrkbprp.supabase.co/storage/v1/object/public/public-assets/resources/board-office-hours.webp'
  ),
  (
    'F26 Class Connector Form', 'sase',
    'https://docs.google.com/forms/d/e/1FAIpQLSfmL0xHfKMK-7x-ACH3ea98V0F1JS7lyK8s3v62eygY4105uQ/viewform',
    false,
    'https://lbauzxflhubvbnrkbprp.supabase.co/storage/v1/object/public/public-assets/resources/class-connector-form.webp'
  ),
  (
    'F26 Class Connector Sheet', 'sase',
    'https://docs.google.com/spreadsheets/d/1pGzTTaZK6Xc1MoQFwOWRms8l5K2zeIn2_K_K_KZ5XrE/edit?usp=sharing',
    false,
    'https://lbauzxflhubvbnrkbprp.supabase.co/storage/v1/object/public/public-assets/resources/class-connector-sheet.webp'
  ),
  (
    'Research Resources', 'academic',
    'https://docs.google.com/spreadsheets/d/1QlZsZNBDsmBO8gRVXnzLHra_at9kqfQmmSVV4i827lU/edit?usp=sharing',
    false,
    'https://lbauzxflhubvbnrkbprp.supabase.co/storage/v1/object/public/public-assets/resources/research.webp'
  ),
  (
    'Pre-health resources', 'academic',
    'https://drive.google.com/drive/folders/1nFlB8M0RVqi5e0s7QtOsnJ4gSEWwaJvA',
    false,
    'https://lbauzxflhubvbnrkbprp.supabase.co/storage/v1/object/public/public-assets/resources/premed.webp'
  ),
  (
    'Design Team List', 'academic',
    'https://docs.google.com/document/d/1gcITx3IKn6HnJ1bcA4TVTlh27wP6jSFf/edit#heading=h.o9rwupa35f1a',
    false,
    'https://lbauzxflhubvbnrkbprp.supabase.co/storage/v1/object/public/public-assets/resources/design-teams.webp'
  ),
  (
    'Resume Template', 'professional',
    'https://drive.google.com/drive/folders/1EcDL-qyRxkPOfUxYuQGBNKkDVh7ylray',
    true,
    'https://lbauzxflhubvbnrkbprp.supabase.co/storage/v1/object/public/public-assets/resources/resume-template.webp'
  ),
  (
    'Internship Guide', 'professional',
    'https://drive.google.com/drive/folders/1ODgUWyr_5Zl3oLwiXUSgbKVggyx8Qxjq',
    false,
    'https://lbauzxflhubvbnrkbprp.supabase.co/storage/v1/object/public/public-assets/resources/internship.webp'
  ),
  (
    'Interview Resources', 'professional',
    'https://drive.google.com/drive/folders/1Ziv21RfRcjXxGj84_feg1Y3JUVRCdjnX',
    false,
    'https://lbauzxflhubvbnrkbprp.supabase.co/storage/v1/object/public/public-assets/resources/interview.webp'
  ),
  (
    'Networking Resources', 'professional',
    'https://drive.google.com/drive/folders/14FTXWDmX-X-FlNe5mEfM0C5D-xf9oN2d',
    false,
    'https://lbauzxflhubvbnrkbprp.supabase.co/storage/v1/object/public/public-assets/resources/networking.webp'
  ),
  (
    'Experiences Tracker', 'professional',
    'https://docs.google.com/document/d/1rxYm5SCaX--ANEcCqRQFCgHLKbwZPqwU/edit',
    false,
    'https://lbauzxflhubvbnrkbprp.supabase.co/storage/v1/object/public/public-assets/resources/experiences-tracker.webp'
  )
on conflict (name) do update set
  image_url = excluded.image_url;
