-- Records which add-ons were actually purchased with each booking (their
-- price is already folded into bookings.amount at booking time -- this
-- table is the "which ones" record for the guest/host to see later).
--
-- createBooking() in src/lib/services/admin-writes.ts already writes to
-- this table today, wrapped in a try/catch that logs and continues rather
-- than failing the booking if the insert fails -- so bookings work
-- correctly with or without this migration; running it just adds the
-- per-add-on breakdown record.
--
-- Run this once in the Supabase SQL editor for the hostiggo_testing_schema
-- project. Safe to re-run (IF NOT EXISTS).

create table if not exists hostiggo_testing_schema.booking_addons (
  id bigint generated always as identity primary key,
  booking_id bigint not null references hostiggo_testing_schema.bookings(booking_id) on delete cascade,
  name text not null,
  price numeric not null default 0,
  type text,
  created_at timestamptz not null default now()
);

create index if not exists booking_addons_booking_id_idx
  on hostiggo_testing_schema.booking_addons(booking_id);
