-- Adds the columns backing the guest Account Settings toggles
-- (Notifications + Privacy tabs). Run this once in the Supabase SQL editor
-- for the hostiggo_testing_schema project. Safe to re-run (IF NOT EXISTS).

alter table hostiggo_testing_schema.users
  add column if not exists email_notifications boolean not null default true,
  add column if not exists sms_alerts boolean not null default true,
  add column if not exists promo_notifications boolean not null default false,
  add column if not exists host_message_notifications boolean not null default true,
  add column if not exists show_profile_to_hosts boolean not null default true,
  add column if not exists include_in_search boolean not null default true,
  add column if not exists activity_status boolean not null default true;
