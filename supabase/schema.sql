-- Schema bazei de date Supabase (proiectul „deutsch-platform”), în ordinea în care a fost aplicat.
-- Este documentație și punct de pornire pentru un proiect nou; datele topic_levels se încarcă din supabase/topic_levels.sql.

-- ======================================================================
-- 1. Progres, sesiuni și răspunsuri (migrarea user_progress_sessions_answers)
-- ======================================================================

-- Starea repetării spațiate, un rând pe utilizator și întrebare (item_id = "<temă>/<id întrebare>")
create table public.progress (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  item_id text not null,
  box smallint not null check (box between 0 and 5),
  due bigint not null,
  seen integer not null check (seen >= 0),
  right_count integer not null check (right_count >= 0),
  wrong_count integer not null check (wrong_count >= 0),
  last bigint not null default 0,
  primary key (user_id, item_id)
);

-- Un rând pe sesiune (topic = id-ul temei sau 'mix')
create table public.sessions (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  topic text not null,
  mode text not null,
  feedback_mode text not null check (feedback_mode in ('practice', 'exam')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  n integer,
  correct integer,
  pct integer
);
create index sessions_user_started_idx on public.sessions (user_id, started_at desc);

-- Un rând pe răspuns dat într-o sesiune
create table public.answers (
  id uuid primary key,
  session_id uuid not null references public.sessions (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  position integer not null,
  item_id text not null,
  mode text not null,
  given text not null default '',
  given_extra text not null default '',
  correct boolean not null,
  skipped boolean not null default false,
  answered_at timestamptz not null default now()
);
create index answers_session_idx on public.answers (session_id);
create index answers_user_answered_idx on public.answers (user_id, answered_at desc);
create index answers_user_item_idx on public.answers (user_id, item_id);

alter table public.progress enable row level security;
alter table public.sessions enable row level security;
alter table public.answers enable row level security;

revoke all on public.progress, public.sessions, public.answers from anon;
revoke all on public.progress, public.sessions, public.answers from authenticated;
grant select, insert, update, delete on public.progress to authenticated;
grant select, insert, update on public.sessions to authenticated;
grant select, insert on public.answers to authenticated;

create policy progress_select on public.progress for select to authenticated using (user_id = (select auth.uid()));
create policy progress_insert on public.progress for insert to authenticated with check (user_id = (select auth.uid()));
create policy progress_update on public.progress for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy progress_delete on public.progress for delete to authenticated using (user_id = (select auth.uid()));

create policy sessions_select on public.sessions for select to authenticated using (user_id = (select auth.uid()));
create policy sessions_insert on public.sessions for insert to authenticated with check (user_id = (select auth.uid()));
create policy sessions_update on public.sessions for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy answers_select on public.answers for select to authenticated using (user_id = (select auth.uid()));
create policy answers_insert on public.answers for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.sessions s where s.id = session_id and s.user_id = (select auth.uid()))
  );

-- ======================================================================
-- 2. Durata sesiunii (migrarea sessions_duration_seconds)
-- ======================================================================

-- Timpul activ al sesiunii, în secunde (inactivitatea și timpul în fundal nu se numără)
alter table public.sessions
  add column duration_s integer check (duration_s is null or duration_s >= 0);

-- ======================================================================
-- 3. Profil și înscrierea la liga săptămânală (migrarea profiles_for_weekly_league)
-- ======================================================================

create table public.profiles (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  display_name text check (display_name is null or char_length(btrim(display_name)) between 2 and 24),
  avatar text check (avatar is null or char_length(avatar) between 1 and 16),
  league_registered boolean not null default false,
  league_prompt_skip boolean not null default false,
  league_prompted_at timestamptz,
  registered_at timestamptz,
  created_at timestamptz not null default now(),
  constraint profiles_registered_needs_identity check (not league_registered or (display_name is not null and avatar is not null))
);

alter table public.profiles enable row level security;
revoke all on public.profiles from anon, authenticated;
grant select, insert, update on public.profiles to authenticated;

