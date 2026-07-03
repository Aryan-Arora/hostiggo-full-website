'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Download,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Info,
  RotateCcw,
  CheckCircle2,
  Ban,
  BedDouble,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import HostDashboardShell from '../_components/HostDashboardShell';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

type DayStatus = 'available' | 'blocked' | 'booked' | 'none';

type DayInfo = {
  day: number;
  dateStr: string;
  price: number | null;
  currency: string;
  status: DayStatus;
  guest?: string;
};

const pad = (n: number) => String(n).padStart(2, '0');
const toDateStr = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
const inr = (n: number, currency: string) =>
  currency === 'INR' || !currency ? `₹${Math.round(n).toLocaleString('en-IN')}` : `${currency} ${n}`;

const STATUS_META: Record<DayStatus, { label: string; dot: string; cell: string; text: string }> = {
  available: { label: 'Available', dot: 'bg-green-500', cell: 'hover:bg-gray-50', text: 'text-green-600' },
  blocked: { label: 'Blocked', dot: 'bg-gray-400', cell: 'bg-gray-50', text: 'text-gray-400' },
  booked: { label: 'Booked', dot: 'bg-blue-500', cell: 'bg-blue-50', text: 'text-blue-600' },
  none: { label: 'No rate set', dot: 'bg-gray-200', cell: 'hover:bg-gray-50', text: 'text-gray-300' },
};

