import "server-only";
import { unstable_cache } from "next/cache";
import { HotelServiceApi } from "@/lib/services/hotel";
import * as addonService from "@/lib/services/addons";

// Centralized unstable_cache-wrapped reads for reference/near-static data.
// Shared by both the /api/* route handlers (for client-side callers) and
// Server Components that want the same cached data without an extra HTTP
// round-trip through our own API during SSR. Importing the same wrapped
// function from both places also means they share one cache entry instead
// of each maintaining its own.

export const getCachedAmenities = unstable_cache(
  async () => await HotelServiceApi.getAmenities(),
  ["amenities-all"],
  { revalidate: 3600, tags: ["reference"] },
);

export const getCachedRoomTypes = unstable_cache(
  async () => await HotelServiceApi.getUniqueRoomType(),
  ["room-types-all"],
  { revalidate: 3600, tags: ["reference"] },
);

export const getCachedAddonsCatalog = unstable_cache(
  async () => await addonService.getAllAddons(),
  ["addons-catalog"],
  { revalidate: 3600, tags: ["reference"] },
);

export const getCachedLocations = unstable_cache(
  async (popular: boolean, limit: number) =>
    popular
      ? await HotelServiceApi.getPopularLocations(limit)
      : await HotelServiceApi.getLocationSample(limit),
  ["locations-list"],
  { revalidate: 3600, tags: ["reference"] },
);

export const getCachedHotelsTeaser = unstable_cache(
  async (locationId: number | null, limit: number) =>
    locationId
      ? await HotelServiceApi.getHotelsByLocationId(locationId, limit)
      : await HotelServiceApi.getHotels(),
  ["hotels-teaser"],
  { revalidate: 60, tags: ["hotels-teaser"] },
);
