# Database Schema for House Rules and Safety Details

This document describes the database schema changes needed to support house rules and safety details features.

## Required Tables

### 1. `listing_house_rules` Table

Stores custom house rules for each listing.

```sql
CREATE TABLE listing_house_rules (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  listing_id BIGINT NOT NULL REFERENCES listings(listing_id) ON DELETE CASCADE,
  rule TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_listing_house_rules_listing_id ON listing_house_rules(listing_id);
```

### 2. `safety_features` Table

Master list of available safety features (managed by admins).

```sql
CREATE TABLE safety_features (
  feature_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR(255) NOT NULL,
  icon VARCHAR(100),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sample data
INSERT INTO safety_features (name, icon, description) VALUES
  ('Exterior security camera', '📹', 'Security cameras monitoring the exterior of the property'),
  ('Noise level monitoring device', '🔊', 'Device to monitor and detect excessive noise'),
  ('Weapon(s) on property', '🔫', 'Any weapons present on the property'),
  ('Smoke alarm', '🚨', 'Functional smoke detection systems'),
  ('First aid kit', '🩹', 'First aid supplies available'),
  ('Fire extinguisher', '🧯', 'Fire extinguishing equipment on premises'),
  ('Emergency contacts', '📞', 'Emergency contact information provided'),
  ('CCTV', '📷', 'Closed-circuit television system'),
  ('Smart lock', '🔒', 'Electronic lock system for entry');
```

### 3. `listing_safety_details` Table

Links safety features to specific listings.

```sql
CREATE TABLE listing_safety_details (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  listing_id BIGINT NOT NULL REFERENCES listings(listing_id) ON DELETE CASCADE,
  feature_id BIGINT NOT NULL REFERENCES safety_features(feature_id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(listing_id, feature_id)
);

CREATE INDEX idx_listing_safety_details_listing_id ON listing_safety_details(listing_id);
CREATE INDEX idx_listing_safety_details_feature_id ON listing_safety_details(feature_id);
```

## Execution Steps

1. Create the `listing_house_rules` table
2. Create the `safety_features` table
3. Create the `listing_safety_details` table
4. Insert sample safety features
5. Enable RLS (Row Level Security) policies if needed

## Row Level Security (RLS) Policies

### For `listing_house_rules`:

```sql
-- Hosts can only see/modify rules for their own listings
CREATE POLICY "Hosts can manage own listing house rules"
  ON listing_house_rules
  FOR ALL
  USING (
    listing_id IN (
      SELECT listing_id FROM listings 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    listing_id IN (
      SELECT listing_id FROM listings 
      WHERE user_id = auth.uid()
    )
  );
```

### For `listing_safety_details`:

```sql
-- Hosts can only see/modify safety details for their own listings
CREATE POLICY "Hosts can manage own listing safety details"
  ON listing_safety_details
  FOR ALL
  USING (
    listing_id IN (
      SELECT listing_id FROM listings 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    listing_id IN (
      SELECT listing_id FROM listings 
      WHERE user_id = auth.uid()
    )
  );
```

## Notes

- House rules are free-text entries that hosts can add, edit, or delete
- Safety features are predefined by admins and hosts simply toggle them on/off for their listings
- Both features are optional and can be managed after listing creation
- Deleting a listing cascades to remove all associated rules and safety details
