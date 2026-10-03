insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at) values
    ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'alice@gmail.com', '{"full_name":"Alice Gator"}', now(), now()),
    ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'bob@gmail.com', '{"full_name":"Bob Gator"}', now(), now());


insert into public.profiles (id, full_name) values
    ('11111111-1111-1111-1111-111111111111', 'Alice Gator'),
    ('22222222-2222-2222-2222-222222222222', 'Bob Gator');

insert into public.events (title, starts_at, ends_at, location_name, checkin_code, points_value) values 
    ('General Body Meeting', now() + interval '1 day', now() + interval '1 day 2 hours', 'Little Hall', 'QR Code', 1),
    ('Other SASE Event', now() + interval '3 day', now() + interval '3 days 2 hours', 'Reitz Union', 'QR Code', 1);

