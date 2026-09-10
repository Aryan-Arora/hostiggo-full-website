# Setup Guide: House Rules and Safety Details Features

## Quick Start

This guide walks through setting up the house rules and safety details features in your Supabase database.

## Prerequisites

- Supabase project with admin access
- Access to the SQL editor in Supabase dashboard
- Existing `listings` table

## Step 1: Create the House Rules Table

Navigate to the SQL Editor in Supabase and run:

```sql
-- Create listing_house_rules table
CREATE TABLE listing_house_rules (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  listing_id BIGINT NOT NULL REFERENCES listings(listing_id) ON DELETE CASCADE,
  rule TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX idx_listing_house_rules_listing_id ON listing_house_rules(listing_id);

-- Enable RLS (Row Level Security)
ALTER TABLE listing_house_rules ENABLE ROW LEVEL SECURITY;

-- Create policy: hosts can only manage their own listing's house rules
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

## Step 2: Create the Safety Features Table

```sql
-- Create safety_features table (master list)
CREATE TABLE safety_features (
  feature_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR(255) NOT NULL UNIQUE,
  icon VARCHAR(100),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index
CREATE INDEX idx_safety_features_name ON safety_features(name);
```

## Step 3: Create the Listing Safety Details Table

```sql
-- Create listing_safety_details table
CREATE TABLE listing_safety_details (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  listing_id BIGINT NOT NULL REFERENCES listings(listing_id) ON DELETE CASCADE,
  feature_id BIGINT NOT NULL REFERENCES safety_features(feature_id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(listing_id, feature_id)
);

-- Create indexes
CREATE INDEX idx_listing_safety_details_listing_id ON listing_safety_details(listing_id);
CREATE INDEX idx_listing_safety_details_feature_id ON listing_safety_details(feature_id);

-- Enable RLS
ALTER TABLE listing_safety_details ENABLE ROW LEVEL SECURITY;

-- Create policy: hosts can only manage their own listing's safety details
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

## Step 4: Populate Safety Features

Insert the predefined safety features. Run this in the SQL Editor:

```sql
-- Insert default safety features
INSERT INTO safety_features (name, icon, description) VALUES
  ('Exterior security camera', '📹', 'Security cameras monitoring the exterior of the property'),
  ('Noise level monitoring device', '🔊', 'Device to monitor and detect excessive noise levels'),
  ('Weapon(s) on property', '🔫', 'Any weapons or firearms present on the property'),
  ('Smoke alarm', '🚨', 'Functional smoke detection systems in the property'),
  ('First aid kit', '🩹', 'First aid supplies and medical equipment available'),
  ('Fire extinguisher', '🧯', 'Fire extinguishing equipment on premises'),
  ('Emergency contacts', '📞', 'Emergency contact information provided to guests'),
  ('CCTV', '📷', 'Closed-circuit television security system'),
  ('Smart lock', '🔒', 'Electronic or smart lock system for entry');
```

## Step 5: Enable Realtime (Optional)

If you want real-time updates in your app:

```sql
-- Enable realtime for house rules
ALTER PUBLICATION supabase_realtime ADD TABLE listing_house_rules;

-- Enable realtime for safety details
ALTER PUBLICATION supabase_realtime ADD TABLE listing_safety_details;
```

## Step 6: Verify Setup

Run these queries to verify everything is set up correctly:

```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('listing_house_rules', 'safety_features', 'listing_safety_details');

-- Check RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('listing_house_rules', 'listing_safety_details');

-- Count safety features
SELECT COUNT(*) FROM safety_features;

-- Expected output: 9
```

## Step 7: Test the API Endpoints

### Test House Rules

```bash
# Create a test house rule (replace LISTING_ID with actual ID)
curl -X POST http://localhost:3000/api/host/listings/LISTING_ID/house-rules \
  -H "Content-Type: application/json" \
  -d '{"rule": "No smoking"}'

# Get all house rules
curl http://localhost:3000/api/host/listings/LISTING_ID/house-rules

# Update a rule (replace RULE_ID with actual ID)
curl -X PATCH http://localhost:3000/api/host/listings/LISTING_ID/house-rules/RULE_ID \
  -H "Content-Type: application/json" \
  -d '{"rule": "No smoking inside"}'

# Delete a rule
curl -X DELETE http://localhost:3000/api/host/listings/LISTING_ID/house-rules/RULE_ID
```

### Test Safety Details

```bash
# Get available safety features and selected ones
curl http://localhost:3000/api/host/listings/LISTING_ID/safety-details

# Add a safety feature (replace FEATURE_ID with actual ID)
curl -X POST http://localhost:3000/api/host/listings/LISTING_ID/safety-details \
  -H "Content-Type: application/json" \
  -d '{"feature_id": 1}'

# Toggle a safety feature (replace DETAIL_ID with actual ID)
curl -X PATCH http://localhost:3000/api/host/listings/LISTING_ID/safety-details/DETAIL_ID \
  -H "Content-Type: application/json" \
  -d '{"enabled": false}'

# Remove a safety feature
curl -X DELETE http://localhost:3000/api/host/listings/LISTING_ID/safety-details/DETAIL_ID
```

## Complete SQL Setup Script

For convenience, here's the complete script to run all at once:

```sql
-- ================================================================
-- House Rules and Safety Details Feature Setup
-- Run this entire script in Supabase SQL Editor
-- ================================================================

-- 1. Create listing_house_rules table
CREATE TABLE listing_house_rules (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  listing_id BIGINT NOT NULL REFERENCES listings(listing_id) ON DELETE CASCADE,
  rule TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_listing_house_rules_listing_id ON listing_house_rules(listing_id);

ALTER TABLE listing_house_rules ENABLE ROW LEVEL SECURITY;

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

-- 2. Create safety_features table
CREATE TABLE safety_features (
  feature_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR(255) NOT NULL UNIQUE,
  icon VARCHAR(100),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_safety_features_name ON safety_features(name);

-- 3. Create listing_safety_details table
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

ALTER TABLE listing_safety_details ENABLE ROW LEVEL SECURITY;

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

-- 4. Populate safety features
INSERT INTO safety_features (name, icon, description) VALUES
  ('Exterior security camera', '📹', 'Security cameras monitoring the exterior of the property'),
  ('Noise level monitoring device', '🔊', 'Device to monitor and detect excessive noise levels'),
  ('Weapon(s) on property', '🔫', 'Any weapons or firearms present on the property'),
  ('Smoke alarm', '🚨', 'Functional smoke detection systems in the property'),
  ('First aid kit', '🩹', 'First aid supplies and medical equipment available'),
  ('Fire extinguisher', '🧯', 'Fire extinguishing equipment on premises'),
  ('Emergency contacts', '📞', 'Emergency contact information provided to guests'),
  ('CCTV', '📷', 'Closed-circuit television security system'),
  ('Smart lock', '🔒', 'Electronic or smart lock system for entry');
```

## Troubleshooting

### "Table does not exist" Error

Make sure you've run the CREATE TABLE statements in order. Check:

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### RLS Policy Not Working

Verify policies are created:

```sql
SELECT policy_name, roles, qual, with_check 
FROM pg_policies 
WHERE tablename IN ('listing_house_rules', 'listing_safety_details');
```

### Foreign Key Constraint Error

Make sure the `listings` table exists and has `listing_id` and `user_id` columns:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'listings';
```

### Can't Insert Safety Features

Make sure `safety_features` table exists first before `listing_safety_details`:

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'safety_%' 
OR table_name LIKE 'listing_house%' 
OR table_name LIKE 'listing_safety%';
```

## What's Next?

1. ✅ Database setup complete
2. ✅ API endpoints ready to use
3. ✅ Frontend components ready
4. Next: Test the features in your app

## Testing Checklist

- [ ] Can create a house rule via API
- [ ] Can retrieve house rules
- [ ] Can edit a house rule
- [ ] Can delete a house rule
- [ ] Can view available safety features
- [ ] Can toggle safety features on/off
- [ ] House rules visible in HouseRulesForm component
- [ ] Safety features visible in SafetyDetailsForm component
- [ ] Forms work in listing management page
- [ ] Forms work in listing wizard (step 8)

## Support

If you encounter issues:

1. Check the Supabase logs for detailed error messages
2. Verify all tables exist with correct column names
3. Check RLS policies are enabled and correct
4. Verify foreign key relationships are set up
5. See INTEGRATION_GUIDE_HOUSE_RULES_SAFETY.md for application integration help
