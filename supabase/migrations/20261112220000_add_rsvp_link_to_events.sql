-- Optional pointer to the event link used for RSVPs. When null, the event
-- does not take RSVPs and the app hides its RSVP button.
alter table public.events
  add column rsvp uuid references public.event_links(id) on delete set null;

create index events_rsvp_idx on public.events (rsvp) where rsvp is not null;
