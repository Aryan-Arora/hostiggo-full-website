"use client";

import React, { useState } from "react";
import { X, Share2, Heart } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { cn } from "@/lib/utils";

const COUPONS = [
  { id: 1, discount: "₹500 off", desc: "Bank offer use", code: "AXIS500" },
  { id: 2, discount: "₹300 off", desc: "Hostiggo offer use", code: "HOST1300" },
  { id: 3, discount: "₹500 off", desc: "Bank offer use", code: "AXIS500" },
  { id: 4, discount: "₹300 off", desc: "Hostiggo offer use", code: "HOST1300" },
  { id: 5, discount: "₹500 off", desc: "Bank offer use", code: "AXIS500" },
];

export default function PageFive() {
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponInput, setCouponInput] = useState("");

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
      </div>

      {/* Confirm Booking Modal matching Figma Screenshot 2 Right */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm">
        <div className="relative w-full max-w-[1120px] bg-white rounded-[32px] border border-gray-200 shadow-2xl p-6 sm:p-10 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between pb-6 border-b border-gray-200 mb-8">
            <h1 className="text-[26px] font-extrabold text-gray-900 tracking-tight">
              Confirm booking
            </h1>
            <button
              onClick={() => window.history.back()}
              className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 3 Columns Layout matching Figma Dev Mode specs */}
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
                    <span className="font-semibold text-gray-900">₹313.20</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Add-ons</span>
                    <span className="font-semibold text-gray-900">₹313.20</span>
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
                  onClick={() => alert("Proceeding to payment gateway...")}
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

      <Footer />
    </div>
  );
}
