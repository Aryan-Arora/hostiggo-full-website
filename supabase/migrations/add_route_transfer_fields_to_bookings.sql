-- Route split-payment tracking. A guest's payment is captured in full,
-- then a Transfer splits the host's net share off to their Linked Account
-- (see src/lib/billing/razorpayRoute.ts). These fields track that transfer
-- and its eventual settlement, arriving asynchronously via
-- /api/webhooks/razorpay (transfer.processed / settlement.processed).
alter table hostiggo_testing_schema.bookings
  add column if not exists razorpay_transfer_id text,
  -- null            -- no transfer attempted yet (e.g. host not onboarded to Route)
  -- 'created'        -- Transfer API call succeeded, not yet processed
  -- 'processed'      -- Razorpay confirmed the transfer went through
  -- 'failed'         -- Transfer API call itself failed (see manual_settlement_flags)
  add column if not exists transfer_status text
    check (transfer_status is null or transfer_status in ('created', 'processed', 'failed')),
  add column if not exists settlement_id text,
  add column if not exists settlement_status text
    check (settlement_status is null or settlement_status in ('pending', 'processed')),
  add column if not exists utr text;

create index if not exists bookings_razorpay_transfer_id_idx
  on hostiggo_testing_schema.bookings (razorpay_transfer_id);
