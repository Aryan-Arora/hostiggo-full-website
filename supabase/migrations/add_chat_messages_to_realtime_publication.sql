-- The `supabase_realtime` publication had zero tables in it, so no
-- postgres_changes subscription anywhere in the app was ever receiving
-- INSERT/UPDATE/DELETE events -- chat's live-message push (both guest and
-- host sides) was silently dead regardless of the client-side filter
-- syntax bug fixed alongside this migration. Adding chat_messages (in its
-- actual schema, hostiggo_testing_schema, not public) restores it.
alter publication supabase_realtime add table hostiggo_testing_schema.chat_messages;
