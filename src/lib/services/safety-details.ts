import { supabase } from '@/lib/supabase';

export interface SafetyFeature {
  feature_id: number;
  name: string;
  icon: string;
  description: string;
}

export interface ListingSafetyDetail {
  id: number;
  listing_id: number;
  feature_id: number;
  enabled: boolean;
  created_at: string;
  safety_features?: SafetyFeature;
}

/**
 * Get all available safety features
 */
export async function getAllSafetyFeatures(): Promise<SafetyFeature[]> {
  try {
    const { data, error } = await supabase
      .from('safety_features')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[safety-details] Failed to fetch safety features:', error);
    throw error;
  }
}

/**
 * Get all safety details assigned to a listing
 */
export async function getListingSafetyDetails(listingId: number): Promise<ListingSafetyDetail[]> {
  try {
    const { data, error } = await supabase
      .from('listing_safety_details')
      .select(
        `
        id,
        listing_id,
        feature_id,
        enabled,
        created_at,
        safety_features(feature_id, name, icon, description)
      `
      )
      .eq('listing_id', listingId);

    if (error) throw error;
    
    return (data || []).map((item: any) => ({
      ...item,
      safety_features: item.safety_features as unknown as SafetyFeature || undefined,
    })) as ListingSafetyDetail[];
  } catch (error) {
    console.error('[safety-details] Failed to fetch listing safety details:', error);
    throw error;
  }
}

/**
 * Add a safety feature to a listing
 */
export async function addSafetyDetailToListing(
  listingId: number,
  featureId: number
): Promise<ListingSafetyDetail> {
  try {
    const { data, error } = await supabase
      .from('listing_safety_details')
      .insert([
        {
          listing_id: listingId,
          feature_id: featureId,
          enabled: true,
        },
      ])
      .select(
        `
        id,
        listing_id,
        feature_id,
        enabled,
        created_at,
        safety_features(feature_id, name, icon, description)
      `
      )
      .single();

    if (error) throw error;
    return {
      ...data,
      safety_features: data.safety_features as unknown as SafetyFeature || undefined,
    } as ListingSafetyDetail;
  } catch (error) {
    console.error('[safety-details] Failed to add safety detail to listing:', error);
    throw error;
  }
}

/**
 * Toggle a safety feature for a listing
 */
export async function toggleSafetyDetail(id: number, enabled: boolean): Promise<ListingSafetyDetail> {
  try {
    const { data, error } = await supabase
      .from('listing_safety_details')
      .update({ enabled })
      .eq('id', id)
      .select(
        `
        id,
        listing_id,
        feature_id,
        enabled,
        created_at,
        safety_features(feature_id, name, icon, description)
      `
      )
      .single();

    if (error) throw error;
    return {
      ...data,
      safety_features: data.safety_features as unknown as SafetyFeature || undefined,
    } as ListingSafetyDetail;
  } catch (error) {
    console.error('[safety-details] Failed to toggle safety detail:', error);
    throw error;
  }
}

/**
 * Remove a safety detail from a listing
 */
export async function removeSafetyDetailFromListing(id: number): Promise<void> {
  try {
    const { error } = await supabase
      .from('listing_safety_details')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('[safety-details] Failed to remove safety detail from listing:', error);
    throw error;
  }
}
