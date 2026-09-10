import {
  Wifi,
  UtensilsCrossed,
  Snowflake,
  Thermometer,
  Tv,
  WashingMachine,
  Car,
  PawPrint,
  Waves,
  Bath,
  DoorOpen,
  Sun,
  Trees,
  Flame,
  Dumbbell,
  ShieldAlert,
  FireExtinguisher,
  BriefcaseMedical,
  Siren,
  LayoutGrid,
  Star,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';

// Single source of truth for the amenity picker, shared by the listing
// wizard (src/app/host/list/amenities/page.tsx), the AI-import review
// screen, and the Edit Listing dashboard. Previously this lived inline in
// the wizard page only.

export type Amenity = { id: string; label: string; icon: LucideIcon };

export const CATEGORIES: { title: string; icon: LucideIcon; items: Amenity[] }[] = [
  {
    title: 'Essentials',
    icon: LayoutGrid,
    items: [
      { id: 'wifi', label: 'WiFi', icon: Wifi },
      { id: 'kitchen', label: 'Kitchen', icon: UtensilsCrossed },
      { id: 'ac', label: 'Air Conditioning', icon: Snowflake },
      { id: 'heating', label: 'Heating', icon: Thermometer },
      { id: 'tv', label: 'TV', icon: Tv },
      { id: 'washer', label: 'Washing Machine', icon: WashingMachine },
      { id: 'parking', label: 'Free Parking', icon: Car },
      { id: 'pets', label: 'Pets Allowed', icon: PawPrint },
    ],
  },
  {
    title: 'Features',
    icon: Star,
    items: [
      { id: 'pool', label: 'Pool', icon: Waves },
      { id: 'hottub', label: 'Hot Tub', icon: Bath },
      { id: 'balcony', label: 'Balcony', icon: DoorOpen },
      { id: 'deck', label: 'Deck', icon: Sun },
      { id: 'garden', label: 'Garden', icon: Trees },
      { id: 'bbq', label: 'BBQ Grill', icon: Flame },
      { id: 'fireplace', label: 'Indoor Fireplace', icon: Flame },
      { id: 'gym', label: 'Gym', icon: Dumbbell },
    ],
  },
  {
    title: 'Safety',
    icon: ShieldCheck,
    items: [
      { id: 'smoke', label: 'Smoke Alarm', icon: ShieldAlert },
      { id: 'extinguisher', label: 'Fire Extinguisher', icon: FireExtinguisher },
      { id: 'firstaid', label: 'First Aid Kit', icon: BriefcaseMedical },
      { id: 'emergency', label: 'Emergency Plan', icon: Siren },
    ],
  },
];

// Maps the wizard's amenity ids to the DB `amenities` table's amenity_id.
// `deck`, `fireplace` and `emergency` have no row in that table yet and are
// silently dropped by callers' `.filter(Boolean)`.
export const AMENITY_DB_ID: Record<string, number> = {
  wifi: 1, ac: 2, heating: 3, kitchen: 4, washer: 5, parking: 7, tv: 8,
  pool: 11, gym: 12, hottub: 13, balcony: 14, smoke: 16, extinguisher: 17,
  firstaid: 18, pets: 19, bbq: 21, garden: 22,
};

export const LABELS: Record<string, string> = Object.fromEntries(
  CATEGORIES.flatMap((c) => c.items).map((i) => [i.id, i.label]),
);

/** DB amenity_id[] -> the wizard's string ids (for seeding the grid). */
export function stringIdsFromDbIds(dbIds: number[] | undefined | null): Set<string> {
  if (!dbIds?.length) return new Set();
  const set = new Set(dbIds);
  return new Set(
    Object.entries(AMENITY_DB_ID)
      .filter(([, id]) => set.has(id))
      .map(([key]) => key),
  );
}

/** The wizard's string ids -> DB amenity_id[] (drops unmapped ids). */
export function dbIdsFromStringIds(stringIds: Iterable<string>): number[] {
  return [...stringIds].map((k) => AMENITY_DB_ID[k]).filter(Boolean);
}
