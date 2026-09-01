"use client";

import React, { useState } from "react";
import {
  Star,
  ChevronDown,
  X,
  Share2,
  Heart,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
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

const COUPONS = [
  { id: 1, discount: "₹500 off", desc: "Bank offer use", code: "AXIS500" },
  { id: 2, discount: "₹300 off", desc: "Hostiggo offer use", code: "HOST1300" },
  { id: 3, discount: "₹500 off", desc: "Bank offer use", code: "AXIS500" },
  { id: 4, discount: "₹300 off", desc: "Hostiggo offer use", code: "HOST1300" },
  { id: 5, discount: "₹500 off", desc: "Bank offer use", code: "AXIS500" },
];

export default function PageThree() {
  const [reviewsModalOpen, setReviewsModalOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [selectedSort, setSelectedSort] = useState("All");
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponInput, setCouponInput] = useState("");

  const sortOptions = [
    "All",
    "Recent first",
    "Highest ratings first",
    "Lowest ratings first",
  ];

  return (
    <div className="min-h-screen bg-[#FFFEF9] font-sans text-gray-900 antialiased selection:bg-[#0c4f74]/10">
      <Navbar />

      <main className="max-w-[1512px] mx-auto px-4 sm:px-8 py-6">
        {/* Top Control Sticky Reserve Bar */}
        <div className="bg-[#f8f7f6] rounded-[24px] border border-gray-200/80 px-6 py-4 mb-10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setBookingModalOpen(true)}
              className="bg-[#0c4f74] hover:bg-[#093c58] text-white px-7 py-3 rounded-[16px] text-[16px] font-bold shadow-[0_8px_20px_rgba(12,79,116,0.22)] transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              Reserve
            </button>
            <div className="flex items-baseline gap-2">
              <span className="text-[14px] text-gray-400 line-through">
                ₹3,349
              </span>
              <span className="text-[20px] font-extrabold text-gray-900">
                ₹2,349
              </span>
              <span className="text-[14px] text-gray-500 font-medium ml-1">
                • for 15 nights • 2 Adults
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="w-10 h-10 rounded-full border border-gray-300 bg-white flex items-center justify-center text-gray-700 hover:border-gray-400 hover:text-gray-900 transition-colors shadow-sm">
              <Share2 className="w-4 h-4" />
            </button>
            <button className="w-10 h-10 rounded-full border border-gray-300 bg-white flex items-center justify-center text-gray-700 hover:border-gray-400 hover:text-gray-900 transition-colors shadow-sm">
              <Heart className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── RATINGS & REVIEWS SECTION ── */}
        <section className="bg-white rounded-[32px] border border-gray-200/90 p-8 sm:p-12 shadow-sm mb-12">
          <h2 className="text-[24px] sm:text-[28px] font-extrabold text-gray-900 mb-8">
            Ratings &amp; reviews
          </h2>

          {/* Rating Big Score & Breakdown Bars */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-10 sm:gap-16 py-6 mb-10">
            <div className="text-center">
              <div className="flex items-baseline justify-center gap-1.5">
                <span className="text-[48px] sm:text-[56px] font-extrabold text-gray-900 leading-none">
                  4.9
                </span>
                <span className="text-[16px] text-gray-500 font-medium">
                  (217)
                </span>
              </div>
              <div className="flex items-center justify-center gap-1 mt-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 text-amber-400 fill-amber-400"
                  />
                ))}
              </div>
            </div>

            {/* Star Distribution Progress Bars */}
            <div className="space-y-2 w-full max-w-[280px]">
              {[
                { star: 5, pct: 85 },
                { star: 4, pct: 20 },
                { star: 3, pct: 10 },
                { star: 2, pct: 5 },
                { star: 1, pct: 2 },
              ].map(({ star, pct }) => (
                <div key={star} className="flex items-center gap-3">
                  <span className="text-[13px] font-bold text-gray-700 w-3">
                    {star}
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full bg-[#1b8fd9] rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reviews Carousel Cards */}
          <div className="relative">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {SAMPLE_REVIEWS.map((r) => (
                <div
                  key={r.id}
                  className="bg-white rounded-[24px] p-6 border border-gray-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={r.avatar}
                          alt={r.name}
                          className="w-12 h-12 rounded-full object-cover shadow-sm border border-gray-100"
                        />
                        <div>
                          <p className="text-[15px] font-bold text-gray-900">
                            {r.name}
                          </p>
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
                      <span className="text-[12px] text-gray-400 font-medium">
                        {r.time}
                      </span>
                    </div>

                    <p className="text-[14px] text-gray-600 leading-relaxed line-clamp-3">
                      &quot;{r.text}&quot;
                    </p>
                  </div>

                  <button
                    onClick={() => setReviewsModalOpen(true)}
                    className="text-[13px] font-bold text-[#0c4f74] hover:underline underline-offset-4 text-left mt-4 inline-block"
                  >
                    Read more
                  </button>
                </div>
              ))}
            </div>

            {/* Carousel Right Arrow Floating Button */}
            <button
              onClick={() => setReviewsModalOpen(true)}
              className="hidden lg:flex absolute -right-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white border border-gray-300 shadow-md items-center justify-center text-gray-700 hover:text-gray-900 hover:scale-105 transition-all"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-8 flex items-center gap-4">
            <button
              onClick={() => setReviewsModalOpen(true)}
              className="px-6 py-2.5 rounded-full border border-gray-900 text-gray-900 font-bold text-[14px] hover:bg-gray-50 transition-colors"
            >
              View all reviews
            </button>
            <button
              onClick={() => setBookingModalOpen(true)}
              className="px-6 py-2.5 rounded-full bg-[#0c4f74] text-white font-bold text-[14px] hover:bg-[#093c58] transition-colors shadow-sm"
            >
              Open Confirm Booking Modal
            </button>
          </div>
        </section>
      </main>

      {/* ── MODAL 1: REVIEWS MODAL WITH SORT (Matches Figma Screens 2 & 3) ── */}
      {reviewsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-[620px] bg-white rounded-[28px] border border-gray-200 shadow-2xl p-6 sm:p-8 max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-5 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="bg-[#008A05] text-white px-3 py-1.5 rounded-xl font-extrabold text-[15px] flex items-center gap-1.5 shadow-sm">
                  <Star className="w-4 h-4 fill-white" />
                  <span>4.3</span>
                </div>
                <span className="text-[17px] font-bold text-gray-900">
                  178 reviews
                </span>

                {/* Sort Dropdown */}
                <div className="relative ml-2">
                  <button
                    onClick={() => setSortOpen(!sortOpen)}
                    className="flex items-center gap-2 border border-gray-300 bg-white hover:bg-gray-50 px-3.5 py-1.5 rounded-full text-[13px] font-bold text-gray-700 transition-colors"
                  >
                    <span>{selectedSort}</span>
                    <ChevronDown
                      className={cn(
                        "w-3.5 h-3.5 transition-transform",
                        sortOpen && "rotate-180",
                      )}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {sortOpen && (
                    <div className="absolute left-0 top-[calc(100%+6px)] z-50 w-48 bg-white rounded-2xl border border-gray-200 shadow-xl py-2 animate-in fade-in zoom-in-95 duration-150">
                      {sortOptions.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => {
                            setSelectedSort(opt);
                            setSortOpen(false);
                          }}
                          className={cn(
                            "w-full text-left px-4 py-2 text-[13px] font-semibold transition-colors",
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
                onClick={() => {
                  setReviewsModalOpen(false);
                  setSortOpen(false);
                }}
                className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Reviews List with Custom Scrollbar */}
            <div className="flex-1 overflow-y-auto py-4 space-y-6 pr-2">
              {SAMPLE_REVIEWS.map((review) => (
                <div key={review.id} className="space-y-2">
                  <div className="flex items-center gap-3">
                    <img
                      src={review.avatar}
                      alt={review.name}
                      className="w-10 h-10 rounded-full object-cover border border-gray-100"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-bold text-gray-900">
                          {review.name}
                        </span>
                        <span className="text-gray-300">•</span>
                        <span className="text-[12px] text-gray-400 font-medium">
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
                  <p className="text-[14px] text-gray-600 leading-relaxed pl-13">
                    {review.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: CONFIRM BOOKING MODAL (Matches Figma Screen 4) ── */}
      {bookingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-[1080px] bg-white rounded-[32px] border border-gray-200 shadow-2xl p-6 sm:p-10 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-6 border-b border-gray-200 mb-8">
              <h1 className="text-[26px] font-extrabold text-gray-900 tracking-tight">
                Confirm booking
              </h1>
              <button
                onClick={() => setBookingModalOpen(false)}
                className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 3 Columns Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              {/* Column 1: Property Details */}
              <div className="space-y-5">
                <div className="rounded-[20px] overflow-hidden border border-gray-200 shadow-sm aspect-[16/10]">
                  <img
                    src="https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80"
                    alt="Apartment in Greater Noida"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div>
                  <h3 className="text-[20px] font-bold text-gray-900 leading-tight">
                    Apartment in Greater Noida
                  </h3>
                  <p className="text-[14px] text-gray-500 mt-1">
                    Manali, Himachal pradesh
                  </p>
                </div>

                <div className="bg-[#f8f7f6] rounded-2xl p-4 border border-gray-200/80 flex items-center justify-between">
                  <div>
                    <p className="text-[13px] font-bold text-gray-900">
                      Check In - check out
                    </p>
                    <p className="text-[13px] text-gray-500 mt-0.5">
                      3 Apr, Fri – 7 Apr, Mon
                    </p>
                  </div>
                  <button className="text-[13px] font-bold text-[#0c4f74] hover:underline underline-offset-4">
                    Edit
                  </button>
                </div>

                <div className="bg-[#f8f7f6] rounded-2xl p-4 border border-gray-200/80 flex items-center justify-between">
                  <div>
                    <p className="text-[13px] font-bold text-gray-900">
                      Guest Details
                    </p>
                    <p className="text-[13px] text-gray-500 mt-0.5">
                      1 Room • 2 Adults
                    </p>
                  </div>
                  <button className="text-[13px] font-bold text-[#0c4f74] hover:underline underline-offset-4">
                    Edit
                  </button>
                </div>
              </div>

              {/* Column 2: Price Details & CTA */}
              <div className="space-y-6">
                <div>
                  <h4 className="text-[16px] font-bold text-gray-900 mb-3">
                    Price Details
                  </h4>
                  <div className="space-y-2.5 text-[14px]">
                    <div className="flex justify-between text-gray-600">
                      <span>2 nights × ₹6,997.70</span>
                      <span className="font-semibold text-gray-900">
                        ₹13,995.39
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Taxes</span>
                      <span className="font-semibold text-gray-900">
                        ₹313.20
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Add-ons</span>
                      <span className="font-semibold text-gray-900">
                        ₹313.20
                      </span>
                    </div>
                    <div className="pt-3 border-t border-gray-200 flex justify-between items-baseline">
                      <span className="text-[15px] font-bold text-gray-900">
                        Total (incl. taxes)
                      </span>
                      <span className="text-[18px] font-extrabold text-gray-900">
                        ₹14,608.59
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-emerald-50/70 border border-emerald-200/70 rounded-2xl p-4">
                  <p className="text-[14px] font-bold text-emerald-900">
                    Free Cancellation
                  </p>
                  <p className="text-[12px] text-emerald-700 mt-1">
                    Cancel before 2 Apr, Fri for a full refund.
                  </p>
                  <a
                    href="#cancellation"
                    className="text-[12px] font-bold text-[#0c4f74] underline underline-offset-2 mt-2 inline-block"
                  >
                    Refund policy
                  </a>
                </div>

                <div>
                  <button
                    onClick={() => {
                      alert("Redirecting to Razorpay checkout...");
                      setBookingModalOpen(false);
                    }}
                    className="w-full bg-[#0c4f74] hover:bg-[#093c58] text-white py-4 rounded-[18px] font-bold text-[16px] shadow-[0_8px_20px_rgba(12,79,116,0.22)] transition-all hover:scale-[1.01] active:scale-[0.99]"
                  >
                    Continue to Payment
                  </button>
                  <p className="text-[11px] text-gray-400 text-center mt-3">
                    By continuing you agree to our{" "}
                    <a href="/terms" className="underline">
                      terms and conditions
                    </a>
                    .
                  </p>
                </div>
              </div>

              {/* Column 3: Coupons Section */}
              <div className="space-y-4">
                <h4 className="text-[16px] font-bold text-gray-900">
                  Coupons ({COUPONS.length} available)
                </h4>

                {/* Input with Apply button */}
                <div className="flex items-center gap-2 border border-gray-300 rounded-2xl p-1.5 focus-within:border-[#0c4f74] focus-within:ring-2 focus-within:ring-[#0c4f74]/10 transition-all bg-white">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="Enter code"
                    className="w-full px-3 py-1.5 text-[14px] outline-none border-none bg-transparent placeholder:text-gray-400 font-medium"
                  />
                  <button
                    onClick={() => {
                      if (couponInput) {
                        setAppliedCoupon(couponInput);
                        setCouponInput("");
                      }
                    }}
                    className="px-4 py-1.5 bg-[#0c4f74] text-white rounded-xl text-[12px] font-bold hover:bg-[#093c58] transition-colors"
                  >
                    Apply
                  </button>
                </div>

                {/* Coupons list */}
                <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                  {COUPONS.map((c) => {
                    const isApplied = appliedCoupon === c.code;
                    return (
                      <div
                        key={c.id}
                        className={cn(
                          "flex items-center justify-between p-3.5 rounded-2xl border transition-all",
                          isApplied
                            ? "border-[#0c4f74] bg-[#0c4f74]/5"
                            : "border-gray-200 bg-white hover:border-gray-300",
                        )}
                      >
                        <div>
                          <p className="text-[14px] font-extrabold text-red-500">
                            {c.discount}
                          </p>
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            {c.desc}:{" "}
                            <span className="font-semibold text-gray-700">
                              {c.code}
                            </span>
                          </p>
                        </div>

                        <button
                          onClick={() =>
                            setAppliedCoupon(isApplied ? null : c.code)
                          }
                          className={cn(
                            "px-4 py-1 rounded-full text-[12px] font-bold border transition-colors",
                            isApplied
                              ? "bg-[#0c4f74] text-white border-[#0c4f74]"
                              : "border-[#0c4f74] text-[#0c4f74] hover:bg-[#0c4f74] hover:text-white",
                          )}
                        >
                          {isApplied ? "Applied" : "Apply"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
