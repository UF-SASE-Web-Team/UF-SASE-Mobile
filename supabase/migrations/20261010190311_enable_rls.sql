alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.check_ins enable row level security;

create policy "profiles can only be read by authenticated users"
    on public.profiles for select 
    to authenticated
    using (true);

create policy "users can update their own profile"
    on public.profiles for update 
    to authenticated
    using (id = (select auth.uid()))
    with check (id = (select auth.uid()));

create policy "events are readable by authenticated users"
    on public.events for select 
    to authenticated
    using (true);

create policy "users can read their own check-ins"
    on public.check_ins for select
    to authenticated 
    using (user_id = (select auth.uid()));