create policy profiles_select_own on public.profiles for select to authenticated using (user_id = (select auth.uid()));
create policy profiles_insert_own on public.profiles for insert to authenticated with check (user_id = (select auth.uid()));
create policy profiles_update_own on public.profiles for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- ======================================================================
-- 4. Motorul de XP al ligii (migrarea weekly_league_xp_engine)
-- ======================================================================

-- Momentul lansării ligii: se numără doar răspunsurile date după el (liga pornește de la zero).
create table public.league_config (
  id boolean primary key default true check (id),
  launch_at timestamptz not null
);
insert into public.league_config (launch_at) values (now());

-- Multiplicatorul de XP după nivelul temei (generat de build.py în supabase/topic_levels.sql)
create table public.topic_levels (
  topic_id text primary key,
  level text not null,
  multiplier numeric(4,2) not null check (multiplier between 0.5 and 5)
);

-- Un rând pe punctaj acordat; scris doar de funcțiile de mai jos.
create table public.xp_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  session_id uuid references public.sessions (id) on delete cascade,
  answer_id uuid references public.answers (id) on delete cascade,
  kind text not null check (kind in ('answer', 'session', 'first_of_day')),
  day date not null,
  occurred_at timestamptz not null,
  is_due boolean,
  is_comeback boolean,
  mode_mult numeric(3,2) not null default 1,
  level_mult numeric(4,2) not null default 1,
  base_points numeric(8,2) not null,
  counted_points numeric(8,2) not null,
  xp integer not null check (xp >= 0)
);
create unique index xp_events_answer_uidx on public.xp_events (answer_id) where kind = 'answer';
create index xp_events_user_day_idx on public.xp_events (user_id, day);
create index xp_events_session_idx on public.xp_events (session_id);

alter table public.league_config enable row level security;
alter table public.topic_levels enable row level security;
alter table public.xp_events enable row level security;
revoke all on public.league_config, public.topic_levels, public.xp_events from anon, authenticated;
grant select on public.topic_levels, public.xp_events to authenticated;
create policy topic_levels_read on public.topic_levels for select to authenticated using (true);
create policy xp_events_select_own on public.xp_events for select to authenticated using (user_id = (select auth.uid()));

-- XP pentru un răspuns corect:
--   bază = 10 (întrebare nouă) | 15 (scadentă) | 5 (reluată înainte de scadență), +5 dacă răspunsul anterior a fost greșit
--   puncte = bază × mod (alege 1, scrie 1,5, scrie + caz 2)
--   plafon zilnic moale: primele 400 de puncte pe zi se numără întregi, restul 25%
--   xp = rotunjire(puncte numărate × multiplicatorul nivelului temei)
-- Nu se acordă XP pentru răspunsuri greșite, date înainte de lansare, mai vechi de 48 h sau din viitor.
create or replace function public.award_answer_xp() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_launch timestamptz;
  v_topic text := split_part(new.item_id, '/', 1);
  v_level numeric;
  v_mode numeric := case new.mode when 'write' then 1.5 when 'both' then 2 else 1 end;
  v_steps int[] := array[0, 1, 3, 7, 14, 30];
  v_box int := 0;
  v_last timestamptz;
  v_last_ok boolean;
  v_new boolean := true;
  v_due boolean := false;
  v_comeback boolean := false;
  v_base numeric;
  v_pts numeric;
  v_day date;
  v_used numeric;
  v_full numeric;
  v_counted numeric;
  v_xp integer;
  r record;
