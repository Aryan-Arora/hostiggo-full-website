import { supabase } from '@/lib/supabase';

export interface HouseRule {
  id: number;
  listing_id: number;
  rule: string;
  created_at: string;
}

/**
 * Get all house rules for a listing
 */
export async function getListingHouseRules(listingId: number): Promise<HouseRule[]> {
  try {
    const { data, error } = await supabase
      .from('listing_house_rules')
      .select('*')
      .eq('listing_id', listingId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[house-rules] Failed to fetch house rules:', error);
    throw error;
  }
}

/**
 * Add a house rule to a listing
 */
export async function addHouseRule(listingId: number, rule: string): Promise<HouseRule> {
  try {
    if (!rule || rule.trim().length === 0) {
      throw new Error('House rule cannot be empty');
    }

    const { data, error } = await supabase
      .from('listing_house_rules')
      .insert([
        {
          listing_id: listingId,
          rule: rule.trim(),
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[house-rules] Failed to add house rule:', error);
    throw error;
  }
}

/**
 * Update a house rule
 */
export async function updateHouseRule(id: number, rule: string): Promise<HouseRule> {
  try {
    if (!rule || rule.trim().length === 0) {
      throw new Error('House rule cannot be empty');
    }

    const { data, error } = await supabase
      .from('listing_house_rules')
      .update({ rule: rule.trim() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[house-rules] Failed to update house rule:', error);
    throw error;
  }
}

/**
 * Delete a house rule
 */
export async function deleteHouseRule(id: number): Promise<void> {
  try {
    const { error } = await supabase
      .from('listing_house_rules')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('[house-rules] Failed to delete house rule:', error);
    throw error;
  }
}
