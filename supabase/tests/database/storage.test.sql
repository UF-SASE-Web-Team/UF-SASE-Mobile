begin;
select plan(3);

select ok(
  (select public from storage.buckets where id = 'public-assets'),
  'public-assets bucket exists and is public'
);

select is(
  (select file_size_limit from storage.buckets where id = 'public-assets'),
  512000::bigint,
  'public-assets uploads are capped at 500 KB'
);

select is(
  (select allowed_mime_types from storage.buckets where id = 'public-assets'),
  array['image/webp'],
  'public-assets only accepts WebP images'
);

select * from finish();
rollback;
