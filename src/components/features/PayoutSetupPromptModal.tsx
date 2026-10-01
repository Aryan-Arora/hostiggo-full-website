'use client';

import { Wallet } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

/**
 * Shown the moment a host's bank account is verified in the KYC form:
 * the verified bank details are already saved to their payout method, so
 * finishing payout setup (PAN + address, then the Razorpay linked account)
 * is one short form away. "Later" is a plain dismiss -- Settings -> Payouts
 * stays pre-filled whenever they come back.
 */
export default function PayoutSetupPromptModal({
  open,
  onSetupNow,
  onLater,
}: {
  open: boolean;
  onSetupNow: () => void;
  onLater: () => void;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onLater();
      }}
    >
      <DialogContent
        className="max-w-[420px] rounded-3xl p-7 bg-white"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-700 flex items-center justify-center mb-2">
            <Wallet className="w-6 h-6" />
          </div>
          <DialogTitle className="text-xl font-bold text-gray-900">Set up your payouts</DialogTitle>
          <DialogDescription className="text-sm text-gray-500 leading-relaxed">
            Your bank account is verified. Finish payout setup so your earnings are sent straight to
            this account -- we&apos;ve already filled in your verified bank details. You just need to
            add your address, plus your PAN if you verified with Aadhaar or passport.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 pt-2">
          <button
            type="button"
            onClick={onSetupNow}
            className="w-full py-3 bg-figma-navy text-white text-sm font-semibold rounded-xl hover:bg-figma-navy/90 transition-all"
          >
            Set up payouts now
          </button>
          <button
            type="button"
            onClick={onLater}
            className="w-full py-3 text-sm font-semibold text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
          >
            I&apos;ll do it later
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
