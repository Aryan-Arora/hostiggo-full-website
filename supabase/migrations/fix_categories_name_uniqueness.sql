-- Fixes a live production bug: hostiggo_testing_schema.categories has
-- UNIQUE(name) -- globally, across every user -- instead of the intended
-- per-user uniqueness. In practice this means the very first user to ever
-- create a category named "Saved" (the default wishlist category every
-- guest gets on their first save) permanently claims that name for
-- themselves; every other user's first wishlist save since then has been
-- failing with "duplicate key value violates unique constraint
-- categories_name_key" (confirmed live in Vercel runtime error logs,
-- 11 occurrences since 2026-08-06, /api/wishlist). This has been silently
-- breaking the Save/wishlist feature for effectively every guest except
-- whichever one user got there first.
--
-- Verified before writing this: as of this migration, no (user_id, name)
-- pair is actually duplicated in the live data (21 rows, 0 duplicates), so
-- this is safe to apply directly with no cleanup step.
--
-- Run this once in the Supabase SQL editor for the hostiggo_testing_schema
-- project. Safe to re-run.

alter table hostiggo_testing_schema.categories
  drop constraint if exists categories_name_key;

alter table hostiggo_testing_schema.categories
  add constraint categories_user_id_name_key unique (user_id, name);
