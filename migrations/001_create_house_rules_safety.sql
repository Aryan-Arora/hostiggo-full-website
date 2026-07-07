-- Migration: Create house rules and safety details tables
-- Status: Idempotent migration with proper execution order

-- 1. Create safety_features table FIRST (no dependencies)
CREATE TABLE IF NOT EXISTS hostiggo_testing_schema.safety_features (
  feature_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR(255) NOT NULL,
  icon VARCHAR(100),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create listing_house_rules table (depends on listings table)
CREATE TABLE IF NOT EXISTS hostiggo_testing_schema.listing_house_rules (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  listing_id BIGINT NOT NULL REFERENCES hostiggo_testing_schema.listings(listing_id) ON DELETE CASCADE,
  rule TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_listing_house_rules_listing_id ON hostiggo_testing_schema.listing_house_rules(listing_id);

-- 3. Create listing_safety_details table (depends on listings and safety_features tables)
CREATE TABLE IF NOT EXISTS hostiggo_testing_schema.listing_safety_details (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  listing_id BIGINT NOT NULL REFERENCES hostiggo_testing_schema.listings(listing_id) ON DELETE CASCADE,
  feature_id BIGINT NOT NULL REFERENCES hostiggo_testing_schema.safety_features(feature_id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(listing_id, feature_id)
);

CREATE INDEX IF NOT EXISTS idx_listing_safety_details_listing_id ON hostiggo_testing_schema.listing_safety_details(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_safety_details_feature_id ON hostiggo_testing_schema.listing_safety_details(feature_id);

-- 4. Enable RLS on listing_house_rules
ALTER TABLE hostiggo_testing_schema.listing_house_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Hosts can manage own listing house rules" ON hostiggo_testing_schema.listing_house_rules;

CREATE POLICY "Hosts can manage own listing house rules"
  ON hostiggo_testing_schema.listing_house_rules
  FOR ALL
  USING (
    listing_id IN (
      SELECT listing_id FROM hostiggo_testing_schema.listings 
      WHERE host_uuid IN (
        SELECT host_uuid FROM hostiggo_testing_schema.host 
        WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    listing_id IN (
      SELECT listing_id FROM hostiggo_testing_schema.listings 
      WHERE host_uuid IN (
        SELECT host_uuid FROM hostiggo_testing_schema.host 
        WHERE user_id = auth.uid()
      )
    )
  );

-- 5. Enable RLS on listing_safety_details
ALTER TABLE hostiggo_testing_schema.listing_safety_details ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Hosts can manage own listing safety details" ON hostiggo_testing_schema.listing_safety_details;

CREATE POLICY "Hosts can manage own listing safety details"
  ON hostiggo_testing_schema.listing_safety_details
  FOR ALL
  USING (
    listing_id IN (
      SELECT listing_id FROM hostiggo_testing_schema.listings 
      WHERE host_uuid IN (
        SELECT host_uuid FROM hostiggo_testing_schema.host 
        WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    listing_id IN (
      SELECT listing_id FROM hostiggo_testing_schema.listings 
      WHERE host_uuid IN (
        SELECT host_uuid FROM hostiggo_testing_schema.host 
        WHERE user_id = auth.uid()
      )
    )
  );

-- 6. Insert safety features (idempotent - no duplicates)
INSERT INTO hostiggo_testing_schema.safety_features (name, icon, description) VALUES
  ('Exterior security camera', '📹', 'Security cameras monitoring the exterior of the property'),
  ('Noise level monitoring device', '🔊', 'Device to monitor and detect excessive noise'),
  ('Weapon(s) on property', '🔫', 'Any weapons present on the property'),
  ('Smoke alarm', '🚨', 'Functional smoke detection systems'),
  ('First aid kit', '🩹', 'First aid supplies available'),
  ('Fire extinguisher', '🧯', 'Fire extinguishing equipment on premises'),
  ('Emergency contacts', '📞', 'Emergency contact information provided'),
  ('CCTV', '📷', 'Closed-circuit television system'),
  ('Smart lock', '🔒', 'Electronic lock system for entry')
ON CONFLICT DO NOTHING;
