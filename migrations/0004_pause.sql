-- Parent can remotely pause a child's device without changing the weekly quota.
alter table children add column if not exists paused boolean not null default false;
