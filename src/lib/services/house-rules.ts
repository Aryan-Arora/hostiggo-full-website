import { supabaseAdmin as supabase } from '@/lib/supabase-admin';

// The actual `listing_house_rules` table is one structured row per listing
// (booleans + times), NOT a list of free-text rule strings — the original
// version of this file assumed a `rule` text column that never existed,
// so every read/write here failed with "Could not find the 'rule' column"
// (verified directly against the live table schema).
export interface HouseRule {
  id: number;
  listing_id: number;
  check_in_time: string | null;
  check_out_time: string | null;
  smoking_allowed: boolean;
  pets_allowed: boolean;
  parties_allowed: boolean;
  quiet_hours: boolean;
}

/**
 * Get the house rules row for a listing (one row per listing, or null if
 * the host hasn't set any yet).
 */
export async function getListingHouseRules(listingId: number): Promise<HouseRule | null> {
  try {
    const { data, error } = await supabase
      .from('listing_house_rules')
      .select('*')
      .eq('listing_id', listingId)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[house-rules] Failed to fetch house rules:', error);
    throw error;
  }
}

export type HouseRulesInput = Partial<
  Pick<
    HouseRule,
    'check_in_time' | 'check_out_time' | 'smoking_allowed' | 'pets_allowed' | 'parties_allowed' | 'quiet_hours'
  >
>;

/**
 * Create or update the house rules row for a listing. There's no unique
 * constraint on listing_id in the live table, so a real upsert (ON
 * CONFLICT) isn't possible — check for an existing row first and
 * update/insert accordingly.
 */
export async function upsertHouseRules(listingId: number, input: HouseRulesInput): Promise<HouseRule> {
  try {
    const { data: existing, error: findErr } = await supabase
      .from('listing_house_rules')
      .select('id')
      .eq('listing_id', listingId)
      .maybeSingle();
    if (findErr) throw findErr;

    if (existing) {
      const { data, error } = await supabase
        .from('listing_house_rules')
        .update(input)
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const { data, error } = await supabase
      .from('listing_house_rules')
      .insert({ listing_id: listingId, ...input })
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[house-rules] Failed to save house rules:', error);
    throw error;
  }
}

/**
 * Delete the house rules row for a listing.
 */
export async function deleteHouseRules(listingId: number): Promise<void> {
  try {
    const { error } = await supabase
      .from('listing_house_rules')
      .delete()
      .eq('listing_id', listingId);

    if (error) throw error;
  } catch (error) {
    console.error('[house-rules] Failed to delete house rules:', error);
    throw error;
  }
}
