-- Audit trail for direct SurePass verification calls made from this app's
-- own /api/verify/{pan,passport,bank} routes -- mirrors the kyc_requests /
-- {pan,passport,bank}_verifications shape already used by the
-- surepass-verify-id / surepass-verify-bank Supabase Edge Functions (same
-- Supabase project, different schema: those write to `public`, this app
-- keeps its own tables in hostiggo_testing_schema like everything else it
-- owns, e.g. aadhaar_kyc).
--
-- Every attempt is logged, success or failure, so a rejection is
-- debuggable and there's a compliance record. Raw PAN/passport/account
-- numbers are never stored -- only masked (first 2 + last 2 chars visible)
-- or hashed values, same convention as aadhaar_kyc.aadhaar_hash.

create table if not exists hostiggo_testing_schema.kyc_requests (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  service_type text not null check (service_type in ('pan', 'passport', 'bank', 'aadhaar')),
  masked_id text,
  status text not null,
  provider_ref_id text,
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists idx_kyc_requests_user_id
  on hostiggo_testing_schema.kyc_requests(user_id);

create table if not exists hostiggo_testing_schema.pan_verifications (
  id bigint generated always as identity primary key,
  kyc_request_id bigint not null references hostiggo_testing_schema.kyc_requests(id) on delete cascade,
  pan_number_masked text,
  full_name text,
  pan_status text,
  pan_status_desc text,
  aadhaar_seeding_status text,
  is_valid boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists hostiggo_testing_schema.passport_verifications (
  id bigint generated always as identity primary key,
  kyc_request_id bigint not null references hostiggo_testing_schema.kyc_requests(id) on delete cascade,
  file_number_masked text,
  passport_number_masked text,
  full_name text,
  dob text,
  nationality text,
  is_valid boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists hostiggo_testing_schema.bank_verifications (
  id bigint generated always as identity primary key,
  kyc_request_id bigint not null references hostiggo_testing_schema.kyc_requests(id) on delete cascade,
  account_hash text,
  account_last4 text,
  ifsc_code text,
  account_holder_name text,
  bank_name text,
  is_valid boolean not null default false,
  created_at timestamptz not null default now()
);

alter table hostiggo_testing_schema.kyc_requests enable row level security;
alter table hostiggo_testing_schema.pan_verifications enable row level security;
alter table hostiggo_testing_schema.passport_verifications enable row level security;
alter table hostiggo_testing_schema.bank_verifications enable row level security;

-- Read-only for the owning user; no insert/update/delete policy for
-- `authenticated` at all -- only the service-role key (used exclusively by
-- our /api/verify/* route handlers) can write, so even a direct PostgREST
-- call can't fabricate a "verified" row.
create policy "select own kyc_requests" on hostiggo_testing_schema.kyc_requests
  for select to authenticated
  using (user_id = auth.uid());

create policy "select own pan_verifications" on hostiggo_testing_schema.pan_verifications
  for select to authenticated
  using (exists (
    select 1 from hostiggo_testing_schema.kyc_requests kr
    where kr.id = pan_verifications.kyc_request_id and kr.user_id = auth.uid()
  ));

create policy "select own passport_verifications" on hostiggo_testing_schema.passport_verifications
  for select to authenticated
  using (exists (
    select 1 from hostiggo_testing_schema.kyc_requests kr
    where kr.id = passport_verifications.kyc_request_id and kr.user_id = auth.uid()
  ));

create policy "select own bank_verifications" on hostiggo_testing_schema.bank_verifications
  for select to authenticated
  using (exists (
    select 1 from hostiggo_testing_schema.kyc_requests kr
    where kr.id = bank_verifications.kyc_request_id and kr.user_id = auth.uid()
  ));
