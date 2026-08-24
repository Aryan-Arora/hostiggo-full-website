-- Migration: Add cursor-based search_listings_by_state RPC
-- This enables infinite scroll search within state boundaries

CREATE OR REPLACE FUNCTION hostiggo_testing_schema.search_listings_by_state(
  p_state TEXT,
  p_district TEXT DEFAULT NULL,
  p_cursor INT DEFAULT NULL,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL,
  p_min_price INT DEFAULT NULL,
  p_max_price INT DEFAULT NULL,
  p_total_guests INT DEFAULT NULL,
  p_ratings INT[] DEFAULT NULL,
  p_amenities INT[] DEFAULT NULL,
  p_roomtypes TEXT[] DEFAULT NULL,
  p_limit INT DEFAULT 50
)
RETURNS TABLE (
  listing JSONB,
  distance FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    jsonb_build_object(
      'listing_id', l.listing_id,
      'title', l.title,
      'description', l.description,
      'price_weekday', l.price_weekday,
      'price_weekend', l.price_weekend,
      'num_guests', l.num_guests,
      'num_bedrooms', l.num_bedrooms,
      'num_beds', l.num_beds,
      'num_bathrooms', l.num_bathrooms,
      'latitude', l.latitude,
      'longitude', l.longitude,
      'property_type_id', l.property_type_id,
      'stay_type_id', l.stay_type_id,
      'location_id', l.location_id,
      'locations', jsonb_build_object(
        'state', loc.state,
        'district', loc.district
      ),
      'listing_media', (
        SELECT jsonb_agg(jsonb_build_object('media_url', media_url, 'is_cover', is_cover))
        FROM hostiggo_testing_schema.listing_media
        WHERE listing_id = l.listing_id
      ),
      'listing_amenities', (
        SELECT jsonb_agg(jsonb_build_object('amenities', jsonb_build_object('name', a.name)))
        FROM hostiggo_testing_schema.listing_amenities la
        JOIN hostiggo_testing_schema.amenities a ON la.amenity_id = a.amenity_id
        WHERE la.listing_id = l.listing_id
      )
    ) AS listing,
    NULL::FLOAT AS distance
  FROM hostiggo_testing_schema.listings l
  LEFT JOIN hostiggo_testing_schema.locations loc ON l.location_id = loc.location_id
  WHERE 
    l.is_active = TRUE
    AND (LOWER(loc.state) = LOWER(p_state) OR p_state IS NULL)
    AND (LOWER(loc.district) = LOWER(p_district) OR p_district IS NULL)
    AND (l.price_weekday >= p_min_price OR p_min_price IS NULL)
    AND (l.price_weekday <= p_max_price OR p_max_price IS NULL)
    AND (l.num_guests >= p_total_guests OR p_total_guests IS NULL)
    AND (p_cursor IS NULL OR l.listing_id > p_cursor)
    AND (
      p_amenities IS NULL 
      OR p_amenities = ARRAY[]::INT[] 
      OR EXISTS (
        SELECT 1 FROM hostiggo_testing_schema.listing_amenities la
        WHERE la.listing_id = l.listing_id
        AND la.amenity_id = ANY(p_amenities)
      )
    )
  ORDER BY l.listing_id ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_listings_state_active_id 
ON hostiggo_testing_schema.listings(location_id, is_active, listing_id ASC)
WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_listings_price_guests_active 
ON hostiggo_testing_schema.listings(price_weekday, num_guests, is_active)
WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_location_state_district 
ON hostiggo_testing_schema.locations(state, district);
