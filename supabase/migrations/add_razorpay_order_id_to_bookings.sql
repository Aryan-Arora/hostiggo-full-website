-- Adds bookings.razorpay_order_id, alongside the existing
-- bookings.razorpay_payment_id (added by
-- add_billing_cancellation_refund_fields.sql). Both are set together by
-- finalizeBookingFromRazorpayOrder() the moment a payment is verified --
-- razorpay_payment_id is the idempotency key that stops a booking being
-- double-inserted if the checkout callback and the payment.captured webhook
-- both fire for the same payment; razorpay_order_id is kept alongside it so
-- a booking can be traced back to the order that created it (support
-- lookups, reconciliation) without a round trip to Razorpay's API.
-- Run this once in the Supabase SQL editor for the hostiggo_testing_schema
-- project. Safe to re-run (IF NOT EXISTS).

alter table hostiggo_testing_schema.bookings
  add column if not exists razorpay_order_id text;

create index if not exists bookings_razorpay_payment_id_idx
  on hostiggo_testing_schema.bookings (razorpay_payment_id);
