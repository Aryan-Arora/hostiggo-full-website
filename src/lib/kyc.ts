// Tracks, per userId, whether this browser has already submitted KYC -- so a
// returning user isn't sent through the form again every time they sign in.
// Mirrors the "hostiggo:*" localStorage convention already used for auth
// state in src/lib/api.ts.
const kycFlagKey = (userId: string) => `hostiggo:kyc:${userId}`;
// Keys written before KYC became PAN-only. Read once and migrated so
// existing users keep their submitted / deferred state.
const legacyFlagKey = (userId: string) => `hostiggo:aadhaar-kyc:${userId}`;
const legacyDeferKey = (userId: string) => `hostiggo:aadhaar-kyc-deferred:${userId}`;

function readMigrated(key: string, legacyKey: string): boolean {
  if (window.localStorage.getItem(key) === '1') return true;
  if (window.localStorage.getItem(legacyKey) !== '1') return false;
  window.localStorage.setItem(key, '1');
  window.localStorage.removeItem(legacyKey);
  return true;
}

export function hasSubmittedKyc(userId: string): boolean {
  if (typeof window === 'undefined') return false;
  return readMigrated(kycFlagKey(userId), legacyFlagKey(userId));
}

export function markKycSubmitted(userId: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(kycFlagKey(userId), '1');
  // A real submission always wins -- clear any "do it later" deferral.
  clearKycDeferral(userId);
}

// "Do KYC verification later" -- KYC is optional, so this is a *persistent*
// localStorage flag, not a per-attempt one: once a host chooses to defer,
// the listing flow never interrupts them for it again. They can still
// complete verification whenever they want from Host Settings -> Identity
// Verification (which links to /kyc), and doing so clears this via
// markKycSubmitted().
const kycDeferKey = (userId: string) => `hostiggo:kyc-deferred:${userId}`;

export function hasDeferredKyc(userId: string): boolean {
  if (typeof window === 'undefined') return false;
  return readMigrated(kycDeferKey(userId), legacyDeferKey(userId));
}

export function deferKyc(userId: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(kycDeferKey(userId), '1');
}

export function clearKycDeferral(userId: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(kycDeferKey(userId));
  window.localStorage.removeItem(legacyDeferKey(userId));
}
