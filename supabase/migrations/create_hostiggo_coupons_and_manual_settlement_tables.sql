-- New tables required by the billing spec (Section 5.6 coupons, Section 4.5
-- manual settlement queue). Neither existed in the schema before this.
-- Run this once in the Supabase SQL editor for the hostiggo_testing_schema
-- project. Safe to re-run (IF NOT EXISTS / CREATE TABLE IF NOT EXISTS).

create table if not exists hostiggo_testing_schema.hostiggo_coupons (
  id bigint generated always as identity primary key,
  code text not null unique,
  discount_type text not null check (discount_type in ('percent', 'fixed')),
  value numeric not null,
  active boolean not null default true,
  expires_at timestamptz,
  usage_limit integer,
  used_count integer not null default 0,
  min_booking_amount numeric,
  created_at timestamptz not null default now()
);

create table if not exists hostiggo_testing_schema.manual_settlement_flags (
  id bigint generated always as identity primary key,
  booking_id bigint not null references hostiggo_testing_schema.bookings(booking_id) on delete cascade,
  reason text not null,
  flagged_at timestamptz not null default now(),
  resolved boolean not null default false,
  resolved_at timestamptz,
  resolved_by uuid,
  notes text
);

create index if not exists manual_settlement_flags_booking_id_idx
  on hostiggo_testing_schema.manual_settlement_flags(booking_id);
create index if not exists manual_settlement_flags_unresolved_idx
  on hostiggo_testing_schema.manual_settlement_flags(resolved) where resolved = false;
