'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { ID_DOCUMENTS, type IdDocument } from './documents';
import DocumentVerificationModal from './DocumentVerificationModal';

export default function ProfileVerificationPage() {
  const router = useRouter();
  const [selectedDoc, setSelectedDoc] = useState<IdDocument | null>(null);

  return (
    <div className="min-h-screen bg-[#fffef9]">
      <Navbar />

      <main className="container-main py-10 md:py-14">
        {/* Heading */}
        <div className="flex items-start gap-4 md:gap-5">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Go back"
            className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-gray-700 shadow-[0_4px_20px_rgba(0,0,0,0.08)] ring-1 ring-gray-100 transition-all hover:text-blue-600 hover:shadow-[0_6px_24px_rgba(0,0,0,0.12)] active:scale-95"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-[#1a1a1a] md:text-4xl">
              Profile Verification
            </h1>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-gray-500 md:text-base">
              You need to verify your profile with an official government
              identity proof
            </p>
          </div>
        </div>

        {/* Document options */}
        <div className="mt-10 w-full max-w-md space-y-4 md:ml-[60px]">
          {ID_DOCUMENTS.map((doc, index) => (
            <div key={doc.id}>
              <button
                type="button"
                onClick={() => setSelectedDoc(doc)}
                className="group flex w-full items-center gap-4 rounded-2xl border border-gray-200/70 bg-white px-5 py-4 text-left shadow-[0_4px_24px_rgba(0,0,0,0.08)] transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <span className="flex h-14 w-[72px] shrink-0 items-center justify-center">
                  <Image
                    src={doc.image}
                    alt={doc.label}
                    width={72}
                    height={56}
                    className="max-h-full max-w-full object-contain"
                  />
                </span>
                <span className="flex-1 text-[17px] font-medium text-gray-800">
                  {doc.label}
                </span>
                <ChevronRight className="h-5 w-5 shrink-0 text-gray-400 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-600" />
              </button>

              {index < ID_DOCUMENTS.length - 1 && (
                <p className="mt-4 text-center text-sm font-medium text-gray-400">
                  OR
                </p>
              )}
            </div>
          ))}
        </div>
      </main>

      <Footer />

      <DocumentVerificationModal
        doc={selectedDoc}
        onClose={() => setSelectedDoc(null)}
      />
    </div>
  );
}
