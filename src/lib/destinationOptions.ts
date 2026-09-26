import { resolveDestinationAlias } from './destinationAliases';

type LocationResult = {
  state?: string | null;
  district?: string | null;
  lower_division_name?: string | null;
};

export type DestinationOption = {
  key: string;
  name: string;
  state: string;
  // Searches every listing in `state` rather than one city/district.
  wholeState: boolean;
};

// Case-, accent- and whitespace-insensitive form of a place name, so
// "Haryāna" and "Haryana" count as the same place.
export function normalizePlaceName(name?: string | null): string {
  return (name ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase();
}

const isPlainAscii = (name: string) => normalizePlaceName(name) === name.trim().toLowerCase();

// Turns raw `locations` rows from the destination search into the options the
// dropdown shows. The rows are one per saved locality, so the same city can
// come back several times (five "Faridabad"s) or under an old name
// ("Gurgaon"); collapse those into one option per place. When the query names
// a state, offer the whole state first -- a state isn't a row of its own, so
// without this there was no way to search all of e.g. Haryana.
export function buildDestinationOptions(
  results: LocationResult[],
  query: string,
  countOfState: (state: string) => number = () => 0,
): DestinationOption[] {
  const q = normalizePlaceName(query);
  const states = new Map<string, DestinationOption>();
  const places = new Map<string, DestinationOption>();

  for (const row of results) {
    const state = (row.state ?? '').trim();
    const stateKey = normalizePlaceName(state);

    if (stateKey && q && stateKey.includes(q)) {
      const existing = states.get(stateKey);
      // Prefer the unaccented spelling -- it's the one most rows (and so the
      // search's state match) use.
      if (!existing || (!isPlainAscii(existing.name) && isPlainAscii(state))) {
        states.set(stateKey, { key: `state:${stateKey}`, name: state, state, wholeState: true });
      }
    }

    const raw = (row.district || row.lower_division_name || state).trim();
    const name = resolveDestinationAlias(raw)?.district ?? raw;
    const nameKey = normalizePlaceName(name);
    if (!nameKey) continue;
    const key = `${nameKey}|${stateKey}`;
    if (!places.has(key)) places.set(key, { key, name, state, wholeState: false });
  }

  // A place named after its own state (Delhi, Goa) is the whole-state option.
  const placeList = [...places.values()].filter((p) => {
    const nameKey = normalizePlaceName(p.name);
    return !(nameKey === normalizePlaceName(p.state) && states.has(nameKey));
  });
  // Stable sort: places in states with more listings first, ties keep DB order.
  placeList.sort((a, b) => countOfState(b.state) - countOfState(a.state));

  return [...states.values(), ...placeList];
}
