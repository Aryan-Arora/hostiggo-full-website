// Best-effort matcher: turns the free-text amenity strings the AI-lister
// backend scrapes from a source site (e.g. "Fast wifi", "Free parking on
// premises") into this platform's `amenities` table ids. Deliberately
// conservative -- a miss just means the host ticks the box themselves in
// the AI review screen; a false match is worse than a gap.

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

// Extra tokens that count as a hit for a given catalog name (keys are the
// *normalized* catalog `name`). Keep synonyms as whole phrases, never bare
// ambiguous words -- e.g. "pool" alone would wrongly match "Pool Table".
const SYNONYMS: Record<string, string[]> = {
  wifi: ['wi fi', 'internet', 'wireless', 'wlan'],
  'air conditioning': ['ac', 'a c', 'air con', 'aircon'],
  'free parking': ['parking', 'car park', 'garage', 'free parking on premises'],
  tv: ['television', 'smart tv', 'cable tv', 'led tv'],
  'swimming pool': ['private pool', 'shared pool', 'infinity pool', 'plunge pool', 'common pool'],
  'washing machine': ['washer', 'laundry'],
  dryer: ['clothes dryer', 'tumble dryer'],
  kitchen: ['kitchenette', 'cooking area'],
  heater: ['heating', 'central heating', 'room heater'],
  'hot tub': ['jacuzzi', 'hottub'],
  gym: ['fitness', 'fitness centre', 'fitness center'],
  'exercise equipment': ['exercise room', 'workout equipment'],
  'smoke alarm': ['smoke detector'],
  'first aid kit': ['first aid'],
  'fire extinguisher': ['extinguisher'],
  'bbq grill': ['bbq', 'barbecue', 'barbeque'],
  garden: ['backyard', 'lawn', 'private garden'],
  balcony: ['private balcony', 'sit out balcony'],
  'pet friendly': ['pets allowed', 'pets welcome', 'dog friendly'],
  refrigerator: ['fridge', 'mini fridge'],
  elevator: ['lift'],
  '24x7 security': ['24 7 security', 'security guard', 'cctv', 'gated security'],
};

/**
 * @param rawNames free-text amenity names from the source listing
 * @param catalog  rows from `GET /api/amenities` ({ amenity_id, name })
 * @returns de-duplicated amenity_id[]
 */
export function matchAmenityNames(
  rawNames: string[],
  catalog: { amenity_id: number; name: string }[],
): number[] {
  if (!rawNames?.length || !catalog?.length) return [];

  // Drop 1-char tokens ("a", "1") that would produce runaway substring hits.
  const normalizedRaw = rawNames.map(norm).filter((s) => s.length >= 2);
  const matched = new Set<number>();

  const hits = (needle: string, raw: string) => {
    if (needle.length < 2) return false;
    // Very short needles (e.g. "ac", "tv") must match a whole token exactly,
    // otherwise they hit unrelated words ("terrace" contains "ac").
    if (needle.length <= 2) return raw === needle || raw.split(' ').includes(needle);
    // raw substring of needle only when raw is itself a real word, so a
    // 2-char raw like "tv" can't match inside "cctv".
    return raw.includes(needle) || (raw.length >= 4 && needle.includes(raw));
  };

  for (const row of catalog) {
    const name = norm(row.name);
    if (name.length < 2) continue;
    const needles = [name, ...(SYNONYMS[name] ?? []).map(norm)];

    if (normalizedRaw.some((raw) => needles.some((needle) => hits(needle, raw)))) {
      matched.add(row.amenity_id);
    }
  }

  return [...matched];
}
