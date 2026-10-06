-- Per-family subscription: 30-day trial, then 3.99 EUR / month.

alter table families add column if not exists trial_ends_at timestamptz;
alter table families add column if not exists paid_until timestamptz;

update families
set trial_ends_at = created_at + interval '30 days'
where trial_ends_at is null;

create table if not exists payments (
  id serial primary key,
  family_id text not null references families(id) on delete cascade,
  user_id text not null,
  amount_cents int not null,
  currency text not null default 'eur',
  kind text not null,
  created_at timestamptz not null default now()
);

create index if not exists payments_family_idx on payments (family_id, created_at desc);
