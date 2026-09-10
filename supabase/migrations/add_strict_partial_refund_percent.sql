-- The Strict cancellation policy's "partial refund if cancelled >= 7 days
-- out" was previously a hardcoded 50% for every listing platform-wide (see
-- the comment on CANCELLATION_POLICY_DEFAULTS.strictPartialRefundPercent in
-- src/lib/billing/refund.ts -- explicitly flagged there as an unconfirmed
-- guess). This makes it a real per-listing value a host sets when choosing
-- the Strict policy; null falls back to the platform default (50%).
alter table hostiggo_testing_schema.listings
  add column if not exists strict_partial_refund_percent numeric;

comment on column hostiggo_testing_schema.listings.strict_partial_refund_percent is
  'Fraction (0-1) refunded under the Strict cancellation policy when cancelled >= strictPartialRefundDays out. Null = platform default (50%).';
