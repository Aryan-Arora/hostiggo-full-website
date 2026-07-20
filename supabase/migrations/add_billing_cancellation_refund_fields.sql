-- Billing/cancellation/refund support -- Section 4.6 of the billing spec.
-- Run this once in the Supabase SQL editor for the hostiggo_testing_schema
-- project. Safe to re-run (IF NOT EXISTS).

alter table hostiggo_testing_schema.bookings
  add column if not exists razorpay_payment_id text,
  add column if not exists refund_status text, -- null | 'processing' | 'processed' | 'failed' | 'not_applicable' | 'flagged_for_manual_settlement'
  add column if not exists refund_amount numeric,
  add column if not exists refund_reason text,
  add column if not exists refund_transaction_id text,
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancelled_by uuid,
  add column if not exists policy_used text, -- 'flexible' | 'moderate' | 'strict'
  add column if not exists refund_processed_at timestamptz,
  add column if not exists payout_released_at timestamptz;

alter table hostiggo_testing_schema.listings
  add column if not exists cancellation_policy text not null default 'moderate';
-- Application code treats any unrecognized value as 'moderate'; add a check
-- constraint once you've confirmed no existing rows have unexpected values:
--   alter table hostiggo_testing_schema.listings
--     add constraint listings_cancellation_policy_check
--     check (cancellation_policy in ('flexible', 'moderate', 'strict'));

alter table hostiggo_testing_schema.listing_discounts
  add column if not exists valid_from timestamptz,
  add column if not exists valid_to timestamptz,
  add column if not exists min_stay_nights integer;

-- Optional: a true Postgres advisory-lock RPC for stronger cancellation
-- concurrency protection than the conditional-UPDATE guard already used in
-- cancelBookingWithRefund(). Not required for the app to work -- the
-- conditional UPDATE is a real (if weaker) guard on its own.
create or replace function hostiggo_testing_schema.try_lock_booking_cancellation(p_booking_id bigint)
returns boolean
language plpgsql
as $$
begin
  return pg_try_advisory_xact_lock(hashtext('booking_cancel:' || p_booking_id::text));
end;
$$;
