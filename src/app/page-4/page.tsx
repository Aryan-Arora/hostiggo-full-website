"use client";

import React, { useState } from "react";
import { Star, ChevronDown, X, Share2, Heart, ArrowRight } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { cn } from "@/lib/utils";

const SAMPLE_REVIEWS = [
  {
    id: 1,
    name: "Bappi Lehri",
    time: "3 weeks ago",
    rating: 5,
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
    text: "We had a wonderful stay at this homestay. The room was clean, spacious, and exactly as shown in the photos. The host was very helpful and welcoming throughout our trip.",
  },
  {
    id: 2,
    name: "Bappi Lehri",
    time: "3 weeks ago",
    rating: 5,
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    text: "very helpfull host and best location and awesome host... spacious flat...will visit again and very nice place ...thnx harveer for so good and fine place",
  },
  {
    id: 3,
    name: "Bappi Lehri",
    time: "3 weeks ago",
    rating: 5,
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    text: "We had a wonderful stay at this homestay. The room was clean, spacious, and exactly as shown in the photos. The host was very helpful and welcoming throughout our trip.",
  },
];

export default function PageFour() {
  const [selectedSort, setSelectedSort] = useState("All");
  const [sortOpen, setSortOpen] = useState(true);

  const sortOptions = [
    "All",
    "Recent first",
    "Highest ratings first",
    "Lowest ratings first",
  ];

  return (
    <div className="min-h-screen bg-[#FFFEF9] font-sans text-gray-900 antialiased relative">
      <Navbar />

      {/* Dimmed Background matching Figma screenshot */}
      <div className="max-w-[1512px] mx-auto px-4 sm:px-8 py-6 opacity-40 pointer-events-none">
        <div className="bg-[#f8f7f6] rounded-[24px] border border-gray-200/80 px-6 py-4 mb-10 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button className="bg-[#0c4f74] text-white px-7 py-3 rounded-[16px] text-[16px] font-bold">
              Reserve
            </button>
            <span className="text-[20px] font-extrabold text-gray-900">
              ₹2,349
            </span>
            <span className="text-[14px] text-gray-500 font-medium">
              • for 15 nights • 2 Adults
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button className="w-10 h-10 rounded-full border border-gray-300 bg-white flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </button>
            <button className="w-10 h-10 rounded-full border border-gray-300 bg-white flex items-center justify-center">
              <Heart className="w-4 h-4" />
            </button>
          </div>
        </div>

        <section className="bg-white rounded-[32px] border border-gray-200 p-8 sm:p-12 shadow-sm">
          <h2 className="text-[24px] font-extrabold text-gray-900 mb-8">
            Ratings &amp; reviews
          </h2>
          <div className="text-center py-6">
            <span className="text-[48px] font-extrabold">4.9</span>
          </div>
        </section>
      </div>

      {/* Modal active with sort menu visible */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <div className="relative w-full max-w-[640px] bg-white rounded-[32px] border border-gray-200 shadow-2xl p-6 sm:p-8 max-h-[85vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between pb-5 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="bg-[#008A05] text-white px-3.5 py-1.5 rounded-xl font-extrabold text-[16px] flex items-center gap-1.5 shadow-sm">
                <Star className="w-4 h-4 fill-white" />
                <span>4.3</span>
              </div>
              <span className="text-[18px] font-bold text-gray-900">
                178 reviews
              </span>

              {/* Sort Dropdown */}
              <div className="relative ml-2">
                <button
                  onClick={() => setSortOpen(!sortOpen)}
                  className="flex items-center gap-2 border border-gray-300 bg-white hover:bg-gray-50 px-4 py-1.5 rounded-full text-[13px] font-bold text-gray-700 transition-colors shadow-sm"
                >
                  <span>{selectedSort}</span>
                  <ChevronDown
                    className={cn(
                      "w-3.5 h-3.5 transition-transform",
                      sortOpen && "rotate-180",
                    )}
                  />
                </button>

                {/* Dropdown Menu matching Figma exactly */}
                {sortOpen && (
                  <div className="absolute left-0 top-[calc(100%+8px)] z-50 w-52 bg-white rounded-2xl border border-gray-200 shadow-2xl py-2 animate-in fade-in zoom-in-95 duration-150">
                    {sortOptions.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => {
                          setSelectedSort(opt);
                          setSortOpen(false);
                        }}
                        className={cn(
                          "w-full text-left px-5 py-2.5 text-[14px] font-semibold transition-colors",
                          selectedSort === opt
                            ? "bg-[#0c4f74]/10 text-[#0c4f74]"
                            : "text-gray-700 hover:bg-gray-50",
                        )}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => window.history.back()}
              className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Reviews */}
          <div className="flex-1 overflow-y-auto py-5 space-y-6 pr-2">
            {SAMPLE_REVIEWS.map((review) => (
              <div key={review.id} className="space-y-2">
                <div className="flex items-center gap-3">
                  <img
                    src={review.avatar}
                    alt={review.name}
                    className="w-11 h-11 rounded-full object-cover border border-gray-100 shadow-sm"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-bold text-gray-900">
                        {review.name}
                      </span>
                      <span className="text-gray-300">•</span>
                      <span className="text-[13px] text-gray-400 font-medium">
                        {review.time}
                      </span>
                    </div>
                    <div className="flex gap-0.5 mt-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className="w-3.5 h-3.5 text-amber-400 fill-amber-400"
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-[14px] text-gray-600 leading-relaxed pl-14">
                  {review.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
