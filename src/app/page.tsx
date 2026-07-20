'use client';

import { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import HeroSection from '@/components/features/HeroSection';
import PopularStays from '@/components/features/PopularStays';
import CTABanner from '@/components/features/CTABanner';
import type { Property, SearchFilters } from '@/types';
import { api, mapListingToProperty } from '@/lib/api';

type HomeSection = {
  id: string;
  title: string;
  properties: Property[];
};

// Default, unfiltered search -- both the "near you" and "popular cities"
// sections go through the same api.search() stack (the same one the
// search-results page uses), just with different destination/geo params.
const NO_FILTERS: SearchFilters = {
  priceMin: 0,
  priceMax: 100000,
  guestRating: null,
  propertyTypes: [],
  stayTypes: [],
  amenities: [],
  bedTypes: [],
  freeCancellation: false,
  breakfast: false,
  parking: false,
  wifi: false,
  ac: false,
  privateRoom: false,
  sharedRoom: false,
  doubleBed: false,
  coupleFriendly: false,
  familyFriendly: false,
};

type GeoState = 'idle' | 'requesting' | 'granted' | 'denied' | 'unsupported';

// Remembers the user's choice across refreshes so the banner doesn't nag on
// every page load -- once they've granted or denied, we respect that and
// only ask again if they explicitly clear it (e.g. browser site data reset).
const GEO_CHOICE_KEY = 'hostiggo:geo-choice';

export default function HomePage() {
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [nearbyProperties, setNearbyProperties] = useState<Property[] | null>(null);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [geoState, setGeoState] = useState<GeoState>('idle');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  const fetchNearby = (latitude: number, longitude: number) => {
    setNearbyLoading(true);
    api
      .search(NO_FILTERS, '', 0, 8, { latitude, longitude })
      .then((rows) => {
        setNearbyProperties((rows || []).map(mapListingToProperty).filter((item) => item.id));
      })
      .catch((err) => {
        console.error('[home] failed to load nearby listings:', err);
        setNearbyProperties([]);
      })
      .finally(() => setNearbyLoading(false));
  };

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoState('unsupported');
      return;
    }
    const storedChoice = localStorage.getItem(GEO_CHOICE_KEY);
    if (storedChoice === 'denied') {
      setGeoState('denied');
      return;
    }
    if (storedChoice === 'granted') {
      setGeoState('requesting');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGeoState('granted');
          fetchNearby(pos.coords.latitude, pos.coords.longitude);
        },
        (err) => {
          // Permission was revoked outside the app (browser settings) --
          // fall back to asking again rather than getting stuck.
          console.warn('[home] stored geo grant no longer valid:', err.message);
          localStorage.removeItem(GEO_CHOICE_KEY);
          setGeoState('idle');
        },
        { enableHighAccuracy: false, timeout: 10000 },
      );
    }
  }, []);

  const requestNearbyStays = () => {
    if (!navigator.geolocation) {
      setGeoState('unsupported');
      return;
    }
    setGeoState('requesting');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        localStorage.setItem(GEO_CHOICE_KEY, 'granted');
        setGeoState('granted');
        fetchNearby(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        console.warn('[home] geolocation denied/failed:', err.message);
        localStorage.setItem(GEO_CHOICE_KEY, 'denied');
        setGeoState('denied');
      },
      { enableHighAccuracy: false, timeout: 10000 },
    );
  };

  useEffect(() => {
    let mounted = true;

    const loadHomeData = async () => {
      setIsLoading(true);
      setError(false);
      try {
        const popularLocations = await api.locations(4, undefined, true);

        const loaded = await Promise.all(
          popularLocations.map(async (location: any) => {
            const cityName =
              location.district || location.lower_division_name || location.state || 'India';
            const rows = await api.search(NO_FILTERS, cityName, 0, 4);
            return {
              id: String(location.location_id),
              title: `Popular stays in ${cityName}`,
              properties: (rows || [])
                .map(mapListingToProperty)
                .filter((item) => item.id),
            };
          }),
        );

        if (mounted) {
          setSections(
            loaded.filter((section) => section.properties.length > 0),
          );
          setIsLoading(false);
        }
      } catch (err) {
        console.error('[home] failed to load Supabase listings:', err);
        if (mounted) {
          setSections([]);
          setError(true);
          setIsLoading(false);
        }
      }
    };

    loadHomeData();

    return () => {
      mounted = false;
    };
  }, [reloadToken]);

  return (
    <div className="min-h-screen bg-figma-cream">
      <Navbar />
      <HeroSection />
      <div className="container-main py-8 space-y-10">
        {geoState === 'idle' && (
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <p className="text-[13.5px] text-blue-800 font-medium">
                Share your location to see homestays near you first.
              </p>
            </div>
            <button
              onClick={requestNearbyStays}
              className="bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-semibold px-4 py-2 rounded-xl transition-colors flex-shrink-0"
            >
              Use my location
            </button>
          </div>
        )}

        {geoState === 'requesting' || nearbyLoading ? (
          <PopularStays
            title="Finding homestays near you..."
            properties={[]}
            isLoading={true}
            itemsPerRow={4}
          />
        ) : geoState === 'granted' && nearbyProperties && nearbyProperties.length > 0 ? (
          <PopularStays
            title="Homestays near you"
            properties={nearbyProperties}
            itemsPerRow={4}
          />
        ) : null}

        {isLoading ? (
          // Show 2 loading sections on initial load
          <>
            <PopularStays
              title="Popular stays loading..."
              properties={[]}
              isLoading={true}
              itemsPerRow={4}
            />
            <PopularStays
              title="Popular stays loading..."
              properties={[]}
              isLoading={true}
              itemsPerRow={4}
            />
          </>
        ) : sections.length === 0 ? (
          <>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-card py-16 px-6 text-center">
              <p className="text-4xl mb-3">{error ? '😕' : '🏠'}</p>
              <h2 className="text-lg font-bold text-gray-800 mb-1">
                {error ? "We couldn't load stays right now" : 'No stays to show yet'}
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                {error
                  ? 'Something went wrong reaching our listings. Please try again.'
                  : 'Check back soon. New homestays are added regularly.'}
              </p>
              {error && (
                <button
                  onClick={() => setReloadToken((t) => t + 1)}
                  className="btn-primary"
                >
                  Try again
                </button>
              )}
            </div>
            <CTABanner />
          </>
        ) : (
          <>
            {sections.slice(0, 2).map((section) => (
              <PopularStays
                key={section.id}
                title={section.title}
                properties={section.properties}
              />
            ))}
            <CTABanner />
            {sections.slice(2).map((section) => (
              <PopularStays
                key={section.id}
                title={section.title}
                properties={section.properties}
              />
            ))}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
