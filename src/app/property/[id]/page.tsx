'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import DateRangePicker from '@/components/features/DateRangePicker';
import {
  Star,
  Heart,
  MapPin,
  Wifi,
  Car,
  Coffee,
  Zap,
  Droplets,
  UtensilsCrossed,
  ArrowLeft,
  Mountain,
  CheckCircle,
  Users,
  BedDouble,
  ChevronLeft,
  ChevronRight,
  X,
  CalendarDays,
  Wind,
  MessageSquare,
  Award,
  Shield,
  Clock,
  ChevronDown,
  Share2,
  ExternalLink,
  Grid3x3,
  Filter,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { cn, toISODate } from '@/lib/utils';
import type { Property, AmenityItem, Review, Host } from '@/types';
import { api, mapListingToProperty } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useWishlist } from '@/hooks/useWishlist';
import { toast } from 'sonner';

const FALLBACK =
  'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&h=600&fit=crop&q=80';

// ── Amenity Icon Map ─────────────────────────────────────────────────
const AMENITY_ICON_MAP: Record<string, React.ReactNode> = {
  wifi: <Wifi className="w-5 h-5" />,
  car: <Car className="w-5 h-5" />,
  coffee: <Coffee className="w-5 h-5" />,
  zap: <Zap className="w-5 h-5" />,
  droplets: <Droplets className="w-5 h-5" />,
  utensils: <UtensilsCrossed className="w-5 h-5" />,
  mountain: <Mountain className="w-5 h-5" />,
  wind: <Wind className="w-5 h-5" />,
};

// ── 1. Full-Screen Gallery Modal ─────────────────────────────────────
function GalleryModal({
  images,
  startIdx,
  onClose,
}: {
  images: string[];
  startIdx: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(startIdx);
  const touchStart = useRef<number | null>(null);

  const prev = useCallback(
    () => setIdx((i) => (i - 1 + images.length) % images.length),
    [images.length],
  );
  const next = useCallback(
    () => setIdx((i) => (i + 1) % images.length),
    [images.length],
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, prev, next]);

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/95 flex flex-col"
      onClick={onClose}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-3 flex-shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-white/70 text-sm font-medium">
          {idx + 1} / {images.length}
        </span>
        <button
          onClick={onClose}
          className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main image */}
      <div
        className="flex-1 relative flex items-center justify-center px-14 py-4 min-h-0"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => {
          touchStart.current = e.changedTouches[0].clientX;
        }}
        onTouchEnd={(e) => {
          if (touchStart.current === null) return;
          const diff = touchStart.current - e.changedTouches[0].clientX;
          if (Math.abs(diff) > 50) diff > 0 ? next() : prev();
          touchStart.current = null;
        }}
      >
        <img
          key={idx}
          src={images[idx] || FALLBACK}
          alt={`Photo ${idx + 1}`}
          className="max-w-full max-h-full object-contain rounded-lg select-none"
          style={{ animation: 'fadeIn 0.2s ease' }}
          draggable={false}
        />
        <button
          onClick={prev}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/25 rounded-full flex items-center justify-center text-white transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={next}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/25 rounded-full flex items-center justify-center text-white transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Thumbnail strip */}
      <div
        className="flex-shrink-0 px-5 pb-4 overflow-x-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex gap-2 justify-center">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              aria-label={`View photo ${i + 1}`}
              className={cn(
                'w-14 h-10 rounded-md overflow-hidden flex-shrink-0 border-2 transition-all',
                i === idx
                  ? 'border-white opacity-100 scale-105'
                  : 'border-transparent opacity-50 hover:opacity-80',
              )}
            >
              <img
                src={img}
                alt={`Photo ${i + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── 2. Image Gallery Grid ────────────────────────────────────────────
function ImageGallery({
  images,
  propertyName,
}: {
  images: string[];
  propertyName: string;
}) {
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryStart, setGalleryStart] = useState(0);

  const open = (i: number) => {
    setGalleryStart(i);
    setGalleryOpen(true);
  };
  const imgs =
    images.length >= 5
      ? images
      : [...images, ...Array(5 - images.length).fill(FALLBACK)];

  return (
    <>
      {/* Grid: 1 large + 4 small */}
      <div
        className="relative rounded-2xl overflow-hidden mb-6"
        style={{ height: 'clamp(260px, 44vw, 440px)' }}
      >
        <div className="grid grid-cols-2 grid-rows-2 gap-1.5 h-full">
          {/* Primary large image */}
          <div
            className="row-span-2 relative overflow-hidden cursor-pointer group"
            onClick={() => open(0)}
          >
            <img
              src={imgs[0]}
              alt={`${propertyName} main`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="eager"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </div>

          {/* 4 small images */}
          <div className="grid grid-cols-2 gap-1.5 col-span-1 row-span-2">
            {imgs.slice(1, 5).map((src, i) => (
              <div
                key={i}
                className={cn(
                  'relative overflow-hidden cursor-pointer group',
                  i === 3 && 'relative',
                )}
                onClick={() => open(i + 1)}
              >
                <img
                  src={src}
                  alt={`${propertyName} ${i + 2}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                {/* "Show all" on last tile */}
                {i === 3 && images.length > 5 && (
                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white">
                    <Grid3x3 className="w-5 h-5 mb-1" />
                    <span className="text-sm font-bold">
                      +{images.length - 5} more
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Show all button overlay */}
        <button
          onClick={() => open(0)}
          className="absolute bottom-3 right-3 bg-white hover:bg-gray-50 text-gray-800 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg border border-gray-200 transition-colors"
        >
          <Grid3x3 className="w-3.5 h-3.5" />
          Show all photos
        </button>
      </div>

      {galleryOpen && (
        <GalleryModal
          images={images}
          startIdx={galleryStart}
          onClose={() => setGalleryOpen(false)}
        />
      )}
    </>
  );
}

