-- Restrict sub-program nesting to 1 level and enforce constraints
alter table public.programs
  drop constraint programs_parent_id_fkey,
  add constraint programs_parent_id_fkey
    foreign key (parent_id) references public.programs(id) on delete restrict,
  add constraint programs_no_self_parent check (parent_id is distinct from id),
  add constraint programs_subprogram_no_category check (parent_id is null or category is null);

create or replace function public.enforce_program_depth()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.parent_id is not null and (
    exists (select 1 from public.programs where id = new.parent_id and parent_id is not null)
    or exists (select 1 from public.programs where parent_id = new.id)
  ) then
    raise exception 'Programs can only be nested one level deep';
  end if;
  return new;
end;
$$;

create trigger programs_enforce_depth
  before insert or update of parent_id on public.programs
  for each row execute function public.enforce_program_depth();
