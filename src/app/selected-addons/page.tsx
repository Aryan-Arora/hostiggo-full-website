'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ChevronLeft, User } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import BackButton from '@/components/ui/back-button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AddonCardData {
  id: string;
  title: string;
  price: string;
  includes: string;
  timings: string;
  borderColor: string;
  qty: number;
}

const INITIAL_ADDONS: AddonCardData[] = [
  {
    id: 'addon-1',
    title: 'Breakfast',
    price: '₹200 / person / day',
    includes: 'Home-cooked vegetarian breakfast',
    timings: '8:00am - 10:00am',
    borderColor: '#2E7D32', // Green
    qty: 1,
  },
  {
    id: 'addon-2',
    title: 'Breakfast',
    price: '₹200 / person / day',
    includes: 'Home-cooked vegetarian breakfast',
    timings: '8:00am - 10:00am',
    borderColor: '#AD4500', // Amber/Orange
    qty: 1,
  },
  {
    id: 'addon-3',
    title: 'Breakfast',
    price: '₹200 / person / day',
    includes: 'Home-cooked vegetarian breakfast',
    timings: '8:00am - 10:00am',
    borderColor: '#0019BC', // Cobalt Blue
    qty: 1,
  },
  {
    id: 'addon-4',
    title: 'Breakfast',
    price: '₹200 / person / day',
    includes: 'Home-cooked vegetarian breakfast',
    timings: '8:00am - 10:00am',
    borderColor: '#000000', // Black
    qty: 1,
  },
];

