'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  GridIcon,
  ExternalLink,
  Filter,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { cn } from '@/lib/utils';
import type { Property, AmenityItem, Review, Host } from '@/types';
import { api, mapListingToProperty } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
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
              className={cn(
                'w-14 h-10 rounded-md overflow-hidden flex-shrink-0 border-2 transition-all',
                i === idx
                  ? 'border-white opacity-100 scale-105'
                  : 'border-transparent opacity-50 hover:opacity-80',
              )}
            >
              <img
                src={img}
                alt=""
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
                    <GridIcon className="w-5 h-5 mb-1" />
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
          <GridIcon className="w-3.5 h-3.5" />
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
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const [loaded, setLoaded] = useState(false);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

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
    if (!mapRef.current || googleMapRef.current || !apiKey) return;

    const loadGoogleMaps = () => {
      if ((window as any).google?.maps) {
        initMap();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
      script.async = true;
      script.defer = true;
      script.onload = initMap;
      document.head.appendChild(script);
    };

    const initMap = () => {
      if (!mapRef.current) return;

      const center = getCenter();

      googleMapRef.current = new (window as any).google.maps.Map(
        mapRef.current,
        {
          center: center,
          zoom: 14,
          zoomControl: true,
          mapTypeControl: false,
          scaleControl: false,
          streetViewControl: false,
          rotateControl: false,
          fullscreenControl: false,
          scrollwheel: false,
          styles: [
            {
              featureType: 'poi',
              stylers: [{ visibility: 'off' }],
            },
          ],
        },
      );

      // Add marker
      new (window as any).google.maps.Marker({
        position: center,
        map: googleMapRef.current,
        title: property.propertyName,
      });

      setLoaded(true);
    };

    loadGoogleMaps();

    return () => {
      // Cleanup if needed
    };
  }, [apiKey]);

  const center = getCenter();
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${center.lat},${center.lng}`;

  return (
    <div className="space-y-3">
      <div
        className="rounded-xl overflow-hidden border border-gray-100 relative"
        style={{ height: 280 }}
      >
        <div ref={mapRef} className="w-full h-full" />
        {!apiKey ? (
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0 bg-blue-50 flex items-center justify-center hover:bg-blue-100 transition-colors"
          >
            <div className="text-center px-4">
              <MapPin className="w-7 h-7 text-blue-500 mx-auto mb-2" />
              <p className="text-[13px] text-gray-700 font-semibold">
                Map preview unavailable
              </p>
              <p className="text-[12px] text-blue-600 mt-1">Open in Google Maps →</p>
            </div>
          </a>
        ) : (
          !loaded && (
            <div className="absolute inset-0 bg-blue-50 flex items-center justify-center">
              <div className="text-center">
                <div className="w-7 h-7 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-[12px] text-blue-500 font-medium">
                  Loading map…
                </p>
              </div>
            </div>
          )
        )}
      </div>
      <a
        href={googleMapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-[12px] text-blue-600 hover:text-blue-700 font-semibold transition-colors"
      >
        <ExternalLink className="w-3.5 h-3.5" />
        View on Google Maps
      </a>
    </div>
  );
}

// ── 4. Rating Breakdown ──────────────────────────────────────────────
function RatingBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[12px] text-gray-600 w-28 flex-shrink-0">
        {label}
      </span>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gray-800 rounded-full"
          style={{ width: `${(value / 5) * 100}%` }}
        />
      </div>
      <span className="text-[12px] font-bold text-gray-700 w-6 text-right">
        {value.toFixed(1)}
      </span>
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

// ── 6. Host Card ─────────────────────────────────────────────────────
function HostCard({ host }: { host: Host }) {
  const { toast } = { toast: (m: { title: string }) => console.log(m.title) };
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
          onClick={() => alert('Message host feature coming soon!')}
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
                    {p.rating.toFixed(1)}
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
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [dateError, setDateError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const today = new Date().toISOString().split('T')[0];

  const nights =
    checkIn && checkOut
      ? Math.max(
          0,
          Math.ceil(
            (new Date(checkOut).getTime() - new Date(checkIn).getTime()) /
              86400000,
          ),
        )
      : 0;

  // Sync to sticky bar
  useEffect(() => {
    onNightsChange?.(nights);
  }, [nights]);
  useEffect(() => {
    onGuestsChange?.(guests);
  }, [guests]);

  const subtotal = property.price * (nights || 1);
  const serviceFee = Math.round(subtotal * 0.08);
  const taxes = Math.round(subtotal * 0.12);
  const total = subtotal + serviceFee + taxes;

  const validateAndBook = () => {
    setDateError('');
    // Booking requires an account — guests can browse freely, but must sign in
    // to reserve. Send them to sign-in and bring them back to this property.
    if (!isAuthenticated) {
      toast('Please sign in to book this stay.');
      router.push(`/signin?redirect=${encodeURIComponent(`/property/${property.id}`)}`);
      return;
    }
    if (!checkIn || !checkOut) {
      setDateError('Please select check-in and check-out dates.');
      return;
    }
    if (checkOut <= checkIn) {
      setDateError('Check-out must be after check-in.');
      return;
    }
    if (nights === 0) {
      setDateError('Minimum 1 night stay required.');
      return;
    }
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div
      className="bg-white rounded-2xl p-5 sticky top-28"
      style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.10)' }}
    >
      {/* Price header */}
      <div className="flex items-baseline gap-2 mb-4">
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
            {Math.round(
              ((property.originalPrice - property.price) /
                property.originalPrice) *
                100,
            )}
            % off
          </span>
        )}
      </div>

      {/* Date inputs */}
      <div className="border border-gray-200 rounded-xl overflow-hidden mb-2">
        <div className="grid grid-cols-2 divide-x divide-gray-200">
          <div className="p-2.5">
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">
              Check in
            </p>
            <input
              type="date"
              value={checkIn}
              min={today}
              onChange={(e) => {
                setCheckIn(e.target.value);
                setDateError('');
                onNightsChange?.(0);
              }}
              className="w-full text-[12px] font-semibold text-gray-800 outline-none bg-transparent cursor-pointer"
            />
          </div>
          <div className="p-2.5">
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">
              Check out
            </p>
            <input
              type="date"
              value={checkOut}
              min={checkIn || today}
              onChange={(e) => {
                setCheckOut(e.target.value);
                setDateError('');
              }}
              className="w-full text-[12px] font-semibold text-gray-800 outline-none bg-transparent cursor-pointer"
            />
          </div>
        </div>
        {/* Guests */}
        <div className="border-t border-gray-200 p-2.5">
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">
            Guests
          </p>
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

      {/* Date error */}
      {dateError && (
        <p className="text-[11px] text-red-500 font-medium mb-2 flex items-center gap-1">
          <X className="w-3 h-3" /> {dateError}
        </p>
      )}

      {/* Price breakdown */}
      {nights > 0 && (
        <div className="mb-4 bg-gray-50 rounded-xl p-3 space-y-2 text-[12px]">
          <div className="flex justify-between text-gray-600">
            <span>
              ₹{property.price.toLocaleString('en-IN')} × {nights} night
              {nights > 1 ? 's' : ''}
            </span>
            <span className="font-semibold">
              ₹{subtotal.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Service fee (8%)</span>
            <span className="font-semibold">
              ₹{serviceFee.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Taxes (12%)</span>
            <span className="font-semibold">
              ₹{taxes.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="flex justify-between font-bold text-gray-800 pt-2 border-t border-gray-200 text-[13px]">
            <span>Total</span>
            <span className="text-blue-700">
              ₹{total.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      )}

      {showSuccess ? (
        <div className="w-full bg-emerald-500 text-white py-3 rounded-xl font-bold text-[14px] flex items-center justify-center gap-2">
          <CheckCircle className="w-5 h-5" /> Booking confirmed!
        </div>
      ) : (
        <button
          onClick={validateAndBook}
          className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white py-3 rounded-xl font-bold text-[14px] transition-colors shadow-md shadow-blue-200 flex items-center justify-center gap-2"
        >
          <CalendarDays className="w-4 h-4" />
          {nights > 0
            ? `Book for ${nights} Night${nights > 1 ? 's' : ''}`
            : 'Check Availability'}
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
              {rating.toFixed(1)}
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

  const [liked, setLiked] = useState(!!property?.isFavorite);
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
        setLiked(Boolean(mapped?.isFavorite));
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
  const rb = property.ratingBreakdown;

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
              onClick={() => setLiked((v) => !v)}
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
                    {property.rating.toFixed(1)}
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

              {/* Overall rating + breakdown */}
              {reviews.length > 0 && (
              <div className="flex items-start gap-5 mb-5">
                {/* Score */}
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

                {/* Bar breakdown */}
                {rb && (
                  <div className="flex-1 space-y-2 pl-4 border-l border-gray-100">
                    <RatingBar label="Cleanliness" value={rb.cleanliness} />
                    <RatingBar label="Accuracy" value={rb.accuracy} />
                    <RatingBar label="Communication" value={rb.communication} />
                    <RatingBar label="Location" value={rb.location} />
                    <RatingBar label="Check-in" value={rb.checkIn} />
                    <RatingBar label="Value" value={rb.value} />
                  </div>
                )}
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
