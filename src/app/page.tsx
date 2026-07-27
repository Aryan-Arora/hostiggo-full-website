import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import HeroSection from '@/components/features/HeroSection';
import HomeSections, { type HomeSection } from '@/components/features/HomeSections';
import { mapListingToProperty } from '@/lib/api';
import {
  getCachedLocations,
  getCachedHotelsTeaser,
} from '@/lib/services/cached-reference-data';

// Matches the 60s revalidate window on getCachedHotelsTeaser -- without
// this, Next would prerender this page once at build time (it's fully
// static: no cookies()/headers() usage) and never regenerate it, so new
// listings would never show up until the next deploy.
export const revalidate = 60;

// Server Component: the "Popular stays" sections are fetched here, at
// request/build time, straight from the cached data-layer functions (no
// client-side fetch waterfall, no extra HTTP hop through our own /api/*
// routes). Only the geolocation-gated "near you" section -- which needs the
// browser Geolocation API -- lives in the client child (HomeSections).
async function loadHomeSections(): Promise<{ sections: HomeSection[]; error: boolean }> {
  try {
    const popularLocations = await getCachedLocations(true, 4);

    const loaded = await Promise.all(
      popularLocations.map(async (location: any) => {
        const cityName =
          location.district || location.lower_division_name || location.state || 'India';
        const rows = await getCachedHotelsTeaser(location.location_id, 4);
        return {
          id: String(location.location_id),
          title: `Popular stays in ${cityName}`,
          properties: (rows || []).map(mapListingToProperty).filter((item) => item.id),
        };
      }),
    );

    return { sections: loaded.filter((section) => section.properties.length > 0), error: false };
  } catch (err) {
    console.error('[home] failed to load Supabase listings:', err);
    return { sections: [], error: true };
  }
}

export default async function HomePage() {
  const { sections, error } = await loadHomeSections();

  return (
    <div className="min-h-screen bg-figma-cream">
      <Navbar />
      <HeroSection />
      <HomeSections initialSections={sections} initialError={error} />
      <Footer />
    </div>
  );
}
