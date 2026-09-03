// Aadhaar number format validation (Verhoeff checksum -- the algorithm
// UIDAI actually uses for the 12th digit), shared between the KYC form
// (instant client-side feedback) and the API route (server-side defense in
// depth, since client validation is never trustworthy on its own).

const D = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];

const P = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

/** True if `digits` (a string of 12 digits) passes the Verhoeff checksum. */
export function isValidVerhoeff(digits: string): boolean {
  let c = 0;
  const reversed = digits.split('').reverse();
  for (let i = 0; i < reversed.length; i++) {
    const digit = Number(reversed[i]);
    if (Number.isNaN(digit)) return false;
    c = D[c][P[i % 8][digit]];
  }
  return c === 0;
}

/** Strips whitespace and validates a 12-digit Aadhaar number's shape + checksum. */
export function isValidAadhaarNumber(raw: string): boolean {
  const digits = raw.replace(/\s+/g, '');
  if (!/^\d{12}$/.test(digits)) return false;
  // UIDAI never issues numbers starting with 0 or 1.
  if (digits[0] === '0' || digits[0] === '1') return false;
  return isValidVerhoeff(digits);
}

/** Formats a 12-digit string as "XXXX XXXX XXXX" for display while typing. */
export function formatAadhaarInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 12);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
}

// Tracks, per userId, whether this browser has already submitted Aadhaar
// KYC -- so a returning user isn't sent through the form again every time
// they sign in. Mirrors the "hostiggo:*" localStorage convention already
// used for auth state in src/lib/api.ts.
const kycFlagKey = (userId: string) => `hostiggo:aadhaar-kyc:${userId}`;

export function hasSubmittedAadhaarKyc(userId: string): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(kycFlagKey(userId)) === '1';
}

export function markAadhaarKycSubmitted(userId: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(kycFlagKey(userId), '1');
  // A real submission always wins -- clear any "do it later" deferral.
  clearAadhaarKycDeferral(userId);
}

// "Do KYC verification later" -- KYC is optional, so this is a *persistent*
// localStorage flag, not a per-attempt one: once a host chooses to defer,
// the listing flow never interrupts them for it again. They can still
// complete verification whenever they want from Host Settings -> Identity
// Verification (which links to /kyc/aadhaar), and doing so clears this via
// markAadhaarKycSubmitted().
const kycDeferKey = (userId: string) => `hostiggo:aadhaar-kyc-deferred:${userId}`;

export function hasDeferredAadhaarKyc(userId: string): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(kycDeferKey(userId)) === '1';
}

export function deferAadhaarKyc(userId: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(kycDeferKey(userId), '1');
}

export function clearAadhaarKycDeferral(userId: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(kycDeferKey(userId));
  // Migrate away from the old per-session key if it's still around.
  window.sessionStorage.removeItem(`hostiggo:aadhaar-kyc-skip:${userId}`);
}
