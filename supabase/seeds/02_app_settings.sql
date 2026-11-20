-- 02_app_settings.sql
-- Global application configuration settings

insert into public.app_settings (key, value)
values
  ('checkin_qr_url', 'https://forms.gle/CBEEdo8zP8hjqHdc6'),
  ('discord_feedback_webhook_url', '')
on conflict (key) do update set value = excluded.value;

-- Google Form check-in sync stays off locally so testing never posts to the live form.
insert into public.app_settings (key, value)
values
  ('google_form_checkin_enabled', 'false'),
  ('google_form_checkin_form_id', '1FAIpQLScBj2IuMWxYg285fwgrhvNp2uVtwpLu9i3jrAn4FbnibZCVTA')
on conflict (key) do update set value = excluded.value;
