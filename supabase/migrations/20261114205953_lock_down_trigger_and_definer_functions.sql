-- Revoke execute on internal trigger functions so they cannot be called
-- directly via PostgREST RPC (/rest/v1/rpc/...) by anon or authenticated users.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.handle_updated_at() from public, anon, authenticated;
revoke execute on function public.sync_program_member_name() from public, anon, authenticated;

-- Ensure account deletion is strictly restricted to authenticated users
-- and not inherited by anon through public.
revoke execute on function public.delete_user_account() from public, anon;
grant execute on function public.delete_user_account() to authenticated;
