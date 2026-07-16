'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Download,
  Wallet,
  Clock,
  ReceiptText,
  TrendingUp,
  Landmark,
  RotateCcw,
} from 'lucide-react';
import HostDashboardShell, { DashboardHeading } from '../_components/HostDashboardShell';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

// Bookings are instant-confirmed on creation — status_id is only ever
// 2 (confirmed) or 3 (cancelled), there is no pending/approval step.
const STATUS_CANCELLED = 3;
const STATUS_CONFIRMED = 2;

type Earn = {
  id: string;
  title: string;
  start: Date | null;
  end: Date | null;
  amount: number;
  cancelled: boolean;
  confirmed: boolean;
};

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const mapEarn = (row: any): Earn => ({
  id: String(row.booking_id),
  title: row.property?.title?.trim() || 'Booked stay',
  start: row.start_date ? new Date(row.start_date) : null,
  end: row.end_date ? new Date(row.end_date) : null,
  amount: Number(row.amount ?? 0),
  cancelled: Number(row.status_id) === STATUS_CANCELLED,
  confirmed: Number(row.status_id) === STATUS_CONFIRMED,
});

const inr = (n: number) =>
  `₹${Math.round(n).toLocaleString('en-IN')}`;

const fmtDate = (d: Date | null) =>
  d ? d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function AreaChart({ series }: { series: number[] }) {
  const w = 560;
  const h = 220;
  const max = Math.max(...series, 1);
  const pts = series.map((v, i) => {
    const x = (i / Math.max(series.length - 1, 1)) * w;
    const y = h - (v / max) * (h - 20) - 10;
    return [x, y] as const;
  });
  const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ');
  const area = `${line} L${w},${h} L0,${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[220px]" preserveAspectRatio="none">
      <defs>
        <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(37,99,235,0.18)" />
          <stop offset="100%" stopColor="rgba(37,99,235,0)" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((g) => (
        <line key={g} x1="0" y1={h * g} x2={w} y2={h * g} stroke="#eef0f3" strokeWidth="1" />
      ))}
      <path d={area} fill="url(#rev)" />
      <path d={line} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3" fill="#fff" stroke="#2563eb" strokeWidth="2" />
      ))}
    </svg>
  );
}

export default function EarningsPage() {
  const { userId } = useAuth();
  const [rows, setRows] = useState<Earn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(false);
    try {
      const data = await api.hostBookings(userId);
      setRows(data.map(mapEarn));
    } catch (err) {
      console.error('[host/earnings] load failed:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const earning = rows.filter((r) => !r.cancelled);
    const total = earning.reduce((s, r) => s + r.amount, 0);
    const confirmedRevenue = earning.filter((r) => r.confirmed).reduce((s, r) => s + r.amount, 0);
    const pendingRevenue = total - confirmedRevenue;

    // 12-month trailing series keyed by start_date month.
    const now = new Date();
    const buckets: { label: string; value: number }[] = [];
    const keyOf = (y: number, m: number) => y * 12 + m;
    const map = new Map<number, number>();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const k = keyOf(d.getFullYear(), d.getMonth());
      map.set(k, 0);
      buckets.push({ label: MONTHS[d.getMonth()], value: 0 });
    }
    earning.forEach((r) => {
      if (!r.start) return;
      const k = keyOf(r.start.getFullYear(), r.start.getMonth());
      if (map.has(k)) map.set(k, (map.get(k) || 0) + r.amount);
    });
    const orderedKeys = [...map.keys()];
    const series = orderedKeys.map((k) => map.get(k) || 0);
    const thisMonth = series[series.length - 1] || 0;
    const lastMonth = series[series.length - 2] || 0;
    const momPct = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : null;

    // Top property by revenue.
    const byProp = new Map<string, number>();
    earning.forEach((r) => byProp.set(r.title, (byProp.get(r.title) || 0) + r.amount));
    let topProp = '';
    let topVal = 0;
    byProp.forEach((v, k) => {
      if (v > topVal) {
        topVal = v;
        topProp = k;
      }
    });
    const avg = byProp.size ? total / byProp.size : 0;
    const topPct = avg > 0 ? Math.round(((topVal - avg) / avg) * 100) : 0;

    const today = startOfDay(new Date());
    const upcoming = earning
      .filter((r) => r.start && startOfDay(r.start) >= today)
      .sort((a, b) => (a.start!.getTime() - b.start!.getTime()))
      .slice(0, 4);
    const history = earning
      .filter((r) => r.end && startOfDay(r.end) < today)
      .sort((a, b) => (b.end!.getTime() - a.end!.getTime()))
      .slice(0, 8);

    return {
      total,
      confirmedRevenue,
      pendingRevenue,
      series,
      labels: buckets.map((b) => b.label),
      momPct,
      topProp,
      topPct,
      upcoming,
      history,
    };
  }, [rows]);

  return (
    <HostDashboardShell active="earnings">
      <DashboardHeading
        title="Financial Overview"
        subtitle="Track your revenue and payouts across all properties."
        actions={
          <>
            <button
              disabled
              title="Coming soon"
              className="px-4 py-2 border border-gray-200 rounded-full text-sm font-medium flex items-center gap-2 text-gray-400 cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              Export Statement
            </button>
            <button
              disabled
              title="Coming soon"
              className="px-6 py-2 bg-blue-600/60 text-white rounded-full text-sm font-semibold cursor-not-allowed"
            >
              Withdraw Funds
            </button>
          </>
        }
      />

      {loading ? (
        <div className="grid grid-cols-12 gap-6">
          {['lg:col-span-4', 'lg:col-span-8', 'lg:col-span-4', 'lg:col-span-8', 'lg:col-span-12'].map(
            (span, i) => (
              <div
                key={i}
                className={cn('col-span-12 bg-white rounded-2xl p-6 border border-gray-100 shadow-card', span)}
              >
                <div className="h-6 w-1/3 bg-gray-100 rounded animate-pulse mb-6" />
                <div className="h-32 bg-gray-50 rounded animate-pulse" />
              </div>
            ),
          )}
        </div>
      ) : error ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-card py-16 text-center">
          <p className="text-4xl mb-3">😕</p>
          <h3 className="text-lg font-bold text-gray-800 mb-1">Couldn&apos;t load earnings</h3>
          <p className="text-sm text-gray-500 mb-6">Please try again.</p>
          <button
            onClick={load}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700"
          >
            <RotateCcw className="w-4 h-4" /> Try again
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-6">
          {/* Total earnings */}
          <div className="col-span-12 lg:col-span-4 bg-white rounded-2xl p-6 border border-gray-200 shadow-card relative overflow-hidden">
            <div className="flex justify-between items-start mb-6">
              <span className="p-3 bg-blue-50 text-blue-600 rounded-xl inline-flex">
                <Wallet className="w-6 h-6" />
              </span>
              {stats.momPct !== null && (
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <span className={cn('font-bold', stats.momPct >= 0 ? 'text-green-600' : 'text-red-500')}>
                    {stats.momPct >= 0 ? '+' : ''}
                    {stats.momPct}%
                  </span>{' '}
                  vs last month
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Total Earnings</p>
            <h2 className="text-4xl font-bold text-gray-900 mb-8 tracking-tight">{inr(stats.total)}</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  <span className="text-sm text-gray-500">Confirmed revenue</span>
                </div>
                <span className="text-sm font-bold text-gray-800">{inr(stats.confirmedRevenue)}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-sky-400" />
                  <span className="text-sm text-gray-500">Pending revenue</span>
                </div>
                <span className="text-sm font-bold text-gray-800">{inr(stats.pendingRevenue)}</span>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="col-span-12 lg:col-span-8 bg-white rounded-2xl p-6 border border-gray-200 shadow-card">
            <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
              <div>
                <h3 className="text-lg font-bold text-gray-800">Revenue Growth</h3>
                <p className="text-xs text-gray-500">Revenue by month over the last year</p>
              </div>
            </div>
            <AreaChart series={stats.series} />
            <div className="flex justify-between mt-4 px-1 text-xs text-gray-400">
              {stats.labels.filter((_, i) => i % 2 === 0).map((m, i) => (
                <span key={`${m}-${i}`}>{m}</span>
              ))}
            </div>
          </div>

          {/* Upcoming */}
          <div className="col-span-12 md:col-span-5 lg:col-span-4 bg-white rounded-2xl p-6 border border-gray-200 shadow-card flex flex-col">
            <h3 className="text-lg font-bold text-gray-800 mb-6">Upcoming Payouts</h3>
            <div className="space-y-4 flex-1">
              {stats.upcoming.length === 0 ? (
                <div className="text-sm text-gray-400 py-8 text-center">No upcoming payouts.</div>
              ) : (
                stats.upcoming.map((u) => (
                  <div
                    key={u.id}
                    className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-center gap-4 hover:border-blue-200 transition-colors"
                  >
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
                      {u.confirmed ? <Clock className="w-5 h-5" /> : <ReceiptText className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-800 truncate">{u.title}</p>
                      <p className="text-xs text-gray-500">Check-in {fmtDate(u.start)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-blue-600">{inr(u.amount)}</p>
                      <span
                        className={cn(
                          'text-[10px] px-2 py-0.5 rounded-full uppercase font-bold',
                          u.confirmed ? 'bg-blue-50 text-blue-600' : 'bg-sky-50 text-sky-600',
                        )}
                      >
                        {u.confirmed ? 'Confirmed' : 'Pending'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Performance */}
          <div className="col-span-12 md:col-span-7 lg:col-span-8 bg-white rounded-2xl p-6 border border-gray-200 shadow-card flex items-center">
            <div className="max-w-md">
              <h3 className="text-lg font-bold text-gray-800 mb-2">Performance by Unit</h3>
              <p className="text-sm text-gray-500 mb-6">
                {stats.topProp
                  ? <>Your highest performing property is &apos;{stats.topProp}&apos;.</>
                  : 'No revenue recorded yet.'}
              </p>
              {stats.topProp && (
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-50 rounded-full">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">
                      {stats.topPct >= 0 ? '+' : ''}
                      {stats.topPct}% revenue
                    </p>
                    <p className="text-xs text-gray-500">Compared to portfolio average</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* History */}
          <div className="col-span-12 bg-white rounded-2xl p-6 border border-gray-200 shadow-card overflow-x-auto">
            <div className="flex justify-between items-center mb-6 px-1">
              <h3 className="text-lg font-bold text-gray-800">Recent Completed Stays</h3>
            </div>
            {stats.history.length === 0 ? (
              <div className="text-sm text-gray-400 py-10 text-center">No completed stays yet.</div>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-gray-200">
                    {['Booking', 'Checkout Date', 'Property', 'Amount', 'Status'].map((th, i) => (
                      <th
                        key={th}
                        className={cn(
                          'pb-4 text-xs uppercase tracking-widest px-4 font-semibold',
                          i === 3 && 'text-right',
                          i === 4 && 'text-center',
                        )}
                      >
                        {th}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {stats.history.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-5 px-4 text-sm text-gray-800 font-mono">#{r.id}</td>
                      <td className="py-5 px-4 text-sm text-gray-500">{fmtDate(r.end)}</td>
                      <td className="py-5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center text-gray-600">
                            <Landmark className="w-4 h-4" />
                          </div>
                          <span className="text-sm text-gray-800 truncate max-w-[200px]">{r.title}</span>
                        </div>
                      </td>
                      <td className="py-5 px-4 text-right font-bold text-gray-800">{inr(r.amount)}</td>
                      <td className="py-5 px-4 text-center">
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[11px] font-bold uppercase">
                          Completed
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </HostDashboardShell>
  );
}
