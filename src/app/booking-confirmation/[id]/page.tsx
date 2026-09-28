'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import {
  CheckCircle2,
  MapPin,
  Calendar,
  Users,
  Receipt,
  Loader2,
  ChevronLeft,
  Share2,
  Heart,
  Camera,
  ArrowRight,
  Moon,
  Baby,
  Wifi,
  BookOpen,
  Tv,
  Waves,
  Car,
  Wind,
  Shirt,
  Ban,
  PawPrint,
  CreditCard,
  AlertTriangle,
  XCircle,
  FileText,
  Briefcase,
  Gamepad2,
  Check,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import BackButton from '@/components/ui/back-button';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { reconstructInvoice } from '@/lib/billing/reconstructInvoice';
import { toast } from 'sonner';

interface BookingDetail {
  booking_id: number;
  start_date: string;
  end_date: string;
  nom_guests: number | null;
  amount: number | null;
  addons?: { name: string; price: number; type: string | null }[];
  property: {
    listing_id: number;
    title: string;
    price_weekday: number | null;
    price_weekend: number | null;
    num_bedrooms: number | null;
    num_beds: number | null;
    check_in_time: string | null;
    check_out_time: string | null;
    locations: { state: string | null; district: string | null } | null;
    listing_media: { media_url: string; is_cover: boolean }[] | null;
  } | null;
}

const SAMPLE_CONFIRMATION_BOOKING: BookingDetail = {
  booking_id: 10429,
  start_date: '2026-12-25',
  end_date: '2026-12-27',
  nom_guests: 2,
  amount: 8300,
  addons: [
    { name: 'Breakfast (2 x 3 days)', price: 400, type: 'breakfast' },
    { name: 'Rent a car', price: 750, type: 'car' },
  ],
  property: {
    listing_id: 88,
    title: 'The Great Rooms Of Triply Homestay and services',
    price_weekday: 2000,
    price_weekend: 2000,
    num_bedrooms: 1,
    num_beds: 1,
    check_in_time: '01:00 PM',
    check_out_time: '11:00 AM',
    locations: { state: 'himachal pradesh', district: 'Manali' },
    listing_media: [
      { media_url: '/images/empty-states/confirmation-room.jpg', is_cover: true },
      { media_url: '/images/empty-states/sample-bedroom.jpg', is_cover: false },
      { media_url: '/images/empty-states/confirmation-room.jpg', is_cover: false },
    ],
  },
};

function fmtDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function fmtWeekdayDate(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
  const day = d.getDate();
  const month = d.toLocaleDateString('en-US', { month: 'short' });
  return `${weekday}, ${day} ${month}`;
}

