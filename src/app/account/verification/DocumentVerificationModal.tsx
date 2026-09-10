'use client';

import { useEffect, useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type { IdDocument } from './documents';

type Props = {
  doc: IdDocument | null;
  onClose: () => void;
};

export default function DocumentVerificationModal({ doc, onClose }: Props) {
  const [number, setNumber] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset the form whenever a different document is opened.
  useEffect(() => {
    setNumber('');
    setFile(null);
    setSubmitting(false);
  }, [doc?.id]);

  // Keep an object URL for the image preview and clean it up.
  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (!doc) {
    return <Dialog open={false} onOpenChange={() => onClose()} />;
  }

  const handleNumberChange = (value: string) => {
    setNumber(doc.uppercase ? value.toUpperCase() : value);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (!selected.type.startsWith('image/')) {
      toast.error('Please upload an image file.');
      return;
    }
    setFile(selected);
  };

  const canSubmit = number.trim().length > 0 && !!file && !submitting;

  const handleSubmit = () => {
    if (!canSubmit) return;
    setSubmitting(true);
    // TODO: upload `file` and `number` to the identity-verification endpoint,
    // then set the user's is_verified flag on approval.
    setTimeout(() => {
      toast.success(
        `${doc.label} submitted. Our team will review your details shortly.`,
      );
      setSubmitting(false);
      onClose();
    }, 600);
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md rounded-[28px] bg-[#fffef9] p-8 sm:rounded-[28px]">
        <DialogHeader className="text-left">
          <DialogTitle className="text-2xl font-semibold text-[#333]">
            {doc.verificationTitle}
          </DialogTitle>
          <DialogDescription className="mt-1 text-[15px] leading-relaxed text-gray-500">
            Please fill the below details so that our team can verify your
            identity
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-6">
          {/* Document number */}
          <div className="space-y-2">
            <label
              htmlFor="doc-number"
              className="block text-[17px] font-medium text-[#151515]"
            >
              {doc.numberLabel}
            </label>
            <input
              id="doc-number"
              type="text"
              inputMode={doc.inputMode}
              maxLength={doc.maxLength}
              autoComplete="off"
              value={number}
              onChange={(e) => handleNumberChange(e.target.value)}
              placeholder={doc.numberPlaceholder}
              className="h-14 w-full rounded-[15px] border border-[#a1a1a1] px-4 text-[15px] text-gray-800 outline-none transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
            />
          </div>

          {/* Upload image */}
          <div className="space-y-2">
            <p className="text-[17px] font-medium text-[#151515]">Upload image</p>
            <div className="rounded-[15px] border border-[#a1a1a1] p-4">
              {previewUrl ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="relative h-40 w-full overflow-hidden rounded-lg bg-gray-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewUrl}
                      alt={`${doc.label} preview`}
                      className="h-full w-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      aria-label="Remove image"
                      className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="max-w-full truncate text-xs text-gray-500">
                    {file?.name}
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-full border border-[#d0d0d0] bg-white px-6 py-2 text-sm font-medium text-gray-600 shadow-[0_4px_18px_rgba(0,0,0,0.12)] transition-colors hover:text-blue-600"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full flex-col items-center gap-3 py-4 text-center"
                >
                  <span className="self-start text-[15px] text-gray-400">
                    {doc.uploadPlaceholder}
                  </span>
                  <ImagePlus className="h-12 w-12 text-gray-300" strokeWidth={1.5} />
                  <span className="rounded-full border border-[#d0d0d0] bg-white px-8 py-2 text-sm font-medium text-gray-600 shadow-[0_4px_18px_rgba(0,0,0,0.12)] transition-colors hover:text-blue-600">
                    Upload
                  </span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={
              canSubmit
                ? 'h-14 w-full rounded-[25px] bg-blue-600 text-[17px] font-semibold text-white transition-colors hover:bg-blue-700 active:scale-[0.99]'
                : 'h-14 w-full cursor-not-allowed rounded-[25px] bg-[#ebebeb] text-[17px] font-semibold text-[#747474]'
            }
          >
            {submitting ? 'Submitting…' : 'Submit'}
          </button>

          <div className="text-center">
            <a
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] text-gray-500 underline underline-offset-2 hover:text-blue-600"
            >
              terms &amp; conditions
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
