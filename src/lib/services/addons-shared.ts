// Types and pure helpers shared between the server-only addons service
// (src/lib/services/addons.ts, which touches the DB) and client components
// that only need the shapes/formatting, not the DB access itself.

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