begin
  if not new.correct then return new; end if;
  select launch_at into v_launch from public.league_config limit 1;
  if v_launch is null or new.answered_at < v_launch
     or new.answered_at > now() + interval '5 minutes'
     or new.answered_at < now() - interval '48 hours' then
    return new;
  end if;
  select multiplier into v_level from public.topic_levels where topic_id = v_topic;
  if v_level is null then v_level := 1; end if;

  -- reia răspunsurile anterioare la aceeași întrebare, cu aceleași cutii și intervale ca în aplicație
  for r in
    select correct, answered_at from public.answers
    where user_id = new.user_id and item_id = new.item_id and id <> new.id
      and (answered_at, id) < (new.answered_at, new.id)
    order by answered_at, id
  loop
    v_new := false;
    if r.correct then v_box := least(v_box + 1, 5); else v_box := 0; end if;
    v_last := r.answered_at;
    v_last_ok := r.correct;
  end loop;

  if v_new then
    v_base := 10;
  else
    v_due := new.answered_at >= v_last + v_steps[v_box + 1] * interval '1 day';
    v_comeback := not v_last_ok;
    v_base := (case when v_due then 15 else 5 end) + (case when v_comeback then 5 else 0 end);
  end if;

  v_pts := v_base * v_mode;
  v_day := (new.answered_at at time zone 'Europe/Bucharest')::date;
  select coalesce(sum(base_points), 0) into v_used
    from public.xp_events where user_id = new.user_id and day = v_day and kind = 'answer';
  v_full := greatest(0, least(v_pts, 400 - v_used));
  v_counted := v_full + 0.25 * (v_pts - v_full);
  v_xp := round(v_counted * v_level)::integer;

  insert into public.xp_events (user_id, session_id, answer_id, kind, day, occurred_at, is_due, is_comeback,
                                mode_mult, level_mult, base_points, counted_points, xp)
  values (new.user_id, new.session_id, new.id, 'answer', v_day, new.answered_at, v_due, v_comeback,
          v_mode, v_level, v_pts, v_counted, v_xp);
  return new;
end $$;

-- Bonusuri fixe, acordate o singură dată la terminarea sesiunii (nu se înmulțesc, nu intră în plafon):
--   +20 pentru o sesiune cu cel puțin 10 răspunsuri și cel puțin 60% corecte
--   +10 pentru prima sesiune terminată a zilei
create or replace function public.award_session_xp() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_launch timestamptz;
  v_n integer;
  v_ok integer;
  v_day date;
begin
  if old.finished_at is not null or new.finished_at is null then return new; end if;
  select launch_at into v_launch from public.league_config limit 1;
  if v_launch is null or new.finished_at < v_launch
     or new.finished_at > now() + interval '5 minutes'
     or new.finished_at < now() - interval '48 hours' then
    return new;
  end if;
  select count(*), count(*) filter (where correct) into v_n, v_ok from public.answers where session_id = new.id;
  v_day := (new.finished_at at time zone 'Europe/Bucharest')::date;

  if v_n >= 10 and v_ok::numeric / v_n >= 0.6 then
    insert into public.xp_events (user_id, session_id, kind, day, occurred_at, base_points, counted_points, xp)
    values (new.user_id, new.id, 'session', v_day, new.finished_at, 20, 20, 20);
  end if;

  if v_n >= 1 and not exists (
    select 1 from public.sessions s
    where s.user_id = new.user_id and s.id <> new.id and s.finished_at is not null
      and s.finished_at < new.finished_at
      and (s.finished_at at time zone 'Europe/Bucharest')::date = v_day
  ) then
    insert into public.xp_events (user_id, session_id, kind, day, occurred_at, base_points, counted_points, xp)
    values (new.user_id, new.id, 'first_of_day', v_day, new.finished_at, 10, 10, 10);
  end if;
  return new;
end $$;

create trigger answers_award_xp after insert on public.answers
  for each row execute function public.award_answer_xp();
create trigger sessions_award_xp after update of finished_at on public.sessions
  for each row execute function public.award_session_xp();

revoke execute on function public.award_answer_xp() from public, anon, authenticated;
revoke execute on function public.award_session_xp() from public, anon, authenticated;

