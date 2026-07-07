import { supabase } from '@/lib/supabase';

export interface ListingDiscount {
  id: number;
  listing_id: number;
  discount_type: string;
  percent: number;
  enabled: boolean;
}

/**
 * Get all discounts for a listing
 */
export async function getListingDiscounts(listingId: number): Promise<ListingDiscount[]> {
  try {
    const { data, error } = await supabase
      .from('listing_discounts')
      .select('*')
      .eq('listing_id', listingId);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[discounts] Failed to fetch discounts:', error);
    throw error;
  }
}

/**
 * Create a new discount for a listing
 */
export async function createDiscount(
  listingId: number,
  discountType: string,
  percent: number
): Promise<ListingDiscount> {
  try {
    if (percent <= 0 || percent > 100) {
      throw new Error('Discount percentage must be between 0 and 100');
    }

    const { data, error } = await supabase
      .from('listing_discounts')
      .insert([
        {
          listing_id: listingId,
          discount_type: discountType,
          percent,
          enabled: true,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[discounts] Failed to create discount:', error);
    throw error;
  }
}

/**
 * Update an existing discount
 */
export async function updateDiscount(
  id: number,
  percent?: number,
  enabled?: boolean
): Promise<ListingDiscount> {
  try {
    if (percent !== undefined && (percent <= 0 || percent > 100)) {
      throw new Error('Discount percentage must be between 0 and 100');
    }

    const updateData: any = {};
    if (percent !== undefined) updateData.percent = percent;
    if (enabled !== undefined) updateData.enabled = enabled;

    const { data, error } = await supabase
      .from('listing_discounts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[discounts] Failed to update discount:', error);
    throw error;
  }
}

/**
 * Delete a discount
 */
export async function deleteDiscount(id: number): Promise<void> {
  try {
    const { error } = await supabase
      .from('listing_discounts')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('[discounts] Failed to delete discount:', error);
    throw error;
  }
}

/**
 * Toggle discount enabled/disabled
 */
export async function toggleDiscount(id: number, enabled: boolean): Promise<ListingDiscount> {
  return updateDiscount(id, undefined, enabled);
}

/**
 * Initialize default discounts for a new listing
 */
export async function initializeDefaultDiscounts(listingId: number): Promise<void> {
  try {
    const defaultDiscounts = [
      { discount_type: 'new_listing', percent: 0, enabled: false },
      { discount_type: 'weekly', percent: 0, enabled: false },
      { discount_type: 'monthly', percent: 0, enabled: false },
    ];

    const { error } = await supabase
      .from('listing_discounts')
      .insert(
        defaultDiscounts.map((d) => ({
          listing_id: listingId,
          ...d,
        }))
      );

    if (error) throw error;
  } catch (error) {
    console.error('[discounts] Failed to initialize default discounts:', error);
    throw error;
  }
}