export default function SelectedAddonsPage() {
  const router = useRouter();
  const [addons, setAddons] = useState<AddonCardData[]>(INITIAL_ADDONS);

  const handleUpdateQty = (id: string, delta: number) => {
    setAddons((prev) =>
      prev.map((a) => (a.id === id ? { ...a, qty: Math.max(1, a.qty + delta) } : a))
    );
  };

  const handleRemove = (id: string) => {
    setAddons((prev) => prev.filter((a) => a.id !== id));
    toast.info('Add-on removed');
  };

  return (
    <div className="min-h-screen bg-[#FBF9F4] flex flex-col font-['Poppins'] overflow-x-hidden">
      <Navbar />

      <main className="flex-1 max-w-[1360px] mx-auto w-full px-6 sm:px-10 lg:px-14 pt-8 sm:pt-10 pb-20">
        {/* Top Header */}
        <div className="flex items-center gap-6 sm:gap-7 mb-10 sm:mb-14">
          <BackButton />
          <h1 className="text-[32px] sm:text-[42px] font-medium text-[#1A1A1A] tracking-[0.126px] leading-[1.4] select-none font-['Poppins']">
            Selected add ons
          </h1>
        </div>

        {/* Content Section */}
        <div className="flex flex-col lg:flex-row items-start justify-between gap-10 lg:gap-14 w-full">
          {/* Left Column: 2x2 Grid of Cards */}
          <div className="w-full lg:w-[680px] grid grid-cols-1 sm:grid-cols-2 gap-6 flex-shrink-0">
            {addons.map((addon) => (
              <div
                key={addon.id}
                style={{ borderColor: addon.borderColor }}
                className="w-full max-w-[324px] h-[287px] rounded-[20px] border-2 bg-white p-5 flex flex-col justify-between shadow-sm transition-all mx-auto sm:mx-0"
              >
                {/* Header */}
                <div className="flex items-center gap-3">
                  <div className="w-[80px] h-[52px] flex items-center justify-center flex-shrink-0">
                    <img
                      src="/images/empty-states/addon-sandwich.png"
                      alt={addon.title}
                      className="w-[80px] h-[50px] object-contain"
                    />
                  </div>
                  <span className="text-[20px] font-semibold text-black font-['Poppins']">
                    {addon.title}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-2 text-[13px] font-medium font-['Poppins'] text-black">
                  <div className="flex items-start justify-between">
                    <span className="text-[16px] text-black font-normal">Price</span>
                    <span className="text-black font-medium">{addon.price}</span>
                  </div>
                  <div className="flex items-start justify-between">
                    <span className="text-[16px] text-black font-normal">Includes</span>
                    <span className="text-black font-medium text-right max-w-[170px] leading-tight">
                      {addon.includes}
                    </span>
                  </div>
                  <div className="flex items-start justify-between">
                    <span className="text-[16px] text-black font-normal">Timings</span>
                    <span className="text-black font-medium">{addon.timings}</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between pt-1">
                  <div className="w-[110px] h-[34px] rounded-full border border-black/50 flex items-center justify-between px-3">
                    <button
                      type="button"
                      onClick={() => handleUpdateQty(addon.id, -1)}
                      className="text-black font-bold text-base hover:opacity-70 cursor-pointer"
                    >
                      -
                    </button>
                    <div className="flex items-center gap-1 text-black font-medium text-[15px]">
                      <User className="w-3.5 h-3.5 stroke-[2]" />
                      <span>{addon.qty}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleUpdateQty(addon.id, 1)}
                      className="text-black font-bold text-base hover:opacity-70 cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemove(addon.id)}
                    className="w-[97px] h-[34px] rounded-full border border-[#FF2D55] text-[#FF2D55] text-[14px] font-medium hover:bg-red-50 flex items-center justify-center transition-all cursor-pointer"
                  >
                    Remove
                  </button>
                </div>

                {/* Footnote */}
                <p className="text-[11px] font-medium italic text-black/80 text-center font-['Poppins']">
                  “Please Inform Dietary preferences in advance”
                </p>
              </div>
            ))}

            {addons.length === 0 && (
              <div className="col-span-full py-16 text-center text-gray-500 font-['Poppins']">
                No add-ons selected.
              </div>
            )}
          </div>

          {/* Middle: Dashed Vertical Line matching Figma Line 279 (height: 607px) */}
          <div className="hidden lg:block w-[1px] min-h-[607px] border-r-2 border-dashed border-[#707070] self-stretch mx-2 flex-shrink-0" />

          {/* Right Column: Payment Information (Figma width: 528px) */}
          <div className="w-full lg:w-[528px] flex flex-col items-start pt-2">
            <h2 className="text-[28px] sm:text-[30px] font-semibold text-[#1A1A1A] mb-8 font-['Poppins']">
              Payment information
            </h2>

            {/* Summary Card matching Figma 528x200px */}
            <div className="w-full rounded-[25px] border border-[#868686] bg-white p-7 sm:p-8 shadow-sm">
              <h3 className="text-[22px] font-bold text-black mb-6 font-['Poppins']">
                Addons
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between text-black font-['Poppins']">
                  <span className="text-[18px] sm:text-[20px] font-medium flex items-center gap-2">
                    <span className="text-black text-xl leading-none">•</span>
                    Breakfast( 2 x 3 days )
                  </span>
                  <span className="text-[22px] sm:text-[24px] font-bold">₹400</span>
                </div>

                <div className="flex items-center justify-between text-black font-['Poppins']">
                  <span className="text-[18px] sm:text-[20px] font-medium flex items-center gap-2">
                    <span className="text-black text-xl leading-none">•</span>
                    Rent a car
                  </span>
                  <span className="text-[22px] sm:text-[24px] font-bold">₹750</span>
                </div>
              </div>
            </div>

            {/* Action Button matching Figma 434x69px, centered */}
            <button
              type="button"
              onClick={() => toast.success('Proceeding to payment gateway...')}
              className="w-full sm:w-[434px] h-[69px] mx-auto bg-[#004772] hover:bg-[#003657] text-white rounded-[20px] font-semibold text-[20px] sm:text-[22px] transition-all shadow-md flex items-center justify-center mt-8 cursor-pointer font-['Poppins'] active:scale-[0.99]"
            >
              Continue to Payment
            </button>

            {/* Terms subtext */}
            <p className="text-[14px] sm:text-[15px] text-black/70 text-center w-full mt-4 font-['Poppins']">
              By continuing you agree to our{' '}
              <a
                href="/terms"
                className="underline hover:text-black transition-colors cursor-pointer"
              >
                terms and conditions
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
