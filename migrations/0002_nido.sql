-- Nido family control schema. Per-user rows always carry user_id (parent).

create table if not exists families (
  id text primary key,
  user_id text not null unique,
  name text not null,
  pin_hash text not null,
  pin_failed int not null default 0,
  pin_locked_until timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists children (
  id text primary key,
  family_id text not null references families(id) on delete cascade,
  user_id text not null,
  name text not null,
  age_band text not null,
  avatar_key text not null default 'pine',
  daily_minutes int not null default 90,
  weekly_minutes int not null default 630,
  bedtime_start text,
  bedtime_end text,
  pairing_code text,
  pairing_expires_at timestamptz,
  pairing_token_hash text,
  device_name text,
  last_seen_at timestamptz,
  last_heartbeat_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists children_user_id_idx on children (user_id);
create unique index if not exists children_pairing_code_uidx
  on children (pairing_code) where pairing_code is not null;

create table if not exists day_limits (
  child_id text not null,
  user_id text not null,
  weekday int not null,
  minutes int not null,
  primary key (child_id, weekday)
);

create table if not exists filter_settings (
  child_id text primary key,
  user_id text not null,
  block_adult boolean not null default true,
  block_violence boolean not null default true,
  block_gambling boolean not null default true,
  block_drugs boolean not null default true,
  block_hate boolean not null default true,
  block_social boolean not null default false,
  block_image_search boolean not null default true,
  force_safe_search boolean not null default true
);

create table if not exists blocked_sites (
  id serial primary key,
  child_id text not null,
  user_id text not null,
  host text not null,
  created_at timestamptz not null default now()
);

create table if not exists allowed_sites (
  id serial primary key,
  child_id text not null,
  user_id text not null,
  host text not null
);

create unique index if not exists blocked_sites_host_uidx on blocked_sites (child_id, host);
create unique index if not exists allowed_sites_host_uidx on allowed_sites (child_id, host);

create table if not exists app_toggles (
  child_id text not null,
  user_id text not null,
  app_id text not null,
  allowed boolean not null,
  primary key (child_id, app_id)
);

create table if not exists usage_days (
  child_id text not null,
  user_id text not null,
  day date not null,
  seconds int not null default 0,
  primary key (child_id, day)
);

create table if not exists extra_grants (
  id serial primary key,
  child_id text not null,
  user_id text not null,
  minutes int not null,
  day date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists time_requests (
  id serial primary key,
  child_id text not null,
  user_id text not null,
  minutes int not null,
  reason text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create index if not exists time_requests_pending_idx
  on time_requests (user_id, status, created_at desc);

create table if not exists activity_log (
  id serial primary key,
  child_id text not null,
  user_id text not null,
  kind text not null,
  detail text,
  created_at timestamptz not null default now()
);

create index if not exists activity_log_child_idx
  on activity_log (child_id, created_at desc);