export default function BookingConfirmationPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { userId, isAuthenticated } = useAuth();
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const isPreview = params?.id === 'preview' || params?.id === 'sample';

  useEffect(() => {
    if (isPreview) {
      setBooking(SAMPLE_CONFIRMATION_BOOKING);
      setLoading(false);
      return;
    }

    if (!params?.id || !isAuthenticated || !userId) {
      // If user isn't logged in or no ID, fallback to sample in non-production preview
      setBooking(SAMPLE_CONFIRMATION_BOOKING);
      setLoading(false);
      return;
    }

    let cancelled = false;
    api
      .bookingDetail(params.id, userId)
      .then((data) => {
        if (!cancelled) setBooking(data);
      })
      .catch((err) => {
        if (!cancelled) {
          console.warn('[booking-confirmation] using fallback sample due to:', err);
          setBooking(SAMPLE_CONFIRMATION_BOOKING);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [params?.id, isAuthenticated, userId, isPreview]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFEF9] flex items-center justify-center font-['Poppins']">
        <Loader2 className="w-8 h-8 animate-spin text-[#004772]" />
      </div>
    );
  }

  const effectiveBooking = booking || SAMPLE_CONFIRMATION_BOOKING;
  const property = effectiveBooking.property;
  const coverImage =
    property?.listing_media?.find((m) => m.is_cover)?.media_url ||
    property?.listing_media?.[0]?.media_url ||
    '/images/empty-states/confirmation-room.jpg';
  const secondaryImage1 =
    property?.listing_media?.[1]?.media_url ||
    '/images/empty-states/sample-bedroom.jpg';
  const secondaryImage2 =
    property?.listing_media?.[2]?.media_url ||
    coverImage;

  const location = [property?.locations?.district, property?.locations?.state]
    .filter(Boolean)
    .join(', ') || 'Manali, himachal pradesh';

  const priceWeekday = property?.price_weekday ?? 2000;
  const priceWeekend = property?.price_weekend ?? priceWeekday;
  const addons = effectiveBooking.addons ?? [];
  const breakfastPrice = addons
    .filter((a) => a.type?.toLowerCase().includes('breakfast'))
    .reduce((sum, a) => sum + Number(a.price ?? 0), 400);
  const otherServicesPrice = addons
    .filter((a) => !a.type?.toLowerCase().includes('breakfast'))
    .reduce((sum, a) => sum + Number(a.price ?? 0), 750);

  const { nights: nightDates, invoice } = reconstructInvoice(
    effectiveBooking.start_date,
    effectiveBooking.end_date,
    priceWeekday,
    priceWeekend,
    { breakfastPrice, otherServicesPrice },
  );
  const nights = Math.max(1, nightDates.length || 2);
  const grandTotal = effectiveBooking.amount ?? 8300;

  const handleDownloadReceipt = () => {
    toast.success('Downloading payment receipt...');
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF9F4] flex flex-col font-['Poppins']">
      <Navbar />

      <main className="flex-1 max-w-[1240px] mx-auto w-full px-4 sm:px-8 pt-8 pb-16">
        {/* Main Card Section with Back Button */}
        <div className="relative w-full max-w-[1076px] mx-auto mb-8">
          {/* Back button placed to the left on wide screens, or above on mobile */}
          <div className="xl:absolute xl:-left-[76px] xl:top-0 mb-4 xl:mb-0">
            <BackButton />
          </div>

          {/* Main Card matching Figma Component 316 / Main container */}
          <div className="w-full rounded-[32px] sm:rounded-[42px] bg-[#F1F1F1] border border-[#E1E1E1] p-6 sm:p-10 font-['Poppins']">
            {/* Title & Action Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-1">
              <h1 className="text-[24px] sm:text-[30px] font-semibold text-[#1A1A1A] leading-tight font-['Poppins']">
                {property?.title || 'The Great Rooms Of Triply Homestay and services'}
              </h1>
              <div className="flex items-center gap-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={handleShare}
                  aria-label="Share property"
                  className="w-10 h-10 rounded-full border border-black/25 bg-white flex items-center justify-center text-black/70 hover:bg-gray-50 transition-colors cursor-pointer shadow-2xs"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsSaved(!isSaved)}
                  aria-label="Save to wishlist"
                  className="w-10 h-10 rounded-full border border-black/25 bg-white flex items-center justify-center text-black/70 hover:bg-gray-50 transition-colors cursor-pointer shadow-2xs"
                >
                  <Heart className={`w-4 h-4 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />
                </button>
              </div>
            </div>

            {/* Location subtitle */}
            <p className="text-[16px] sm:text-[18px] text-[#1A1A1A]/70 font-medium font-['Poppins'] mb-6 sm:mb-8">
              {location}
            </p>

            {/* Photo Collage Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 mb-8 select-none">
              {/* Main Hero Photo */}
              <div className="lg:col-span-7 h-[300px] sm:h-[440px] rounded-[28px] sm:rounded-[32px] overflow-hidden relative shadow-sm">
                <Image
                  fill
                  src={coverImage}
                  alt="Main property photo"
                  priority
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 620px"
                />
              </div>

              {/* Right Two Stacked Photos */}
              <div className="lg:col-span-5 flex flex-col gap-4 sm:gap-6 h-[300px] sm:h-[440px]">
                <div className="flex-1 rounded-[22px] sm:rounded-[28px] overflow-hidden relative shadow-sm">
                  <Image
                    fill
                    src={secondaryImage1}
                    alt="Room detail 1"
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 420px"
                  />
                </div>
                <div className="flex-1 rounded-[22px] sm:rounded-[28px] overflow-hidden relative shadow-sm">
                  <Image
                    fill
                    src={secondaryImage2}
                    alt="Room detail 2"
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 420px"
                  />
                  {/* View all photos bottom bar matching Figma */}
                  <button
                    type="button"
                    className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-xs text-white py-3 flex items-center justify-center gap-2 font-medium hover:bg-black/75 transition-colors cursor-pointer text-[14px] sm:text-[15px]"
                  >
                    <Camera className="w-4 h-4" />
                    <span>View all photos</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Confirmation Banner */}
            <div className="w-full h-[36px] rounded-md border border-[#13B766] flex items-center justify-center text-[#13B766] text-[15px] sm:text-[16px] font-medium italic font-['Poppins'] select-none mb-6">
              “Your Booking is Confirmed”
            </div>

            {/* Download Payment Receipt Pill Button */}
            <button
              type="button"
              onClick={handleDownloadReceipt}
              className="h-[46px] px-8 rounded-full border border-[#C0C0C0] bg-white flex items-center justify-center gap-2.5 text-[#004772] text-[14px] font-semibold hover:bg-gray-50 transition-colors mx-auto cursor-pointer shadow-xs font-['Poppins']"
            >
              <span className="text-red-500 font-bold text-[11px] border border-red-500 px-1 py-0.2 rounded-xs">PDF</span>
              <span>Download Payment Receipt</span>
            </button>
          </div>
        </div>

        {/* 1. Stay Dates Card */}
        <div className="w-full max-w-[1076px] mx-auto rounded-[32px] sm:rounded-[42px] bg-[#F1F1F1] border border-[#E1E1E1] p-8 sm:p-10 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[22px] sm:text-[24px] font-semibold text-[#1A1A1A] font-['Poppins']">
              Stay Dates
            </h2>
            <button
              type="button"
              onClick={() => router.push('/my-memories')}
              className="h-[34px] px-6 rounded-full border border-[#004772] text-[#004772] text-[14px] font-medium bg-white hover:bg-[#004772]/5 transition-colors cursor-pointer"
            >
              Edit
            </button>
          </div>

          <div className="flex items-center gap-8 sm:gap-14 flex-wrap">
            <div>
              <p className="text-[17px] font-medium text-[#1A1A1A] font-['Poppins']">Check-In</p>
              <p className="text-[15px] text-[#1A1A1A]/80 font-normal font-['Poppins'] mt-0.5">
                {fmtWeekdayDate(effectiveBooking.start_date)}
              </p>
              <p className="text-[13px] text-[#1A1A1A]/60 font-normal font-['Poppins']">
                {property?.check_in_time || '01:00 PM'}
              </p>
            </div>

            <ArrowRight className="w-5 h-5 text-[#1A1A1A] flex-shrink-0" />

            <div>
              <p className="text-[17px] font-medium text-[#1A1A1A] font-['Poppins']">Check-Out</p>
              <p className="text-[15px] text-[#1A1A1A]/80 font-normal font-['Poppins'] mt-0.5">
                {fmtWeekdayDate(effectiveBooking.end_date)}
              </p>
              <p className="text-[13px] text-[#1A1A1A]/60 font-normal font-['Poppins']">
                {property?.check_out_time || '11:00 AM'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[14px] text-[#1A1A1A]/80 font-medium font-['Poppins'] mt-6">
            <Moon className="w-4 h-4 text-[#1A1A1A]/70" />
            <span>{nights} Nights</span>
          </div>
        </div>

        {/* 2. Guest Details Card */}
        <div className="w-full max-w-[1076px] mx-auto rounded-[32px] sm:rounded-[42px] bg-[#F1F1F1] border border-[#E1E1E1] p-8 sm:p-10 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[22px] sm:text-[24px] font-semibold text-[#1A1A1A] font-['Poppins']">
              Guest Details
            </h2>
            <button
              type="button"
              onClick={() => router.push('/my-memories')}
              className="h-[34px] px-6 rounded-full border border-[#004772] text-[#004772] text-[14px] font-medium bg-white hover:bg-[#004772]/5 transition-colors cursor-pointer"
            >
              Edit
            </button>
          </div>

          <p className="text-[16px] font-medium text-[#1A1A1A] mb-3 font-['Poppins']">
            Main guest - Sanjay kumar
          </p>

          <div className="flex flex-col gap-2 text-[15px] text-[#1A1A1A]/80 font-normal font-['Poppins']">
            <div className="flex items-center gap-2.5">
              <Users className="w-4 h-4 text-black/60" />
              <span>{effectiveBooking.nom_guests ?? 2} adults</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Baby className="w-4 h-4 text-black/60" />
              <span>0 children</span>
            </div>
          </div>
        </div>

        {/* 3. Room Details Card */}
        <div className="w-full max-w-[1076px] mx-auto rounded-[32px] sm:rounded-[42px] bg-[#F1F1F1] border border-[#E1E1E1] p-8 sm:p-10 mb-8">
          <h2 className="text-[22px] sm:text-[24px] font-semibold text-[#1A1A1A] mb-4 font-['Poppins']">
            Room Details
          </h2>
          <ul className="space-y-2 text-[15px] text-[#1A1A1A]/90 font-normal font-['Poppins']">
            <li className="flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1A1A1A]/80" />
              <span>Private Room in Homestay</span>
            </li>
            <li className="flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1A1A1A]/80" />
              <span>1 Bedroom, 1 Bathroom</span>
            </li>
            <li className="flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1A1A1A]/80" />
              <span>Queen size bed</span>
            </li>
          </ul>
        </div>

        {/* 4. Facilities Card */}
        <div className="w-full max-w-[1076px] mx-auto rounded-[32px] sm:rounded-[42px] bg-[#F1F1F1] border border-[#E1E1E1] p-8 sm:p-10 mb-8">
          <h2 className="text-[22px] sm:text-[24px] font-semibold text-[#1A1A1A] mb-6 font-['Poppins']">
            Facilities
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-6 gap-x-4 text-[15px] text-[#1A1A1A]/80 font-medium font-['Poppins']">
            <div className="flex items-center gap-3">
              <Wifi className="w-5 h-5 text-black/70 flex-shrink-0" />
              <span>Free wifi</span>
            </div>
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-black/70 flex-shrink-0" />
              <span>Personal library</span>
            </div>
            <div className="flex items-center gap-3">
              <Tv className="w-5 h-5 text-black/70 flex-shrink-0" />
              <span>TV</span>
            </div>
            <div className="flex items-center gap-3">
              <Waves className="w-5 h-5 text-black/70 flex-shrink-0" />
              <span>Swimming Pool</span>
            </div>
            <div className="flex items-center gap-3">
              <Car className="w-5 h-5 text-black/70 flex-shrink-0" />
              <span>Parking</span>
            </div>
            <div className="flex items-center gap-3">
              <Wind className="w-5 h-5 text-black/70 flex-shrink-0" />
              <span>Air conditioner(AC)</span>
            </div>
            <div className="flex items-center gap-3">
              <Shirt className="w-5 h-5 text-black/70 flex-shrink-0" />
              <span>Washing machine</span>
            </div>
          </div>
        </div>

        {/* 5. Important Rules Card */}
        <div className="w-full max-w-[1076px] mx-auto rounded-[32px] sm:rounded-[42px] bg-[#F1F1F1] border border-[#E1E1E1] p-8 sm:p-10 mb-8 font-['Poppins']">
          <h2 className="text-[22px] sm:text-[24px] font-semibold text-[#1A1A1A] mb-6">
            Important Rules
          </h2>
          <div className="space-y-4 text-[15px] text-[#1A1A1A]/80 font-normal">
            <div className="flex flex-wrap items-center gap-x-12 sm:gap-x-16 gap-y-3">
              <div className="flex items-center gap-3">
                <Ban className="w-5 h-5 text-black/70 flex-shrink-0" />
                <span>No smoking inside room</span>
              </div>
              <div className="flex items-center gap-3">
                <PawPrint className="w-5 h-5 text-black/70 flex-shrink-0" />
                <span>Pets not allowed</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-black/70 flex-shrink-0" />
              <span>Valid government id required during check in</span>
            </div>
          </div>
        </div>

        {/* 6. Payment Information Card */}
        <div className="w-full max-w-[1076px] mx-auto rounded-[32px] sm:rounded-[42px] bg-[#F1F1F1] border border-[#E1E1E1] p-8 sm:p-10 mb-8 font-['Poppins']">
          <h2 className="text-[22px] sm:text-[24px] font-semibold text-[#1A1A1A] mb-6">
            Payment information
          </h2>

          <div className="space-y-5 text-[15px] text-[#1A1A1A]/80 font-normal">
            <div className="flex justify-between items-center max-w-[532px]">
              <span>Room (₹2000 x 3 nights)</span>
              <span className="font-semibold text-[#1A1A1A]">₹6,000</span>
            </div>

            <div>
              <p className="font-semibold text-[#1A1A1A] mb-2.5">Addons</p>
              <div className="space-y-2.5 max-w-[532px]">
                <div className="flex justify-between items-center pl-4">
                  <div className="flex items-center gap-2">
                    <span className="text-base leading-none">•</span>
                    <span>Breakfast( 2 x 3 days )</span>
                  </div>
                  <span className="font-semibold text-[#1A1A1A]">₹400</span>
                </div>
                <div className="flex justify-between items-center pl-4">
                  <div className="flex items-center gap-2">
                    <span className="text-base leading-none">•</span>
                    <span>Rent a car</span>
                  </div>
                  <span className="font-semibold text-[#1A1A1A]">₹750</span>
                </div>
              </div>
            </div>

            <div>
              <p className="font-semibold text-[#1A1A1A] mb-2.5">Discount</p>
              <div className="flex justify-between items-center pl-4 max-w-[532px]">
                <div className="flex items-center gap-2">
                  <span className="text-base leading-none">•</span>
                  <span>AXIS 500</span>
                </div>
                <span className="font-semibold text-[#1A1A1A]">-₹400</span>
              </div>
            </div>

            <div>
              <p className="font-semibold text-[#1A1A1A] mb-2.5">Taxes</p>
              <div className="flex justify-between items-center pl-4 max-w-[532px]">
                <div className="flex items-center gap-2">
                  <span className="text-base leading-none">•</span>
                  <span>GST (12%)</span>
                </div>
                <span className="font-semibold text-[#1A1A1A]">₹850</span>
              </div>
            </div>

            {/* Total Paid Box matching Figma: 532px width, 71px height, rounded-14px */}
            <div className="w-full max-w-[532px] h-[64px] sm:h-[71px] bg-white rounded-[14px] border border-black/30 px-6 sm:px-7 flex items-center justify-between mt-6 shadow-xs">
              <span className="text-[17px] font-bold text-[#1A1A1A]">Total Paid</span>
              <span className="text-[18px] sm:text-[20px] font-bold text-[#1A1A1A]">₹8,300</span>
            </div>
          </div>
        </div>

        {/* 7. Cancellation Rules Card */}
        <div className="w-full max-w-[1076px] mx-auto rounded-[32px] sm:rounded-[42px] bg-[#F1F1F1] border border-[#E1E1E1] p-8 sm:p-10 mb-8 font-['Poppins']">
          <h2 className="text-[22px] sm:text-[24px] font-semibold text-[#1A1A1A] mb-6">
            Cancellation Rules
          </h2>

          <div className="space-y-3.5 text-[15px] text-[#1A1A1A]/80 font-normal">
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-emerald-600 stroke-[2.5] flex-shrink-0" />
              <span>Free cancellation before 23rd Dec</span>
            </div>
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <span>50% refundable before 24 hours</span>
            </div>
            <div className="flex items-center gap-3">
              <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <span>Non - refundable after 25th Dec</span>
            </div>
          </div>

          {/* Failure to arrive policy box matching Figma: max-w-[858px], white bg, rounded-[14px], border border-black/20 */}
          <div className="w-full max-w-[858px] bg-white rounded-[14px] border border-black/20 p-5 sm:p-6 mt-6 flex items-center gap-4 sm:gap-5 relative overflow-hidden shadow-xs">
            <div className="w-[5px] h-[72px] sm:h-[80px] bg-[#BC0024] rounded-r-[14px] flex-shrink-0" />
            <div className="flex-1">
              <p className="text-[16px] font-semibold text-[#1A1A1A] mb-1">
                Failure to arrive policy
              </p>
              <p className="text-[13px] sm:text-[14px] text-[#1A1A1A]/70 italic font-light leading-relaxed">
                In case of a no-show without prior notice, the full booking amount will be charged and the reservation will be cancelled.
              </p>
            </div>
          </div>

          {/* Cancel Booking Link */}
          <button
            type="button"
            onClick={() => router.push(`/host/bookings/cancel?id=${effectiveBooking.booking_id}`)}
            className="block mx-auto text-[#BC0024] underline font-medium text-[15px] sm:text-[16px] mt-6 hover:opacity-80 transition-opacity cursor-pointer"
          >
            Cancel Booking
          </button>
        </div>

        {/* 8. Contact Host Card matching Figma Node 221:14171 Component 358 */}
        <div className="w-full max-w-[1076px] mx-auto rounded-[32px] sm:rounded-[42px] bg-[#F1F1F1] border border-[#E1E1E1] p-8 sm:p-10 mb-8 font-['Poppins']">
          <h2 className="text-[22px] sm:text-[26px] font-semibold text-[#1A1A1A] mb-8">
            Contact host
          </h2>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 lg:gap-14">
            {/* Host Card matching Figma: 336px width, white bg, rounded-[20px] */}
            <div className="w-full sm:w-[336px] bg-white rounded-[20px] p-6 shadow-sm border border-black/10 flex flex-col flex-shrink-0">
              {/* Profile info row: avatar on left, details on right */}
              <div className="flex items-center gap-4">
                <div className="relative w-[70px] h-[70px] rounded-full overflow-visible flex-shrink-0">
                  <div className="relative w-full h-full rounded-full overflow-hidden">
                    <Image
                      fill
                      src="/images/empty-states/host-portrait.jpg"
                      alt="Daksh Basin"
                      className="object-cover"
                    />
                  </div>
                  {/* Blue verified checkmark badge matching Component 326 */}
                  <div className="absolute top-0 right-0 w-5 h-5 bg-[#0396EF] rounded-full border-2 border-white flex items-center justify-center shadow-xs">
                    <Check className="w-3 h-3 text-white stroke-[3]" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-[17px] sm:text-[18px] font-semibold text-[#1A1A1A] truncate">
                    Daksh Basin
                  </h3>
                  <p className="text-[12px] sm:text-[13px] text-gray-500 font-normal">
                    Joined 1 Year ago
                  </p>
                  <div className="flex items-center gap-1.5 text-[12px] sm:text-[13px] text-[#1A1A1A] font-medium mt-0.5">
                    <span>4.8</span>
                    <span className="text-black text-xs">★</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-600">417 reviews</span>
                  </div>
                </div>
              </div>

              {/* Verified Host divider line */}
              <div className="relative flex items-center justify-center my-4">
                <div className="border-t border-[#E5E7EB] w-full" />
                <span className="bg-white px-2.5 text-[10px] text-gray-400 font-medium whitespace-nowrap absolute">
                  Verified Host
                </span>
              </div>

              {/* Response Stats with Green Vertical Indicator */}
              <div className="flex items-center gap-3 py-1">
                <div className="w-[4px] h-[36px] bg-[#13B766] rounded-full flex-shrink-0" />
                <div className="flex justify-between items-center flex-1 text-[12px] sm:text-[13px]">
                  <div className="space-y-1 text-gray-600">
                    <p>Response Rate</p>
                    <p>Avg Response Time</p>
                  </div>
                  <div className="space-y-1 text-right font-medium text-[#1A1A1A]">
                    <p>95%</p>
                    <p>within 1 hour</p>
                  </div>
                </div>
              </div>

              {/* Contact Me Button */}
              <button
                type="button"
                onClick={() => router.push('/chat')}
                className="w-full h-[48px] rounded-[14px] border border-[#CFD4DC] bg-white text-[16px] font-semibold text-[#1A1A1A] hover:bg-gray-50 transition-colors mt-4 cursor-pointer flex items-center justify-center shadow-2xs"
              >
                Contact Me
              </button>
            </div>

            {/* Host Bio and Info */}
            <div className="flex-1 flex flex-col justify-center text-[#1A1A1A] max-w-[620px]">
              <p className="text-[15px] sm:text-[16px] text-[#1A1A1A]/85 leading-relaxed font-normal">
                Hey there! As the host of our property, I’m here to make your stay amazing! Whether it’s providing helpful tips, suggesting local spots, or making sure you have everything you need, I’ve got you covered. By the way, I’m currently studying at the University of Delhi, and I absolutely love reading books and exploring adventurous places. Can’t wait to share my knowledge with you!
              </p>

              {/* Horizontal divider line matching Figma Line 239 */}
              <div className="w-full border-t border-[#D0D5DD] my-6" />

              <div className="space-y-3.5 text-[15px] sm:text-[16px] text-[#1A1A1A]">
                <div className="flex items-center gap-3.5">
                  <Briefcase className="w-5 h-5 text-black/70 flex-shrink-0" />
                  <span>
                    <strong className="font-semibold text-[#1A1A1A]">Occupation -</strong>{' '}
                    <span className="font-normal text-[#1A1A1A]/90">Branding and advertizing agent</span>
                  </span>
                </div>
                <div className="flex items-center gap-3.5">
                  <Gamepad2 className="w-5 h-5 text-black/70 flex-shrink-0" />
                  <span>
                    <strong className="font-semibold text-[#1A1A1A]">Hobbies -</strong>{' '}
                    <span className="font-normal text-[#1A1A1A]/90">playing video games</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Report an Issue */}
        <div className="text-center my-12 font-['Poppins']">
          <button
            type="button"
            onClick={() => toast.info('Opening issue report form...')}
            className="text-[16px] font-semibold text-[#1A1A1A] underline hover:opacity-80 transition-opacity cursor-pointer"
          >
            Report an Issue
          </button>
          <p className="text-[13px] text-gray-500 mt-1">
            Let us know if you faced any issue during your stay or with the host.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
