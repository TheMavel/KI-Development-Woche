-- Newsletter-Anmeldungen für die Portfolio-Seite
-- Ausführen im Supabase-Dashboard: SQL Editor → New query → einfügen → Run

create table if not exists public.newsletter_subscribers (
  id            uuid primary key default gen_random_uuid(),
  name          text not null check (char_length(name) between 2 and 120),
  email         text not null unique
                  check (email = lower(email) and email ~ '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$' and char_length(email) <= 254),
  consent       boolean not null check (consent = true),
  consented_at  timestamptz not null default now(),
  source        text not null default 'portfolio' check (char_length(source) <= 60)
);

-- Row Level Security: Besucher dürfen sich nur eintragen, nichts lesen, ändern oder löschen.
alter table public.newsletter_subscribers enable row level security;

drop policy if exists "Besucher duerfen sich eintragen" on public.newsletter_subscribers;
create policy "Besucher duerfen sich eintragen"
  on public.newsletter_subscribers
  for insert
  to anon
  with check (consent = true);

-- Rechte für die öffentliche Rolle auf das Eintragen begrenzen
revoke all on public.newsletter_subscribers from anon;
grant insert (name, email, consent, source) on public.newsletter_subscribers to anon;
