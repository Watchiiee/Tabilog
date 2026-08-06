-- Tabilog initial schema (Phase 2-1)
-- Applied manually via the Supabase SQL Editor.
--
-- RLS is enabled on every table with NO policies. FastAPI connects with the
-- service_role key, which bypasses RLS, so it works as normal. Everyone else
-- (the anon key baked into the app, or any authenticated PostgREST caller)
-- gets denied by default -- all real access must go through FastAPI.

create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  nickname text,
  created_at timestamptz not null default now()
);

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  title text not null,
  start_date date,
  end_date date,
  solar_summary text,
  sentiment_badge text,
  total_distance numeric,
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.places (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  name text,
  latitude double precision,
  longitude double precision,
  visit_order integer,
  memo text,
  rating integer,
  visited_at timestamptz
);

create table public.photos (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places (id) on delete cascade,
  photo_url text not null,
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;
alter table public.trips enable row level security;
alter table public.places enable row level security;
alter table public.photos enable row level security;

-- Mirror every new Supabase Auth signup into public.users.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
