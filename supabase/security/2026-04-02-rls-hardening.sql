-- unrot Supabase security hardening
-- Date: 2026-04-02
-- Purpose: Resolve Security Advisor warning: rls_disabled_in_public
--
-- IMPORTANT:
-- 1) Update admin email below if needed.
-- 2) Run this whole script in Supabase SQL Editor.

begin;

-- Change this email if your admin login uses a different address.
create or replace function public.is_admin_user()
returns boolean
language sql
stable
as $$
  select coalesce((auth.jwt() ->> 'email') = 'moezxx40@gmail.com', false);
$$;

-- Enable RLS on app tables in public schema
alter table if exists public.topics enable row level security;
alter table if exists public.sessions enable row level security;
alter table if exists public.profiles enable row level security;

-- Clean existing policies to keep this migration idempotent
-- TOPICS
 drop policy if exists "topics_select_public" on public.topics;
 drop policy if exists "topics_insert_admin" on public.topics;
 drop policy if exists "topics_update_admin" on public.topics;
 drop policy if exists "topics_delete_admin" on public.topics;

-- SESSIONS
 drop policy if exists "sessions_select_public" on public.sessions;
 drop policy if exists "sessions_insert_own" on public.sessions;
 drop policy if exists "sessions_update_own_or_admin" on public.sessions;
 drop policy if exists "sessions_delete_own_or_admin" on public.sessions;

-- PROFILES
 drop policy if exists "profiles_select_own_or_admin" on public.profiles;
 drop policy if exists "profiles_insert_own_or_admin" on public.profiles;
 drop policy if exists "profiles_update_own_or_admin" on public.profiles;
 drop policy if exists "profiles_delete_admin_only" on public.profiles;

-- =========================
-- TOPICS POLICIES
-- =========================
-- Public read so Explore/Topic pages keep working for all visitors.
create policy "topics_select_public"
on public.topics
for select
to anon, authenticated
using (true);

-- Only admin can create/update/delete topics.
create policy "topics_insert_admin"
on public.topics
for insert
to authenticated
with check (public.is_admin_user());

create policy "topics_update_admin"
on public.topics
for update
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

create policy "topics_delete_admin"
on public.topics
for delete
to authenticated
using (public.is_admin_user());

-- =========================
-- SESSIONS POLICIES
-- =========================
-- Public read so leaderboard and shared results pages work.
create policy "sessions_select_public"
on public.sessions
for select
to anon, authenticated
using (true);

-- Authenticated users can insert only their own sessions.
create policy "sessions_insert_own"
on public.sessions
for insert
to authenticated
with check (auth.uid() = user_id);

-- Owner or admin can update/delete session records.
create policy "sessions_update_own_or_admin"
on public.sessions
for update
to authenticated
using (auth.uid() = user_id or public.is_admin_user())
with check (auth.uid() = user_id or public.is_admin_user());

create policy "sessions_delete_own_or_admin"
on public.sessions
for delete
to authenticated
using (auth.uid() = user_id or public.is_admin_user());

-- =========================
-- PROFILES POLICIES
-- =========================
-- Users can read only their own profile; admin can read all.
create policy "profiles_select_own_or_admin"
on public.profiles
for select
to authenticated
using (auth.uid() = id or public.is_admin_user());

-- Users can create only their own profile; admin can create any.
create policy "profiles_insert_own_or_admin"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id or public.is_admin_user());

-- Users can update only their own profile; admin can update any.
create policy "profiles_update_own_or_admin"
on public.profiles
for update
to authenticated
using (auth.uid() = id or public.is_admin_user())
with check (auth.uid() = id or public.is_admin_user());

-- Only admin can delete profile rows.
create policy "profiles_delete_admin_only"
on public.profiles
for delete
to authenticated
using (public.is_admin_user());

commit;

-- Optional verification queries:
-- select tablename, rowsecurity from pg_tables where schemaname='public' and tablename in ('topics','sessions','profiles');
-- select schemaname, tablename, policyname, cmd, roles from pg_policies where schemaname='public' and tablename in ('topics','sessions','profiles') order by tablename, policyname;
