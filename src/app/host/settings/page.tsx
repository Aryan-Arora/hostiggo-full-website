'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  User,
  Landmark,
  Shield,
  MessageSquareText,
  LifeBuoy,
  Pencil,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  Key,
  Activity,
  ChevronRight,
  Mail,
  ShieldAlert,
  HelpCircle,
  type LucideIcon,
} from 'lucide-react';
import HostDashboardShell, { DashboardHeading } from '../_components/HostDashboardShell';
import { useAuth } from '@/context/AuthContext';
import { useKycStatus } from '@/hooks/useKycStatus';
import BankDetailsNotice from '@/components/features/BankDetailsNotice';
import KycModal from '@/components/features/KycModal';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

const NAV: { id: string; label: string; icon: LucideIcon }[] = [
  { id: 'personal', label: 'Personal Info', icon: User },
  { id: 'payouts', label: 'Payouts & Taxes', icon: Landmark },
  { id: 'security', label: 'Login & Security', icon: Shield },
  { id: 'feedback', label: 'Feedback', icon: MessageSquareText },
  { id: 'support', label: 'Support', icon: LifeBuoy },
];

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  avatar: string;
  about: string;
  isVerified: boolean;
  stats: {
    rating: number | string;
    reviews: number;
    listings: number;
  };
}

function SettingsLinkRow({
  href,
  icon: Icon,
  title,
  desc,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  desc: string;
}) {
  return (
    <Link href={href} className="flex items-center gap-4 p-6 hover:bg-gray-50 transition-colors">
      <div className="w-11 h-11 rounded-xl bg-figma-navy/5 flex items-center justify-center text-figma-navy shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-bold text-gray-800">{title}</h3>
        <p className="text-sm text-gray-500">{desc}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
    </Link>
  );
}

function VerifiedBadge({ ok, label }: { ok: boolean; label?: string }) {
  return ok ? (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
      <CheckCircle2 className="w-3 h-3" /> Verified
    </span>
  ) : (
    <span className="inline-flex items-center text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
      {label ?? 'Not verified'}
    </span>
  );
}

