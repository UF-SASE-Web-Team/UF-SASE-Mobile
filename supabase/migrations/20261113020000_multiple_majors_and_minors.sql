-- Members can list several majors and minors (double majors, multiple minors).
alter table public.profiles
  add column majors text[] not null default '{}',
  add column minors text[] not null default '{}';

update public.profiles
set majors = case when nullif(trim(major), '') is null then '{}' else array[trim(major)] end,
    minors = case when nullif(trim(minor), '') is null then '{}' else array[trim(minor)] end;

alter table public.profiles
  drop column major,
  drop column minor,
  add constraint profiles_majors_limit check (cardinality(majors) <= 3),
  add constraint profiles_minors_limit check (cardinality(minors) <= 3);
