-- PROPOSED -- review before running. Nothing here has been applied.
-- Step 4 of the search fix: tidy hostiggo_testing_schema.locations so
-- destination search has clean names to match. Run each numbered block on its
-- own; every destructive block starts with the SELECT that shows what it hits.
--
-- Audit behind this file (anon read, 2026-10-01): 83 locations rows, 46 of them
-- used by no listing at all. 1 active listing (322) has location_id NULL.

SET search_path TO hostiggo_testing_schema;

-- 1. Unused junk rows. Preview first. These are import/host-flow leftovers:
--    'Assam | New Delhi', 'Goa | Delhi' (wrong state), a Faridabad row whose
--    locality is a Saket street address, duplicate Saket / Park Royal /
--    Dwarka rows, and the unused 'Gurgaon' row (search already maps Gurgaon ->
--    Gurugram, see src/lib/destinationAliases.ts).
SELECT location_id, state, district, lower_division_name
FROM locations l
WHERE NOT EXISTS (SELECT 1 FROM listings x WHERE x.location_id = l.location_id)
  AND (
        (state = 'Assam'  AND district = 'New Delhi')
     OR (state = 'Goa'    AND district = 'Delhi')
     OR (state = 'Haryana' AND district = 'Gurgaon')
     OR (state = 'Delhi'  AND district ILIKE 'new delhi')
     OR (state = 'Delhi'  AND district = 'Delhi' AND location_id <> 6)
     OR (district = 'Faridabad' AND lower_division_name ILIKE '%New Delhi%')
  )
ORDER BY location_id;

-- Then, if the preview is what you expect (other tables with a foreign key to
-- locations.location_id will make this fail rather than orphan anything):
-- BEGIN;
-- DELETE FROM locations l
-- WHERE NOT EXISTS (SELECT 1 FROM listings x WHERE x.location_id = l.location_id)
--   AND ( (state = 'Assam' AND district = 'New Delhi')
--      OR (state = 'Goa' AND district = 'Delhi')
--      OR (state = 'Haryana' AND district = 'Gurgaon')
--      OR (state = 'Delhi' AND district ILIKE 'new delhi')
--      OR (state = 'Delhi' AND district = 'Delhi' AND location_id <> 6)
--      OR (district = 'Faridabad' AND lower_division_name ILIKE '%New Delhi%') );
-- COMMIT;   -- or ROLLBACK;

-- 2. Listing 322 ("Peaceful retreat in a quiet neighbourhood") is active but has
--    no location_id and no coordinates, so no destination search can ever return
--    it. Needs the real place from the host -- fill in and run:
-- UPDATE listings SET location_id = <location_id of its real place> WHERE listing_id = 322;
-- (Or set is_active = FALSE until the host adds an address.)

-- 3. OPTIONAL, product decision: locality names stored as `district`.
--    Listings are filed under 'Kandaghat' (18), 'Narkanda' (2), 'Haralur' (14),
--    'Sunrakh Bangar', 'Mukki', ... so searching 'Shimla' or 'Bangalore' misses
--    them, and the result cards print this value as the place name. Two options:
--      a) rename the district so the city search finds them (also relabels the
--         cards), e.g. Haralur -> Bengaluru:
--         UPDATE locations SET district = 'Bengaluru' WHERE state = 'Karnataka' AND district = 'Haralur';
--      b) keep district as is and add a separate searchable column, e.g.
--         ALTER TABLE locations ADD COLUMN city text;  -- then search city OR district
--         (needs the search_listings_by_state RPC changed to match it).
--    Not run. Tell me which way you want to go for Shimla-area and Bengaluru.
