'use client';

import Link from 'next/link';
import { MapPin, Star, Pencil, SlidersHorizontal } from 'lucide-react';
import HostDashboardShell, { DashboardHeading } from '../_components/HostDashboardShell';
import { cn } from '@/lib/utils';

type Listing = {
  id: string;
  name: string;
  location: string;
  price: number;
  image: string;
  status: 'incomplete' | 'live' | 'paused';
  rating?: number;
  reviews?: number;
  note: string;
  cta: string;
};

const LISTINGS: Listing[] = [
  {
    id: '1',
    name: 'Ocean Breeze Villa',
    location: 'Malibu, California',
    price: 450,
    image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&h=450&fit=crop&q=80',
    status: 'incomplete',
    note: 'Missing photos & ID',
    cta: 'Finish Listing',
  },
  {
    id: '2',
    name: 'Summit Peak Retreat',
    location: 'Aspen, Colorado',
    price: 320,
    image: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=600&h=450&fit=crop&q=80',
    status: 'live',
    rating: 4.92,
    reviews: 128,
    note: 'Active Booking',
    cta: 'Edit Listing',
  },
  {
    id: '3',
    name: 'Industrial Arts Loft',
    location: 'Brooklyn, New York',
    price: 185,
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&h=450&fit=crop&q=80',
    status: 'live',
    rating: 4.85,
    reviews: 94,
    note: 'Next: Oct 12',
    cta: 'Edit Listing',
  },
  {
    id: '4',
    name: 'Desert Mirage House',
    location: 'Scottsdale, Arizona',
    price: 275,
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&h=450&fit=crop&q=80',
    status: 'paused',
    rating: 4.7,
    reviews: 56,
    note: 'Paused',
    cta: 'Reactivate',
  },
];

const STATUS_DOT: Record<Listing['status'], string> = {
  incomplete: 'bg-red-500 animate-pulse',
  live: 'bg-green-500',
  paused: 'bg-gray-400',
};

const STATUS_LABEL: Record<Listing['status'], string> = {
  incomplete: 'Incomplete',
  live: 'Live',
  paused: 'Paused',
};

export default function MyListingsPage() {
  return (
    <HostDashboardShell active="listings">
      <DashboardHeading
        title="Your Listings"
        subtitle="Manage your properties, update availability, and maximize your earnings from one central dashboard."
        actions={
          <button className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium hover:bg-gray-50 transition-all">
            <SlidersHorizontal className="w-5 h-5" />
            Sort: Priority
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {LISTINGS.map((l) => (
          <article
            key={l.id}
            className={cn(
              'group relative bg-white rounded-2xl shadow-card overflow-hidden border border-gray-100 hover:shadow-card-hover transition-all duration-300',
              l.status === 'paused' && 'opacity-80 hover:opacity-100',
            )}
          >
            <div className="relative aspect-[4/3] overflow-hidden">
              <img
                src={l.image}
                alt={l.name}
                className={cn(
                  'w-full h-full object-cover transition-all duration-500',
                  l.status === 'paused' && 'grayscale group-hover:grayscale-0',
                )}
              />
              <div className="absolute top-4 left-4 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                <span className={cn('w-2 h-2 rounded-full', STATUS_DOT[l.status])} />
                <span className="text-xs font-semibold text-gray-700">
                  {STATUS_LABEL[l.status]}
                </span>
              </div>
              <div className="absolute inset-0 bg-blue-900/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Link
                  href="/host/listings/manage"
                  className="bg-white text-blue-600 px-6 py-3 rounded-xl font-bold shadow-lg translate-y-4 group-hover:translate-y-0 transition-transform duration-300 flex items-center gap-2"
                >
                  <Pencil className="w-5 h-5" />
                  {l.cta}
                </Link>
              </div>
            </div>
            <div className="p-6">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-bold text-gray-800 truncate pr-4">
                  {l.name}
                </h3>
                <span className="text-lg font-bold text-blue-600">
                  ${l.price}
                  <span className="text-sm text-gray-400 font-normal">/nt</span>
                </span>
              </div>
              <p className="text-sm text-gray-500 flex items-center gap-1 mb-6">
                <MapPin className="w-4 h-4" />
                {l.location}
              </p>
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                {l.rating ? (
                  <div className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span className="text-sm font-bold text-gray-800">{l.rating}</span>
                    <span className="text-xs text-gray-400">({l.reviews})</span>
                  </div>
                ) : (
                  <span className="w-9 h-9 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-600">
                    75%
                  </span>
                )}
                <p
                  className={cn(
                    'text-xs font-bold',
                    l.status === 'incomplete' ? 'text-red-500' : 'text-gray-500',
                  )}
                >
                  {l.note}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </HostDashboardShell>
  );
}
