-- unrot realtime friend battle mode
-- Date: 2026-04-03
-- Purpose: Add non-AI, realtime PvP battle infrastructure (matches, rounds, answers, damage resolution)

begin;

-- =========================
-- TABLES
-- =========================

create table if not exists public.battle_matches (
  id uuid primary key default gen_random_uuid(),
  invite_code text unique not null,
  host_user_id uuid not null references auth.users(id) on delete cascade,
  guest_user_id uuid references auth.users(id) on delete set null,
  topic_id text not null references public.topics(id) on delete restrict,
  status text not null default 'waiting' check (status in ('waiting', 'active', 'finished', 'cancelled')),
  max_rounds integer not null default 5 check (max_rounds between 1 and 20),
  current_round integer not null default 1 check (current_round >= 1),
  host_hp integer not null default 100 check (host_hp between 0 and 100),
  guest_hp integer not null default 100 check (guest_hp between 0 and 100),
  winner_user_id uuid references auth.users(id) on delete set null,
  round_started_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists battle_matches_host_user_id_idx on public.battle_matches(host_user_id);
create index if not exists battle_matches_guest_user_id_idx on public.battle_matches(guest_user_id);
create index if not exists battle_matches_invite_code_idx on public.battle_matches(invite_code);
create index if not exists battle_matches_status_idx on public.battle_matches(status);

create table if not exists public.battle_match_rounds (
  match_id uuid not null references public.battle_matches(id) on delete cascade,
  round_number integer not null check (round_number >= 1),
  topic_id text not null references public.topics(id) on delete restrict,
  passage text not null,
  question text not null,
  options jsonb not null,
  correct_answer text not null,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (match_id, round_number)
);

create index if not exists battle_match_rounds_topic_id_idx on public.battle_match_rounds(topic_id);

create table if not exists public.battle_round_answers (
  match_id uuid not null references public.battle_matches(id) on delete cascade,
  round_number integer not null check (round_number >= 1),
  user_id uuid not null references auth.users(id) on delete cascade,
  selected_answer text,
  is_correct boolean not null,
  response_ms integer not null default 0 check (response_ms >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  primary key (match_id, round_number, user_id)
);

create index if not exists battle_round_answers_user_id_idx on public.battle_round_answers(user_id);

create table if not exists public.battle_round_results (
  match_id uuid not null references public.battle_matches(id) on delete cascade,
  round_number integer not null check (round_number >= 1),
  host_score integer not null default 0,
  guest_score integer not null default 0,
  host_damage integer not null default 0,
  guest_damage integer not null default 0,
  resolved_at timestamptz not null default timezone('utc', now()),
  primary key (match_id, round_number)
);

-- Keep updated_at fresh
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists battle_matches_set_updated_at on public.battle_matches;
create trigger battle_matches_set_updated_at
before update on public.battle_matches
for each row
execute function public.update_updated_at_column();

-- =========================
-- RLS
-- =========================

alter table public.battle_matches enable row level security;
alter table public.battle_match_rounds enable row level security;
alter table public.battle_round_answers enable row level security;
alter table public.battle_round_results enable row level security;

-- Remove old policies for idempotency
-- battle_matches
 drop policy if exists "battle_matches_select_participants" on public.battle_matches;
 drop policy if exists "battle_matches_insert_host" on public.battle_matches;
 drop policy if exists "battle_matches_update_participants" on public.battle_matches;

-- battle_match_rounds
 drop policy if exists "battle_rounds_select_participants" on public.battle_match_rounds;
 drop policy if exists "battle_rounds_insert_host" on public.battle_match_rounds;

-- battle_round_answers
 drop policy if exists "battle_answers_select_participants" on public.battle_round_answers;
 drop policy if exists "battle_answers_insert_own_participant" on public.battle_round_answers;

-- battle_round_results
 drop policy if exists "battle_results_select_participants" on public.battle_round_results;

create policy "battle_matches_select_participants"
on public.battle_matches
for select
to authenticated
using (auth.uid() = host_user_id or auth.uid() = guest_user_id);

create policy "battle_matches_insert_host"
on public.battle_matches
for insert
to authenticated
with check (auth.uid() = host_user_id);

create policy "battle_matches_update_participants"
on public.battle_matches
for update
to authenticated
using (auth.uid() = host_user_id or auth.uid() = guest_user_id)
with check (auth.uid() = host_user_id or auth.uid() = guest_user_id);

create policy "battle_rounds_select_participants"
on public.battle_match_rounds
for select
to authenticated
using (
  exists (
    select 1
    from public.battle_matches m
    where m.id = battle_match_rounds.match_id
      and (m.host_user_id = auth.uid() or m.guest_user_id = auth.uid())
  )
);

create policy "battle_rounds_insert_host"
on public.battle_match_rounds
for insert
to authenticated
with check (
  exists (
    select 1
    from public.battle_matches m
    where m.id = battle_match_rounds.match_id
      and m.host_user_id = auth.uid()
      and m.status = 'waiting'
  )
);

create policy "battle_answers_select_participants"
on public.battle_round_answers
for select
to authenticated
using (
  exists (
    select 1
    from public.battle_matches m
    where m.id = battle_round_answers.match_id
      and (m.host_user_id = auth.uid() or m.guest_user_id = auth.uid())
  )
);

create policy "battle_answers_insert_own_participant"
on public.battle_round_answers
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.battle_matches m
    where m.id = battle_round_answers.match_id
      and (m.host_user_id = auth.uid() or m.guest_user_id = auth.uid())
      and m.status = 'active'
  )
);