-- XP-ul meu: azi, săptămâna aceasta (luni–duminică, Europe/Bucharest) și săptămâna trecută
create or replace function public.my_xp_summary() returns json
language sql stable security invoker set search_path = public, pg_temp as $$
  select json_build_object(
    'today', coalesce((select sum(xp) from public.xp_events
                       where user_id = auth.uid() and day = (now() at time zone 'Europe/Bucharest')::date), 0),
    'week', coalesce((select sum(xp) from public.xp_events
                      where user_id = auth.uid() and day >= date_trunc('week', now() at time zone 'Europe/Bucharest')::date), 0),
    'last_week', coalesce((select sum(xp) from public.xp_events
                           where user_id = auth.uid()
                             and day >= date_trunc('week', now() at time zone 'Europe/Bucharest')::date - 7
                             and day < date_trunc('week', now() at time zone 'Europe/Bucharest')::date), 0)
  );
$$;
revoke execute on function public.my_xp_summary() from public, anon;
grant execute on function public.my_xp_summary() to authenticated;

-- ======================================================================
-- 5. Clasamentul săptămânal (migrarea league_standings)
-- ======================================================================

-- Clasament săptămânal (luni–duminică, Europe/Bucharest). Îl văd doar cei înscriși și arată doar numele afișat,
-- avatarul, XP-ul, locul și o comparație cu săptămâna trecută; niciodată identificatori, e-mailuri sau răspunsuri.
-- Departajare: XP, apoi acuratețea săptămânii, apoi cine a ajuns primul la scor, apoi numele.
create or replace function public.league_standings() returns json
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
  v_me uuid := auth.uid();
  v_tz constant text := 'Europe/Bucharest';
  v_ws date := date_trunc('week', now() at time zone 'Europe/Bucharest')::date;
  v_result json;
begin
  if v_me is null or not exists (select 1 from public.profiles where user_id = v_me and league_registered) then
    return json_build_object('registered', false);
  end if;

  with members as (
    select user_id, display_name, avatar from public.profiles where league_registered
  ),
  cur as (
    select e.user_id, sum(e.xp)::int as xp, max(e.occurred_at) as last_at
    from public.xp_events e join members m using (user_id) where e.day >= v_ws group by e.user_id
  ),
  prev as (
    select e.user_id, sum(e.xp)::int as xp
    from public.xp_events e join members m using (user_id) where e.day >= v_ws - 7 and e.day < v_ws group by e.user_id
  ),
  acc as (
    select a.user_id, count(*) filter (where a.correct)::numeric / nullif(count(*), 0) as acc
    from public.answers a join members m using (user_id)
    where (a.answered_at at time zone 'Europe/Bucharest')::date >= v_ws group by a.user_id
  ),
  scored as (
    select m.user_id, m.display_name, m.avatar, coalesce(c.xp, 0) as xp, coalesce(p.xp, 0) as last_xp, c.last_at, coalesce(ac.acc, 0) as acc
    from members m left join cur c using (user_id) left join prev p using (user_id) left join acc ac using (user_id)
  ),
  ranked as (
    select s.*, row_number() over (order by xp desc, acc desc, last_at asc nulls last, display_name) as rk from scored s
  ),
  prev_ranked as (
    select user_id, row_number() over (order by last_xp desc, display_name) as prk from scored where last_xp > 0
  )
  select json_build_object(
    'registered', true,
    'week_start', v_ws,
    'week_end', ((v_ws + 7)::timestamp at time zone 'Europe/Bucharest'),
    'members', coalesce(json_agg(json_build_object(
        'rank', r.rk, 'name', r.display_name, 'avatar', r.avatar, 'xp', r.xp,
        'last_xp', r.last_xp, 'last_rank', pr.prk, 'me', r.user_id = v_me) order by r.rk), '[]'::json))
  into v_result
  from ranked r left join prev_ranked pr using (user_id);
  return v_result;
end $$;

revoke execute on function public.league_standings() from public, anon;
grant execute on function public.league_standings() to authenticated;

-- ======================================================================
-- 6. Trepte, grupe, promovări și rezumat de luni (migrarea league_tiers_groups_promotions)
--    Funcția league_standings de mai jos o înlocuiește pe cea din secțiunea 5.
-- ======================================================================

alter table public.profiles add column if not exists league_recap_seen_week date;

