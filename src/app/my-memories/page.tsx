'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuth } from '@/components/providers/AuthProvider';
import {
  MapPin,
  Calendar,
  X,
  Clock,
  CheckCircle,
  XCircle,
  Navigation,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Users,
  UtensilsCrossed,
  Car,
  BedDouble,
  AlarmClock,
  Plus,
  Minus,
  Dog,
  Star,
  Edit3,
  ChevronDown,
  Receipt,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
const memoriesIllustration = '/memories-illustration.png';
import { cn } from '@/lib/utils';
import { api, getStoredUserId, mapBooking } from '@/lib/api';
import { toast } from 'sonner';
import { calculateBookingInvoice } from '@/lib/billing/invoice';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type TabKey = 'upcoming' | 'completed' | 'cancelled';

interface GuestCounts {
  adults: number;
  children: number;
  rooms: number;
  pets: boolean;
}

interface Booking {
  id: string;
  title: string;
  image: string;
  location: string;
  distanceText: string;
  checkIn: Date;
  checkOut: Date;
  status: TabKey;
  coordinates: { lat: number; lng: number } | null;
  guests: GuestCounts;
  // The actual amount charged for this booking (as stored at the time it
  // was made) plus the listing's current per-night rates -- together these
  // let the price-breakdown dropdown reconstruct the same itemized GST/fee
  // lines shown at checkout (see calculateBookingInvoice), instead of only
  // ever showing that breakdown once, live, and never again.
  amount: number | null;
  priceWeekday: number | null;
  priceWeekend: number | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock Data
// ─────────────────────────────────────────────────────────────────────────────

const today = new Date();

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const fmtDate = (d: Date) =>
  d.toLocaleDateString('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

const fmtShort = (d: Date) =>
  d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });

const fmtMonthYear = (d: Date) =>
  d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

function getDaysLeft(checkIn: Date): number {
  return Math.ceil((checkIn.getTime() - today.getTime()) / 86400000);
}

function getNights(checkIn: Date, checkOut: Date): number {
  return Math.ceil((checkOut.getTime() - checkIn.getTime()) / 86400000);
}

// Mirrors the weekend-aware subtotal calc used at checkout
// (src/app/property/[id]/page.tsx) and server-side in createBooking() --
// Fri/Sat nights bill at priceWeekend, everything else at priceWeekday --
// so a booking's price-breakdown dropdown always matches what was actually
// charged instead of assuming every night was priced the same.
function computeBookingInvoice(booking: Booking) {
  if (booking.priceWeekday == null) return null;
  const priceWeekend = booking.priceWeekend ?? booking.priceWeekday;
  const nights = getNights(booking.checkIn, booking.checkOut);
  let subtotal = 0;
  let weekdayNights = 0;
  let weekendNights = 0;
  const cur = new Date(booking.checkIn);
  for (let i = 0; i < nights; i++) {
    const dow = cur.getDay();
    const isWeekend = dow === 5 || dow === 6;
    subtotal += isWeekend ? priceWeekend : booking.priceWeekday;
    if (isWeekend) weekendNights++; else weekdayNights++;
    cur.setDate(cur.getDate() + 1);
  }
  const invoice = calculateBookingInvoice({ basePropertyPrice: subtotal });
  return { invoice, nights, weekdayNights, weekendNights, priceWeekend };
}

function PriceBreakdown({ booking }: { booking: Booking }) {
  const [open, setOpen] = useState(false);
  const computed = computeBookingInvoice(booking);
  if (!computed) return null;
  const { invoice, weekdayNights, weekendNights, priceWeekend } = computed;

  return (
    <div className="rounded-2xl border border-gray-100 mb-5 overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
      >
        <span className="flex items-center gap-2 text-[13px] font-bold text-gray-800">
          <Receipt className="w-3.5 h-3.5 text-gray-400" />
          Price breakdown
        </span>
        <span className="flex items-center gap-2">
          <span className="text-[13px] font-bold text-gray-800">
            ₹{(booking.amount ?? invoice.grandTotalRupees).toLocaleString('en-IN')}
          </span>
          <ChevronDown
            className={cn('w-4 h-4 text-gray-400 transition-transform', open && 'rotate-180')}
          />
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-2 text-[12px] bg-gray-50/50">
          <div className="flex justify-between text-gray-600 pt-1">
            <span>
              {weekendNights === 0 || weekdayNights === 0 ? (
                <>
                  ₹{(weekendNights > 0 ? priceWeekend : booking.priceWeekday!).toLocaleString('en-IN')} × {weekdayNights + weekendNights} night{weekdayNights + weekendNights > 1 ? 's' : ''}
                </>
              ) : (
                <>
                  ₹{booking.priceWeekday!.toLocaleString('en-IN')} × {weekdayNights} night{weekdayNights > 1 ? 's' : ''} + ₹{priceWeekend.toLocaleString('en-IN')} × {weekendNights} night{weekendNights > 1 ? 's' : ''}
                </>
              )}
            </span>
            <span className="font-semibold">₹{(invoice.propertyPricePaise / 100).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>GST on property ({(invoice.propertyGstRate * 100).toFixed(0)}%)</span>
            <span className="font-semibold">₹{(invoice.gstOnPropertyPaise / 100).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Hostiggo service fee ({(invoice.hostiggoServiceFeeRate * 100).toFixed(0)}%)</span>
            <span className="font-semibold">₹{(invoice.hostiggoServiceFeePaise / 100).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>GST on service fee (18%)</span>
            <span className="font-semibold">₹{(invoice.gstOnHostiggoServiceFeePaise / 100).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-200">
            <span>Total</span>
            <span>₹{(booking.amount ?? invoice.grandTotalRupees).toLocaleString('en-IN')}</span>
          </div>
          {booking.amount != null && (
            <p className="text-[10px] text-gray-400 pt-1">
              Recomputed from the listing&apos;s current per-night rates against the actual charged total -- the total above is the exact amount charged at booking.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function guestLabel(g: GuestCounts): string {
  const parts = [
    `${g.adults} Adult${g.adults !== 1 ? 's' : ''}`,
    `${g.rooms} Room${g.rooms !== 1 ? 's' : ''}`,
  ];
  if (g.children > 0)
    parts.push(`${g.children} Child${g.children !== 1 ? 'ren' : ''}`);
  return parts.join(' · ');
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isBetween(d: Date, start: Date, end: Date) {
  return d > start && d < end;
}

// ─────────────────────────────────────────────────────────────────────────────
// Calendar Picker
// ─────────────────────────────────────────────────────────────────────────────

interface CalendarPickerProps {
  checkIn: Date | null;
  checkOut: Date | null;
  onChange: (ci: Date | null, co: Date | null) => void;
  onDone: () => void;
}

function CalendarPicker({
  checkIn,
  checkOut,
  onChange,
  onDone,
}: CalendarPickerProps) {
  const [hovered, setHovered] = useState<Date | null>(null);
  const [monthOffset, setMonthOffset] = useState(0);

  const now = new Date();
  const m1 = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const m2 = new Date(now.getFullYear(), now.getMonth() + monthOffset + 1, 1);

  const buildCalendar = (firstOfMonth: Date) => {
    const year = firstOfMonth.getFullYear();
    const month = firstOfMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    return cells;
  };

  const handleDayClick = (d: Date) => {
    if (!checkIn || (checkIn && checkOut)) {
      onChange(d, null);
    } else {
      if (d < checkIn) {
        onChange(d, null);
      } else if (isSameDay(d, checkIn)) {
        onChange(null, null);
      } else {
        onChange(checkIn, d);
      }
    }
  };

  const getDayStyle = (d: Date | null): string => {
    if (!d) return '';
    const base =
      'w-9 h-9 flex items-center justify-center text-[13px] font-medium rounded-full cursor-pointer select-none transition-all duration-150 relative z-10';
    const isPast = d < today && !isSameDay(d, today);

    if (isPast)
      return cn(base, 'text-gray-300 cursor-not-allowed pointer-events-none');
    if (checkIn && isSameDay(d, checkIn))
      return cn(base, 'bg-[#004772] text-white font-bold');
    if (checkOut && isSameDay(d, checkOut))
      return cn(base, 'bg-[#004772] text-white font-bold');
    if (isSameDay(d, today))
      return cn(base, 'text-[#004772] font-bold hover:bg-figma-navy/5');

    const rangeEnd = checkOut ?? hovered;
    if (
      checkIn &&
      rangeEnd &&
      isBetween(
        d,
        checkIn < rangeEnd ? checkIn : rangeEnd,
        checkIn < rangeEnd ? rangeEnd : checkIn,
      )
    ) {
      return cn(base, 'bg-figma-navy/5 text-[#004772] rounded-none');
    }
    return cn(base, 'text-gray-700 hover:bg-gray-100');
  };

  const getRangeWrap = (d: Date | null): string => {
    if (!d) return '';
    const rangeEnd = checkOut ?? hovered;
    if (!checkIn || !rangeEnd) return '';
    const lo = checkIn < rangeEnd ? checkIn : rangeEnd;
    const hi = checkIn < rangeEnd ? rangeEnd : checkIn;
    if (isSameDay(d, lo)) return 'bg-figma-navy/5 rounded-l-full';
    if (isSameDay(d, hi)) return 'bg-figma-navy/5 rounded-r-full';
    if (isBetween(d, lo, hi)) return 'bg-figma-navy/5';
    return '';
  };

  const renderMonth = (firstOfMonth: Date) => {
    const cells = buildCalendar(firstOfMonth);
    const DAYS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
    return (
      <div className="flex-1">
        <p className="text-[15px] font-bold text-gray-900 text-center mb-4">
          {fmtMonthYear(firstOfMonth)}
        </p>
        <div className="grid grid-cols-7 mb-2">
          {DAYS.map((d) => (
            <div
              key={d}
              className="text-[11px] font-bold text-gray-400 text-center py-1"
            >
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-1">
          {cells.map((d, i) => (
            <div key={i} className={cn('relative', d ? getRangeWrap(d) : '')}>
              <div
                className={getDayStyle(d)}
                onClick={() =>
                  d && !(d < today && !isSameDay(d, today)) && handleDayClick(d)
                }
                onMouseEnter={() => checkIn && !checkOut && d && setHovered(d)}
                onMouseLeave={() => setHovered(null)}
              >
                {d?.getDate()}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="animate-modal-in">
      {/* Check-in / Check-out summary */}
      <div className="flex gap-3 mb-6">
        <div
          className={cn(
            'flex-1 border-2 rounded-2xl px-4 py-3 transition-all duration-200',
            !checkIn
              ? 'border-[#004772] bg-figma-navy/5'
              : 'border-gray-200 bg-white',
          )}
        >
          <p className="text-[10px] font-black text-gray-500 tracking-widest uppercase mb-1">
            Check In
          </p>
          <p
            className={cn(
              'text-[15px] font-bold',
              checkIn ? 'text-gray-900' : 'text-gray-300',
            )}
          >
            {checkIn ? fmtShort(checkIn) : 'N/A'}
          </p>
        </div>
        <div
          className={cn(
            'flex-1 border-2 rounded-2xl px-4 py-3 transition-all duration-200',
            checkIn && !checkOut
              ? 'border-[#004772] bg-figma-navy/5'
              : 'border-gray-200 bg-white',
          )}
        >
          <p className="text-[10px] font-black text-gray-500 tracking-widest uppercase mb-1">
            Check Out
          </p>
          <p
            className={cn(
              'text-[15px] font-bold',
              checkOut ? 'text-gray-900' : 'text-gray-300',
            )}
          >
            {checkOut ? fmtShort(checkOut) : 'N/A'}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setMonthOffset((o) => o - 1)}
          className="w-8 h-8 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => setMonthOffset((o) => o + 1)}
          className="w-8 h-8 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Dual months */}
      <div className="flex gap-6 mb-6">
        {renderMonth(m1)}
        <div className="w-px bg-gray-100 flex-shrink-0 hidden sm:block" />
        <div className="flex-1 hidden sm:block">{renderMonth(m2)}</div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <button
          onClick={() => onChange(null, null)}
          className="text-[13px] font-semibold text-gray-500 underline hover:text-gray-700 transition-colors"
        >
          Clear dates
        </button>
        <button
          onClick={onDone}
          disabled={!checkIn || !checkOut}
          className="bg-[#004772] text-white text-[14px] font-bold px-8 py-2.5 rounded-2xl hover:bg-[#003a5c] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          Done
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Guest Selector
// ─────────────────────────────────────────────────────────────────────────────

interface GuestSelectorProps {
  guests: GuestCounts;
  onChange: (g: GuestCounts) => void;
}

function GuestSelector({ guests, onChange }: GuestSelectorProps) {
  const [open, setOpen] = useState(false);

  const counter = (
    label: string,
    sub: string,
    val: number,
    icon: React.ReactNode,
    min: number,
    key: keyof Omit<GuestCounts, 'pets'>,
  ) => (
    <div className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-figma-navy/5 rounded-full flex items-center justify-center text-[#004772]">
          {icon}
        </div>
        <div>
          <p className="text-[14px] font-semibold text-gray-900">{label}</p>
          <p className="text-[12px] text-gray-400">{sub}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() =>
            onChange({
              ...guests,
              [key]: Math.max(min, (guests[key] as number) - 1),
            })
          }
          disabled={(guests[key] as number) <= min}
          className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-500 hover:border-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <Minus className="w-3 h-3" />
        </button>
        <span className="w-5 text-center text-[15px] font-bold text-gray-900">
          {guests[key]}
        </span>
        <button
          onClick={() =>
            onChange({ ...guests, [key]: (guests[key] as number) + 1 })
          }
          className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-500 hover:border-gray-500 transition-all"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
    </div>
  );

  return (
    <div>
      {/* Trigger pill */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'w-full flex items-center gap-3 border-2 rounded-2xl px-4 py-3 transition-all duration-200 text-left',
          open
            ? 'border-[#004772] bg-figma-navy/5'
            : 'border-gray-200 hover:border-gray-300',
        )}
      >
        <Users className="w-4 h-4 text-gray-500 flex-shrink-0" />
        <span className="flex-1 text-[13.5px] font-semibold text-gray-700">
          {guestLabel(guests)}
        </span>
        <ChevronRight
          className={cn(
            'w-4 h-4 text-gray-400 transition-transform duration-200',
            open && 'rotate-90',
          )}
        />
      </button>

      {/* Expanded panel */}
      {open && (
        <div className="mt-2 bg-white border border-gray-100 rounded-2xl shadow-lg overflow-hidden animate-modal-in">
          <div className="px-5 pt-2 pb-1">
            {counter(
              'Adults',
              'Age 13 or above',
              guests.adults,
              <Users className="w-4 h-4" />,
              1,
              'adults',
            )}
            {counter(
              'Children',
              'Ages 2–12',
              guests.children,
              <span className="text-[16px]">👶</span>,
              0,
              'children',
            )}
            {counter(
              'Room',
              '1 or more',
              guests.rooms,
              <BedDouble className="w-4 h-4" />,
              1,
              'rooms',
            )}
          </div>

          {/* Pets toggle */}
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-amber-50 rounded-full flex items-center justify-center">
                <span className="text-[16px]">🐾</span>
              </div>
              <div>
                <p className="text-[14px] font-semibold text-gray-900">
                  Pets with you?
                </p>
                <p className="text-[12px] text-gray-400">
                  Service animals allowed
                </p>
              </div>
            </div>
            <button
              onClick={() => onChange({ ...guests, pets: !guests.pets })}
              className={cn(
                'relative w-11 h-6 rounded-full transition-all duration-300',
                guests.pets ? 'bg-[#004772]' : 'bg-gray-200',
              )}
            >
              <div
                className={cn(
                  'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300',
                  guests.pets ? 'translate-x-5' : 'translate-x-0',
                )}
              />
            </button>
          </div>

          <div className="px-5 pb-5">
            <button
              onClick={() => setOpen(false)}
              className="w-full bg-[#004772] text-white text-[14px] font-bold py-3 rounded-2xl hover:bg-[#003a5c] transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Manage Booking Modal
// ─────────────────────────────────────────────────────────────────────────────

type ModalView = 'overview' | 'modify' | 'cancel';

interface RefundPreview {
  policy: 'flexible' | 'moderate' | 'strict';
  grandTotalRupees: number;
  refundAmountRupees: number;
  refundPercent: number;
  reason: string;
}

function ManageBookingModal({
  booking,
  userId,
  onClose,
  onUpdate,
}: {
  booking: Booking;
  userId: string;
  onClose: () => void;
  onUpdate: (b: Partial<Booking>) => void;
}) {
  const router = useRouter();
  const [view, setView] = useState<ModalView>('overview');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [tempCheckIn, setTempCheckIn] = useState<Date | null>(booking.checkIn);
  const [tempCheckOut, setTempCheckOut] = useState<Date | null>(
    booking.checkOut,
  );
  const [tempGuests, setTempGuests] = useState<GuestCounts>({
    ...booking.guests,
  });
  const [saving, setSaving] = useState(false);
  const [refundPreview, setRefundPreview] = useState<RefundPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const nights =
    tempCheckIn && tempCheckOut ? getNights(tempCheckIn, tempCheckOut) : 0;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const handleSave = async () => {
    const nextCheckIn = tempCheckIn ?? booking.checkIn;
    const nextCheckOut = tempCheckOut ?? booking.checkOut;
    setSaving(true);
    try {
      await Promise.all([
        api.updateBookingDates(booking.id, nextCheckIn, nextCheckOut, userId),
        api.updateBookingGuests(
          booking.id,
          {
            adults: tempGuests.adults,
            children: tempGuests.children,
            pets: tempGuests.pets ? 1 : 0,
          },
          userId,
        ),
      ]);
      onUpdate({
        checkIn: nextCheckIn,
        checkOut: nextCheckOut,
        guests: tempGuests,
      });
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update booking',
      );
    } finally {
      setSaving(false);
    }
  };

  const openCancelConfirm = async () => {
    setView('cancel');
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const preview = await api.getRefundPreview(booking.id, userId);
      setRefundPreview(preview);
    } catch (error) {
      setPreviewError(
        error instanceof Error ? error.message : 'Could not calculate your refund.',
      );
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleCancel = async () => {
    setSaving(true);
    try {
      await api.cancelBookingWithRefund(booking.id, userId, 'Cancelled by guest');
      onUpdate({ status: 'cancelled' });
      onClose();
      toast.success(
        refundPreview && refundPreview.refundAmountRupees > 0
          ? `Booking cancelled. ₹${refundPreview.refundAmountRupees.toLocaleString('en-IN')} will be refunded.`
          : 'Booking cancelled.',
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to cancel booking',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className="relative bg-white w-full sm:max-w-[560px] sm:mx-4 sm:rounded-3xl rounded-t-3xl overflow-hidden flex flex-col"
        style={{
          maxHeight: '92dvh',
          animation: 'modalSlide 0.28s cubic-bezier(0.34,1.56,0.64,1) both',
        }}
      >
        {/* ── Header ── */}
        <div className="relative flex-shrink-0">
          <img
            src={booking.image}
            alt={booking.title}
            className="w-full h-[130px] object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors"
          >
            <X className="w-4 h-4 text-gray-700" strokeWidth={2.5} />
          </button>

          {/* Tab toggle */}
          {booking.status === 'upcoming' && (
            <div className="absolute bottom-3 left-4 flex gap-2">
              <button
                onClick={() => setView('overview')}
                className={cn(
                  'px-3.5 py-1.5 rounded-full text-[12px] font-bold transition-all',
                  view === 'overview'
                    ? 'bg-white text-gray-900'
                    : 'bg-white/30 text-white hover:bg-white/50',
                )}
              >
                Overview
              </button>
              <button
                onClick={() => setView('modify')}
                className={cn(
                  'px-3.5 py-1.5 rounded-full text-[12px] font-bold transition-all flex items-center gap-1.5',
                  view === 'modify'
                    ? 'bg-white text-gray-900'
                    : 'bg-white/30 text-white hover:bg-white/50',
                )}
              >
                <Edit3 className="w-3 h-3" />
                Modify
              </button>
            </div>
          )}
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {/* ── Overview ── */}
          {view === 'overview' && (
            <div className="p-5">
              <h3 className="text-[15px] font-bold text-gray-900 mb-0.5 leading-snug">
                {booking.title}
              </h3>
              <div className="flex items-center gap-1.5 text-[12px] text-gray-400 mb-4">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                {booking.location}
              </div>

              {/* Dates */}
              <div className="flex gap-3 bg-gray-50 rounded-2xl p-4 mb-5">
                <div className="flex-1 text-center">
                  <p className="text-[10px] font-black text-gray-400 tracking-wider uppercase mb-1">
                    Check-In
                  </p>
                  <p className="text-[13px] font-bold text-gray-800">
                    {fmtShort(booking.checkIn)}
                  </p>
                </div>
                <div className="text-gray-200 self-center font-bold text-lg">
                  →
                </div>
                <div className="flex-1 text-center">
                  <p className="text-[10px] font-black text-gray-400 tracking-wider uppercase mb-1">
                    Check-Out
                  </p>
                  <p className="text-[13px] font-bold text-gray-800">
                    {fmtShort(booking.checkOut)}
                  </p>
                </div>
              </div>

              <PriceBreakdown booking={booking} />

              {/* Actions */}
              <div className="flex flex-col gap-2.5">
                {booking.status === 'upcoming' && (
                  <>
                    <button
                      onClick={() => setView('modify')}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-[13px] font-semibold bg-[#004772] text-white hover:bg-[#003a5c] transition-all active:scale-[0.98]"
                    >
                      <span>Modify Booking</span>
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        onClose();
                        router.push(`/property/${booking.id}`);
                      }}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-[13px] font-semibold bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 transition-all"
                    >
                      <span>View Property</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={openCancelConfirm}
                      disabled={saving}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-[13px] font-semibold bg-red-50 text-red-500 border border-red-200 hover:bg-red-100 transition-all"
                    >
                      <span>Cancel Booking</span>
                      <XCircle className="w-4 h-4" />
                    </button>
                  </>
                )}
                {booking.status === 'completed' && (
                  <>
                    <button
                      onClick={() => {
                        onClose();
                        router.push(`/property/${booking.id}`);
                      }}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-[13px] font-semibold bg-[#004772] text-white hover:bg-[#003a5c] transition-all"
                    >
                      <span>Book Again</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        onClose();
                        router.push(`/property/${booking.id}#write-review`);
                      }}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-[13px] font-semibold bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 transition-all"
                    >
                      <span>Write a Review</span>
                      <Star className="w-4 h-4" />
                    </button>
                  </>
                )}
                {booking.status === 'cancelled' && (
                  <button
                    onClick={() => {
                      onClose();
                      router.push(`/property/${booking.id}`);
                    }}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-[13px] font-semibold bg-[#004772] text-white hover:bg-[#003a5c] transition-all"
                  >
                    <span>Book Again</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── Modify ── */}
          {view === 'modify' && (
            <div className="p-5 space-y-6">
              {/* Dates */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[14px] font-bold text-gray-900">Dates</p>
                  <button
                    onClick={() => setCalendarOpen((o) => !o)}
                    className="flex items-center gap-1.5 text-[12px] font-semibold text-[#004772] hover:underline"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    {calendarOpen ? 'Close' : 'Change dates'}
                  </button>
                </div>

                {!calendarOpen ? (
                  <button
                    onClick={() => setCalendarOpen(true)}
                    className="w-full flex items-center gap-3 border-2 border-gray-200 rounded-2xl px-4 py-3 hover:border-gray-300 transition-all text-left"
                  >
                    <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="flex-1">
                      <span className="text-[13.5px] font-semibold text-gray-700">
                        {tempCheckIn && tempCheckOut
                          ? `${fmtShort(tempCheckIn)} → ${fmtShort(tempCheckOut)} · ${nights} night${nights !== 1 ? 's' : ''}`
                          : 'Select dates'}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>
                ) : (
                  <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50/50">
                    <CalendarPicker
                      checkIn={tempCheckIn}
                      checkOut={tempCheckOut}
                      onChange={(ci, co) => {
                        setTempCheckIn(ci);
                        setTempCheckOut(co);
                      }}
                      onDone={() => setCalendarOpen(false)}
                    />
                  </div>
                )}
              </div>

              {/* Guests */}
              <div>
                <p className="text-[14px] font-bold text-gray-900 mb-3">
                  Guests
                </p>
                <GuestSelector guests={tempGuests} onChange={setTempGuests} />
              </div>

              {/* Summary */}
              {nights > 0 && (
                <div className="bg-gray-50 rounded-2xl p-4 space-y-2.5">
                  <p className="text-[13px] font-bold text-gray-900">
                    Updated Summary
                  </p>
                  <div className="flex justify-between text-[13px] text-gray-600">
                    <span>
                      {nights} night{nights !== 1 ? 's' : ''} ·{' '}
                      {guestLabel(tempGuests)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Cancel confirm ── */}
          {view === 'cancel' && (
            <div className="p-5 space-y-4">
              <h3 className="text-[15px] font-bold text-gray-900">
                Cancel this booking?
              </h3>

              {previewLoading && (
                <div className="text-[13px] text-gray-500 py-6 text-center">
                  Calculating your refund...
                </div>
              )}

              {previewError && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-[13px] text-red-600">
                  {previewError}
                </div>
              )}

              {refundPreview && (
                <>
                  {refundPreview.refundPercent < 1 && (
                    <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 flex items-start gap-3">
                      <AlarmClock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[13.5px] font-bold text-amber-800">
                          {refundPreview.refundPercent === 0
                            ? 'No refund for this cancellation'
                            : `Only ${Math.round(refundPreview.refundPercent * 100)}% will be refunded`}
                        </p>
                        <p className="text-[12px] text-amber-700 mt-1 leading-snug">
                          {refundPreview.reason}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
                    <div className="flex justify-between text-[13px] text-gray-600">
                      <span>Total paid</span>
                      <span>₹{refundPreview.grandTotalRupees.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-[15px] font-bold text-gray-900 pt-1 border-t border-gray-200">
                      <span>You&apos;ll be refunded</span>
                      <span className={refundPreview.refundAmountRupees > 0 ? 'text-green-600' : 'text-red-500'}>
                        ₹{refundPreview.refundAmountRupees.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {refundPreview.refundPercent === 1 && (
                    <p className="text-[12px] text-gray-500">{refundPreview.reason}</p>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        {view === 'modify' && (
          <div className="flex-shrink-0 p-4 border-t border-gray-100 bg-white">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-[#004772] text-white text-[14px] font-bold py-3.5 rounded-2xl hover:bg-[#003a5c] active:scale-[0.99] transition-all shadow-sm"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
        {view === 'cancel' && (
          <div className="flex-shrink-0 p-4 border-t border-gray-100 bg-white flex gap-2.5">
            <button
              onClick={() => setView('overview')}
              disabled={saving}
              className="flex-1 bg-gray-50 text-gray-700 border border-gray-200 text-[14px] font-bold py-3.5 rounded-2xl hover:bg-gray-100 transition-all"
            >
              Keep Booking
            </button>
            <button
              onClick={handleCancel}
              disabled={saving || previewLoading || !refundPreview}
              className="flex-1 bg-red-500 text-white text-[14px] font-bold py-3.5 rounded-2xl hover:bg-red-600 active:scale-[0.99] transition-all shadow-sm disabled:opacity-50"
            >
              {saving ? 'Cancelling...' : 'Confirm Cancellation'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton Card
// ─────────────────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div
      className="bg-white rounded-[20px] overflow-hidden border border-gray-100 animate-pulse"
      style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}
    >
      <div className="flex flex-col sm:flex-row">
        <div className="w-full sm:w-[240px] h-[200px] sm:h-auto bg-gray-200 flex-shrink-0" />
        <div className="flex-1 p-6 flex flex-col gap-3">
          <div className="h-5 bg-gray-200 rounded-lg w-3/4" />
          <div className="h-3.5 bg-gray-100 rounded-lg w-1/2" />
          <div className="flex gap-2 mt-2">
            <div className="h-8 bg-gray-100 rounded-full w-28" />
            <div className="h-8 w-8 bg-gray-100 rounded-full" />
          </div>
          <div className="h-10 bg-gray-100 rounded-xl w-36 mt-auto" />
        </div>
        <div className="hidden sm:flex flex-col items-center justify-center gap-4 px-8 py-6 bg-gray-50 min-w-[190px]">
          <div className="h-12 w-24 bg-gray-200 rounded-lg" />
          <div className="h-12 w-24 bg-gray-200 rounded-lg" />
          <div className="h-6 w-20 bg-gray-300 rounded-full" />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Booking Card
// ─────────────────────────────────────────────────────────────────────────────

function BookingCard({
  booking,
  onManage,
}: {
  booking: Booking;
  onManage: () => void;
}) {
  const [imgErr, setImgErr] = useState(false);
  const FALLBACK =
    'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&h=600&fit=crop&q=80';

  const daysLeft = getDaysLeft(booking.checkIn);
  const nights = getNights(booking.checkIn, booking.checkOut);

  const statusLabel =
    booking.status === 'upcoming'
      ? daysLeft === 0
        ? 'Today!'
        : daysLeft === 1
          ? 'Tomorrow!'
          : daysLeft < 0
            ? 'Ongoing'
            : `${daysLeft} days left`
      : booking.status === 'completed'
        ? `${nights} night stay`
        : 'Booking cancelled';

  const statusColor =
    booking.status === 'upcoming'
      ? 'text-[#004772]'
      : booking.status === 'completed'
        ? 'text-emerald-600'
        : 'text-red-400';

  const handleLocation = () => {
    if (!booking.coordinates) return;
    window.open(
      `https://www.google.com/maps?q=${booking.coordinates.lat},${booking.coordinates.lng}`,
      '_blank',
    );
  };

  return (
    <div
      className="bg-white rounded-[20px] overflow-hidden group transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
      style={{
        boxShadow: '0 4px 24px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)',
      }}
    >
      <div className="flex flex-col sm:flex-row min-h-[160px]">
        {/* Image */}
        <div className="relative w-full sm:w-[240px] h-[200px] sm:h-auto flex-shrink-0 overflow-hidden rounded-t-[20px] sm:rounded-l-[20px] sm:rounded-tr-none">
          <img
            src={imgErr ? FALLBACK : booking.image}
            alt={booking.title}
            onError={() => setImgErr(true)}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Content */}
        <div className="flex-1 px-6 py-5 flex flex-col justify-between min-w-0">
          <div>
            <h3 className="text-[17px] font-bold text-gray-900 leading-snug mb-1.5 line-clamp-2">
              {booking.title}
            </h3>
            <p className="text-[13px] text-gray-400 flex items-center gap-1.5 mb-4">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-gray-300" />
              {booking.distanceText}
            </p>

            {/* Guest badge */}
            <div className="flex items-center gap-2 text-[12px] text-gray-400 mb-4">
              <Users className="w-3.5 h-3.5" />
              <span>{guestLabel(booking.guests)}</span>
            </div>

            {/* Location + Share */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={handleLocation}
                disabled={!booking.coordinates}
                title={booking.coordinates ? undefined : 'Exact location unavailable'}
                className={cn(
                  'flex items-center gap-2 border text-[12.5px] font-semibold px-4 py-2 rounded-full transition-all duration-200',
                  booking.coordinates
                    ? 'border-gray-200 text-gray-600 hover:border-figma-navy/40 hover:text-figma-navy hover:bg-figma-navy/5'
                    : 'border-gray-100 text-gray-300 cursor-not-allowed',
                )}
              >
                <Navigation className="w-3.5 h-3.5" />
                Location
              </button>
            </div>
          </div>

          <button
            onClick={onManage}
            className="self-start mt-4 bg-[#004772] text-white text-[13.5px] font-bold px-6 py-2.5 rounded-xl hover:bg-[#003a5c] active:scale-[0.97] transition-all duration-200 shadow-sm hover:shadow-md"
          >
            Manage Booking
          </button>
        </div>

        {/* Dates Panel */}
        <div
          className="flex sm:flex-col items-center justify-around sm:justify-center gap-3 sm:gap-6 px-6 py-5 sm:min-w-[190px] border-t sm:border-t-0 sm:border-l border-gray-100 flex-shrink-0"
          style={{ background: '#F8F9FC' }}
        >
          <div className="text-center">
            <p className="text-[11px] font-bold text-gray-400 tracking-wider uppercase mb-1.5">
              Check-In
            </p>
            <p className="text-[14px] font-bold text-gray-800 whitespace-nowrap">
              {fmtDate(booking.checkIn)}
            </p>
          </div>
          <div className="hidden sm:block w-8 h-px bg-gray-200" />
          <div className="sm:hidden text-gray-300 font-bold">-</div>
          <div className="text-center">
            <p className="text-[11px] font-bold text-gray-400 tracking-wider uppercase mb-1.5">
              Check-Out
            </p>
            <p className="text-[14px] font-bold text-gray-800 whitespace-nowrap">
              {fmtDate(booking.checkOut)}
            </p>
          </div>
          <p
            className={cn(
              'text-[16px] sm:text-[17px] font-extrabold whitespace-nowrap mt-0 sm:mt-2',
              statusColor,
            )}
          >
            {statusLabel}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty State
// ─────────────────────────────────────────────────────────────────────────────

const EMPTY_CONFIG: Record<
  TabKey,
  { heading: string; sub: string; cta?: string }
> = {
  upcoming: {
    heading: 'No upcoming trips yet,',
    sub: 'Start planning your next stay or services.',
    cta: 'Explore stays',
  },
  completed: {
    heading: 'No completed trips yet,',
    sub: 'Your past stays will appear here.',
  },
  cancelled: {
    heading: 'No cancelled bookings,',
    sub: 'Cancelled trips will be shown here.',
  },
};

function SignedOutState() {
  const router = useRouter();
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-14 py-16 animate-fade-in">
      <img
        src={memoriesIllustration}
        alt="Sign in to see your trips"
        className="w-[160px] sm:w-[200px] object-contain drop-shadow-sm"
      />
      <div className="text-center sm:text-left max-w-xs">
        <h3 className="text-[22px] sm:text-[26px] font-extrabold italic text-gray-900 leading-tight mb-2">
          Sign in to see your trips
        </h3>
        <p className="text-[14px] text-gray-500 leading-relaxed mb-6">
          Your bookings and stay history will show up here once you&apos;re signed in.
        </p>
        <button
          onClick={() => router.push('/signin?redirect=/my-memories')}
          className="bg-[#004772] text-white px-6 py-2.5 rounded-xl text-[14px] font-semibold hover:bg-[#003a5c] transition-all shadow-sm"
        >
          Sign in
        </button>
      </div>
    </div>
  );
}

function EmptyState({ tab }: { tab: TabKey }) {
  const router = useRouter();
  const { heading, sub, cta } = EMPTY_CONFIG[tab];
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-14 py-16 animate-fade-in">
      <img
        src={memoriesIllustration}
        alt="No trips"
        className="w-[160px] sm:w-[200px] object-contain drop-shadow-sm"
      />
      <div className="text-center sm:text-left max-w-xs">
        <h3 className="text-[22px] sm:text-[26px] font-extrabold italic text-gray-900 leading-tight mb-2">
          {heading}
        </h3>
        <p className="text-[14px] text-gray-500 leading-relaxed mb-6">{sub}</p>
        {cta && (
          <button
            onClick={() => router.push('/')}
            className="bg-[#004772] text-white px-6 py-2.5 rounded-xl text-[14px] font-semibold hover:bg-[#003a5c] transition-all shadow-sm"
          >
            {cta}
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab Switcher
// ─────────────────────────────────────────────────────────────────────────────

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  {
    key: 'upcoming',
    label: 'Upcoming',
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  {
    key: 'completed',
    label: 'Completed',
    icon: <CheckCircle className="w-3.5 h-3.5" />,
  },
  {
    key: 'cancelled',
    label: 'Cancelled',
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
];

function TabSwitcher({
  active,
  onChange,
  counts,
}: {
  active: TabKey;
  onChange: (t: TabKey) => void;
  counts: Record<TabKey, number>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const btn = container.querySelector(
      `[data-tab="${active}"]`,
    ) as HTMLElement;
    if (btn) setIndicator({ left: btn.offsetLeft, width: btn.offsetWidth });
  }, [active]);

  return (
    <div
      ref={containerRef}
      className="relative flex items-center bg-gray-100 rounded-full p-1"
    >
      <div
        className="absolute top-1 bottom-1 bg-[#004772] rounded-full shadow-md transition-all duration-250 ease-in-out pointer-events-none"
        style={{ left: indicator.left, width: indicator.width }}
      />
      {TABS.map((tab) => (
        <button
          key={tab.key}
          data-tab={tab.key}
          onClick={() => onChange(tab.key)}
          className={cn(
            'relative z-10 flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-full text-[12.5px] sm:text-[13px] font-semibold transition-colors duration-200 select-none whitespace-nowrap',
            active === tab.key
              ? 'text-white'
              : 'text-gray-600 hover:text-gray-800',
          )}
        >
          {tab.icon}
          {tab.label}
          {counts[tab.key] > 0 && (
            <span
              className={cn(
                'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                active === tab.key
                  ? 'bg-white/25 text-white'
                  : 'bg-gray-200 text-gray-600',
              )}
            >
              {counts[tab.key]}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export default function MyMemoriesPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('upcoming');
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [managingId, setManagingId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const { user, isLoading } = useSupabaseAuth();

  useEffect(() => {
    if (isLoading) return;

    let mounted = true;

    const loadBookings = async () => {
      const resolvedUserId = user?.id ?? getStoredUserId();
      if (mounted) setUserId(resolvedUserId);
      if (!resolvedUserId) {
        setBookings([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const labels: TabKey[] = ['upcoming', 'completed', 'cancelled'];
        const results = await Promise.all(
          labels.map((label) => api.guestBookings(resolvedUserId, label)),
        );
        if (mounted) {
          setBookings(results.flat().map(mapBooking) as Booking[]);
        }
      } catch (error) {
        console.error('[memories] failed to load bookings:', error);
        if (mounted) setBookings([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadBookings();

    return () => {
      mounted = false;
    };
  }, [user?.id, isLoading]);

  const counts: Record<TabKey, number> = {
    upcoming: bookings.filter((b) => b.status === 'upcoming').length,
    completed: bookings.filter((b) => b.status === 'completed').length,
    cancelled: bookings.filter((b) => b.status === 'cancelled').length,
  };

  const filtered = bookings.filter((b) => b.status === activeTab);
  const managingBooking = bookings.find((b) => b.id === managingId) ?? null;

  const handleUpdate = useCallback((id: string, updates: Partial<Booking>) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updates } : b)),
    );
  }, []);

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 mb-8 sm:mb-10">
          <h1 className="text-[28px] sm:text-[34px] font-extrabold text-gray-900 tracking-tight flex-shrink-0">
            My Memories
          </h1>
          <TabSwitcher
            active={activeTab}
            onChange={setActiveTab}
            counts={counts}
          />
        </div>

        {/* Content */}
        <div key={activeTab} className="animate-fade-in">
          {loading ? (
            <div className="flex flex-col gap-4">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : !userId ? (
            <SignedOutState />
          ) : filtered.length === 0 ? (
            <EmptyState tab={activeTab} />
          ) : (
            <div className="flex flex-col gap-4">
              {filtered.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onManage={() => setManagingId(booking.id)}
                />
              ))}
            </div>
          )}
        </div>

        {!loading && filtered.length > 0 && (
          <p className="text-center text-[12px] text-gray-400 mt-10">
            Showing {filtered.length} {activeTab} booking
            {filtered.length !== 1 ? 's' : ''}
          </p>
        )}
      </main>

      <Footer />

      {managingBooking && userId && (
        <ManageBookingModal
          booking={managingBooking}
          userId={userId}
          onClose={() => setManagingId(null)}
          onUpdate={(updates) => handleUpdate(managingBooking.id, updates)}
        />
      )}

      <style>{`
        @keyframes modalSlide {
          from { opacity: 0; transform: translateY(32px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fadeIn 0.25s ease both; }
        .animate-modal-in { animation: fadeIn 0.2s ease both; }
        @media (max-width: 640px) {
          @keyframes modalSlide {
            from { opacity: 0; transform: translateY(100%); }
            to   { opacity: 1; transform: translateY(0); }
          }
        }
      `}</style>
    </div>
  );
}
