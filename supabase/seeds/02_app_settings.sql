-- 02_app_settings.sql
-- Global application configuration settings

insert into public.app_settings (key, value)
values ('checkin_qr_url', 'https://forms.gle/CBEEdo8zP8hjqHdc6')
on conflict (key) do update set value = excluded.value;