create table if not exists public.league_members (
  user_id uuid primary key references auth.users on delete cascade,
  tier smallint not null default 1 check (tier between 1 and 4),
  division integer,
  joined_week date not null
);
create table if not exists public.league_weeks (
  week_start date primary key,
  closed_at timestamptz not null default now()
);
create table if not exists public.league_results (
  week_start date not null,
  user_id uuid not null references auth.users on delete cascade,
  tier smallint not null,
  division integer not null,
  place integer not null,
  group_size integer not null,
  xp integer not null,
  outcome text not null check (outcome in ('promoted', 'demoted', 'stayed', 'inactive')),
  new_tier smallint not null,
  primary key (week_start, user_id)
);
alter table public.league_members enable row level security;
alter table public.league_weeks enable row level security;
alter table public.league_results enable row level security;
revoke all on public.league_members, public.league_weeks, public.league_results from anon, authenticated;

-- Închide o săptămână: clasează fiecare grupă, aplică promovările și retrogradările, apoi reface grupele.
-- Reguli: n ≥ 8 → primii 3 urcă, ultimii 3 coboară; 4–7 → urcă doar primul; sub 4 nimeni; sub 50 XP = inactiv (nu se mută);
-- treapta 1 nu retrogradează, treapta 4 nu promovează; cine s-a alăturat în acea săptămână nu retrogradează.
create or replace function public.league_close_week(p_week date)
 returns void language plpgsql security definer set search_path to 'public', 'pg_temp'
as $function$
begin
  insert into public.league_weeks (week_start) values (p_week) on conflict (week_start) do nothing;
  if not found then return; end if;

  with base as (
    select lm.user_id, lm.tier, lm.division, lm.joined_week, p.display_name,
      coalesce((select sum(e.xp) from public.xp_events e
                where e.user_id = lm.user_id and e.day >= p_week and e.day < p_week + 7), 0)::int as xp,
      (select max(e.occurred_at) from public.xp_events e
        where e.user_id = lm.user_id and e.day >= p_week and e.day < p_week + 7) as last_at,
      (select count(*) filter (where a.correct)::numeric / nullif(count(*), 0) from public.answers a
        where a.user_id = lm.user_id
          and (a.answered_at at time zone 'Europe/Bucharest')::date >= p_week
          and (a.answered_at at time zone 'Europe/Bucharest')::date < p_week + 7) as acc
    from public.league_members lm join public.profiles p on p.user_id = lm.user_id
    where p.league_registered and lm.joined_week <= p_week and lm.division is not null
  ),
  ranked as (
    select b.*,
      count(*) over (partition by tier, division) as n,
      row_number() over (partition by tier, division order by xp desc, coalesce(acc, 0) desc, last_at asc nulls last, display_name) as rk,
      (xp >= 50) as is_active,
      (joined_week = p_week) as is_protected
    from base b
  ),
  act as (
    select r.*,
      case when r.is_active then row_number() over (partition by tier, division, is_active order by rk) end as arank,
      count(*) filter (where r.is_active) over (partition by tier, division) as acount,
      case when r.n >= 8 then 3 when r.n >= 4 then 1 else 0 end as p_slots,
      case when r.n >= 8 then 3 else 0 end as d_slots
    from ranked r
  ),
  step1 as (
    select a.*, (a.is_active and a.tier < 4 and a.arank <= least(a.p_slots, a.acount)) as is_promoted from act a
  ),
  step2 as (
    select s.*,
      case when s.is_active and not s.is_promoted and not s.is_protected
           then row_number() over (partition by tier, division, (is_active and not is_promoted and not is_protected) order by rk desc) end as drank
    from step1 s
  ),
  final as (
    select s2.*,
      case when not s2.is_active then 'inactive'
           when s2.is_promoted then 'promoted'
           when s2.tier > 1 and s2.drank is not null and s2.drank <= s2.d_slots then 'demoted'
           else 'stayed' end as outcome
    from step2 s2
  )
  insert into public.league_results (week_start, user_id, tier, division, place, group_size, xp, outcome, new_tier)
  select p_week, user_id, tier, division, rk, n, xp, outcome,
         (case outcome when 'promoted' then tier + 1 when 'demoted' then tier - 1 else tier end)::smallint
  from final;

  update public.league_members lm set tier = r.new_tier
  from public.league_results r where r.week_start = p_week and r.user_id = lm.user_id;

  -- grupele pentru săptămâna următoare: până la 15 membri într-o treaptă = o grupă, altfel grupe de ~12 echilibrate după XP-ul săptămânii
  with regs as (
    select lm.user_id, lm.tier, coalesce(r.xp, 0) as xp
    from public.league_members lm join public.profiles p on p.user_id = lm.user_id
    left join public.league_results r on r.week_start = p_week and r.user_id = lm.user_id
    where p.league_registered
  ),
  t as (select regs.*, count(*) over (partition by tier) as m, row_number() over (partition by tier order by xp desc, user_id) as i from regs),
  g as (select t.*, case when m <= 15 then 1 else ceil(m / 12.0)::int end as groups from t),
  s as (select g.*, (i - 1) / groups as rnd, (i - 1) % groups as pos from g)
  update public.league_members lm
  set division = case when s.groups = 1 then 1 when s.rnd % 2 = 0 then (s.pos + 1)::int else (s.groups - s.pos)::int end
  from s where s.user_id = lm.user_id;

  update public.league_members lm set division = null
  from public.profiles p where p.user_id = lm.user_id and not p.league_registered;
