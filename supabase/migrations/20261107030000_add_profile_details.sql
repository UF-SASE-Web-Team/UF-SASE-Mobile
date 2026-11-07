alter table public.profiles
  add column instagram_handle text,
  add column linkedin_url text,
  add column bio text,
  add constraint profiles_bio_length check (char_length(bio) <= 500);

comment on column public.profiles.avatar_url is
  'Remote avatar URL or bundled mascot identifier (sase-shark / sase-cat).';
