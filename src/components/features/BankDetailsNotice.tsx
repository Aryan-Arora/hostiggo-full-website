import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Shown wherever a host enters bank / PAN details (KYC form, Settings ->
 * Payouts). Bank verification and Razorpay payouts both match the name on
 * the account against the PAN, so a mismatch is the most common reason a
 * payout gets held -- and once released, the credit timing is the bank's.
 */
export default function BankDetailsNotice({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex items-start gap-2.5 rounded-xl border border-figma-navy/10 bg-figma-navy/5 px-3.5 py-3',
        className,
      )}
    >
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-figma-navy" />
      <div className="space-y-1 text-xs leading-relaxed text-gray-600">
        <p>
          <span className="font-semibold text-gray-800">Keep your details consistent.</span> Your full
          name and PAN must exactly match the details registered with your bank account. A mismatch can
          cause verification to fail or payouts to be held.
        </p>
        <p>
          Once a payout is released, some banks take longer than others to credit it to your account
          -- each bank processes payments at its own pace.
        </p>
      </div>
    </div>
  );
}
