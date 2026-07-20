# Billing module

Pure, unit-tested functions for guest checkout pricing/GST, host payouts,
cancellation refunds, and pre-checkout nightly price resolution -- plus the
Razorpay integration points and the orchestrating cancel-with-refund flow
that wire them together. No business logic for any of this lives in UI
components; every calculation is exported here.

All money is handled as integer paise internally (`money.ts`) to avoid
floating-point rounding drift; rupee values only exist at function
boundaries.

## Files

- `money.ts` -- paise/rupee conversion + rounding helpers.
- `invoice.ts` -- `calculateBookingInvoice()`, Section 1: itemized
  guest checkout breakup (property + GST, Hostiggo service fee + GST,
  breakfast + GST, other services + GST, grand total).
- `payout.ts` -- `calculateHostPayout()`, Section 3: host payout net of
  5% commission + 1% TCS + 1% TDS, computed only on property + add-ons
  (never on the service fee or any GST).
- `refund.ts` -- `calculateRefund()`, Section 4.3: single final refund
  amount for a cancelled booking under the Flexible/Moderate/Strict
  policies.
- `pricing.ts` -- Section 5: `resolveNightlyPrice()` (calendar price
  overrides base price, then the best applicable discount is applied),
  `resolveBookingSubtotal()` (sums across a stay), `validateCoupon()` /
  `applyCoupon()` (checkout-only, never affects the property card price).
- `razorpay.ts` -- thin wrapper around the `razorpay` npm SDK: order
  creation (payment capture), refunds, payouts, plus the gateway/payout fee
  calculators (Hostiggo-side costs, never shown to the guest or deducted
  from the host). Credentials read from `RAZORPAY_KEY_ID` /
  `RAZORPAY_KEY_SECRET` / `RAZORPAY_ACCOUNT_NUMBER` env vars only.
- `cancelBooking.ts` -- `cancelBookingWithRefund()`, Section 4.8: the full
  orchestrating flow (validate -> policy -> time remaining -> refund calc
  -> payout-released check -> Razorpay refund -> DB update -> calendar
  release).
- `__tests__/` -- vitest unit tests. Run with `npm test`.

## Known open items (flagged, not silently resolved)

1. **Host payout worked example mismatch -- resolved.** The source spec
   states a ₹10,788 net payout for a ₹10,000 property with no add-ons.
   The formula as specified (`payoutBase - 5% - 1% - 1%`) can only
   produce a number `<= payoutBase`, and ₹10,788 > ₹10,000 -- so the
   stated formula cannot reproduce the stated example under any reading
   of "5%/1%/1% of payoutBase". Decision: the ₹10,788 example is treated
   as an error in the source doc, and the formula is implemented exactly
   as specified (verified: reproduces ₹9,300 for the ₹10,000 case). This
   is now the confirmed, final formula.
2. **Strict policy's partial-refund percentage isn't specified anywhere**
   in the source doc for the ">= 7 days" case ("partial refund (per
   configured %)" -- no number given). Defaulted to 50%, configurable via
   `CancellationPolicyConfig.strictPartialRefundPercent`. Confirm the real
   number.
3. **Notifications (email/SMS/push) and an accounting ledger** are called
   out as TODOs in `cancelBooking.ts` -- no notification provider or
   ledger table exists anywhere in this codebase yet, so wiring real sends
   would mean guessing at a provider. The hooks are marked clearly at the
   point they'd fire.
4. **`cancelBookingWithRefund` is a new, separate endpoint**
   (`/api/bookings/cancel-with-refund`) from the existing
   `/api/bookings/cancel` (a simple status-flip with no refund logic,
   still used by the guest my-memories cancel flow). They are
   *intentionally not merged* in this pass, so the already-working simple
   flow can't regress. Switching the guest-facing UI over to the new
   refund-aware endpoint is a deliberate follow-up, once the migrations
   below have been run and this has been tested against a real Razorpay
   payment (impossible to fully verify end-to-end without live Razorpay
   credentials and a real captured payment, neither of which exist in this
   session).

## Required manual step: run the migrations

Same pattern as the earlier settings-toggles migration -- this session's DB
access is a different Supabase project than the one this app runs against,
so these need to be run manually in the Supabase SQL editor for the
`hostiggo_testing_schema` project:

1. `supabase/migrations/add_billing_cancellation_refund_fields.sql` --
   adds `bookings.razorpay_payment_id` / `refund_status` / `refund_amount` /
   `refund_reason` / `refund_transaction_id` / `cancelled_at` /
   `cancelled_by` / `policy_used` / `refund_processed_at` /
   `payout_released_at`; `listings.cancellation_policy`;
   `listing_discounts.valid_from` / `valid_to` / `min_stay_nights`.
2. `supabase/migrations/create_hostiggo_coupons_and_manual_settlement_tables.sql`
   -- creates `hostiggo_coupons` and `manual_settlement_flags` (neither
   existed before).

Until these are run, `cancelBookingWithRefund()` will fail on the columns
it can't find -- it is **not** wrapped in the same "degrade gracefully"
pattern as some earlier work this session, because a cancellation/refund
flow failing loudly is the correct behavior (silently succeeding without
actually processing a refund would be worse).

## Also required: Razorpay credentials + host fund accounts

Nothing in this module can be exercised against a real payment without:

- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` in `.env.local` (test-mode keys
  for development).
- `RAZORPAY_ACCOUNT_NUMBER` (RazorpayX business account) for payouts.
- A way to collect and store each host's Razorpay `fund_account_id` during
  onboarding/KYC -- not part of this module, and not found anywhere in the
  existing host-onboarding wizard.

None of this was available in this session, so the Razorpay calls in
`razorpay.ts` are wired correctly (real SDK, real parameter shapes,
verified against the installed SDK's TypeScript types) but have never been
executed against a real Razorpay account.
