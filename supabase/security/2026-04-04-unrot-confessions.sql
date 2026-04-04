-- unrot anonymous confessions board
-- Date: 2026-04-04
-- Purpose: Add public anonymous "Unrot Confessions" feature storage with RLS

begin;

-- Keep this aligned with your admin login email.
create or replace function public.is_admin_user()
returns boolean
language sql
stable
as $$
  select coalesce((auth.jwt() ->> 'email') = 'moezxx40@gmail.com', false);
$$;

create table if not exists public.confessions (
  id uuid primary key default gen_random_uuid(),
  confession_text text not null,
  is_approved boolean not null default false,
  is_flagged boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint confessions_text_length check (char_length(btrim(confession_text)) between 20 and 500)
);

alter table public.confessions alter column is_approved set default false;
alter table public.confessions alter column is_flagged set default false;

create index if not exists confessions_created_at_idx on public.confessions(created_at desc);
create index if not exists confessions_visibility_idx on public.confessions(is_approved, is_flagged, created_at desc);

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists confessions_set_updated_at on public.confessions;
create trigger confessions_set_updated_at
before update on public.confessions
for each row
execute function public.update_updated_at_column();

alter table public.confessions enable row level security;

drop policy if exists "confessions_select_public" on public.confessions;
drop policy if exists "confessions_insert_public" on public.confessions;
drop policy if exists "confessions_update_admin" on public.confessions;
drop policy if exists "confessions_delete_admin" on public.confessions;

create policy "confessions_select_public"
on public.confessions
for select
to anon, authenticated
using (
  (is_approved = true and is_flagged = false)
  or public.is_admin_user()
);

create policy "confessions_insert_public"
on public.confessions
for insert
to anon, authenticated
with check (
  is_approved = false
  and is_flagged = false
  and char_length(btrim(confession_text)) between 20 and 500
);

create policy "confessions_update_admin"
on public.confessions
for update
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

create policy "confessions_delete_admin"
on public.confessions
for delete
to authenticated
using (public.is_admin_user());

grant select, insert on table public.confessions to anon, authenticated;

commit;