end $function$;

-- Sincronizare la cerere (fără job programat): creează membrii, le dă grupă și închide săptămânile scadente (luni 06:00, ora României).
create or replace function public.league_sync()
 returns void language plpgsql security definer set search_path to 'public', 'pg_temp'
as $function$
declare
  v_launch timestamptz;
  v_launch_week date;
  v_w date;
  v_div integer;
  r record;
begin
  perform pg_advisory_xact_lock(hashtext('league_sync'));
  select launch_at into v_launch from public.league_config limit 1;
  if v_launch is null then return; end if;
  v_launch_week := date_trunc('week', v_launch at time zone 'Europe/Bucharest')::date;

  insert into public.league_members (user_id, tier, joined_week)
  select p.user_id, 1, greatest(v_launch_week, date_trunc('week', coalesce(p.registered_at, now()) at time zone 'Europe/Bucharest')::date)
  from public.profiles p
  where p.league_registered and not exists (select 1 from public.league_members m where m.user_id = p.user_id);

  for r in
    select lm.user_id, lm.tier from public.league_members lm join public.profiles p on p.user_id = lm.user_id
    where p.league_registered and lm.division is null order by lm.joined_week, lm.user_id
  loop
    select x.d into v_div from (
      select lm2.division as d, count(*) as c
      from public.league_members lm2 join public.profiles p2 on p2.user_id = lm2.user_id
      where p2.league_registered and lm2.tier = r.tier and lm2.division is not null
      group by lm2.division having count(*) < 15 order by count(*), lm2.division limit 1) x;
    if v_div is null then
      select coalesce(max(division), 0) + 1 into v_div from public.league_members where tier = r.tier;
    end if;
    update public.league_members set division = v_div where user_id = r.user_id;
  end loop;

  v_w := coalesce((select max(week_start) + 7 from public.league_weeks), v_launch_week);
  while ((v_w + 7)::timestamp at time zone 'Europe/Bucharest') + interval '6 hours' <= now() loop
    perform public.league_close_week(v_w);
    v_w := v_w + 7;
  end loop;
end $function$;

-- Clasamentul grupei tale + treapta, rezumatul ultimei săptămâni închise (dacă nu l-ai închis) și istoricul pe 12 săptămâni.
-- Nu expune identificatori, e-mailuri sau răspunsuri. Nu mai este „stable”: face și sincronizarea.
create or replace function public.league_standings()
 returns json language plpgsql security definer set search_path to 'public', 'pg_temp'
