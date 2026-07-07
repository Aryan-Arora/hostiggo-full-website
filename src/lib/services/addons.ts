import { supabase } from '@/lib/supabase';

export interface Addon {
  addon_id: number;
  name: string;
  icon: string;
  category: string;
  created_at: string;
}

export interface ListingAddon {
  id: number;
  listing_id: number;
  addon_id: number;
  price: number;
  includes: string;
  timing_from: string | null;
  timing_to: string | null;
  another_details: Record<string, any> | null;
  additional_notes: string;
  created_at: string;
  addon?: Addon;
}

/**
 * Get all available addons from the database
 */
export async function getAllAddons(): Promise<Addon[]> {
  try {
    const { data, error } = await supabase
      .from('addons')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[addons] Failed to fetch addons:', error);
    throw error;
  }
}

/**
 * Get all addons assigned to a listing
 */
export async function getListingAddons(listingId: number): Promise<ListingAddon[]> {
  try {
    const { data, error } = await supabase
      .from('listing_addons')
      .select(
        `
        id,
        listing_id,
        addon_id,
        price,
        includes,
        timing_from,
        timing_to,
        another_details,
        additional_notes,
        created_at,
        addons(addon_id, name, icon, category, created_at)
      `
      )
      .eq('listing_id', listingId);

    if (error) throw error;
    
    // Transform the data to match ListingAddon interface
    const transformed = (data || []).map((item: any) => ({
      ...item,
      addon: item.addons,
    }));
    
    return transformed;
  } catch (error) {
    console.error('[addons] Failed to fetch listing addons:', error);
    throw error;
  }
}

/**
 * Add an addon to a listing
 */
export async function addAddonToListing(
  listingId: number,
  addonId: number,
  price: number,
  includes: string,
  timingFrom?: string,
  timingTo?: string,
  details?: Record<string, any>,
  notes?: string
): Promise<ListingAddon> {
  try {
    if (price < 0) {
      throw new Error('Price cannot be negative');
    }

    const { data, error } = await supabase
      .from('listing_addons')
      .insert([
        {
          listing_id: listingId,
          addon_id: addonId,
          price,
          includes,
          timing_from: timingFrom || null,
          timing_to: timingTo || null,
          another_details: details || null,
          additional_notes: notes || '',
        },
      ])
      .select(
        `
        id,
        listing_id,
        addon_id,
        price,
        includes,
        timing_from,
        timing_to,
        another_details,
        additional_notes,
        created_at,
        addons(addon_id, name, icon, category, created_at)
      `
      )
      .single();

    if (error) throw error;
    return {
      ...data,
      addon: data.addons as unknown as Addon,
    };
  } catch (error) {
    console.error('[addons] Failed to add addon to listing:', error);
    throw error;
  }
}

/**
 * Update an addon on a listing
 */
export async function updateListingAddon(
  addonListingId: number,
  price?: number,
  includes?: string,
  timingFrom?: string,
  timingTo?: string,
  details?: Record<string, any>,
  notes?: string
): Promise<ListingAddon> {
  try {
    if (price !== undefined && price < 0) {
      throw new Error('Price cannot be negative');
    }

    const updateData: any = {};
    if (price !== undefined) updateData.price = price;
    if (includes !== undefined) updateData.includes = includes;
    if (timingFrom !== undefined) updateData.timing_from = timingFrom || null;
    if (timingTo !== undefined) updateData.timing_to = timingTo || null;
    if (details !== undefined) updateData.another_details = details || null;
    if (notes !== undefined) updateData.additional_notes = notes || '';

    const { data, error } = await supabase
      .from('listing_addons')
      .update(updateData)
      .eq('id', addonListingId)
      .select(
        `
        id,
        listing_id,
        addon_id,
        price,
        includes,
        timing_from,
        timing_to,
        another_details,
        additional_notes,
        created_at,
        addons(addon_id, name, icon, category, created_at)
      `
      )
      .single();

    if (error) throw error;
    return {
      ...data,
      addon: data.addons as unknown as Addon,
    };
  } catch (error) {
    console.error('[addons] Failed to update addon:', error);
    throw error;
  }
}

/**
 * Remove an addon from a listing
 */
export async function removeAddonFromListing(addonListingId: number): Promise<void> {
  try {
    const { error } = await supabase
      .from('listing_addons')
      .delete()
      .eq('id', addonListingId);

    if (error) throw error;
  } catch (error) {
    console.error('[addons] Failed to remove addon from listing:', error);
    throw error;
  }
}

/**
 * Get addon by ID
 */
export async function getAddonById(addonId: number): Promise<Addon | null> {
  try {
    const { data, error } = await supabase
      .from('addons')
      .select('*')
      .eq('addon_id', addonId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  } catch (error) {
    console.error('[addons] Failed to fetch addon:', error);
    throw error;
  }
}

/**
 * Group addons by category
 */
export function groupAddonsByCategory(addons: Addon[]): Record<string, Addon[]> {
  return addons.reduce(
    (acc, addon) => {
      if (!acc[addon.category]) {
        acc[addon.category] = [];
      }
      acc[addon.category].push(addon);
      return acc;
    },
    {} as Record<string, Addon[]>
  );
}