create policy "battle_results_select_participants"
on public.battle_round_results
for select
to authenticated
using (
  exists (
    select 1
    from public.battle_matches m
    where m.id = battle_round_results.match_id
      and (m.host_user_id = auth.uid() or m.guest_user_id = auth.uid())
  )
);

-- =========================
-- RPC HELPERS
-- =========================

create or replace function public.generate_battle_invite_code()
returns text
language plpgsql
as $$
declare
  code text;
  exists_code boolean;
begin
  loop
    code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    select exists(select 1 from public.battle_matches where invite_code = code) into exists_code;
    exit when not exists_code;
  end loop;

  return code;
end;
$$;

create or replace function public.create_battle_match(p_topic_id text, p_max_rounds integer default 5)
returns public.battle_matches
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match public.battle_matches;
  v_uid uuid;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'Authentication required';
  end if;

  if p_max_rounds < 1 or p_max_rounds > 20 then
    raise exception 'Invalid max rounds';
  end if;

  insert into public.battle_matches (invite_code, host_user_id, topic_id, max_rounds)
  values (public.generate_battle_invite_code(), v_uid, p_topic_id, p_max_rounds)
  returning * into v_match;

  return v_match;
end;
$$;

grant execute on function public.create_battle_match(text, integer) to authenticated;

create or replace function public.join_battle_match(p_invite_code text)
returns public.battle_matches
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match public.battle_matches;
  v_uid uuid;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'Authentication required';
  end if;

  select *
  into v_match
  from public.battle_matches
  where invite_code = upper(trim(p_invite_code));

  if not found then
    raise exception 'Match not found';
  end if;

  if v_match.status <> 'waiting' then
    raise exception 'Match is not joinable';
  end if;

  if v_match.host_user_id = v_uid then
    return v_match;
  end if;

  if v_match.guest_user_id is not null and v_match.guest_user_id <> v_uid then
    raise exception 'Match already has two players';
  end if;

  update public.battle_matches
  set guest_user_id = v_uid
  where id = v_match.id
  returning * into v_match;

  return v_match;
end;
$$;

grant execute on function public.join_battle_match(text) to authenticated;

create or replace function public.start_battle_match(p_match_id uuid)
returns public.battle_matches
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match public.battle_matches;
begin
  select * into v_match from public.battle_matches where id = p_match_id;

  if not found then
    raise exception 'Match not found';
  end if;

  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if auth.uid() <> v_match.host_user_id then
    raise exception 'Only host can start';
  end if;

  if v_match.guest_user_id is null then
    raise exception 'Waiting for friend to join';
  end if;

  if v_match.status <> 'waiting' then
    return v_match;
  end if;

  update public.battle_matches
  set status = 'active',
      current_round = 1,
      host_hp = 100,
      guest_hp = 100,
      winner_user_id = null,
      round_started_at = timezone('utc', now())
  where id = v_match.id
  returning * into v_match;

  return v_match;
end;
$$;

grant execute on function public.start_battle_match(uuid) to authenticated;

