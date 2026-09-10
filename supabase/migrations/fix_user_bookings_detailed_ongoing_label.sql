-- user_bookings_detailed.booking_label had a gap: a CONFIRMED booking
-- that's currently mid-stay (checked in, not yet checked out --
-- start_date <= today < end_date) matched neither the "completed"
-- branch (end_date <= today) nor the "upcoming" branch (start_date >
-- today), so it fell through to `ELSE 'cancelled'` -- a real, currently
-- active, paid-for trip showing up in the guest's Cancelled tab in My
-- Memories. Confirmed live against 4 real in-progress bookings (ids 146,
-- 147, 151, 152) before this fix. Merges the completed/upcoming branches
-- so any CONFIRMED booking that hasn't ended yet (future OR ongoing) is
-- "upcoming", matching what My Memories' 3-tab UI (upcoming/completed/
-- cancelled) can actually represent.
create or replace view hostiggo_testing_schema.user_bookings_detailed as
 SELECT b.booking_id,
    b.user_id,
    b.start_date,
    b.end_date,
    b.num_adults,
    b.num_children,
    bs.status_name,
    lsv.title AS listing_title,
    lsv.avg_rating,
    lsv.amenity_names,
    lsv.cover_image_url AS cover_photo_url,
    ( SELECT array_agg(listing_media.media_url) AS array_agg
           FROM hostiggo_testing_schema.listing_media
          WHERE listing_media.listing_id = b.listing_id) AS all_media_urls,
        CASE
            WHEN bs.status_name::text = 'CANCELLED'::text THEN 'cancelled'::text
            WHEN bs.status_name::text = 'CONFIRMED'::text AND b.end_date <= CURRENT_DATE THEN 'completed'::text
            WHEN bs.status_name::text = 'CONFIRMED'::text AND b.end_date > CURRENT_DATE THEN 'upcoming'::text
            ELSE 'cancelled'::text
        END AS booking_label
   FROM hostiggo_testing_schema.bookings b
     JOIN hostiggo_testing_schema.booking_status bs ON b.status_id = bs.status_id
     JOIN hostiggo_testing_schema.listing_search_view lsv ON b.listing_id = lsv.listing_id;
