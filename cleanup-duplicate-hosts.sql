-- CLEANUP: Remove duplicate host records
-- This script identifies users with multiple host profiles and keeps only the first one.
-- WARNING: This is destructive. Test on a backup first!

-- First, let's see which users have duplicates:
SELECT user_id, COUNT(*) as host_count, ARRAY_AGG(host_uuid::text) as host_uuids
FROM hostiggo_testing_schema.host
WHERE user_id IS NOT NULL
GROUP BY user_id
HAVING COUNT(*) > 1;

-- Delete duplicate host records, keeping only the first one per user:
DELETE FROM hostiggo_testing_schema.host
WHERE host_uuid IN (
  SELECT host_uuid
  FROM (
    SELECT host_uuid,
           ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY host_uuid ASC) as rn
    FROM hostiggo_testing_schema.host
    WHERE user_id IS NOT NULL
  ) t
  WHERE rn > 1
);

-- Verify duplicates are removed:
SELECT user_id, COUNT(*) as host_count
FROM hostiggo_testing_schema.host
WHERE user_id IS NOT NULL
GROUP BY user_id
HAVING COUNT(*) > 1;

-- (Should return empty result set if cleanup was successful)

-- RECOMMENDED: Add a unique constraint to prevent future duplicates:
ALTER TABLE hostiggo_testing_schema.host
ADD CONSTRAINT host_user_id_unique UNIQUE (user_id);
