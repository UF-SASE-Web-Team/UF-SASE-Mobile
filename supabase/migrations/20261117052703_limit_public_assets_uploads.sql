-- Keep public images small to control Supabase cached egress.
--
-- Every image in `public-assets` (event flyers, program banners, resource
-- icons) is downloaded by every member's phone, so oversized uploads multiply
-- across the whole membership. Storage now rejects anything that is not WebP or
-- is larger than 500 KB. Run `npm run optimize-image -- <file>` to convert an
-- image before uploading it.
--
-- Limits only apply to new uploads; files already in the bucket are untouched.
-- The bucket was created in the dashboard, so this also creates it for local
-- development.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('public-assets', 'public-assets', true, 512000, array['image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