create or replace function public.submit_battle_answer(
  p_match_id uuid,
  p_round_number integer,
  p_selected_answer text,
  p_response_ms integer
)
returns public.battle_matches
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match public.battle_matches;
  v_round public.battle_match_rounds;
  v_uid uuid;
  v_is_host boolean;
  v_is_correct boolean;

  v_host_answer public.battle_round_answers;
  v_guest_answer public.battle_round_answers;

  v_host_score integer := 0;
  v_guest_score integer := 0;
  v_host_damage integer := 0;
  v_guest_damage integer := 0;
  v_host_speed_bonus integer := 0;
  v_guest_speed_bonus integer := 0;
  v_speed_diff integer := 0;

  v_lock_key bigint;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'Authentication required';
  end if;

  if p_response_ms < 0 then
    raise exception 'Invalid response time';
  end if;

  select * into v_match from public.battle_matches where id = p_match_id;
  if not found then
    raise exception 'Match not found';
  end if;

  if v_match.status <> 'active' then
    raise exception 'Match is not active';
  end if;

  if p_round_number <> v_match.current_round then
    raise exception 'This round is closed';
  end if;

  if v_uid <> v_match.host_user_id and v_uid <> v_match.guest_user_id then
    raise exception 'Not a participant';
  end if;

  select * into v_round
  from public.battle_match_rounds
  where match_id = p_match_id and round_number = p_round_number;

  if not found then
    raise exception 'Round not found';
  end if;

  v_is_host := v_uid = v_match.host_user_id;
  v_is_correct := coalesce(trim(p_selected_answer), '') = trim(v_round.correct_answer);

  insert into public.battle_round_answers (match_id, round_number, user_id, selected_answer, is_correct, response_ms)
  values (p_match_id, p_round_number, v_uid, p_selected_answer, v_is_correct, p_response_ms)
  on conflict (match_id, round_number, user_id) do nothing;

  -- Serialize round resolution to prevent double damage application.
  v_lock_key := ('x' || substr(replace(p_match_id::text, '-', ''), 1, 16))::bit(64)::bigint;
  perform pg_advisory_xact_lock(v_lock_key);

  if exists (
    select 1
    from public.battle_round_results rr
    where rr.match_id = p_match_id
      and rr.round_number = p_round_number
  ) then
    select * into v_match from public.battle_matches where id = p_match_id;
    return v_match;
  end if;

  select * into v_host_answer
  from public.battle_round_answers
  where match_id = p_match_id
    and round_number = p_round_number
    and user_id = v_match.host_user_id;

  select * into v_guest_answer
  from public.battle_round_answers
  where match_id = p_match_id
    and round_number = p_round_number
    and user_id = v_match.guest_user_id;

  if v_host_answer.match_id is null or v_guest_answer.match_id is null then
    select * into v_match from public.battle_matches where id = p_match_id;
    return v_match;
  end if;

  -- Scoring model:
  -- 1) Correctness is primary (correct should always beat wrong)
  -- 2) Speed is a secondary tie-breaker/bonus
  -- 3) If both wrong, no damage is applied this round
  v_host_speed_bonus := floor(greatest(0, 45000 - least(v_host_answer.response_ms, 45000)) / 150.0)::integer;
  v_guest_speed_bonus := floor(greatest(0, 45000 - least(v_guest_answer.response_ms, 45000)) / 150.0)::integer;

  v_host_score := (case when v_host_answer.is_correct then 1000 else 0 end) + v_host_speed_bonus;
  v_guest_score := (case when v_guest_answer.is_correct then 1000 else 0 end) + v_guest_speed_bonus;

  if v_host_answer.is_correct and not v_guest_answer.is_correct then
    v_guest_damage := least(30, 18 + floor(v_host_speed_bonus / 35.0)::integer);
    v_host_damage := 0;
  elsif v_guest_answer.is_correct and not v_host_answer.is_correct then
    v_host_damage := least(30, 18 + floor(v_guest_speed_bonus / 35.0)::integer);
    v_guest_damage := 0;
  elsif v_host_answer.is_correct and v_guest_answer.is_correct then
    v_speed_diff := abs(v_host_speed_bonus - v_guest_speed_bonus);

    if v_host_speed_bonus > v_guest_speed_bonus then
      v_guest_damage := least(16, greatest(1, ceil(v_speed_diff / 18.0)::integer));
      v_host_damage := 0;
    elsif v_guest_speed_bonus > v_host_speed_bonus then
      v_host_damage := least(16, greatest(1, ceil(v_speed_diff / 18.0)::integer));
      v_guest_damage := 0;
    end if;
  else
    v_host_damage := 0;
    v_guest_damage := 0;
  end if;

  insert into public.battle_round_results (match_id, round_number, host_score, guest_score, host_damage, guest_damage)
  values (p_match_id, p_round_number, v_host_score, v_guest_score, v_host_damage, v_guest_damage);

  update public.battle_matches
  set host_hp = greatest(0, host_hp - v_host_damage),
      guest_hp = greatest(0, guest_hp - v_guest_damage),
      current_round = current_round + 1,
      round_started_at = timezone('utc', now())
  where id = p_match_id;

  select * into v_match from public.battle_matches where id = p_match_id;

  if v_match.current_round > v_match.max_rounds or v_match.host_hp = 0 or v_match.guest_hp = 0 then
    update public.battle_matches
    set status = 'finished',
        winner_user_id = case
          when host_hp = guest_hp then null
          when host_hp > guest_hp then host_user_id
          else guest_user_id
        end,
        round_started_at = null
    where id = p_match_id
    returning * into v_match;
  end if;

  return v_match;
end;
$$;

grant execute on function public.submit_battle_answer(uuid, integer, text, integer) to authenticated;

-- =========================
-- REALTIME PUBLICATION
-- =========================

do $$
begin
  begin
    execute 'alter publication supabase_realtime add table public.battle_matches';
  exception when duplicate_object then
    null;
  end;

  begin
    execute 'alter publication supabase_realtime add table public.battle_match_rounds';
  exception when duplicate_object then
    null;
  end;

  begin
    execute 'alter publication supabase_realtime add table public.battle_round_answers';
  exception when duplicate_object then
    null;
  end;

  begin
    execute 'alter publication supabase_realtime add table public.battle_round_results';
  exception when duplicate_object then
    null;
  end;
end
$$;

commit;