as $function$
declare
  v_me uuid := auth.uid();
  v_ws date := date_trunc('week', now() at time zone 'Europe/Bucharest')::date;
  v_tier smallint;
  v_div integer;
  v_seen date;
  v_recap json;
  v_hist json;
  v_result json;
begin
  if v_me is null or not exists (select 1 from public.profiles where user_id = v_me and league_registered) then
    return json_build_object('registered', false);
  end if;
  perform public.league_sync();

  select tier, division into v_tier, v_div from public.league_members where user_id = v_me;
  select league_recap_seen_week into v_seen from public.profiles where user_id = v_me;

  select json_build_object('week_start', r.week_start, 'tier', r.tier, 'place', r.place, 'size', r.group_size, 'xp', r.xp,
           'outcome', r.outcome, 'new_tier', r.new_tier,
           'prev_xp', coalesce((select sum(e.xp) from public.xp_events e
                                where e.user_id = v_me and e.day >= r.week_start - 7 and e.day < r.week_start), 0)::int,
           'first_week', not exists (select 1 from public.league_results r0 where r0.user_id = v_me and r0.week_start < r.week_start))
  into v_recap
  from public.league_results r
  where r.user_id = v_me
    and r.week_start = (select max(week_start) from public.league_results where user_id = v_me)
    and (v_seen is null or r.week_start > v_seen);

  select coalesce(json_agg(json_build_object('week_start', h.week_start, 'tier', h.tier, 'place', h.place, 'size', h.group_size,
                                              'xp', h.xp, 'outcome', h.outcome, 'new_tier', h.new_tier) order by h.week_start desc), '[]'::json)
  into v_hist
  from (select * from public.league_results where user_id = v_me order by week_start desc limit 12) h;

  with members as (
    select p.user_id, p.display_name, p.avatar
    from public.league_members lm join public.profiles p on p.user_id = lm.user_id
    where p.league_registered and lm.tier = v_tier and lm.division is not distinct from v_div
  ),
  cur as (
    select e.user_id, sum(e.xp)::int as xp, max(e.occurred_at) as last_at
    from public.xp_events e join members m using (user_id) where e.day >= v_ws group by e.user_id
  ),
  prev as (
    select e.user_id, sum(e.xp)::int as xp
    from public.xp_events e join members m using (user_id) where e.day >= v_ws - 7 and e.day < v_ws group by e.user_id
  ),
  acc as (
    select a.user_id, count(*) filter (where a.correct)::numeric / nullif(count(*), 0) as acc
    from public.answers a join members m using (user_id)
    where (a.answered_at at time zone 'Europe/Bucharest')::date >= v_ws group by a.user_id
  ),
  scored as (
    select m.user_id, m.display_name, m.avatar, coalesce(c.xp, 0) as xp, coalesce(p.xp, 0) as last_xp, c.last_at, coalesce(ac.acc, 0) as acc
    from members m left join cur c using (user_id) left join prev p using (user_id) left join acc ac using (user_id)
  ),
  ranked as (
    select s.*, row_number() over (order by xp desc, acc desc, last_at asc nulls last, display_name) as rk from scored s
  ),
  prev_ranked as (
    select user_id, row_number() over (order by last_xp desc, display_name) as prk from scored where last_xp > 0
  )
  select json_build_object(
    'registered', true,
    'week_start', v_ws,
    'week_end', ((v_ws + 7)::timestamp at time zone 'Europe/Bucharest'),
    'tier', v_tier,
    'division', v_div,
    'recap', v_recap,
    'history', v_hist,
    'members', coalesce(json_agg(json_build_object(
        'rank', r.rk, 'name', r.display_name, 'avatar', r.avatar, 'xp', r.xp,
        'last_xp', r.last_xp, 'last_rank', pr.prk, 'me', r.user_id = v_me) order by r.rk), '[]'::json))
  into v_result
  from ranked r left join prev_ranked pr using (user_id);
  return v_result;
end $function$;

revoke execute on function public.league_close_week(date), public.league_sync() from public, anon, authenticated;
revoke execute on function public.league_standings() from public, anon;
grant execute on function public.league_standings() to authenticated;
