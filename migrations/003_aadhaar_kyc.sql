-- Migration: Aadhaar KYC submissions, collected at login.
--
-- We never store the raw 12-digit Aadhaar number: only the last 4 digits
-- (for display back to the user) and a SHA-256 hash (for duplicate
-- detection / future matching against a real verification provider). This
-- table records that a user *submitted* their Aadhaar details -- it is not
-- a live verification result. Actual verification requires integrating a
-- UIDAI-licensed KYC provider (e.g. via DigiLocker or an eKYC API), which
-- is a separate, follow-up integration.

CREATE TABLE IF NOT EXISTS hostiggo_testing_schema.aadhaar_kyc (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL,
  full_name TEXT NOT NULL,
  aadhaar_last4 TEXT NOT NULL,
  aadhaar_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_aadhaar_kyc_user_id
ON hostiggo_testing_schema.aadhaar_kyc(user_id);

CREATE INDEX IF NOT EXISTS idx_aadhaar_kyc_hash
ON hostiggo_testing_schema.aadhaar_kyc(aadhaar_hash);

ALTER TABLE hostiggo_testing_schema.aadhaar_kyc ENABLE ROW LEVEL SECURITY;
-- No anon-role policies are created -- this table is only ever written to
-- or read from server-side API routes using the service-role key, which
-- bypasses RLS. This matches the pattern used for other private,
-- user-scoped tables in this schema (e.g. wishlists).
