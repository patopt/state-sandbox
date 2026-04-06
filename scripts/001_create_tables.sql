-- Pax Historia Game Database Schema
-- This creates all the tables needed for the country simulation game

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =====================================================
-- PROFILES TABLE (extends auth.users)
-- =====================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  avatar_url text,
  president_image_url text,
  openai_api_key text,
  google_api_key text,
  preferred_ai_provider text default 'openai' check (preferred_ai_provider in ('openai', 'google')),
  preferred_model text default 'gpt-4o',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
create policy "profiles_delete_own" on public.profiles for delete using (auth.uid() = id);

-- =====================================================
-- GAME SESSIONS (Countries/Nations)
-- =====================================================
create table if not exists public.game_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  country_name text not null,
  government_type text not null,
  flag_svg text,
  description text,
  current_date text not null default '2024-01', -- Format: YYYY-MM
  turn_number integer default 1,
  is_active boolean default true,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now()
);

alter table public.game_sessions enable row level security;

create policy "game_sessions_select_own" on public.game_sessions for select using (auth.uid() = user_id);
create policy "game_sessions_insert_own" on public.game_sessions for insert with check (auth.uid() = user_id);
create policy "game_sessions_update_own" on public.game_sessions for update using (auth.uid() = user_id);
create policy "game_sessions_delete_own" on public.game_sessions for delete using (auth.uid() = user_id);

-- =====================================================
-- COUNTRY STATS (Economy, Population, etc.)
-- =====================================================
create table if not exists public.country_stats (
  id uuid primary key default uuid_generate_v4(),
  game_session_id uuid references public.game_sessions(id) on delete cascade not null,
  date text not null, -- Format: YYYY-MM
  
  -- Economy
  gdp numeric default 1000000000000, -- 1 trillion default
  gdp_growth_rate numeric default 0.025,
  inflation_rate numeric default 0.02,
  unemployment_rate numeric default 0.05,
  debt_to_gdp numeric default 0.60,
  trade_balance numeric default 0,
  tax_revenue numeric default 0,
  government_spending numeric default 0,
  
  -- Population
  total_population bigint default 50000000,
  birth_rate numeric default 0.012,
  death_rate numeric default 0.008,
  immigration_rate numeric default 0.002,
  literacy_rate numeric default 0.95,
  life_expectancy numeric default 78,
  human_development_index numeric default 0.85,
  
  -- Government
  approval_rating numeric default 0.50,
  political_stability numeric default 0.70,
  corruption_index numeric default 0.30,
  freedom_index numeric default 0.75,
  
  -- Military
  military_personnel bigint default 500000,
  military_budget numeric default 50000000000,
  military_strength_index numeric default 0.60,
  nuclear_weapons boolean default false,
  
  -- Infrastructure
  infrastructure_quality numeric default 0.70,
  internet_penetration numeric default 0.85,
  electricity_access numeric default 0.99,
  road_quality numeric default 0.70,
  
  -- Resources
  oil_reserves numeric default 0,
  natural_gas_reserves numeric default 0,
  coal_reserves numeric default 0,
  renewable_energy_percent numeric default 0.20,
  
  created_at timestamptz default now() not null
);

alter table public.country_stats enable row level security;

create policy "country_stats_select" on public.country_stats 
  for select using (
    exists (
      select 1 from public.game_sessions 
      where id = country_stats.game_session_id 
      and user_id = auth.uid()
    )
  );
create policy "country_stats_insert" on public.country_stats 
  for insert with check (
    exists (
      select 1 from public.game_sessions 
      where id = country_stats.game_session_id 
      and user_id = auth.uid()
    )
  );

-- =====================================================
-- REGIONS (Map areas that can be controlled)
-- =====================================================
create table if not exists public.regions (
  id uuid primary key default uuid_generate_v4(),
  game_session_id uuid references public.game_sessions(id) on delete cascade not null,
  name text not null,
  region_type text default 'territory' check (region_type in ('capital', 'territory', 'colony', 'disputed')),
  population bigint default 1000000,
  area_km2 numeric default 10000,
  terrain_type text default 'plains' check (terrain_type in ('plains', 'mountains', 'desert', 'forest', 'coastal', 'urban', 'tundra', 'jungle')),
  resource_richness numeric default 0.5,
  development_level numeric default 0.5,
  loyalty numeric default 0.8,
  is_controlled boolean default true,
  map_coordinates jsonb, -- {x, y, width, height} for SVG rendering
  color text default '#3b82f6',
  created_at timestamptz default now() not null
);

