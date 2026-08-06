import type { Destination } from "@/types";

// Cities shown as quick suggestions in the empty destination search dropdown.
// (state is left blank where the name already implies it, e.g. New Delhi.)
export const SUGGESTED_DESTINATIONS: Destination[] = [
  { id: "1", name: "New Delhi", state: "", stayCount: 12060, imageUrl: "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=96&h=96&fit=crop&q=80" },
  { id: "2", name: "Noida", state: "Uttar Pradesh", stayCount: 9500, imageUrl: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=96&h=96&fit=crop&q=80" },
  { id: "3", name: "Shimla", state: "Himachal Pradesh", stayCount: 5530, imageUrl: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=96&h=96&fit=crop&q=80" },
  { id: "4", name: "Jaipur", state: "Rajasthan", stayCount: 8900, imageUrl: "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=96&h=96&fit=crop&q=80" },
  { id: "5", name: "Uttarakhand", state: "Uttarakhand", stayCount: 7410, imageUrl: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=96&h=96&fit=crop&q=80" },
  { id: "6", name: "Kolkata", state: "West Bengal", stayCount: 6200, imageUrl: "https://images.unsplash.com/photo-1558431382-27e303142255?w=96&h=96&fit=crop&q=80" },
  { id: "7", name: "Bangalore", state: "Karnataka", stayCount: 10800, imageUrl: "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=96&h=96&fit=crop&q=80" },
  { id: "8", name: "Guwahati", state: "Assam", stayCount: 2870, imageUrl: "https://images.unsplash.com/photo-1548013146-72479768bada?w=96&h=96&fit=crop&q=80" },
];

export type CityAreaGuide = {
  name: string;
  description: string;
};

export type CityGuide = {
  city: string;
  state: string;
  stayCount: number;
  imageUrl: string;
  areas: CityAreaGuide[];
};

/**
 * Curated "city guides" that power the destination search dropdown. When the
 * user types a city that has a guide, the dropdown surfaces its popular areas.
 * Listings are stored at city/district level, so selecting an area searches the
 * parent city's stays — the area name is carried through only as context for the
 * results header (true per-area filtering would need each listing area-tagged).
 */
export const CITY_GUIDES: CityGuide[] = [
  {
    city: "New Delhi",
    state: "Delhi",
    stayCount: 12187,
    imageUrl: "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=128&h=128&fit=crop&q=80",
    areas: [
      { name: "Connaught Place", description: "Central Delhi, shopping, restaurants, nightlife" },
      { name: "Karol Bagh", description: "Markets, very popular with travelers" },
      { name: "Paharganj", description: "Near new delhi railway station, backpacker area" },
      { name: "Hauz Khas", description: "Trendy cafes, nightlife, lake view heritage site" },
      { name: "Aerocity", description: "Luxury hotels, modern district near airport" },
    ],
  },
  {
    city: "Manali",
    state: "Himachal Pradesh",
    stayCount: 4320,
    imageUrl: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=128&h=128&fit=crop&q=80",
    areas: [
      { name: "Old Manali", description: "Riverside cafes, laid-back backpacker vibe" },
      { name: "Mall Road", description: "Central market, shops and eateries" },
      { name: "Solang Valley", description: "Adventure sports, snow, paragliding" },
      { name: "Vashisht", description: "Hot springs, temples, budget stays" },
    ],
  },
  {
    city: "Jaipur",
    state: "Rajasthan",
    stayCount: 8900,
    imageUrl: "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=128&h=128&fit=crop&q=80",
    areas: [
      { name: "C-Scheme", description: "Upscale central area, cafes and boutiques" },
      { name: "Bani Park", description: "Heritage havelis, quiet, near the station" },
      { name: "Amer", description: "Near Amer Fort, historic and scenic" },
      { name: "MI Road", description: "Shopping, dining and city-centre buzz" },
    ],
  },
  {
    city: "Bangalore",
    state: "Karnataka",
    stayCount: 10800,
    imageUrl: "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=128&h=128&fit=crop&q=80",
    areas: [
      { name: "Indiranagar", description: "Trendy pubs, restaurants and boutiques" },
      { name: "Koramangala", description: "Startup hub, cafes and nightlife" },
      { name: "MG Road", description: "Central shopping and business district" },
      { name: "Whitefield", description: "IT parks, modern district near tech campuses" },
    ],
  },
  {
    city: "Goa",
    state: "Goa",
    stayCount: 15400,
    imageUrl: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=128&h=128&fit=crop&q=80",
    areas: [
      { name: "Baga", description: "Lively beach, shacks and nightlife" },
      { name: "Calangute", description: "Popular beach, water sports and markets" },
      { name: "Anjuna", description: "Flea market, cliffs and beach parties" },
      { name: "Panjim", description: "Latin quarter, riverside capital charm" },
    ],
  },
];

/** Find a curated city guide by (partial, case-insensitive) name match. */
export const findCityGuide = (query: string): CityGuide | undefined => {
  const q = query.trim().toLowerCase();
  if (!q) return undefined;
  return CITY_GUIDES.find((g) => {
    const city = g.city.toLowerCase();
    return city.startsWith(q) || q.startsWith(city) || (q.length >= 3 && city.includes(q));
  });
};

