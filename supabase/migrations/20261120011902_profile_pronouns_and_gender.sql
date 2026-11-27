-- Pronouns are shown on profiles. Gender is private and only used to answer the
-- SASE Google check-in form's required gender question; it is never inferred
-- from pronouns.

alter table public.profiles
  add column pronouns text,
  add constraint profiles_pronouns_length check (pronouns is null or char_length(pronouns) <= 30);

-- One of the form's choices (Female, Male, Non-binary, Prefer not to say) or a
-- self-described answer. Null sends "Prefer not to say".
alter table public.profile_private
  add column gender text,
  add constraint profile_private_gender_length
    check (gender is null or char_length(trim(gender)) between 1 and 50);

comment on table public.profile_private is
  'Owner-only member details (UFID, UF email, gender). Never exposed to other members.';
