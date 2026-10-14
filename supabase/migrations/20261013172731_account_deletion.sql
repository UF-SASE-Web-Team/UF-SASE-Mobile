-- Function for authenticated users to delete their account and personal data
create or replace function public.delete_user_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  delete from auth.users where id = v_uid;
end;
$$;

grant execute on function public.delete_user_account() to authenticated;
revoke execute on function public.delete_user_account() from anon;
