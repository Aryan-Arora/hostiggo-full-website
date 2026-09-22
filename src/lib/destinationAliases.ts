// Place names people search for that don't match how `locations` rows are
// stored. Keys are lowercase. An alias either widens the search to a whole
// state or swaps in the district name the listings are actually filed under.
type DestinationAlias = { state?: string; district?: string };

const DESTINATION_ALIASES: Record<string, DestinationAlias> = {
  // Delhi is a city-state. The destination dropdown's "New Delhi" city guide
  // (and every one of its popular areas) searches "New Delhi", but most Delhi
  // listings are filed under district "Delhi", so search the whole state.
  'new delhi': { state: 'Delhi' },
  // Old name for the city; its listings are filed under "Gurugram".
  gurgaon: { district: 'Gurugram' },
};

export function resolveDestinationAlias(destination?: string | null): DestinationAlias | null {
  if (!destination) return null;
  return DESTINATION_ALIASES[destination.trim().toLowerCase()] ?? null;
}
