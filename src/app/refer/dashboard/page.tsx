import { redirect } from 'next/navigation';

// This page used to show a full fake referral dashboard -- a hardcoded
// referral code, fabricated earnings, a fake reward history table, and
// several buttons (Invite Now, Redeem Credits, Filter, Export) with no
// handlers -- none of it backed by anything real, since no referral system
// exists in the schema yet (see the comment in src/app/refer/page.tsx).
// It also wasn't linked from anywhere, just reachable by URL. Redirecting
// to the honest "coming soon" /refer page instead of keeping this alive.
export default function ReferDashboardRedirect() {
  redirect('/refer');
}
