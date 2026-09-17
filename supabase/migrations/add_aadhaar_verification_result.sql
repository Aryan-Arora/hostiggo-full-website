-- Aadhaar KYC now runs a live SurePass check (via the surepass-verify-id
-- Supabase Edge Function shared with the Hostiggo mobile app) instead of
-- always leaving a submission at 'pending'. Persist the provider's
-- reference id (for support/audit lookups) and the reason a submission was
-- rejected or is still pending, so the dashboard banner and Settings can
-- show the host why.
alter table hostiggo_testing_schema.aadhaar_kyc
  add column if not exists provider_reference text,
  add column if not exists reason text;
