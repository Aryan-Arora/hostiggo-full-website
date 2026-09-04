'use client';

import { ShieldCheck } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AadhaarKycForm } from '@/app/kyc/aadhaar/_components/AadhaarKycForm';

/**
 * In-flow Aadhaar KYC prompt. Replaces the old full-page redirect to
 * /kyc/aadhaar when a host enters the listing flow -- same form, shown as a
 * modal over the page they were already on.
 *
 * KYC is optional, so dismissing the modal (X) is treated the same as the
 * form's "Skip for now": a permanent defer. The host dashboard banner and
 * Settings -> Identity Verification keep the reminder alive afterwards.
 */
export default function KycModal({
  open,
  userId,
  defaultName,
  onCompleted,
  onSkipped,
}: {
  open: boolean;
  userId: string;
  defaultName?: string;
  onCompleted: () => void;
  onSkipped: () => void;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onSkipped();
      }}
    >
      <DialogContent
        className="max-w-[480px] max-h-[90vh] overflow-y-auto rounded-3xl p-7"
        // Require a deliberate choice -- clicking the backdrop or hitting
        // Escape shouldn't silently dismiss identity verification.
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="w-12 h-12 rounded-2xl bg-figma-navy/10 text-figma-navy flex items-center justify-center mb-2">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <DialogTitle className="text-xl font-bold text-gray-900">
            Verify your identity
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500 leading-relaxed">
            Verified hosts earn more guest trust and bookings. It&apos;s optional and takes a
            minute — upload a photo of your Aadhaar card once. You can also finish this later
            from your host dashboard.
          </DialogDescription>
        </DialogHeader>

        <AadhaarKycForm
          userId={userId}
          defaultName={defaultName}
          onCompleted={onCompleted}
          onSkipped={onSkipped}
        />
      </DialogContent>
    </Dialog>
  );
}
