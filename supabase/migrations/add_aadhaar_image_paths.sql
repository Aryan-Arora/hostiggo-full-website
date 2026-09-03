-- Aadhaar KYC now collects front/back photo uploads, not just the typed
-- number. Storage paths only (never a public URL -- the "identity-documents"
-- bucket is private; access is via short-lived signed URLs generated
-- server-side, same pattern as the rest of this table's PII handling: the
-- raw Aadhaar number is never stored, only a last4 + hash).
alter table hostiggo_testing_schema.aadhaar_kyc
  add column if not exists front_image_path text,
  add column if not exists back_image_path text;
