-- Migration: 20261117034033_add_app_feedback.sql
-- Description: User app feedback table, RLS policies, app_settings webhook URL, and Discord notification trigger

create table public.app_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  category text not null check (category in ('bug', 'feature', 'general')),
  message text not null check (length(trim(message)) > 0 and length(message) <= 300),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_app_feedback_user on public.app_feedback (user_id, created_at desc);

alter table public.app_feedback enable row level security;

create policy "Users can submit their own feedback"
  on public.app_feedback for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can view their own feedback"
  on public.app_feedback for select
  to authenticated
  using (auth.uid() = user_id);

-- Optional Discord webhook configuration in app_settings
insert into public.app_settings (key, value)
values ('discord_feedback_webhook_url', '')
on conflict (key) do nothing;

-- Function: Forward feedback to Discord if webhook URL is configured
create or replace function public.handle_app_feedback_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_webhook_url text;
  v_profile record;
  v_payload jsonb;
  v_color int;
begin
  -- 1. Fetch webhook URL from app_settings
  select value into v_webhook_url
  from public.app_settings
  where key = 'discord_feedback_webhook_url';

  if v_webhook_url is null or trim(v_webhook_url) = '' then
    return new;
  end if;

  -- 2. Fetch sender profile
  select username, full_name into v_profile
  from public.profiles
  where id = new.user_id;

  -- 3. Determine embed color (Red for bug, Gold for feature, SASE Blue for general)
  if new.category = 'bug' then
    v_color := 15158332; -- #e74c3c
  elsif new.category = 'feature' then
    v_color := 15844367; -- #f1c40f
  else
    v_color := 21147;    -- #00529b
  end if;

  -- 4. Construct Discord embed payload
  v_payload := jsonb_build_object(
    'embeds', jsonb_build_array(
      jsonb_build_object(
        'title', '📱 New App Feedback: ' || initcap(new.category),
        'description', new.message,
        'color', v_color,
        'fields', jsonb_build_array(
          jsonb_build_object(
            'name', 'Member',
            'value', coalesce('@' || v_profile.username, 'Anonymous') || ' (' || coalesce(v_profile.full_name, 'Unknown') || ')',
            'inline', true
          ),
          jsonb_build_object(
            'name', 'Platform',
            'value', coalesce(new.metadata->>'platform', 'Unknown') || ' ' || coalesce(new.metadata->>'os_version', ''),
            'inline', true
          ),
          jsonb_build_object(
            'name', 'App Version',
            'value', coalesce(new.metadata->>'app_version', '1.1.0'),
            'inline', true
          )
        ),
        'timestamp', to_char(now() at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
      )
    )
  );

  -- 5. Send asynchronous HTTP POST via pg_net (net schema in Supabase)
  begin
    perform net.http_post(
      url := v_webhook_url,
      body := v_payload,
      headers := '{"Content-Type": "application/json"}'::jsonb
    );
  exception
    when others then
      null;
  end;

  return new;
exception
  when others then
    return new;
end;
$$;

create trigger trg_app_feedback_notification
after insert on public.app_feedback
for each row
execute function public.handle_app_feedback_notification();