alter table public.regions enable row level security;

create policy "regions_select" on public.regions 
  for select using (
    exists (
      select 1 from public.game_sessions 
      where id = regions.game_session_id 
      and user_id = auth.uid()
    )
  );
create policy "regions_insert" on public.regions 
  for insert with check (
    exists (
      select 1 from public.game_sessions 
      where id = regions.game_session_id 
      and user_id = auth.uid()
    )
  );
create policy "regions_update" on public.regions 
  for update using (
    exists (
      select 1 from public.game_sessions 
      where id = regions.game_session_id 
      and user_id = auth.uid()
    )
  );

-- =====================================================
-- CITIES (Micropolis-style city management)
-- =====================================================
create table if not exists public.cities (
  id uuid primary key default uuid_generate_v4(),
  game_session_id uuid references public.game_sessions(id) on delete cascade not null,
  region_id uuid references public.regions(id) on delete cascade not null,
  name text not null,
  city_type text default 'city' check (city_type in ('capital', 'metropolis', 'city', 'town', 'village', 'military_base', 'port', 'industrial')),
  population bigint default 100000,
  
  -- Micropolis Zones
  residential_zones integer default 10,
  commercial_zones integer default 5,
  industrial_zones integer default 3,
  
  -- Infrastructure
  power_plants integer default 1,
  power_capacity integer default 100,
  power_demand integer default 50,
  water_facilities integer default 1,
  water_capacity integer default 100,
  water_demand integer default 50,
  roads_km integer default 100,
  rail_km integer default 20,
  
  -- Services
  hospitals integer default 2,
  schools integer default 5,
  universities integer default 1,
  police_stations integer default 3,
  fire_stations integer default 2,
  
  -- Economy
  local_gdp numeric default 10000000000,
  tax_rate numeric default 0.10,
  unemployment numeric default 0.05,
  crime_rate numeric default 0.05,
  pollution_level numeric default 0.20,
  happiness numeric default 0.70,
  
  -- Generated image
  city_image_url text,
  
  map_x integer default 0,
  map_y integer default 0,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now()
);

alter table public.cities enable row level security;

create policy "cities_select" on public.cities 
  for select using (
    exists (
      select 1 from public.game_sessions 
      where id = cities.game_session_id 
      and user_id = auth.uid()
    )
  );
create policy "cities_insert" on public.cities 
  for insert with check (
    exists (
      select 1 from public.game_sessions 
      where id = cities.game_session_id 
      and user_id = auth.uid()
    )
  );
create policy "cities_update" on public.cities 
  for update using (
    exists (
      select 1 from public.game_sessions 
      where id = cities.game_session_id 
      and user_id = auth.uid()
    )
  );

-- =====================================================
-- MILITARY UNITS (Freeciv-style)
-- =====================================================
create table if not exists public.military_units (
  id uuid primary key default uuid_generate_v4(),
  game_session_id uuid references public.game_sessions(id) on delete cascade not null,
  region_id uuid references public.regions(id) on delete set null,
  city_id uuid references public.cities(id) on delete set null,
  
  name text not null,
  unit_type text not null check (unit_type in (
    'infantry', 'mechanized_infantry', 'armored', 'artillery', 
    'air_force', 'navy', 'special_forces', 'missile', 'nuclear',
    'cavalry', 'militia', 'marines', 'paratroopers'
  )),
  
  strength integer default 100, -- 0-100
  morale integer default 80, -- 0-100
  experience integer default 0, -- 0-100
  personnel integer default 1000,
  equipment_quality numeric default 0.7,
  
  -- Movement
  movement_points integer default 2,
  max_movement integer default 2,
  position_x integer default 0,
  position_y integer default 0,
  
  -- Combat stats
  attack_power integer default 10,
  defense_power integer default 10,
  range integer default 1,
  
  maintenance_cost numeric default 1000000,
  is_active boolean default true,
  
  created_at timestamptz default now() not null,
  updated_at timestamptz default now()
);

alter table public.military_units enable row level security;