// ── 3. Property Map ──────────────────────────────────────────────────
function PropertyMap({ property }: { property: Property }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [loaded, setLoaded] = useState(false);

  const CITY_CENTERS: Record<string, { lat: number; lng: number }> = {
    'New Delhi': { lat: 28.6139, lng: 77.209 },
    Manali: { lat: 32.2396, lng: 77.1887 },
    Shimla: { lat: 31.1048, lng: 77.1734 },
    Jaipur: { lat: 26.9124, lng: 75.7873 },
    Bangalore: { lat: 12.9716, lng: 77.5946 },
    Rishikesh: { lat: 30.0869, lng: 78.2676 },
    Goa: { lat: 15.2993, lng: 74.124 },
    Dharamshala: { lat: 32.219, lng: 76.3234 },
    Kasol: { lat: 32.0109, lng: 77.313 },
    Kolkata: { lat: 22.5726, lng: 88.3639 },
  };

  const getCenter = () => {
    if (property.coordinates)
      return { lat: property.coordinates.lat, lng: property.coordinates.lng };
    for (const [name, coords] of Object.entries(CITY_CENTERS)) {
      if (property.city.toLowerCase().includes(name.toLowerCase()))
        return coords;
    }
    return { lat: 22.5937, lng: 78.9629 };
  };

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const L = require('leaflet');

    // Load CSS on client
    if (typeof document !== 'undefined' && !document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    const center = getCenter();

    mapInstanceRef.current = L.map(mapRef.current).setView(
      [center.lat, center.lng],
      14,
    );

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(mapInstanceRef.current);

    // Create custom red pin marker using divIcon (most reliable approach)
    const customIcon = L.divIcon({
      html: `
        <div style="
          width: 32px;
          height: 40px;
          background-image: url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22%23ef4444%22><path d=%22M12 2C7.58 2 4 5.58 4 10c0 5.25 8 13 8 13s8-7.75 8-13c0-4.42-3.58-8-8-8zm0 11c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z%22/></svg>');
          background-repeat: no-repeat;
          background-position: center;
          background-size: contain;
          cursor: pointer;
        "></div>
      `,
      iconSize: [32, 40],
      iconAnchor: [16, 40],
      popupAnchor: [0, -40],
      className: 'custom-marker-pin',
    });

    // Add marker with custom red pin icon
    markerRef.current = L.marker([center.lat, center.lng], {
      icon: customIcon,
      title: property.propertyName,
    })
      .addTo(mapInstanceRef.current)
      .bindPopup(property.propertyName);

    setLoaded(true);
  }, [property.propertyName, property.coordinates]);

  const center = getCenter();

  return (
    <div className="space-y-3">
      <div
        className="rounded-xl overflow-hidden border border-gray-100 relative"
        style={{ height: 280 }}
      >
        <div ref={mapRef} className="w-full h-full" />
        {!loaded && (
          <div className="absolute inset-0 bg-blue-50 flex items-center justify-center">
            <div className="text-center">
              <div className="w-7 h-7 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-[12px] text-blue-500 font-medium">
                Loading map…
              </p>
            </div>
          </div>
        )}
      </div>
      <a
        href={`https://www.openstreetmap.org/?mlat=${center.lat}&mlon=${center.lng}&zoom=14`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-[12px] text-blue-600 hover:text-blue-700 font-semibold transition-colors"
      >
        <ExternalLink className="w-3.5 h-3.5" />
        View on OpenStreetMap
      </a>
    </div>
  );
}

// ── 5. Review Card ───────────────────────────────────────────────────
function ReviewCard({ review }: { review: Review }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = review.reviewText.length > 120;

  return (
    <div className="pb-5 border-b border-gray-100 last:border-0 last:pb-0">
      <div className="flex items-center gap-3 mb-2.5">
        <img
          src={review.userAvatar}
          alt={review.userName}
          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
          loading="lazy"
        />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold text-gray-800 leading-none">
            {review.userName}
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {review.reviewDate}
          </p>
        </div>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={cn(
                'w-3 h-3',
                i < review.rating
                  ? 'text-amber-400 fill-amber-400'
                  : 'text-gray-200 fill-gray-200',
              )}
            />
          ))}
        </div>
      </div>
      <p className="text-[13px] text-gray-600 leading-relaxed">
        {isLong && !expanded
          ? `${review.reviewText.slice(0, 120)}…`
          : review.reviewText}
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-[12px] text-gray-800 font-bold underline mt-1 hover:text-blue-600 transition-colors"
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}
    </div>
  );
}

// ── Write a review (signed-in guests) ────────────────────────────────
function WriteReview({ listingId }: { listingId: string }) {
  const { userId, isAuthenticated } = useAuth();
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="mt-5 pt-5 border-t border-gray-100 text-center">
        <p className="text-[13px] text-gray-500">
          <button
            onClick={() => router.push(`/signin?redirect=/property/${listingId}`)}
            className="text-blue-600 font-bold hover:underline"
          >
            Sign in
          </button>{' '}
          to leave a review.
        </p>
      </div>
    );
  }

  const submit = async () => {
    if (!rating) {
      toast.error('Please pick a star rating.');
      return;
    }
    setSubmitting(true);
    try {
      await api.createReview({
        listingId,
        userId: userId!,
        rating,
        comment: comment.trim() || undefined,
      });
      toast.success('Thanks for your review!');
      setRating(0);
      setComment('');
      setTimeout(() => router.refresh(), 700);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not submit your review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-5 pt-5 border-t border-gray-100">
      <p className="text-[13px] font-bold text-gray-800 mb-2">Write a review</p>
      <div className="flex items-center gap-1 mb-3">
        {Array.from({ length: 5 }).map((_, i) => {
          const v = i + 1;
          return (
            <button
              key={v}
              type="button"
              onMouseEnter={() => setHover(v)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setRating(v)}
              aria-label={`${v} star${v > 1 ? 's' : ''}`}
            >
              <Star
                className={cn(
                  'w-6 h-6 transition-colors',
                  (hover || rating) >= v
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-gray-200 fill-gray-200',
                )}
              />
            </button>
          );
        })}
      </div>
      <textarea
        rows={3}
        maxLength={500}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share a few words about your stay (optional)…"
        className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-[13px] resize-none"
      />
      <div className="flex justify-end mt-2">
        <button
          onClick={submit}
          disabled={submitting}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-[13px] hover:bg-blue-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? 'Submitting…' : 'Submit review'}
        </button>
      </div>
    </div>
  );
}

