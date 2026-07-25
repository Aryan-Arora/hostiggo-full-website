'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  CheckCircle2,
  MapPin,
  Calendar,
  Users,
  Receipt,
  Loader2,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { reconstructInvoice } from '@/lib/billing/reconstructInvoice';

interface BookingDetail {
  booking_id: number;
  start_date: string;
  end_date: string;
  nom_guests: number | null;
  amount: number | null;
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

function fmtDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function BookingConfirmationPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { userId, isAuthenticated } = useAuth();
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params?.id || !isAuthenticated || !userId) return;
    let cancelled = false;
    api
      .bookingDetail(params.id, userId)
      .then((data) => {
        if (!cancelled) setBooking(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load booking.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [params?.id, isAuthenticated, userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-figma-navy" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <Navbar />
        <div className="container-main py-20 text-center">
          <p className="text-gray-500 mb-4">{error || 'Booking not found.'}</p>
          <button
            onClick={() => router.push('/my-memories')}
            className="btn-primary"
          >
            View my bookings
          </button>
        </div>
      </div>
    );
  }

  const property = booking.property;
  const coverImage =
    property?.listing_media?.find((m) => m.is_cover)?.media_url ||
    property?.listing_media?.[0]?.media_url ||
    '/logo.png';
  const location = [property?.locations?.district, property?.locations?.state]
    .filter(Boolean)
    .join(', ');

  const priceWeekday = property?.price_weekday ?? 0;
  const priceWeekend = property?.price_weekend ?? priceWeekday;
  const { nights: nightDates, invoice } = reconstructInvoice(
    booking.start_date,
    booking.end_date,
    priceWeekday,
    priceWeekend,
  );
  const nights = nightDates.length;
  const grandTotal = booking.amount ?? invoice.grandTotalRupees;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Navbar />
      <main className="container-main max-w-3xl py-10 md:py-14">
        {/* Success header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-9 h-9 text-green-600" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
            Booking confirmed!
          </h1>
          <p className="text-sm text-gray-500">
            Booking ID #{booking.booking_id} &middot; A confirmation has been added to your bookings.
          </p>
        </div>

        {/* Property card */}
        <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden mb-6">
          <div className="flex flex-col sm:flex-row">
            <div className="sm:w-64 h-48 sm:h-auto flex-shrink-0 bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={coverImage}
                alt={property?.title || 'Property'}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 p-5">
              <h2 className="text-lg font-bold text-gray-900 mb-1">
                {property?.title || 'Property'}
              </h2>
              {location && (
                <p className="text-sm text-gray-500 flex items-center gap-1 mb-4">
                  <MapPin className="w-3.5 h-3.5" /> {location}
                </p>
              )}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400 text-xs mb-0.5">Check-in</p>
                  <p className="font-semibold text-gray-800 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    {fmtDate(booking.start_date)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-0.5">Check-out</p>
                  <p className="font-semibold text-gray-800 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    {fmtDate(booking.end_date)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-0.5">Guests</p>
                  <p className="font-semibold text-gray-800 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-gray-400" />
                    {booking.nom_guests ?? 1} guest{(booking.nom_guests ?? 1) !== 1 ? 's' : ''}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-0.5">Nights</p>
                  <p className="font-semibold text-gray-800">{nights} night{nights !== 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bill */}
        <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-5 md:p-6 mb-8">
          <h3 className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-4">
            <Receipt className="w-4 h-4 text-gray-400" /> Bill summary
          </h3>
          <div className="space-y-2 text-[13px]">
            <div className="flex justify-between text-gray-600">
              <span>Property price ({nights} night{nights !== 1 ? 's' : ''})</span>
              <span className="font-semibold">
                ₹{(invoice.propertyPricePaise / 100).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>GST on property ({(invoice.propertyGstRate * 100).toFixed(0)}%)</span>
              <span className="font-semibold">
                ₹{(invoice.gstOnPropertyPaise / 100).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Hostiggo service fee ({(invoice.hostiggoServiceFeeRate * 100).toFixed(0)}%)</span>
              <span className="font-semibold">
                ₹{(invoice.hostiggoServiceFeePaise / 100).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>GST on service fee (18%)</span>
              <span className="font-semibold">
                ₹{(invoice.gstOnHostiggoServiceFeePaise / 100).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 pt-3 mt-1 border-t border-gray-200 text-[15px]">
              <span>Total paid</span>
              <span>₹{grandTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => router.push('/my-memories')}
            className="btn-primary flex-1 text-center py-3"
          >
            View my bookings
          </button>
          <button
            onClick={() => router.push('/')}
            className="btn-outline flex-1 text-center py-3"
          >
            Back to home
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