export default function HostSettingsPage() {
  const { userId } = useAuth();
  const { status: kycStatus, refresh: refreshKyc } = useKycStatus();
  const [kycModalOpen, setKycModalOpen] = useState(false);
  const [tab, setTab] = useState('personal');
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [about, setAbout] = useState('');
  const [saving, setSaving] = useState(false);

  // Payouts & Taxes tab.
  const [payoutMethod, setPayoutMethod] = useState<Awaited<
    ReturnType<typeof api.getPayoutMethod>
  > | null>(null);
  const [loadingPayoutMethod, setLoadingPayoutMethod] = useState(true);
  const [editingPayoutMethod, setEditingPayoutMethod] = useState(false);
  const [payoutForm, setPayoutForm] = useState({
    accountHolderName: '',
    bankAccountNumber: '',
    bankIfsc: '',
    panNumber: '',
    addressLine1: '',
    city: '',
    state: '',
    postalCode: '',
  });
  const [savingPayoutMethod, setSavingPayoutMethod] = useState(false);

  const loadPayoutMethod = async () => {
    setLoadingPayoutMethod(true);
    try {
      const data = await api.getPayoutMethod();
      setPayoutMethod(data);
      setEditingPayoutMethod(!data);
    } catch (err) {
      console.error('[host/settings] payout method load failed:', err);
    } finally {
      setLoadingPayoutMethod(false);
    }
  };

  useEffect(() => {
    loadPayoutMethod();
  }, []);

  const handleSavePayoutMethod = async () => {
    setSavingPayoutMethod(true);
    try {
      // Send only what actually changed -- untouched fields (and a blank
      // account number / PAN, meaning "keep what's on file") are omitted.
      const f = payoutForm;
      const m = payoutMethod;
      const diff: Parameters<typeof api.updatePayoutMethod>[0] = {};
      if (f.accountHolderName.trim() && f.accountHolderName.trim() !== m?.account_holder_name)
        diff.accountHolderName = f.accountHolderName.trim();
      if (f.bankAccountNumber) diff.bankAccountNumber = f.bankAccountNumber;
      if (f.bankIfsc && f.bankIfsc !== m?.bank_ifsc) diff.bankIfsc = f.bankIfsc;
      if (f.panNumber && f.panNumber !== m?.pan_number) diff.panNumber = f.panNumber;
      if (f.addressLine1.trim() !== (m?.address_line1 ?? '') && (m || f.addressLine1.trim()))
        diff.addressLine1 = f.addressLine1.trim();
      if (f.city.trim() !== (m?.city ?? '') && (m || f.city.trim())) diff.city = f.city.trim();
      if (f.state.trim() !== (m?.state ?? '') && (m || f.state.trim())) diff.state = f.state.trim();
      if (f.postalCode !== (m?.postal_code ?? '') && (m || f.postalCode)) diff.postalCode = f.postalCode;

      if (Object.keys(diff).length === 0) {
        toast.info('No changes to save.');
        setEditingPayoutMethod(false);
        return;
      }
      await api.updatePayoutMethod(diff);
      toast.success('Saved. Any bank or PAN change was verified with SurePass.');
      await loadPayoutMethod();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save payout details.');
    } finally {
      setSavingPayoutMethod(false);
    }
  };

  const loadProfile = async () => {
    if (!userId) return;
    setLoadingProfile(true);
    try {
      const res = await fetch(`/api/host/profile-info?userId=${encodeURIComponent(userId)}`);
      if (!res.ok) throw new Error(`Failed to fetch profile: ${res.status}`);
      const json = await res.json();
      setProfile(json.data);
      setName(json.data.name ?? '');
      setEmail(json.data.email ?? '');
      setPhone(json.data.phone ?? '');
      setAbout(json.data.about ?? '');
    } catch (err) {
      console.error('[host/settings] load failed:', err);
      toast.error('Could not load your profile.');
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      await Promise.all([
        api.updateProfile(userId, { name, email, phone }),
        fetch('/api/host/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, about: about.trim() }),
        }).then((res) => {
          if (!res.ok) throw new Error('Failed to save about section');
        }),
      ]);
      toast.success('Profile updated.');
      await loadProfile();
    } catch (err) {
      console.error('[host/settings] save failed:', err);
      toast.error(err instanceof Error ? err.message : 'Could not save your profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loadingProfile) {
    return (
      <HostDashboardShell active="settings">
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-figma-navy" />
        </div>
      </HostDashboardShell>
    );
  }

  return (
    <HostDashboardShell active="settings">
      <DashboardHeading
        title="Account Settings"
        subtitle="Manage your host profile, security preferences, and financial information."
      />

      <div className="flex flex-col md:flex-row gap-6">
        {/* Settings nav */}
        <div className="w-full md:w-64 shrink-0">
          <div className="bg-white rounded-2xl p-2 shadow-card border border-gray-200">
            <nav className="flex flex-col space-y-1">
              {NAV.map((n) => {
                const Icon = n.icon;
                const on = tab === n.id;
                return (
                  <button
                    key={n.id}
                    onClick={() => setTab(n.id)}
                    className={cn(
                      'flex items-center justify-between px-4 py-3 rounded-xl transition-all text-sm',
                      on
                        ? 'bg-figma-navy text-white font-semibold'
                        : 'text-gray-500 hover:bg-gray-100',
                    )}
                  >
                    <span>{n.label}</span>
                    <Icon className="w-4 h-4" />
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-6">
          {tab === 'personal' && (loadingProfile ? (
            <div className="bg-white rounded-2xl p-16 shadow-card border border-gray-200 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <>
              {/* Profile header */}
              <div className="bg-white rounded-2xl p-6 shadow-card border border-gray-200">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="relative">
                    <Image
                      width={128}
                      height={128}
                      src={profile?.avatar || 'https://i.pravatar.cc/200?img=45'}
                      alt={profile?.name || 'Host'}
                      className="w-32 h-32 rounded-3xl object-cover ring-4 ring-gray-100 shadow"
                    />
                    <button
                      disabled
                      title="Photo upload coming soon"
                      className="absolute -bottom-2 -right-2 bg-figma-navy/70 text-white p-2 rounded-xl shadow-md cursor-not-allowed"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-center sm:text-left">
                    <h2 className="text-xl font-bold text-gray-800">{profile?.name}</h2>
                    <p className="text-sm text-gray-500 mb-4">Hosting since {new Date().getFullYear()}</p>
                    <div className="flex items-center gap-6 justify-center sm:justify-start">
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-800">
                          {typeof profile?.stats.rating === 'string'
                            ? profile.stats.rating
                            : profile?.stats.rating?.toFixed(1) ?? 'N/A'}
                        </p>
                        <p className="text-xs text-gray-400 uppercase tracking-wider">Rating</p>
                      </div>
                      <div className="w-px h-10 bg-gray-200" />
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-800">{profile?.stats.reviews ?? 0}</p>
                        <p className="text-xs text-gray-400 uppercase tracking-wider">Reviews</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fields */}
              <div className="bg-white rounded-2xl p-6 shadow-card border border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 mb-6">Personal Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500 ml-1">Legal Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-figma-navy focus:border-transparent outline-none text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500 ml-1">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-figma-navy focus:border-transparent outline-none text-sm"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-bold text-gray-500 ml-1">
                      Bio / Host Description
                    </label>
                    <textarea
                      rows={4}
                      value={about}
                      onChange={(e) => setAbout(e.target.value)}
                      placeholder="Tell guests a bit about yourself as a host."
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-figma-navy focus:border-transparent outline-none text-sm resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500 ml-1">Phone Number</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-figma-navy focus:border-transparent outline-none text-sm"
                    />
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-8 py-3 bg-figma-navy text-white rounded-xl font-bold hover:bg-figma-navy/90 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {saving ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </>
          ))}

          {tab === 'payouts' && (
            <>
              <div className="bg-white rounded-2xl p-6 shadow-card border border-gray-200">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">Payout Methods</h3>
                    <p className="text-sm text-gray-500">
                      Manage how you receive your hosting earnings.
                    </p>
                  </div>
                  {!editingPayoutMethod && payoutMethod && (
                    <button
                      onClick={() => {
                        setPayoutForm({
                          accountHolderName: payoutMethod.account_holder_name,
                          bankAccountNumber: '', // never re-shown in full; re-enter to change
                          bankIfsc: payoutMethod.bank_ifsc,
                          panNumber: payoutMethod.pan_number,
                          addressLine1: payoutMethod.address_line1,
                          city: payoutMethod.city,
                          state: payoutMethod.state,
                          postalCode: payoutMethod.postal_code,
                        });
                        setEditingPayoutMethod(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                    >
                      <Pencil className="w-4 h-4" /> Update details
                    </button>
                  )}
                </div>

                {loadingPayoutMethod ? (
                  <div className="p-8 flex justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  </div>
                ) : !editingPayoutMethod && payoutMethod ? (
                  <div className="space-y-4">
                    <div className="p-5 rounded-xl border border-gray-200 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-0.5">Account holder</p>
                        <p className="text-sm font-medium text-gray-900">{payoutMethod.account_holder_name}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-0.5">Bank account</p>
                        <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                          {payoutMethod.bank_account_number}
                          <VerifiedBadge ok={payoutMethod.verification.bank.verified} />
                        </p>
                        {payoutMethod.bank_name && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {payoutMethod.bank_name}
                            {payoutMethod.bank_branch ? `, ${payoutMethod.bank_branch}` : ''}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-0.5">IFSC</p>
                        <p className="text-sm font-medium text-gray-900">{payoutMethod.bank_ifsc}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-0.5">PAN</p>
                        <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                          {payoutMethod.pan_number ||
                            payoutMethod.verification.pan.maskedPan ||
                            'Not added'}
                          {(payoutMethod.pan_number || payoutMethod.verification.pan.maskedPan) && (
                            <VerifiedBadge ok={payoutMethod.verification.pan.verified} />
                          )}
                        </p>
                      </div>
                      {payoutMethod.upi_id && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-0.5">UPI</p>
                          <p className="text-sm font-medium text-gray-900">{payoutMethod.upi_id}</p>
                        </div>
                      )}
                      <div className="col-span-2">
                        <p className="text-xs font-semibold text-gray-500 mb-0.5">Address</p>
                        <p className="text-sm font-medium text-gray-900">
                          {[payoutMethod.address_line1, payoutMethod.city, payoutMethod.state, payoutMethod.postal_code]
                            .filter(Boolean)
                            .join(', ')}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setKycModalOpen(true)}
                      className="text-xs font-bold text-figma-navy hover:underline"
                    >
                      Update PAN / bank verification
                    </button>
                    <div className="flex items-center gap-2 p-4 rounded-xl bg-amber-50 border border-amber-200">
                      <Landmark className="w-4 h-4 text-amber-600 shrink-0" />
                      <p className="text-xs text-amber-800">
                        {payoutMethod.status === 'submitted' &&
                          "Your details are saved. We're setting up automatic payouts and will notify you once this account is ready to receive money."}
                        {payoutMethod.status === 'onboarding' &&
                          'Your payout account is being verified.'}
                        {payoutMethod.status === 'active' &&
                          'This account is active and ready to receive payouts. Once a payout is released, your bank may take some time to credit it.'}
                        {payoutMethod.status === 'rejected' &&
                          'This account could not be verified -- please review and resubmit your details.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-xs font-bold text-gray-500 mb-1">
                          Account holder name (exactly as on your bank account and PAN)
                        </label>
                        <input
                          type="text"
                          value={payoutForm.accountHolderName}
                          onChange={(e) =>
                            setPayoutForm((f) => ({ ...f, accountHolderName: e.target.value }))
                          }
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-figma-navy/40 focus:ring-2 focus:ring-figma-navy/10 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">
                          Bank account number
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={payoutForm.bankAccountNumber}
                          onChange={(e) =>
                            setPayoutForm((f) => ({
                              ...f,
                              bankAccountNumber: e.target.value.replace(/\D/g, ''),
                            }))
                          }
                          placeholder={payoutMethod ? 'Re-enter to change' : undefined}
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-figma-navy/40 focus:ring-2 focus:ring-figma-navy/10 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">IFSC code</label>
                        <input
                          type="text"
                          value={payoutForm.bankIfsc}
                          onChange={(e) =>
                            setPayoutForm((f) => ({ ...f, bankIfsc: e.target.value.toUpperCase() }))
                          }
                          placeholder="HDFC0001234"
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-figma-navy/40 focus:ring-2 focus:ring-figma-navy/10 transition-all uppercase"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">
                          PAN{' '}
                          {kycStatus === 'verified' && (
                            <span className="font-normal text-gray-400">
                              (optional -- your identity is already verified)
                            </span>
                          )}
                        </label>
                        <input
                          type="text"
                          value={payoutForm.panNumber}
                          onChange={(e) =>
                            setPayoutForm((f) => ({ ...f, panNumber: e.target.value.toUpperCase() }))
                          }
                          placeholder="ABCDE1234F"
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-figma-navy/40 focus:ring-2 focus:ring-figma-navy/10 transition-all uppercase"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Postal code</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={payoutForm.postalCode}
                          onChange={(e) =>
                            setPayoutForm((f) => ({
                              ...f,
                              postalCode: e.target.value.replace(/\D/g, '').slice(0, 6),
                            }))
                          }
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-figma-navy/40 focus:ring-2 focus:ring-figma-navy/10 transition-all"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-bold text-gray-500 mb-1">Address</label>
                        <input
                          type="text"
                          value={payoutForm.addressLine1}
                          onChange={(e) =>
                            setPayoutForm((f) => ({ ...f, addressLine1: e.target.value }))
                          }
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-figma-navy/40 focus:ring-2 focus:ring-figma-navy/10 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">City</label>
                        <input
                          type="text"
                          value={payoutForm.city}
                          onChange={(e) => setPayoutForm((f) => ({ ...f, city: e.target.value }))}
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-figma-navy/40 focus:ring-2 focus:ring-figma-navy/10 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">State</label>
                        <input
                          type="text"
                          value={payoutForm.state}
                          onChange={(e) => setPayoutForm((f) => ({ ...f, state: e.target.value }))}
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-figma-navy/40 focus:ring-2 focus:ring-figma-navy/10 transition-all"
                        />
                      </div>
                    </div>

                    <BankDetailsNotice />

                    <div className="flex items-center gap-2 p-4 rounded-xl bg-figma-navy/5 border border-figma-navy/10">
                      <Landmark className="w-4 h-4 text-figma-navy shrink-0" />
                      <p className="text-xs text-gray-600">
                        Changing your bank account or PAN re-checks it with SurePass before saving.
                        Already-verified details don&apos;t need to be re-entered -- leave the account
                        number or PAN blank to keep what&apos;s on file.
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleSavePayoutMethod}
                        disabled={savingPayoutMethod}
                        className="px-6 py-2.5 bg-figma-navy text-white rounded-xl font-bold hover:bg-figma-navy/90 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {savingPayoutMethod && <Loader2 className="w-4 h-4 animate-spin" />}
                        {savingPayoutMethod ? 'Saving…' : 'Save changes'}
                      </button>
                      {payoutMethod && (
                        <button
                          onClick={() => setEditingPayoutMethod(false)}
                          className="px-6 py-2.5 text-gray-600 font-bold hover:bg-gray-50 rounded-xl transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-card border border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-full bg-figma-navy/5 flex items-center justify-center text-figma-navy">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-800">Identity Verification</h3>
                    <p className="text-sm text-gray-500">
                      {profile?.isVerified || kycStatus === 'verified'
                        ? 'Your identity has been successfully verified.'
                        : kycStatus === 'pending'
                          ? 'Your documents are in -- verification is in progress.'
                          : kycStatus === 'rejected'
                            ? 'We could not verify your last submission. Please double-check your PAN and re-submit.'
                            : 'Optional. Verified hosts get more guest trust and bookings.'}
                    </p>
                  </div>
                </div>
                {profile?.isVerified || kycStatus === 'verified' ? (
                  <span className="flex items-center gap-2 font-bold text-green-600">
                    <CheckCircle2 className="w-5 h-5" /> Verified
                  </span>
                ) : kycStatus === 'pending' ? (
                  <span className="flex items-center gap-2 font-bold text-gray-400">
                    <CheckCircle2 className="w-5 h-5" /> Pending
                  </span>
                ) : (
                  <Link
                    href="/kyc?redirect=/host/settings"
                    className="px-5 py-2.5 bg-figma-navy text-white rounded-xl font-bold hover:bg-figma-navy/90 active:scale-95 transition-all whitespace-nowrap"
                  >
                    {kycStatus === 'rejected' ? 'Re-verify' : 'Verify now'}
                  </Link>
                )}
              </div>
            </>
          )}

          {tab === 'security' && (
            <div className="bg-white rounded-2xl shadow-card border border-gray-200 divide-y divide-gray-100 overflow-hidden">
              <SettingsLinkRow
                href="/account/password"
                icon={Key}
                title="Password & Security"
                desc="Set or change the password used to sign in with your email."
              />
              <SettingsLinkRow
                href="/account/login-activity"
                icon={Activity}
                title="Login Activity"
                desc="Review recent sign-ins to your account."
              />
            </div>
          )}

          {tab === 'feedback' && (
            <div className="bg-white rounded-2xl shadow-card border border-gray-200 divide-y divide-gray-100 overflow-hidden">
              <SettingsLinkRow
                href="/support"
                icon={MessageSquareText}
                title="Share feedback"
                desc="Report an issue, suggest an improvement, or share your hosting experience."
              />
            </div>
          )}

          {tab === 'support' && (
            <div className="bg-white rounded-2xl shadow-card border border-gray-200 divide-y divide-gray-100 overflow-hidden">
              <SettingsLinkRow
                href="/contact"
                icon={Mail}
                title="Contact us"
                desc="Reach our support team for booking, payment, or account questions."
              />
              <SettingsLinkRow
                href="/report-issue"
                icon={LifeBuoy}
                title="Report an issue"
                desc="Something not working right? Let us know the details."
              />
              <SettingsLinkRow
                href="/safety"
                icon={ShieldAlert}
                title="Safety information"
                desc="How Hostiggo keeps hosts and guests safe."
              />
              <SettingsLinkRow
                href="/faq"
                icon={HelpCircle}
                title="FAQs"
                desc="Answers to common questions about hosting, payouts, and bookings."
              />
            </div>
          )}
        </div>
      </div>
      {userId && (
        <KycModal
          open={kycModalOpen}
          userId={userId}
          defaultName={payoutMethod?.account_holder_name ?? name}
          onCompleted={() => {
            setKycModalOpen(false);
            refreshKyc();
            loadPayoutMethod();
          }}
          onSkipped={() => {
            setKycModalOpen(false);
            refreshKyc();
            loadPayoutMethod();
          }}
        />
      )}
    </HostDashboardShell>
  );
}
