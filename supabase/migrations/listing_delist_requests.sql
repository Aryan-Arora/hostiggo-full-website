-- Non-destructive, deferred listing removal (QA #13).
--
-- "Remove listing" used to hard-DELETE the listing and its child rows (and
-- the API route had no auth at all). Now it only records a delist request:
--   * no upcoming bookings  -> the listing is delisted once the request is
--                              24 hours old
--   * upcoming bookings     -> the listing stays live/bookable until every
--                              non-cancelled booking has checked out, then
--                              it is delisted
-- Both cases are the same rule: delist when the request is >= 24h old AND
-- there is no non-cancelled booking whose end_date is today or later.
-- A pg_cron job applies that rule every 15 minutes. Delisting hides the
-- listing (is_active = false, lisiting_status = 3 "Deleted") but keeps the
-- row, its photos and booking history -- nothing is deleted, and support
-- can see every request via delist_requested_at / delist_requested_by.

alter table hostiggo_testing_schema.listings
  add column if not exists delist_requested_at timestamptz,
  add column if not exists delist_requested_by uuid,
  add column if not exists delist_reason text,
  add column if not exists delisted_at timestamptz;

create index if not exists listings_pending_delist_idx
  on hostiggo_testing_schema.listings (delist_requested_at)
  where delist_requested_at is not null and delisted_at is null;

create or replace function hostiggo_testing_schema.process_pending_delistings()
returns integer
language plpgsql
security definer
set search_path = hostiggo_testing_schema, public
as $$
declare
  n integer;
begin
  update hostiggo_testing_schema.listings l
     set is_active = false,
         lisiting_status = 3,
         delisted_at = now(),
         updated_at = now()
   where l.delist_requested_at is not null
     and l.delisted_at is null
     and l.delist_requested_at <= now() - interval '24 hours'
     and not exists (
       select 1
         from hostiggo_testing_schema.bookings b
        where b.listing_id = l.listing_id
          and coalesce(b.status_id, 0) <> 3          -- 3 = CANCELLED
          and b.end_date >= current_date              -- not yet checked out
     );
  get diagnostics n = row_count;
  return n;
end;
$$;

revoke all on function hostiggo_testing_schema.process_pending_delistings() from public, anon, authenticated;

select cron.schedule(
  'process-pending-delistings',
  '*/15 * * * *',
  $$select hostiggo_testing_schema.process_pending_delistings()$$
);