// ── 6. Host Card ─────────────────────────────────────────────────────
function HostCard({ host }: { host: Host }) {
  const { isAuthenticated, userId } = useAuth();
  const router = useRouter();

  const handleMessageHost = () => {
    if (!isAuthenticated || !userId) {
      toast.error('Please sign in to message the host');
      router.push(`/signin?redirect=${encodeURIComponent(window.location.href)}`);
      return;
    }

    // Navigate to chat page with host ID as query parameter
    router.push(`/chat?hostId=${encodeURIComponent(host.id)}`);
  };

  return (
    <div
      className="bg-white rounded-2xl p-5"
      style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.07)' }}
    >
      <h2 className="text-[15px] font-bold text-gray-800 mb-4">
        Meet your host
      </h2>
      <div className="flex items-start gap-4">
        <div className="relative flex-shrink-0">
          <img
            src={host.avatar}
            alt={host.name}
            className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
          />
          {host.isSuperhost && (
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center shadow">
              <Award className="w-3 h-3 text-white" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-[15px] font-extrabold text-gray-800">
              {host.name}
            </h3>
            {host.isSuperhost && (
              <span className="text-[10px] font-bold bg-rose-50 border border-rose-200 text-rose-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Award className="w-2.5 h-2.5" /> Superhost
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 mt-1.5 flex-wrap">
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="text-[12px] font-bold text-gray-700">
                {host.rating}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[12px] text-gray-500">
              <Users className="w-3 h-3" /> {host.tripsHosted} trips hosted
            </div>
            <div className="flex items-center gap-1 text-[12px] text-gray-500">
              <CalendarDays className="w-3 h-3" /> Joined {host.joinDate}
            </div>
          </div>
        </div>
      </div>

      {host.bio && (
        <p className="text-[13px] text-gray-600 leading-relaxed mt-3">
          {host.bio}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="bg-gray-50 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-[11px] font-bold text-gray-600">
              Response rate
            </span>
          </div>
          <p className="text-[14px] font-extrabold text-gray-800">
            {host.responseRate}%
          </p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-[11px] font-bold text-gray-600">
              Response time
            </span>
          </div>
          <p className="text-[13px] font-bold text-gray-800 capitalize">
            {host.responseTime}
          </p>
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <button
          onClick={handleMessageHost}
          className="flex-1 flex items-center justify-center gap-1.5 border border-gray-800 text-gray-800 hover:bg-gray-50 py-2.5 rounded-xl text-[13px] font-bold transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          Message Host
        </button>
        <button
          onClick={() => alert('Host profile coming soon!')}
          className="flex-1 flex items-center justify-center gap-1.5 bg-gray-800 hover:bg-gray-900 text-white py-2.5 rounded-xl text-[13px] font-bold transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          View Profile
        </button>
      </div>
    </div>
  );
}

// ── 7. Suggested Properties (Horizontal scroll) ──────────────────────
function SuggestedStays({ current }: { current: Property }) {
  const router = useRouter();
  const [suggested, setSuggested] = useState<Property[]>([]);

  useEffect(() => {
    let mounted = true;

    const loadSuggested = async () => {
      try {
        const rows = await api.hotels();
        if (!mounted) return;
        setSuggested(
          rows
            .map(mapListingToProperty)
            .filter(
              (p) =>
                p.id !== current.id &&
                (p.city === current.city ||
                  p.state === current.state ||
                  Math.abs(p.price - current.price) < 15000),
            )
            .slice(0, 8),
        );
      } catch (error) {
        console.error('[property] failed to load suggested stays:', error);
        if (mounted) setSuggested([]);
      }
    };

    loadSuggested();

    return () => {
      mounted = false;
    };
  }, [current.id, current.city, current.state, current.price]);

  if (suggested.length === 0) return null;

  return (
    <div
      className="bg-white rounded-2xl p-5"
      style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.07)' }}
    >
      <h2 className="text-[15px] font-bold text-gray-800 mb-4">
        You might also like
      </h2>
      <div
        className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1"
        style={{ scrollbarWidth: 'none' }}
      >
        {suggested.map((p) => (
          <div
            key={p.id}
            className="flex-shrink-0 w-[200px] bg-gray-50 rounded-xl overflow-hidden cursor-pointer group hover:-translate-y-0.5 transition-transform"
            style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}
            onClick={() => {
              router.push(`/property/${p.id}`);
              window.scrollTo(0, 0);
            }}
          >
            <div className="relative h-28 overflow-hidden">
              <img
                src={p.images[0] || FALLBACK}
                alt={p.propertyName}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-400"
                loading="lazy"
              />
              {p.originalPrice && (
                <span className="absolute top-2 left-2 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                  -
                  {Math.round(
                    ((p.originalPrice - p.price) / p.originalPrice) * 100,
                  )}
                  %
                </span>
              )}
            </div>
            <div className="p-2.5">
              <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">
                {p.propertyType}
              </span>
              <p className="text-[11px] font-bold text-gray-800 mt-1 line-clamp-1">
                {p.propertyName}
              </p>
              <p className="text-[10px] text-gray-400 mb-1.5 line-clamp-1">
                {p.city}, {p.state}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                  <span className="text-[10px] font-bold text-gray-700">
                    {p.rating > 0 ? p.rating.toFixed(1) : 'New'}
                  </span>
                </div>
                <div>
                  <span className="text-[12px] font-extrabold text-blue-700">
                    ₹{Math.round(p.price / 1000)}k
                  </span>
                  <span className="text-[9px] text-gray-400">/night</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 8. Booking Widget ────────────────────────────────────────────────
function BookingWidget({
  property,
  onNightsChange,
  onGuestsChange,
}: {
  property: Property;
  onNightsChange?: (n: number) => void;
  onGuestsChange?: (g: number) => void;
}) {
  const searchParams = useSearchParams();
  const { isAuthenticated, userId } = useAuth();
  const router = useRouter();

  // Seed dates from URL params (passed by search results)
  const paramCheckIn = searchParams.get('checkIn');
  const paramCheckOut = searchParams.get('checkOut');
  const toDate = (s: string | null) => s ? new Date(s + 'T00:00:00') : null;

  const [checkIn, setCheckIn] = useState<Date | null>(toDate(paramCheckIn));
  const [checkOut, setCheckOut] = useState<Date | null>(toDate(paramCheckOut));
  const [guests, setGuests] = useState(1);
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  // The booking card is `sticky`, so it only sits near the top of the
  // viewport once the page has been scrolled. Opened before that (e.g.
  // right after landing on the page), the calendar renders in the card's
  // natural, far-down document position - off-screen below the fold, with
  // nothing prompting the guest to scroll for it. Scroll it into view
  // whenever it opens so it's never invisible.
  useEffect(() => {
    if (showPicker) {
      pickerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [showPicker]);

  // 'idle' | 'checking' | 'available' | 'unavailable' | 'booking' | 'confirmed'
  const [status, setStatus] = useState<'idle' | 'checking' | 'available' | 'unavailable' | 'booking' | 'confirmed'>(
    paramCheckIn && paramCheckOut ? 'available' : 'idle'
  );
  const [unavailableReason, setUnavailableReason] = useState('');

  const nights = checkIn && checkOut
    ? Math.max(0, Math.ceil((checkOut.getTime() - checkIn.getTime()) / 86400000))
    : 0;

  useEffect(() => { onNightsChange?.(nights); }, [nights]);
  useEffect(() => { onGuestsChange?.(guests); }, [guests]);

  // Mirrors the server-side calc in createBooking() — weekend nights
  // (Fri/Sat) bill at priceWeekend, everything else at the weekday price,
  // so this preview matches what actually gets charged.
  const subtotal = (() => {
    if (!checkIn || !checkOut || nights === 0) return property.price;
    const priceWeekend = property.priceWeekend ?? property.price;
    let sum = 0;
    const cur = new Date(checkIn);
    for (let i = 0; i < nights; i++) {
      const dow = cur.getDay();
      sum += dow === 5 || dow === 6 ? priceWeekend : property.price;
      cur.setDate(cur.getDate() + 1);
    }
    return sum;
  })();
  const serviceFee = Math.round(subtotal * 0.08);
  const taxes = Math.round(subtotal * 0.12);
  const total = subtotal + serviceFee + taxes;

  const handleDatesChange = (ci: Date | null, co: Date | null) => {
    setCheckIn(ci);
    setCheckOut(co);
    setStatus('idle');
    setUnavailableReason('');
    if (ci && co) setShowPicker(false);
  };

  const checkAvailability = async () => {
    if (!checkIn || !checkOut) return;
    setStatus('checking');
    setUnavailableReason('');
    try {
      const res = await fetch(
        `/api/bookings/check-availability?listingId=${property.id}&startDate=${toISODate(checkIn)}&endDate=${toISODate(checkOut)}`
      );
      const data = await res.json();
      if (!res.ok || data.error) {
        setStatus('idle');
        toast.error(data.error ?? 'Could not check availability. Please try again.');
        return;
      }
      if (data.available) {
        setStatus('available');
      } else {
        setStatus('unavailable');
        setUnavailableReason(data.reason ?? 'Property is not available on these dates.');
      }
    } catch {
      setStatus('idle');
      toast.error('Could not check availability. Please try again.');
    }
  };

  const book = async () => {
    if (!isAuthenticated || !userId) {
      toast('Please sign in to book this stay.');
      const params = new URLSearchParams();
      if (checkIn) params.set('checkIn', toISODate(checkIn)!);
      if (checkOut) params.set('checkOut', toISODate(checkOut)!);
      const qs = params.toString();
      const returnTo = `/property/${property.id}${qs ? `?${qs}` : ''}`;
      router.push(`/signin?redirect=${encodeURIComponent(returnTo)}`);
      return;
    }
    setStatus('booking');
    try {
      await api.createBooking({
        listingId: property.id,
        userId,
        startDate: toISODate(checkIn)!,
        endDate: toISODate(checkOut)!,
        numAdults: guests,
        numChildren: 0,
      });
      setStatus('confirmed');
      toast.success('Booking confirmed! See it in your bookings.');
    } catch (err) {
      console.error('[property] booking failed:', err);
      toast.error(err instanceof Error ? err.message : 'Could not complete the booking.');
      setStatus('available');
    }
  };

  const formatDate = (d: Date | null) =>
    d ? d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Add date';

  return (
    <div
      className="bg-white rounded-2xl p-5 sticky top-28"
      style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.10)' }}
    >
      {/* Price header */}
      <div className="flex items-baseline gap-2 mb-1">
        {property.originalPrice && (
          <span className="text-[13px] text-gray-400 line-through">
            ₹{property.originalPrice.toLocaleString('en-IN')}
          </span>
        )}
        <span className="text-[24px] font-extrabold text-blue-700">
          ₹{property.price.toLocaleString('en-IN')}
        </span>
        <span className="text-[12px] text-gray-400">/night</span>
        {property.originalPrice && (
          <span className="ml-auto text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            {Math.round(((property.originalPrice - property.price) / property.originalPrice) * 100)}% off
          </span>
        )}
      </div>
      {/* Discount badge — informational only. The booking price calc below
          doesn't apply this discount yet (that's a separate pricing-logic
          change), so it's shown honestly as a host-offered discount rather
          than baked into the displayed/charged price. */}
      <p className="text-[11px] font-bold text-emerald-600 mb-4 min-h-[14px]">
        {property.activeDiscount &&
          `🏷️ ${property.activeDiscount.percent}% off — ${property.activeDiscount.type.replace(/_/g, ' ')}`}
      </p>

      {/* Date selector — displays selected dates, opens picker on click.
          Wrapped in `relative` so the absolutely-positioned dropdown-panel
          below anchors to this row instead of the sticky booking widget
          container (sticky also establishes a positioning context, which
          was making the calendar render detached/misplaced). */}
      <div className="relative">
      <div
        className="border border-gray-200 rounded-xl overflow-hidden mb-2 cursor-pointer hover:border-blue-400 transition-colors"
        onClick={() => setShowPicker((v) => !v)}
      >
        <div className="grid grid-cols-2 divide-x divide-gray-200">
          <div className="p-2.5">
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Check in</p>
            <p className={`text-[13px] font-semibold ${checkIn ? 'text-gray-800' : 'text-gray-400'}`}>
              {formatDate(checkIn)}
            </p>
          </div>
          <div className="p-2.5">
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Check out</p>
            <p className={`text-[13px] font-semibold ${checkOut ? 'text-gray-800' : 'text-gray-400'}`}>
              {formatDate(checkOut)}
            </p>
          </div>
        </div>

        {/* Guests row */}
        <div className="border-t border-gray-200 p-2.5" onClick={(e) => e.stopPropagation()}>
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Guests</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setGuests((g) => Math.max(1, g - 1))}
              className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-gray-400 transition-colors text-sm"
            >
              −
            </button>
            <span className="flex-1 text-center text-[13px] font-bold text-gray-800">
              {guests} Guest{guests !== 1 ? 's' : ''}
            </span>
            <button
              onClick={() =>
                setGuests((g) => Math.min(property.maxGuests, g + 1))
              }
              className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-gray-400 transition-colors text-sm"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* DateRangePicker dropdown — anchored to the *right* edge of this
          narrow sidebar card. DateRangePicker renders itself at a fixed
          min(600px, 95vw) width (sized for the wide, centered SearchForm
          bar), much wider than this sidebar. `right-0` alone doesn't work
          here: since DateRangePicker's own root is itself `position:
          absolute` (the shared `.dropdown-panel` class), this wrapper's
          only child is out-of-flow, so the wrapper's shrink-to-fit width
          collapses to 0 and `right-0` just anchors a single point instead
          of pushing the 600px box leftward. Giving the wrapper the same
          explicit width fixes that, so it actually stays on-screen. */}
      {showPicker && (
        <div
          className="absolute top-[calc(100%+8px)] right-0 z-50"
          style={{ width: 'min(600px, 95vw)', scrollMarginTop: '90px' }}
          ref={pickerRef}
        >
          <DateRangePicker
            checkIn={checkIn}
            checkOut={checkOut}
            onChange={handleDatesChange}
            onClose={() => setShowPicker(false)}
          />
        </div>
      )}
      </div>

      {/* Unavailable message */}
      {status === 'unavailable' && (
        <p className="text-[11px] text-red-500 font-medium mb-2 flex items-center gap-1">
          <X className="w-3 h-3" /> {unavailableReason}
        </p>
      )}

      {/* Price breakdown — only show when available/confirmed */}
      {nights > 0 && (status === 'available' || status === 'confirmed' || status === 'booking') && (
        <div className="mb-4 bg-gray-50 rounded-xl p-3 space-y-2 text-[12px]">
          <div className="flex justify-between text-gray-600">
            <span>₹{property.price.toLocaleString('en-IN')} × {nights} night{nights > 1 ? 's' : ''}</span>
            <span className="font-semibold">₹{subtotal.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Service fee (8%)</span>
            <span className="font-semibold">₹{serviceFee.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Taxes (12%)</span>
            <span className="font-semibold">₹{taxes.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between font-bold text-gray-800 pt-2 border-t border-gray-200 text-[13px]">
            <span>Total</span>
            <span className="text-blue-700">₹{total.toLocaleString('en-IN')}</span>
          </div>
        </div>
      )}

      {/* CTA button */}
      {status === 'confirmed' ? (
        <div className="w-full bg-emerald-500 text-white py-3 rounded-xl font-bold text-[14px] flex items-center justify-center gap-2">
          <CheckCircle className="w-5 h-5" /> Booking confirmed!
        </div>
      ) : status === 'available' || status === 'booking' ? (
        <button
          onClick={book}
          disabled={status === 'booking'}
          className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white py-3 rounded-xl font-bold text-[14px] transition-colors shadow-md shadow-blue-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <CalendarDays className="w-4 h-4" />
          {status === 'booking' ? 'Booking…' : `Book for ${nights} Night${nights > 1 ? 's' : ''}`}
        </button>
      ) : (
        <button
          onClick={checkIn && checkOut ? checkAvailability : () => setShowPicker(true)}
          disabled={status === 'checking'}
          className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white py-3 rounded-xl font-bold text-[14px] transition-colors shadow-md shadow-blue-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <CalendarDays className="w-4 h-4" />
          {status === 'checking' ? 'Checking…' : checkIn && checkOut ? 'Check Availability' : 'Select Dates'}
        </button>
      )}

      <div className="flex flex-col gap-1 mt-3">
        {property.freeCancellation && (
          <p className="text-center text-[11px] text-emerald-600 font-semibold flex items-center justify-center gap-1">
            <CheckCircle className="w-3 h-3" /> Free cancellation available
          </p>
        )}
        {property.isInstantBook && (
          <p className="text-center text-[11px] text-blue-500 font-medium flex items-center justify-center gap-1">
            <Zap className="w-3 h-3" /> Instant confirmation
          </p>
        )}
      </div>
      <p className="text-center text-[10px] text-gray-400 mt-2">
        You won't be charged yet
      </p>
    </div>
  );
}

// ── Reviews Modal ───────────────────────────────────────────────────
const STAR_FILTERS = [
  { label: 'All', value: 0 },
  { label: '5 stars', value: 5 },
  { label: '4 stars', value: 4 },
  { label: '3 stars', value: 3 },
  { label: '2 stars', value: 2 },
  { label: '1 star', value: 1 },
];

function ReviewsModal({
  reviews,
  rating,
  reviewCount,
  onClose,
}: {
  reviews: Review[];
  rating: number;
  reviewCount: number;
  onClose: () => void;
}) {
  const [starFilter, setStarFilter] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const filtered =
    starFilter === 0 ? reviews : reviews.filter((r) => r.rating === starFilter);

  const currentLabel =
    STAR_FILTERS.find((f) => f.value === starFilter)?.label ?? 'All';

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-lg flex flex-col"
        style={{
          boxShadow: '0 24px 80px rgba(0,0,0,0.28)',
          maxHeight: '82vh',
          animation: 'modalSlideUp 0.22s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 flex-shrink-0">
          {/* Rating badge */}
          <div className="flex items-center gap-1.5 bg-emerald-500 text-white px-2.5 py-1 rounded-lg">
            <Star className="w-3.5 h-3.5 fill-white" />
            <span className="text-[14px] font-extrabold">
              {rating > 0 ? rating.toFixed(1) : 'New'}
            </span>
          </div>
          <div>
            <span className="text-[15px] font-extrabold text-gray-800">
              {reviewCount} reviews
            </span>
          </div>

          {/* Star filter dropdown */}
          <div className="relative ml-2">
            <button
              onClick={() => setFilterOpen((o) => !o)}
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-[12px] font-semibold transition-all',
                filterOpen
                  ? 'border-blue-400 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300',
              )}
            >
              {currentLabel}
              <ChevronDown
                className={cn(
                  'w-3 h-3 transition-transform',
                  filterOpen && 'rotate-180',
                )}
              />
            </button>
            {filterOpen && (
              <div
                className="absolute top-full left-0 mt-1 bg-white rounded-xl border border-gray-100 py-1 z-10 min-w-[120px]"
                style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
              >
                {STAR_FILTERS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => {
                      setStarFilter(f.value);
                      setFilterOpen(false);
                    }}
                    className={cn(
                      'w-full text-left px-4 py-2 text-[13px] transition-colors flex items-center gap-2',
                      starFilter === f.value
                        ? 'text-blue-600 font-semibold bg-blue-50'
                        : 'text-gray-700 hover:bg-gray-50',
                    )}
                  >
                    {f.value > 0 && (
                      <div className="flex gap-0.5">
                        {Array.from({ length: f.value }).map((_, i) => (
                          <Star
                            key={i}
                            className="w-2.5 h-2.5 text-amber-400 fill-amber-400"
                          />
                        ))}
                      </div>
                    )}
                    {f.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Count badge */}
          {starFilter !== 0 && (
            <span className="text-[11px] text-gray-400 font-medium ml-1">
              {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            </span>
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            className="ml-auto w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable reviews body */}
        <div
          ref={bodyRef}
          className="reviews-scroll flex-1 overflow-y-auto px-5 py-4 space-y-5"
        >
          {filtered.length === 0 ? (
            <div className="py-10 text-center">
              <div className="text-4xl mb-3">⭐</div>
              <p className="text-[14px] font-semibold text-gray-500">
                No {starFilter}-star reviews yet.
              </p>
              <button
                onClick={() => setStarFilter(0)}
                className="mt-3 text-[13px] text-blue-600 font-semibold underline"
              >
                Show all reviews
              </button>
            </div>
          ) : (
            filtered.map((review) => (
              <div
                key={review.id}
                className="pb-5 border-b border-gray-100 last:border-0 last:pb-0"
              >
                <div className="flex items-start gap-3 mb-2">
                  <img
                    src={review.userAvatar}
                    alt={review.userName}
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    loading="lazy"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] leading-none">
                      <span className="font-bold text-gray-800">
                        {review.userName}
                      </span>
                      <span className="text-gray-400 font-medium">
                        {' '}&middot; {review.reviewDate}
                      </span>
                    </p>
                    <div className="flex items-center gap-0.5 mt-1.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            'w-3 h-3',
                            i < review.rating
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-gray-200 fill-gray-200',
                          )}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-[13px] text-gray-600 leading-relaxed">
                  {review.reviewText}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sticky Scroll Summary Bar ────────────────────────────────────────
function StickyBookingBar({
  property,
  nights,
  guests,
  onReserve,
  show,
}: {
  property: Property;
  nights: number;
  guests: number;
  onReserve: () => void;
  show: boolean;
}) {
  return (
    <div
      className={cn(
        'fixed top-0 inset-x-0 z-[999] bg-white border-b border-gray-200 transition-all duration-300',
        show
          ? 'translate-y-0 opacity-100'
          : '-translate-y-full opacity-0 pointer-events-none',
      )}
      style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.10)' }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-4">
        {/* Reserve button */}
        <button
          onClick={onReserve}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl font-bold text-[13px] transition-colors shadow-sm flex-shrink-0"
        >
          Reserve
        </button>

        {/* Price + info */}
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[15px] font-extrabold text-gray-800">
            ₹{property.price.toLocaleString('en-IN')}
          </span>
          <span className="text-[12px] text-gray-400">/night</span>
          {nights > 0 && (
            <span className="text-[12px] text-gray-500 ml-2 font-medium">
              · for {nights} night{nights !== 1 ? 's' : ''}
            </span>
          )}
          {guests > 0 && (
            <span className="text-[12px] text-gray-500 font-medium">
              · {guests} Adult{guests !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="ml-auto flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href);
            }}
            className="w-8 h-8 rounded-full border border-gray-200 hover:border-gray-300 bg-white flex items-center justify-center text-gray-500 hover:text-blue-600 transition-colors"
            title="Share"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
          <button
            className="w-8 h-8 rounded-full border border-gray-200 hover:border-rose-300 bg-white flex items-center justify-center text-gray-400 hover:text-rose-500 transition-colors"
            title="Save"
          >
            <Heart className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────
export default function PropertyDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, userId } = useAuth();
  const { isSaved, toggle: toggleWishlist } = useWishlist(userId);
  const liked = property ? isSaved(property.id) : false;
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const [reviewsModalOpen, setReviewsModalOpen] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [stickyBar, setStickyBar] = useState(false);
  const [barNights, setBarNights] = useState(0);
  const [barGuests, setBarGuests] = useState(1);
  const galleryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;

    const loadProperty = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const row = await api.propertyDetail(id);
        if (!mounted) return;
        const mapped = row ? mapListingToProperty(row) : null;
        setProperty(mapped);
      } catch (error) {
        console.error('[property] failed to load detail:', error);
        if (mounted) setProperty(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadProperty();

    return () => {
      mounted = false;
    };
  }, [id]);

  // Show sticky bar after scrolling past gallery
  useEffect(() => {
    const handleScroll = () => {
      const galleryBottom = galleryRef.current
        ? galleryRef.current.getBoundingClientRect().bottom
        : 500;
      setStickyBar(galleryBottom < 0);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f2f5]">
        <Navbar />
        <div className="container-main py-6 max-w-6xl mx-auto px-4 sm:px-6">
          <div className="h-[440px] rounded-2xl bg-white animate-pulse mb-6" />
          <div className="h-8 w-2/3 rounded bg-white animate-pulse mb-4" />
          <div className="h-4 w-1/2 rounded bg-white animate-pulse" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-[#f0f2f5]">
        <Navbar />
        <div className="container-main py-20 text-center">
          <div className="text-6xl mb-4">🏨</div>
          <h1 className="text-2xl font-bold text-gray-700 mb-4">
            Property not found
          </h1>
          <button
            onClick={() => router.back()}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Go back
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const images = property.images.length > 0 ? property.images : [FALLBACK];
  const amenities =
    property.amenityDetails ??
    property.amenities.map((a) => ({ name: a, icon: 'wifi', available: true }));
  const visibleAmenities = showAllAmenities ? amenities : amenities.slice(0, 8);
  const reviews = property.reviews ?? [];
  const previewReviews = reviews.slice(0, 3);

  const descIsLong = (property.description?.length ?? 0) > 200;

  return (
    <div className="min-h-screen bg-[#f0f2f5]">
      {/* Sticky booking summary bar */}
      <StickyBookingBar
        property={property}
        nights={barNights}
        guests={barGuests}
        onReserve={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        show={stickyBar}
      />

      <Navbar />

      <div className="container-main py-6 max-w-6xl mx-auto px-4 sm:px-6">
        {/* Back + Actions */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 font-medium text-sm transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to results
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                navigator.clipboard?.writeText(window.location.href);
                alert('Link copied!');
              }}
              className="flex items-center gap-1.5 text-[12px] text-gray-600 hover:text-blue-600 font-semibold bg-white border border-gray-200 px-3 py-1.5 rounded-xl transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" /> Share
            </button>
            <button
              onClick={async () => {
                if (!isAuthenticated || !userId || !property) {
                  router.push('/signin');
                  return;
                }
                try {
                  await toggleWishlist(property.id);
                } catch (err) {
                  console.error('[property] wishlist toggle failed:', err);
                  toast.error('Could not update your wishlist. Please try again.');
                }
              }}
              className={cn(
                'flex items-center gap-1.5 text-[12px] font-semibold bg-white border px-3 py-1.5 rounded-xl transition-all',
                liked
                  ? 'border-rose-300 text-rose-500 bg-rose-50'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300',
              )}
            >
              <Heart className={cn('w-3.5 h-3.5', liked && 'fill-rose-500')} />
              {liked ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>

        {/* ── 1. IMAGE GALLERY ── */}
        <div ref={galleryRef}>
          <ImageGallery images={images} propertyName={property.propertyName} />
        </div>

        {/* ── Main grid ── */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* ══ LEFT COLUMN ══ */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* ── 2. PROPERTY OVERVIEW ── */}
            <div
              className="bg-white rounded-2xl p-5"
              style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.07)' }}
            >
              {/* Badges */}
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
                  {property.propertyType}
                </span>
                {property.isInstantBook && (
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5" />
                    Instant Book
                  </span>
                )}
                {property.freeCancellation && (
                  <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle className="w-2.5 h-2.5" />
                    Free Cancellation
                  </span>
                )}
              </div>

              <h1 className="text-[20px] sm:text-[22px] font-extrabold text-gray-800 leading-tight mb-1">
                {property.propertyName}
              </h1>
              <p className="text-[13px] text-gray-500 flex items-center gap-1 mb-3">
                <MapPin className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                {property.city}, {property.state}
              </p>

              {/* Host line */}
              {property.host && (
                <div className="flex items-center gap-2.5 mb-3 pb-3 border-b border-gray-100">
                  <img
                    src={property.host.avatar}
                    alt={property.host.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <span className="text-[13px] text-gray-600">
                    Hosted by{' '}
                    <strong className="text-gray-800">
                      {property.host.name}
                    </strong>
                    {property.host.isSuperhost && (
                      <span className="ml-1.5 text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-full">
                        Superhost
                      </span>
                    )}
                  </span>
                </div>
              )}

              {/* Quick stats */}
              <div className="flex items-center gap-4 flex-wrap mb-4">
                <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span className="text-[14px] font-extrabold text-amber-700">
                    {property.rating > 0 ? property.rating.toFixed(1) : 'New'}
                  </span>
                  <span className="text-[12px] text-amber-600">
                    ({property.reviewCount} reviews)
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[13px] text-gray-500">
                  <Users className="w-3.5 h-3.5 text-gray-400" /> Up to{' '}
                  {property.maxGuests} guests
                </div>
                {property.bedType && (
                  <div className="flex items-center gap-1 text-[13px] text-gray-500">
                    <BedDouble className="w-3.5 h-3.5 text-gray-400" />{' '}
                    {property.bedType}
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <p className="text-[13px] text-gray-600 leading-relaxed">
                  {descIsLong && !descExpanded
                    ? `${(property.description ?? '').slice(0, 200)}…`
                    : (property.description ??
                      `Experience the charm of ${property.city} in this beautifully curated ${property.propertyType.toLowerCase()}.`)}
                </p>
                {descIsLong && (
                  <button
                    onClick={() => setDescExpanded((v) => !v)}
                    className="flex items-center gap-1 text-[13px] font-bold text-gray-800 underline mt-2 hover:text-blue-600 transition-colors"
                  >
                    {descExpanded ? 'Show less' : 'Read more'}
                    <ChevronDown
                      className={cn(
                        'w-3.5 h-3.5 transition-transform',
                        descExpanded && 'rotate-180',
                      )}
                    />
                  </button>
                )}
              </div>
            </div>

            {/* ── 3. AMENITIES / FACILITIES ── */}
            <div
              className="bg-white rounded-2xl p-5"
              style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.07)' }}
            >
              <h2 className="text-[15px] font-bold text-gray-800 mb-4">
                Facilities
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {visibleAmenities.map((am, i) => (
                  <div
                    key={i}
                    className={cn(
                      'flex items-center gap-2.5 p-2.5 rounded-xl border transition-colors',
                      am.available
                        ? 'bg-gray-50 border-gray-100'
                        : 'bg-gray-50/50 border-dashed border-gray-200 opacity-50',
                    )}
                  >
                    <div
                      className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                        am.available
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-gray-100 text-gray-400',
                      )}
                    >
                      {AMENITY_ICON_MAP[am.icon] ?? (
                        <CheckCircle className="w-4 h-4" />
                      )}
                    </div>
                    <span
                      className={cn(
                        'text-[12px] font-semibold',
                        am.available
                          ? 'text-gray-700'
                          : 'text-gray-400 line-through',
                      )}
                    >
                      {am.name}
                    </span>
                    {!am.available && (
                      <X className="w-3 h-3 text-gray-300 ml-auto flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
              {amenities.length > 8 && (
                <button
                  onClick={() => setShowAllAmenities((v) => !v)}
                  className="mt-3 text-[13px] font-bold text-gray-800 underline hover:text-blue-600 transition-colors flex items-center gap-1"
                >
                  {showAllAmenities
                    ? 'Show less'
                    : `Show all ${amenities.length} amenities`}
                  <ChevronDown
                    className={cn(
                      'w-3.5 h-3.5 transition-transform',
                      showAllAmenities && 'rotate-180',
                    )}
                  />
                </button>
              )}
            </div>

            {/* ── 3b. ADD-ONS ── */}
            {property.addons && property.addons.length > 0 && (
              <div
                className="bg-white rounded-2xl p-5"
                style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.07)' }}
              >
                <h2 className="text-[15px] font-bold text-gray-800 mb-4">
                  Available add-ons
                </h2>
                <div className="space-y-2.5">
                  {property.addons.map((addon, i) => (
                    <div
                      key={i}
                      className="flex items-start justify-between gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100"
                    >
                      <div className="min-w-0">
                        <p className="text-[13px] font-bold text-gray-800">{addon.name}</p>
                        {addon.includes && (
                          <p className="text-[11px] text-gray-500 mt-0.5">{addon.includes}</p>
                        )}
                        {addon.timingFrom && addon.timingTo && (
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            {addon.timingFrom.slice(0, 5)} – {addon.timingTo.slice(0, 5)}
                          </p>
                        )}
                      </div>
                      <span className="text-[13px] font-bold text-blue-700 flex-shrink-0">
                        +₹{addon.price.toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-gray-400 mt-3">
                  Ask the host about these add-ons when booking.
                </p>
              </div>
            )}

            {/* ── 3c. HOUSE RULES ── */}
            {property.houseRules && property.houseRules.length > 0 && (
              <div
                className="bg-white rounded-2xl p-5"
                style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.07)' }}
              >
                <h2 className="text-[15px] font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" /> House rules
                </h2>
                <ul className="space-y-2">
                  {property.houseRules.map((rule, i) => (
                    <li key={i} className="text-[13px] text-gray-700 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5 flex-shrink-0" />
                      {rule}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* ── 3d. SAFETY & PROPERTY ── */}
            {property.safetyFeatures && property.safetyFeatures.length > 0 && (
              <div
                className="bg-white rounded-2xl p-5"
                style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.07)' }}
              >
                <h2 className="text-[15px] font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-gray-500" /> Safety & property
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {property.safetyFeatures.map((f, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl bg-gray-50 border border-gray-100"
                    >
                      <span className="text-[16px] flex-shrink-0">{f.icon || '🛡️'}</span>
                      <span className="text-[12px] font-semibold text-gray-700">{f.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── 5. MAP LOCATION ── */}
            <div
              className="bg-white rounded-2xl p-5"
              style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.07)' }}
            >
              <h2 className="text-[15px] font-bold text-gray-800 mb-3">
                Location
              </h2>
              <PropertyMap property={property} />
              <p className="text-[12px] text-gray-400 mt-2 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-blue-500" />
                {property.city}, {property.state}
              </p>
            </div>

            {/* ── 6. RATINGS & REVIEWS ── */}
            <div
              className="bg-white rounded-2xl p-5"
              style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.07)' }}
            >
              <h2 className="text-[15px] font-bold text-gray-800 mb-4">
                Ratings &amp; reviews
              </h2>

              {/* Empty state when this property has no reviews yet */}
              {reviews.length === 0 && (
                <div className="py-8 text-center">
                  <Star className="w-8 h-8 text-gray-200 fill-gray-200 mx-auto mb-3" />
                  <p className="text-[14px] font-semibold text-gray-700">
                    No reviews yet
                  </p>
                  <p className="text-[12px] text-gray-400 mt-1">
                    Be the first to stay and share your experience.
                  </p>
                </div>
              )}

              {/* Overall rating — no per-category breakdown is shown here
                  because the database only stores one rating per review;
                  there's no real cleanliness/accuracy/communication/location/
                  check-in/value sub-score anywhere to break it down into. */}
              {reviews.length > 0 && (
              <div className="flex items-start gap-5 mb-5">
                <div className="text-center flex-shrink-0">
                  <p className="text-[42px] font-extrabold text-gray-800 leading-none">
                    {property.rating.toFixed(1)}
                  </p>
                  <div className="flex justify-center mt-1.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          'w-3.5 h-3.5',
                          i < Math.round(property.rating)
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-gray-200 fill-gray-200',
                        )}
                      />
                    ))}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1 font-medium">
                    {property.reviewCount} reviews
                  </p>
                </div>
              </div>
              )}

              {/* Preview reviews (3-column card layout) */}
              {reviews.length > 0 && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                    {previewReviews.map((review) => (
                      <div
                        key={review.id}
                        className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex flex-col gap-3"
                      >
                        {/* User info */}
                        <div className="flex items-center gap-2.5">
                          <img
                            src={review.userAvatar}
                            alt={review.userName}
                            className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                            loading="lazy"
                          />
                          <div className="min-w-0">
                            <p className="text-[12px] font-bold text-gray-800 truncate">
                              {review.userName}
                            </p>
                            <p className="text-[10px] text-gray-400">
                              {review.reviewDate}
                            </p>
                          </div>
                        </div>
                        {/* Stars */}
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                'w-3 h-3',
                                i < review.rating
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-gray-200 fill-gray-200',
                              )}
                            />
                          ))}
                        </div>
                        {/* Text */}
                        <p className="text-[12px] text-gray-600 leading-relaxed line-clamp-4 flex-1">
                          {review.reviewText}
                        </p>
                        <button
                          onClick={() => setReviewsModalOpen(true)}
                          className="text-[12px] font-bold text-gray-700 underline underline-offset-2 hover:text-blue-600 transition-colors text-left"
                        >
                          Read more
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Next arrow row */}
                  <div className="flex items-center gap-3">
                    {reviews.length > 3 && (
                      <button
                        onClick={() => setReviewsModalOpen(true)}
                        className="flex items-center gap-2 border border-gray-300 hover:border-blue-400 hover:text-blue-600 text-gray-700 px-5 py-2.5 rounded-xl text-[13px] font-bold transition-all"
                      >
                        View all {reviews.length} reviews
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </>
              )}

              {/* Leave a review */}
              <WriteReview listingId={property.id} />
            </div>

            {/* ── 7. SUGGESTED STAYS ── */}
            <SuggestedStays current={property} />

            {/* ── 8. HOST INFORMATION ── */}
            {property.host && <HostCard host={property.host} />}
          </div>

          {/* ══ RIGHT COLUMN: Booking Widget ══ */}
          <div className="lg:w-[310px] xl:w-[330px] flex-shrink-0 w-full">
            <BookingWidget
              property={property}
              onNightsChange={setBarNights}
              onGuestsChange={setBarGuests}
            />
          </div>
        </div>

        {/* Mobile booking bar (fixed bottom) */}
        <div
          className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 px-4 py-3 z-50"
          style={{ boxShadow: '0 -4px 16px rgba(0,0,0,0.08)' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[18px] font-extrabold text-blue-700">
                ₹{property.price.toLocaleString('en-IN')}
              </span>
              <span className="text-[12px] text-gray-400 ml-1">/night</span>
              {property.rating && (
                <div className="flex items-center gap-1 mt-0.5">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <span className="text-[11px] font-bold text-gray-600">
                    {property.rating.toFixed(1)}
                  </span>
                  <span className="text-[11px] text-gray-400">
                    ({property.reviewCount})
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold text-[14px] transition-colors shadow-md shadow-blue-200"
            >
              Reserve
            </button>
          </div>
        </div>

        {/* Spacer for mobile fixed bar */}
        <div className="lg:hidden h-20" />
      </div>

      <Footer />

      {/* Reviews full modal */}
      {reviewsModalOpen && (
        <ReviewsModal
          reviews={reviews}
          rating={property.rating}
          reviewCount={property.reviewCount}
          onClose={() => setReviewsModalOpen(false)}
        />
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
        @keyframes modalSlideUp { from { opacity: 0; transform: translateY(24px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
      `}</style>
    </div>
  );
}
