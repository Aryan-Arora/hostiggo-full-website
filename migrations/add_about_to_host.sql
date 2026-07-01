-- Migration: Add 'about' column to host table
-- This allows hosts to write a bio/about section on their profile

ALTER TABLE hostiggo_testing_schema.host
ADD COLUMN about text DEFAULT NULL;

-- Update the column comment for clarity (optional)
COMMENT ON COLUMN hostiggo_testing_schema.host.about IS 'Host bio/about section - displayed on their public profile';
