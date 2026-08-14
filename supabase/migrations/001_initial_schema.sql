-- Kine Compliance App — initial schema
-- Run in Supabase SQL Editor or via Supabase CLI

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null,
  clinic_name text,
  created_at timestamptz not null default now()
);

create table public.patients (
  id uuid primary key default gen_random_uuid(),
  therapist_id uuid not null references public.profiles (id) on delete cascade,
  full_name text not null,
  phone_number text not null,
  created_at timestamptz not null default now()
);

create index patients_therapist_id_idx on public.patients (therapist_id);

create table public.exercise_library (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  video_url text not null,
  default_sets integer not null default 3 check (default_sets > 0),
  default_reps integer not null default 10 check (default_reps > 0),
  created_at timestamptz not null default now()
);

create table public.prescriptions (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  therapist_id uuid not null references public.profiles (id) on delete cascade,
  magic_token text not null unique default encode(gen_random_bytes(24), 'hex'),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index prescriptions_patient_id_idx on public.prescriptions (patient_id);
create index prescriptions_therapist_id_idx on public.prescriptions (therapist_id);
create unique index prescriptions_magic_token_idx on public.prescriptions (magic_token);

create table public.prescription_items (
  id uuid primary key default gen_random_uuid(),
  prescription_id uuid not null references public.prescriptions (id) on delete cascade,
  exercise_id uuid not null references public.exercise_library (id) on delete restrict,
  sets integer not null default 3 check (sets > 0),
  reps integer not null default 10 check (reps > 0),
  frequency_per_day integer not null default 1 check (frequency_per_day > 0),
  created_at timestamptz not null default now(),
  unique (prescription_id, exercise_id)
);

create index prescription_items_prescription_id_idx
  on public.prescription_items (prescription_id);

create table public.completion_logs (
  id uuid primary key default gen_random_uuid(),
  prescription_id uuid not null references public.prescriptions (id) on delete cascade,
  completed_at timestamptz not null default now(),
  pain_score integer not null check (pain_score between 1 and 10),
  patient_notes text,
  created_at timestamptz not null default now()
);

create index completion_logs_prescription_id_idx
  on public.completion_logs (prescription_id);
create index completion_logs_completed_at_idx
  on public.completion_logs (completed_at desc);

-- ---------------------------------------------------------------------------
-- Auto-create profile on therapist signup
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, clinic_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'clinic_name'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Patient-facing RPC (magic link, no auth required)
-- ---------------------------------------------------------------------------

create or replace function public.get_prescription_by_token(p_token text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  result json;
begin
  select json_build_object(
    'prescription', json_build_object(
      'id', pr.id,
      'magic_token', pr.magic_token,
      'active', pr.active,
      'created_at', pr.created_at
    ),
    'patient', json_build_object(
      'id', pa.id,
      'full_name', pa.full_name
    ),
    'therapist', json_build_object(
      'clinic_name', pf.clinic_name,
      'full_name', pf.full_name
    ),
    'items', coalesce(
      (
        select json_agg(
          json_build_object(
            'id', pi.id,
            'sets', pi.sets,
            'reps', pi.reps,
            'frequency_per_day', pi.frequency_per_day,
            'exercise', json_build_object(
              'id', el.id,
              'title', el.title,
              'description', el.description,
              'video_url', el.video_url,
              'default_sets', el.default_sets,
              'default_reps', el.default_reps
            )
          )
          order by pi.created_at
        )
        from public.prescription_items pi
        join public.exercise_library el on el.id = pi.exercise_id
        where pi.prescription_id = pr.id
      ),
      '[]'::json
    ),
    'streak_days', (
      with daily_logs as (
        select distinct (completed_at at time zone 'utc')::date as log_date
        from public.completion_logs
        where prescription_id = pr.id
      ),
      streak as (
        select log_date,
          log_date - (row_number() over (order by log_date desc))::integer as grp
        from daily_logs
        where log_date >= (current_date - interval '365 days')
      )
      select count(*)::integer
      from streak
      where grp = (
        select grp from streak where log_date = current_date limit 1
      )
    ),
    'logged_today', exists (
      select 1
      from public.completion_logs cl
      where cl.prescription_id = pr.id
        and (cl.completed_at at time zone 'utc')::date = current_date
    )
  )
  into result
  from public.prescriptions pr
  join public.patients pa on pa.id = pr.patient_id
  join public.profiles pf on pf.id = pr.therapist_id
  where pr.magic_token = p_token
    and pr.active = true;

  if result is null then
    raise exception 'Prescription not found or inactive';
  end if;

  return result;
end;
$$;

create or replace function public.log_completion_by_token(
  p_token text,
  p_pain_score integer,
  p_patient_notes text default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prescription_id uuid;
  v_log_id uuid;
  v_streak integer;
begin
  if p_pain_score < 1 or p_pain_score > 10 then
    raise exception 'Pain score must be between 1 and 10';
  end if;

  select id into v_prescription_id
  from public.prescriptions
  where magic_token = p_token and active = true;

  if v_prescription_id is null then
    raise exception 'Prescription not found or inactive';
  end if;

  if exists (
    select 1 from public.completion_logs
    where prescription_id = v_prescription_id
      and (completed_at at time zone 'utc')::date = current_date
  ) then
    raise exception 'Already logged completion for today';
  end if;

  insert into public.completion_logs (prescription_id, pain_score, patient_notes)
  values (v_prescription_id, p_pain_score, nullif(trim(p_patient_notes), ''))
  returning id into v_log_id;

  select (public.get_prescription_by_token(p_token) ->> 'streak_days')::integer
  into v_streak;

  return json_build_object(
    'log_id', v_log_id,
    'streak_days', v_streak
  );
end;
$$;

grant execute on function public.get_prescription_by_token(text) to anon, authenticated;
grant execute on function public.log_completion_by_token(text, integer, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.patients enable row level security;
alter table public.exercise_library enable row level security;
alter table public.prescriptions enable row level security;
alter table public.prescription_items enable row level security;
alter table public.completion_logs enable row level security;

-- Profiles
create policy "Therapists can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Therapists can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Patients
create policy "Therapists manage own patients"
  on public.patients for all
  using (auth.uid() = therapist_id)
  with check (auth.uid() = therapist_id);

-- Exercise library (shared among authenticated therapists)
create policy "Authenticated therapists can read exercises"
  on public.exercise_library for select
  to authenticated
  using (true);

create policy "Authenticated therapists can insert exercises"
  on public.exercise_library for insert
  to authenticated
  with check (true);

create policy "Authenticated therapists can update exercises"
  on public.exercise_library for update
  to authenticated
  using (true);

create policy "Authenticated therapists can delete exercises"
  on public.exercise_library for delete
  to authenticated
  using (true);

-- Prescriptions
create policy "Therapists manage own prescriptions"
  on public.prescriptions for all
  using (auth.uid() = therapist_id)
  with check (auth.uid() = therapist_id);

-- Prescription items (via parent prescription)
create policy "Therapists manage own prescription items"
  on public.prescription_items for all
  using (
    exists (
      select 1 from public.prescriptions pr
      where pr.id = prescription_id and pr.therapist_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.prescriptions pr
      where pr.id = prescription_id and pr.therapist_id = auth.uid()
    )
  );

-- Completion logs (therapists read; patients write via RPC)
create policy "Therapists read own completion logs"
  on public.completion_logs for select
  using (
    exists (
      select 1 from public.prescriptions pr
      where pr.id = prescription_id and pr.therapist_id = auth.uid()
    )
  );
