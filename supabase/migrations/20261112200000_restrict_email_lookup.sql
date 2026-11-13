-- The username -> email lookup used to be callable by anyone, which let a
-- signed-out caller turn any username into that member's email address.
-- Username login now goes through the `login` edge function, which performs
-- the lookup with the service role and never returns the email to the client.

revoke execute on function public.get_email_from_username(text) from public, anon, authenticated;
grant execute on function public.get_email_from_username(text) to service_role;