create policy "military_units_select" on public.military_units 
  for select using (
    exists (
      select 1 from public.game_sessions 
      where id = military_units.game_session_id 
      and user_id = auth.uid()
    )
  );
create policy "military_units_insert" on public.military_units 
  for insert with check (
    exists (
      select 1 from public.game_sessions 
      where id = military_units.game_session_id 
      and user_id = auth.uid()
    )
  );
create policy "military_units_update" on public.military_units 
  for update using (
    exists (
      select 1 from public.game_sessions 
      where id = military_units.game_session_id 
      and user_id = auth.uid()
    )
  );
create policy "military_units_delete" on public.military_units 
  for delete using (
    exists (
      select 1 from public.game_sessions 
      where id = military_units.game_session_id 
      and user_id = auth.uid()
    )
  );

-- =====================================================
-- AI NATIONS (Computer-controlled countries)
-- =====================================================
create table if not exists public.ai_nations (
  id uuid primary key default uuid_generate_v4(),
  game_session_id uuid references public.game_sessions(id) on delete cascade not null,
  name text not null,
  government_type text not null,
  flag_svg text,
  
  -- Personality traits for AI behavior
  aggression numeric default 0.5, -- 0-1
  diplomacy numeric default 0.5, -- 0-1
  economic_focus numeric default 0.5, -- 0-1
  military_focus numeric default 0.5, -- 0-1
  
  -- Stats
  military_strength numeric default 0.5,
  economic_strength numeric default 0.5,
  population bigint default 30000000,
  
  -- Relations with player (-1 to 1)
  relation_score numeric default 0,
  relation_status text default 'neutral' check (relation_status in (
    'allied', 'friendly', 'neutral', 'unfriendly', 'hostile', 'at_war'
  )),
  
  is_active boolean default true,
  created_at timestamptz default now() not null
);

alter table public.ai_nations enable row level security;

create policy "ai_nations_select" on public.ai_nations 
  for select using (
    exists (
      select 1 from public.game_sessions 
      where id = ai_nations.game_session_id 
      and user_id = auth.uid()
    )
  );
create policy "ai_nations_insert" on public.ai_nations 
  for insert with check (
    exists (
      select 1 from public.game_sessions 
      where id = ai_nations.game_session_id 
      and user_id = auth.uid()
    )
  );
create policy "ai_nations_update" on public.ai_nations 
  for update using (
    exists (
      select 1 from public.game_sessions 
      where id = ai_nations.game_session_id 
      and user_id = auth.uid()
    )
  );

-- =====================================================
-- DIPLOMATIC TREATIES
-- =====================================================
create table if not exists public.treaties (
  id uuid primary key default uuid_generate_v4(),
  game_session_id uuid references public.game_sessions(id) on delete cascade not null,
  ai_nation_id uuid references public.ai_nations(id) on delete cascade not null,
  
  treaty_type text not null check (treaty_type in (
    'trade_agreement', 'non_aggression_pact', 'defensive_alliance',
    'military_alliance', 'peace_treaty', 'ceasefire', 'embargo',
    'open_borders', 'research_agreement'
  )),
  
  terms jsonb,
  start_date text not null, -- YYYY-MM
  end_date text, -- YYYY-MM or null for indefinite
  is_active boolean default true,
  
  created_at timestamptz default now() not null
);

alter table public.treaties enable row level security;

create policy "treaties_select" on public.treaties 
  for select using (
    exists (
      select 1 from public.game_sessions 
      where id = treaties.game_session_id 
      and user_id = auth.uid()
    )
  );
create policy "treaties_insert" on public.treaties 
  for insert with check (
    exists (
      select 1 from public.game_sessions 
      where id = treaties.game_session_id 
      and user_id = auth.uid()
    )
  );
create policy "treaties_update" on public.treaties 
  for update using (
    exists (
      select 1 from public.game_sessions 
      where id = treaties.game_session_id 
      and user_id = auth.uid()
    )
  );

-- =====================================================
-- TECHNOLOGIES (Tech tree like Freeciv)
-- =====================================================
create table if not exists public.technologies (
  id uuid primary key default uuid_generate_v4(),
  game_session_id uuid references public.game_sessions(id) on delete cascade not null,
  
  name text not null,
  category text not null check (category in (
    'military', 'economy', 'infrastructure', 'social', 'science', 'culture'
  )),
  tier integer default 1, -- 1-5
  
  is_researched boolean default false,
  research_progress numeric default 0, -- 0-100
  research_cost integer default 1000,
  
  effects jsonb, -- {gdp_bonus: 0.05, military_attack: 10, etc.}
  prerequisites text[], -- Array of tech names required
  
  created_at timestamptz default now() not null
);