export default function CalendarPage() {
  const { userId } = useAuth();
  const [listings, setListings] = useState<{ id: string; title: string }[]>([]);
  const [listingId, setListingId] = useState<string>('');
  const [monthDate, setMonthDate] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });
  const [entries, setEntries] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [priceInput, setPriceInput] = useState('');
  const [availInput, setAvailInput] = useState(true);
  const [saving, setSaving] = useState(false);

  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();

  // Load the host's listings for the picker.
  useEffect(() => {
    if (!userId) return;
    let active = true;
    setLoadingListings(true);
    api
      // Listing picker needs every listing, not just a page of them.
      .hostListings(userId, 0, 500)
      .then(({ data: rows }) => {
        if (!active) return;
        const mapped = rows.map((r: any) => ({
          id: String(r.listing_id),
          title: r.title?.trim() || `Listing ${r.listing_id}`,
        }));
        setListings(mapped);
        if (mapped.length) setListingId((cur) => cur || mapped[0].id);
      })
      .catch((err) => console.error('[host/calendar] listings load failed:', err))
      .finally(() => active && setLoadingListings(false));
    return () => {
      active = false;
    };
  }, [userId]);

  const loadCalendar = useCallback(async () => {
    if (!listingId) return;
    const start = toDateStr(year, month, 1);
    const end = toDateStr(year, month, new Date(year, month + 1, 0).getDate());
    setLoading(true);
    setError(false);
    setSelectedDay(null);
    try {
      const data = await api.hostCalendar(listingId, start, end);
      setEntries(data.entries ?? []);
      setBookings(data.bookings ?? []);
    } catch (err) {
      console.error('[host/calendar] calendar load failed:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [listingId, year, month]);

  useEffect(() => {
    loadCalendar();
  }, [loadCalendar]);

  // Build a date -> DayInfo map for the visible month.
  const days = useMemo<DayInfo[]>(() => {
    const entryMap = new Map<string, any>();
    for (const e of entries) entryMap.set(e.date, e);

    const isBooked = (dateStr: string): { booked: boolean; guest?: string } => {
      for (const b of bookings) {
        // Booked for [start_date, end_date) — checkout day is free.
        if (b.start_date && b.end_date && dateStr >= b.start_date && dateStr < b.end_date) {
          return { booked: true, guest: b.guest?.name };
        }
      }
      return { booked: false };
    };

    const count = new Date(year, month + 1, 0).getDate();
    const out: DayInfo[] = [];
    for (let d = 1; d <= count; d++) {
      const dateStr = toDateStr(year, month, d);
      const entry = entryMap.get(dateStr);
      const booking = isBooked(dateStr);
      let status: DayStatus = 'none';
      if (booking.booked) status = 'booked';
      else if (entry) status = entry.is_available ? 'available' : 'blocked';
      out.push({
        day: d,
        dateStr,
        price: entry ? Number(entry.price) : null,
        currency: entry?.currency ?? 'INR',
        status,
        guest: booking.guest,
      });
    }
    return out;
  }, [entries, bookings, year, month]);

  const leading = new Date(year, month, 1).getDay();
  const selected = selectedDay ? days.find((d) => d.dateStr === selectedDay) : null;

  // Seed the edit form whenever a different day is selected.
  useEffect(() => {
    if (selected) {
      setPriceInput(selected.price != null ? String(selected.price) : '');
      setAvailInput(selected.status !== 'blocked');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDay]);

  const handleSaveDay = async () => {
    if (!selected || !listingId) return;
    const day = selected.dateStr;
    setSaving(true);
    try {
      await api.updateCalendarDay({
        listingId,
        date: day,
        price: priceInput.trim() ? Number(priceInput) : undefined,
        isAvailable: availInput,
      });
      toast.success('Calendar updated');
      await loadCalendar();
      setSelectedDay(day);
    } catch (err) {
      console.error('[host/calendar] save failed:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const changeMonth = (delta: number) => {
    setMonthDate((cur) => new Date(cur.getFullYear(), cur.getMonth() + delta, 1));
  };

  const fmtLong = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    return `${MONTHS[m - 1].slice(0, 3)} ${d}, ${y}`;
  };

  const disabledBtn = 'opacity-50 cursor-not-allowed';

  return (
    <HostDashboardShell active="calendar">
      <div className="flex flex-col xl:flex-row gap-6">
        {/* Calendar */}
        <div className="flex-1 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {MONTHS[month]} {year}
              </h2>
              <p className="text-sm text-gray-500">Availability and nightly rates.</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Listing picker */}
              <select
                value={listingId}
                onChange={(e) => setListingId(e.target.value)}
                disabled={loadingListings || !listings.length}
                className="max-w-[220px] px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                aria-label="Select listing"
              >
                {loadingListings ? (
                  <option>Loading…</option>
                ) : listings.length === 0 ? (
                  <option>No listings</option>
                ) : (
                  listings.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.title}
                    </option>
                  ))
                )}
              </select>
              <button
                disabled
                title="Coming soon"
                className={cn(
                  'flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-400 text-sm font-medium rounded-lg',
                  disabledBtn,
                )}
              >
                <Download className="w-4 h-4" />
                Import iCal
              </button>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button className="p-2 bg-white shadow-sm rounded-md text-blue-600" aria-label="Grid view">
                  <LayoutGrid className="w-5 h-5" />
                </button>
                <button disabled title="Coming soon" className={cn('p-2 text-gray-400', disabledBtn)} aria-label="List view">
                  <List className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center border border-gray-200 rounded-lg">
                <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-50 transition-all" aria-label="Previous month">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="w-px h-8 bg-gray-200" />
                <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-50 transition-all" aria-label="Next month">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
            {(['available', 'blocked', 'booked', 'none'] as DayStatus[]).map((s) => (
              <span key={s} className="flex items-center gap-1.5">
                <span className={cn('w-2.5 h-2.5 rounded-full', STATUS_META[s].dot)} />
                {STATUS_META[s].label}
              </span>
            ))}
          </div>

          <div className="bg-white rounded-2xl shadow-card border border-gray-200 overflow-hidden">
            <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
              {DOW.map((d) => (
                <div key={d} className="py-3 text-center text-sm font-medium text-gray-500">
                  {d}
                </div>
              ))}
            </div>

            {error ? (
              <div className="py-16 text-center">
                <p className="text-3xl mb-2">😕</p>
                <p className="text-sm text-gray-500 mb-4">Couldn&apos;t load the calendar.</p>
                <button
                  onClick={loadCalendar}
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700"
                >
                  <RotateCcw className="w-4 h-4" /> Try again
                </button>
              </div>
            ) : loading ? (
              <div className="grid grid-cols-7">
                {Array.from({ length: 35 }).map((_, i) => (
                  <div key={i} className="aspect-square border-r border-b border-gray-100 p-3">
                    <div className="h-3 w-4 bg-gray-100 rounded animate-pulse" />
                    <div className="h-3 w-8 bg-gray-100 rounded animate-pulse mt-auto" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-7">
                {Array.from({ length: leading }).map((_, i) => (
                  <div key={`b${i}`} className="aspect-square bg-gray-50/50 border-r border-b border-gray-100" />
                ))}
                {days.map((d) => {
                  const meta = STATUS_META[d.status];
                  const isSel = selectedDay === d.dateStr;
                  return (
                    <button
                      key={d.dateStr}
                      onClick={() => setSelectedDay(d.dateStr)}
                      className={cn(
                        'aspect-square p-3 border-r border-b border-gray-100 flex flex-col text-left transition-colors relative',
                        meta.cell,
                        isSel && 'ring-2 ring-blue-500 ring-inset z-10',
                      )}
                    >
                      <span className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{d.day}</span>
                        <span className={cn('w-2 h-2 rounded-full', meta.dot)} />
                      </span>
                      <span className={cn('mt-auto font-bold text-xs', meta.text)}>
                        {d.status === 'booked'
                          ? 'Booked'
                          : d.price != null && d.status !== 'blocked'
                            ? inr(d.price, d.currency)
                            : d.status === 'blocked'
                              ? 'Blocked'
                              : '—'}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Details panel */}
        <aside className="w-full xl:w-96 shrink-0">
          <div className="sticky top-24 space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-card border border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 mb-6">Day Details</h3>

              {selected ? (
                <>
                  <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="flex items-center gap-3 mb-1">
                      <CalendarDays className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-bold text-gray-800">{fmtLong(selected.dateStr)}</span>
                    </div>
                    <p className="text-xs text-gray-500 ml-8 flex items-center gap-1.5">
                      <span className={cn('w-2 h-2 rounded-full', STATUS_META[selected.status].dot)} />
                      {STATUS_META[selected.status].label}
                      {selected.guest ? ` · ${selected.guest}` : ''}
                    </p>
                  </div>

                  {selected.status === 'booked' ? (
                    // Booked days are read-only — can't re-price or block a reserved night.
                    <>
                      <div className="space-y-4 mb-6">
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-sm text-gray-500">Nightly rate</span>
                          <span className="text-sm font-bold text-gray-800">
                            {selected.price != null ? inr(selected.price, selected.currency) : 'Not set'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="text-sm text-gray-500">Status</span>
                          <span className="text-sm font-bold text-blue-600 flex items-center gap-1.5">
                            <BedDouble className="w-4 h-4" /> Booked
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 text-center">
                        Booked nights can&apos;t be edited.
                      </p>
                    </>
                  ) : (
                    <>
                      {/* Nightly rate (editable) */}
                      <div className="space-y-2 mb-5">
                        <label className="block text-sm text-gray-500">Nightly rate</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                          <input
                            type="number"
                            min={0}
                            value={priceInput}
                            onChange={(e) => setPriceInput(e.target.value)}
                            placeholder="0"
                            className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                          />
                        </div>
                      </div>

                      {/* Availability toggle */}
                      <div className="space-y-2 mb-6">
                        <label className="block text-sm text-gray-500">Availability</label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setAvailInput(true)}
                            className={cn(
                              'flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-bold transition-all',
                              availInput
                                ? 'border-green-600 bg-green-600 text-white shadow-md'
                                : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50',
                            )}
                          >
                            <CheckCircle2 className="w-4 h-4" /> Open
                          </button>
                          <button
                            type="button"
                            onClick={() => setAvailInput(false)}
                            className={cn(
                              'flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-bold transition-all',
                              !availInput
                                ? 'border-gray-700 bg-gray-700 text-white shadow-md'
                                : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50',
                            )}
                          >
                            <Ban className="w-4 h-4" /> Block
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={handleSaveDay}
                        disabled={saving}
                        className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                        {saving ? 'Saving…' : 'Save changes'}
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className="py-10 text-center text-sm text-gray-400">
                  Select a date to see its rate and availability.
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-card">
              <div className="flex items-center gap-3 mb-4">
                <Info className="w-5 h-5 text-blue-600" />
                <h4 className="font-bold text-gray-800">Tips for Hosts</h4>
              </div>
              <ul className="space-y-3 text-sm text-gray-500 list-disc pl-5">
                <li>Open more dates to increase your visibility in search.</li>
                <li>Weekend rates can be 15–20% higher than weekdays.</li>
                <li>Sync your iCal to avoid double bookings.</li>
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </HostDashboardShell>
  );
}
