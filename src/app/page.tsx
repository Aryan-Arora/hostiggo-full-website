'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import HeroSection from '@/components/features/HeroSection';
import PopularStays from '@/components/features/PopularStays';
import CTABanner from '@/components/features/CTABanner';
import type { Property } from '@/types';
import { api, mapListingToProperty } from '@/lib/api';

type HomeSection = {
  id: string;
  title: string;
  properties: Property[];
};

export default function HomePage() {
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let mounted = true;

    const loadHomeData = async () => {
      setIsLoading(true);
      setError(false);
      try {
        const locations = await api.locations(40);
        const selected = locations
          .slice()
          .sort(() => Math.random() - 0.5)
          .slice(0, 4);

        const loaded = await Promise.all(
          selected.map(async (location: any) => {
            const rows = await api.hotelsByLocation(location.location_id, 4);
            return {
              id: String(location.location_id),
              title: `Popular stays in ${
                location.district ||
                location.lower_division_name ||
                location.state ||
                'India'
              }`,
              properties: rows
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
    <div className="min-h-screen bg-[#f8f6f1]">
      <Navbar />
      <HeroSection />
      <div className="container-main py-8 space-y-10">
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
                  : 'Check back soon — new homestays are added regularly.'}
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