alter table public.technologies enable row level security;

create policy "technologies_select" on public.technologies 
  for select using (
    exists (
      select 1 from public.game_sessions 
      where id = technologies.game_session_id 
      and user_id = auth.uid()
    )
  );
create policy "technologies_insert" on public.technologies 
  for insert with check (
    exists (
      select 1 from public.game_sessions 
      where id = technologies.game_session_id 
      and user_id = auth.uid()
    )
  );
create policy "technologies_update" on public.technologies 
  for update using (
    exists (
      select 1 from public.game_sessions 
      where id = technologies.game_session_id 
      and user_id = auth.uid()
    )
  );

-- =====================================================
-- HISTORICAL EVENTS (with AI-generated images)
-- =====================================================
create table if not exists public.historical_events (
  id uuid primary key default uuid_generate_v4(),
  game_session_id uuid references public.game_sessions(id) on delete cascade not null,
  
  date text not null, -- YYYY-MM
  title text not null,
  description text not null,
  event_type text not null check (event_type in (
    'political', 'economic', 'military', 'natural_disaster', 
    'cultural', 'technological', 'diplomatic', 'social'
  )),
  
  severity text default 'moderate' check (severity in ('minor', 'moderate', 'major', 'critical')),
  
  -- AI-generated image via Nano Banana
  event_image_url text,
  image_prompt text,
  
  effects jsonb, -- What changed as a result
  player_choices jsonb, -- What options were available
  chosen_action text, -- What the player did
  
  created_at timestamptz default now() not null
);

alter table public.historical_events enable row level security;

create policy "historical_events_select" on public.historical_events 
  for select using (
    exists (
      select 1 from public.game_sessions 
      where id = historical_events.game_session_id 
      and user_id = auth.uid()
    )
  );
create policy "historical_events_insert" on public.historical_events 
  for insert with check (
    exists (
      select 1 from public.game_sessions 
      where id = historical_events.game_session_id 
      and user_id = auth.uid()
    )
  );

-- =====================================================
-- GAME TURN HISTORY
-- =====================================================
create table if not exists public.turn_history (
  id uuid primary key default uuid_generate_v4(),
  game_session_id uuid references public.game_sessions(id) on delete cascade not null,
  
  turn_number integer not null,
  date text not null, -- YYYY-MM
  
  -- Snapshots of key metrics
  stats_snapshot jsonb not null,
  
  -- Actions taken this turn
  player_actions jsonb,
  ai_actions jsonb,
  
  -- Events that occurred
  events jsonb,
  
  -- Executive report generated by AI
  executive_report text,
  
  created_at timestamptz default now() not null
);

alter table public.turn_history enable row level security;

create policy "turn_history_select" on public.turn_history 
  for select using (
    exists (
      select 1 from public.game_sessions 
      where id = turn_history.game_session_id 
      and user_id = auth.uid()
    )
  );
create policy "turn_history_insert" on public.turn_history 
  for insert with check (
    exists (
      select 1 from public.game_sessions 
      where id = turn_history.game_session_id 
      and user_id = auth.uid()
    )
  );

-- =====================================================
-- AUTO-CREATE PROFILE ON SIGNUP TRIGGER
-- =====================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
create index if not exists idx_game_sessions_user_id on public.game_sessions(user_id);
create index if not exists idx_country_stats_game_session on public.country_stats(game_session_id);
create index if not exists idx_regions_game_session on public.regions(game_session_id);
create index if not exists idx_cities_game_session on public.cities(game_session_id);
create index if not exists idx_cities_region on public.cities(region_id);
create index if not exists idx_military_units_game_session on public.military_units(game_session_id);
create index if not exists idx_ai_nations_game_session on public.ai_nations(game_session_id);
create index if not exists idx_technologies_game_session on public.technologies(game_session_id);
create index if not exists idx_historical_events_game_session on public.historical_events(game_session_id);
create index if not exists idx_turn_history_game_session on public.turn_history(game_session_id);
