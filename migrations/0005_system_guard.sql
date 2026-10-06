-- Parent records whether Family Link (Android) or Screen Time (iOS) is set up
-- for this child. Nido cannot drive those system APIs; this is the checklist.
alter table children add column if not exists device_os text;
alter table children add column if not exists system_guard boolean not null default false;
