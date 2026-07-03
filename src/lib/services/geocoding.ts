/**
 * Geocoding utilities using OpenStreetMap Nominatim API (free, no API key required)
 * Forward geocoding: address → coordinates
 * Reverse geocoding: coordinates → address
 */

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  displayName: string;
  address: {
    street?: string;
    city?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
    countryCode?: string;
  };
}

export interface AutocompleteResult {
  placeId: string;
  displayName: string;
  latitude: number;
  longitude: number;
  boundingBox: [number, number, number, number]; // [south, north, west, east]
}

/**
 * Forward geocoding: convert address string to coordinates
 * @param query - Address to search for
 * @returns GeocodingResult with coordinates and address components
 */
export async function geocodeAddress(query: string): Promise<GeocodingResult | null> {
  if (!query.trim()) return null;

  try {
    const params = new URLSearchParams({
      q: query,
      format: "json",
      addressdetails: "1",
      limit: "1",
    });

    const response = await fetch(`${NOMINATIM_BASE}/search?${params}`, {
      headers: {
        "User-Agent": "Hostiggo-App (Next.js)",
      },
    });

    if (!response.ok) throw new Error("Geocoding request failed");

    const data = await response.json();
    if (!data || data.length === 0) return null;

    const result = data[0];
    return {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      displayName: result.display_name,
      address: {
        street: result.address?.road,
        city: result.address?.city || result.address?.town,
        county: result.address?.county,
        state: result.address?.state,
        postcode: result.address?.postcode,
        country: result.address?.country,
        countryCode: result.address?.country_code?.toUpperCase(),
      },
    };
  } catch (error) {
    console.error("[geocodeAddress] Error:", error);
    return null;
  }
}

/**
 * Reverse geocoding: convert coordinates to address
 * @param latitude - Latitude
 * @param longitude - Longitude
 * @returns GeocodingResult with address components
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<GeocodingResult | null> {
  if (!latitude || !longitude) return null;

  try {
    const params = new URLSearchParams({
      lat: latitude.toString(),
      lon: longitude.toString(),
      format: "json",
      addressdetails: "1",
    });

    const response = await fetch(`${NOMINATIM_BASE}/reverse?${params}`, {
      headers: {
        "User-Agent": "Hostiggo-App (Next.js)",
      },
    });

    if (!response.ok) throw new Error("Reverse geocoding request failed");

    const result = await response.json();

    return {
      latitude,
      longitude,
      displayName: result.display_name,
      address: {
        street: result.address?.road,
        city: result.address?.city || result.address?.town,
        county: result.address?.county,
        state: result.address?.state,
        postcode: result.address?.postcode,
        country: result.address?.country,
        countryCode: result.address?.country_code?.toUpperCase(),
      },
    };
  } catch (error) {
    console.error("[reverseGeocode] Error:", error);
    return null;
  }
}

/**
 * Autocomplete search for addresses
 * @param query - Search query
 * @returns Array of autocomplete suggestions
 */
export async function autocompleteAddress(query: string): Promise<AutocompleteResult[]> {
  if (!query.trim() || query.length < 3) return [];

  try {
    const params = new URLSearchParams({
      q: query,
      format: "json",
      addressdetails: "1",
      limit: "5",
    });

    const response = await fetch(`${NOMINATIM_BASE}/search?${params}`, {
      headers: {
        "User-Agent": "Hostiggo-App (Next.js)",
      },
    });

    if (!response.ok) throw new Error("Autocomplete request failed");

    const data = await response.json();
    if (!data) return [];

    return data.map((result: any) => ({
      placeId: result.osm_id,
      displayName: result.display_name,
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      boundingBox: result.boundingbox
        ? [
            parseFloat(result.boundingbox[0]),
            parseFloat(result.boundingbox[1]),
            parseFloat(result.boundingbox[2]),
            parseFloat(result.boundingbox[3]),
          ]
        : [0, 0, 0, 0],
    }));
  } catch (error) {
    console.error("[autocompleteAddress] Error:", error);
    return [];
  }
}

/**
 * Format address components into a readable string
 */
export function formatAddress(address: GeocodingResult["address"]): string {
  const parts = [];
  if (address.street) parts.push(address.street);
  if (address.city) parts.push(address.city);
  if (address.state) parts.push(address.state);
  if (address.postcode) parts.push(address.postcode);
  if (address.country) parts.push(address.country);
  return parts.filter(Boolean).join(", ");
}
