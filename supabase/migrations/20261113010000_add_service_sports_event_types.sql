-- New event categories for the events list filter and event tags.
alter type public.event_type add value if not exists 'service';
alter type public.event_type add value if not exists 'sports';
