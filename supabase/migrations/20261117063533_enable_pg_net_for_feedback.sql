-- Enable pg_net so handle_app_feedback_notification() can POST feedback to Discord.
-- Without it, net.http_post fails and the trigger silently swallows the error.
create extension if not exists pg_net with schema extensions;
