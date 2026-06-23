'use client';

import {
  Download,
  Wallet,
  Clock,
  ReceiptText,
  ArrowRight,
  TrendingUp,
  Landmark,
} from 'lucide-react';
import HostDashboardShell, { DashboardHeading } from '../_components/HostDashboardShell';
import { cn } from '@/lib/utils';

const BREAKDOWN = [
  { label: 'Stay Revenue', value: '$12,400.00', dot: 'bg-blue-600' },
  { label: 'Add-on Services', value: '$1,250.50', dot: 'bg-sky-400' },
  { label: 'Referrals', value: '$635.00', dot: 'bg-gray-300' },
];

const UPCOMING = [
  { icon: Clock, title: 'Scheduled Payout', date: 'Due Sept 24, 2024', amount: '$2,450.00', tag: 'Queued', tagClass: 'bg-blue-50 text-blue-600' },
  { icon: ReceiptText, title: 'Referral Bonus', date: 'Due Oct 02, 2024', amount: '$150.00', tag: 'Pending', tagClass: 'bg-sky-50 text-sky-600' },
];

const HISTORY = [
  { id: '#PAY-992104', date: 'Sept 12, 2024', dest: 'Chase Bank (****4492)', amount: '$3,120.00', status: 'Credited' },
  { id: '#PAY-992087', date: 'Aug 28, 2024', dest: 'Chase Bank (****4492)', amount: '$2,780.00', status: 'Credited' },
  { id: '#PAY-991950', date: 'Aug 14, 2024', dest: 'Chase Bank (****4492)', amount: '$1,940.00', status: 'Credited' },
];

// 12-month revenue series for the area chart.
const SERIES = [22, 30, 26, 38, 35, 48, 42, 58, 50, 44, 52, 60];

function AreaChart() {
  const w = 560;
  const h = 220;
  const max = Math.max(...SERIES);
  const pts = SERIES.map((v, i) => {
    const x = (i / (SERIES.length - 1)) * w;
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
  return (
    <HostDashboardShell active="earnings">
      <DashboardHeading
        title="Financial Overview"
        subtitle="Track your revenue and manage upcoming payouts across all properties."
        actions={
          <>
            <button className="px-4 py-2 border border-gray-200 rounded-full text-sm font-medium flex items-center gap-2 hover:bg-gray-50 transition-all">
              <Download className="w-4 h-4" />
              Export Statement
            </button>
            <button className="px-6 py-2 bg-blue-600 text-white rounded-full text-sm font-semibold shadow-md hover:bg-blue-700 transition-all">
              Withdraw Funds
            </button>
          </>
        }
      />

      <div className="grid grid-cols-12 gap-6">
        {/* Total earnings */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded-2xl p-6 border border-gray-200 shadow-card relative overflow-hidden">
          <div className="flex justify-between items-start mb-6">
            <span className="p-3 bg-blue-50 text-blue-600 rounded-xl inline-flex">
              <Wallet className="w-6 h-6" />
            </span>
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <span className="text-green-600 font-bold">+12%</span> vs last month
            </span>
          </div>
          <p className="text-xs text-gray-500 uppercase tracking-wider">Total Earnings</p>
          <h2 className="text-4xl font-bold text-gray-900 mb-8 tracking-tight">$14,285.50</h2>
          <div className="space-y-4">
            {BREAKDOWN.map((b) => (
              <div key={b.label} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className={cn('w-2 h-2 rounded-full', b.dot)} />
                  <span className="text-sm text-gray-500">{b.label}</span>
                </div>
                <span className="text-sm font-bold text-gray-800">{b.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div className="col-span-12 lg:col-span-8 bg-white rounded-2xl p-6 border border-gray-200 shadow-card">
          <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-800">Revenue Growth</h3>
              <p className="text-xs text-gray-500">Projected vs actual earnings this fiscal year</p>
            </div>
            <div className="flex p-1 bg-gray-100 rounded-xl">
              <button className="px-4 py-1.5 rounded-lg text-xs font-bold bg-white shadow-sm text-blue-600">
                Monthly
              </button>
              <button className="px-4 py-1.5 rounded-lg text-xs text-gray-500 hover:text-gray-800">
                Yearly
              </button>
            </div>
          </div>
          <AreaChart />
          <div className="flex justify-between mt-4 px-1 text-xs text-gray-400">
            {['Jan', 'Mar', 'May', 'Jul', 'Sep', 'Nov'].map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>
        </div>

        {/* Upcoming */}
        <div className="col-span-12 md:col-span-5 lg:col-span-4 bg-white rounded-2xl p-6 border border-gray-200 shadow-card flex flex-col">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Upcoming</h3>
          <div className="space-y-4 flex-1">
            {UPCOMING.map((u) => {
              const Icon = u.icon;
              return (
                <div
                  key={u.title}
                  className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-center gap-4 hover:border-blue-200 transition-colors"
                >
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-800">{u.title}</p>
                    <p className="text-xs text-gray-500">{u.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-blue-600">{u.amount}</p>
                    <span className={cn('text-[10px] px-2 py-0.5 rounded-full uppercase font-bold', u.tagClass)}>
                      {u.tag}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <a href="#" className="mt-6 text-center text-blue-600 font-bold text-sm flex items-center justify-center gap-1 hover:underline">
            View All Scheduled Items <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        {/* Performance */}
        <div className="col-span-12 md:col-span-7 lg:col-span-8 bg-white rounded-2xl p-6 border border-gray-200 shadow-card flex items-center">
          <div className="max-w-md">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Performance by Unit</h3>
            <p className="text-sm text-gray-500 mb-6">
              Your highest performing property this month is &apos;Azure Beachfront Villa&apos;.
            </p>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 rounded-full">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-bold text-gray-800">+24% revenue</p>
                <p className="text-xs text-gray-500">Compared to portfolio average</p>
              </div>
            </div>
          </div>
        </div>

        {/* History */}
        <div className="col-span-12 bg-white rounded-2xl p-6 border border-gray-200 shadow-card overflow-x-auto">
          <div className="flex justify-between items-center mb-6 px-1">
            <h3 className="text-lg font-bold text-gray-800">Payout History</h3>
          </div>
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-200">
                {['Transaction ID', 'Date', 'Destination', 'Amount', 'Status'].map((th, i) => (
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
              {HISTORY.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-5 px-4 text-sm text-gray-800 font-mono">{r.id}</td>
                  <td className="py-5 px-4 text-sm text-gray-500">{r.date}</td>
                  <td className="py-5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center text-gray-600">
                        <Landmark className="w-4 h-4" />
                      </div>
                      <span className="text-sm text-gray-800">{r.dest}</span>
                    </div>
                  </td>
                  <td className="py-5 px-4 text-right font-bold text-gray-800">{r.amount}</td>
                  <td className="py-5 px-4 text-center">
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[11px] font-bold uppercase">
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </HostDashboardShell>
  );
}
