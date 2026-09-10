"use client";

import { ChevronRight, Heart, Share2, Star } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import { api, mapListingToProperty } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Property, Review } from "@/types";

const SAMPLE_REVIEWS = [
  {
    id: "1",
    userName: "Bappi Lehri",
    userAvatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
    rating: 5,
    reviewDate: "3 weeks ago",
    reviewText:
      "We had a wonderful stay at this homestay. The room was clean, spacious, and exactly as shown in the photos. The host was very helpful and welcoming throughout our trip.",
  },
  {
    id: "2",
    userName: "Bappi Lehri",
    userAvatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
    rating: 5,
    reviewDate: "3 weeks ago",
    reviewText:
      "We had a wonderful stay at this homestay. The room was clean, spacious, and exactly as shown in the photos. The host was very helpful and welcoming throughout our trip.",
  },
  {
    id: "3",
    userName: "Bappi Lehri",
    userAvatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
    rating: 5,
    reviewDate: "3 weeks ago",
    reviewText:
      "We had a wonderful stay at this homestay. The room was clean, spacious, and exactly as shown in the photos. The host was very helpful and welcoming throughout our trip.",
  },
];

function RatingBar({ value, width }: { value: number; width: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-4 text-right text-[12px] font-medium text-[#1a1a1a] opacity-80">
        {value}
      </span>
      <div className="h-2.5 w-[180px] rounded-full bg-[#d9d9d9] overflow-hidden">
        <div
          className="h-full rounded-full bg-[#1B8FD9]"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const [expanded, setExpanded] = useState(false);
  const text = review.reviewText || "";
  const isLong = text.length > 120;

  return (
    <article className="w-full max-w-[360px] rounded-[22px] border border-[#d8d8d8] bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_10px_28px_rgba(0,0,0,0.08)]">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img
            src={review.userAvatar}
            alt={review.userName}
            className="h-10 w-10 rounded-full object-cover"
          />
          <div>
            <p className="text-[16px] font-medium leading-none text-[#1a1a1a]">
              {review.userName}
            </p>
            <div className="mt-2 flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star
                  key={index}
                  className={cn(
                    "h-3.5 w-3.5",
                    index < review.rating
                      ? "fill-[#1a1a1a] text-[#1a1a1a]"
                      : "fill-[#d1d5db] text-[#d1d5db]",
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        <span className="text-[12px] font-normal text-[#7a7a7a]">
          {review.reviewDate}
        </span>
      </div>

      <p className="mt-5 text-[15px] leading-[1.8] text-[#1a1a1a]/80">
        {isLong && !expanded ? `${text.slice(0, 120)}...` : text}
      </p>

      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-3 text-[14px] font-medium text-[#0d7bb7] transition-colors hover:text-[#095c90]"
        >
          {expanded ? "Read less" : "Read more"}
        </button>
      )}
    </article>
  );
}

export default function PropertyReviewsPage() {
  const params = useParams<{ id?: string }>();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    const listingId = params?.id;

    if (!listingId) {
      setProperty(null);
      setLoading(false);
      return;
    }

    const id = String(listingId);
    let isMounted = true;

    async function load() {
      try {
        const row = await api.propertyDetail(id);
        if (!isMounted) return;
        setProperty(row ? mapListingToProperty(row) : null);
      } catch (error) {
        console.error("[reviews page] failed to load property:", error);
        if (isMounted) setProperty(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [params?.id]);

  const rating = property?.rating ?? 4.9;
  const reviewCount = property?.reviewCount ?? 417;

  const reviewCards = useMemo(() => {
    const source =
      property?.reviews && property.reviews.length > 0
        ? property.reviews
        : SAMPLE_REVIEWS;

    return source.slice(0, 3).map((review) => ({
      ...review,
      userName: review.userName || "Guest",
      userAvatar:
        review.userAvatar ||
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
      reviewText: review.reviewText || "Great stay.",
      reviewDate: review.reviewDate || "Recently",
    })) as Review[];
  }, [property]);

  const servicePrice = property?.price ?? 2349;

  const ratingBreakdown = useMemo(
    () => [
      { value: 5, width: 72 },
      { value: 4, width: 65 },
      { value: 3, width: 15 },
      { value: 2, width: 10 },
      { value: 1, width: 5 },
    ],
    [],
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f3ef]">
        <Navbar />
        <div className="mx-auto flex max-w-[1200px] items-center justify-center px-4 py-20">
          <div className="h-10 w-40 animate-pulse rounded-full bg-[#d9d9d9]" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f3ef] text-[#1a1a1a]">
      <Navbar />

      <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
        <header className="mt-4 rounded-[18px] border-b border-[#d9d9d9] bg-white px-4 py-4 shadow-[0_0_0_1px_rgba(0,0,0,0.02)] sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <button
                type="button"
                className="rounded-[24px] bg-[#0d7bb7] px-6 py-3 text-[18px] font-semibold text-white shadow-[0_10px_20px_rgba(13,123,183,0.2)] transition-transform hover:-translate-y-0.5 hover:bg-[#0a6ea5]"
              >
                Reserve
              </button>

              <div className="flex items-center gap-2 text-[18px] font-medium text-[#1a1a1a]">
                <span className="font-medium text-[#1a1a1a]">
                  ₹{servicePrice.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-center">
              <div className="hidden items-center gap-2 text-[15px] text-[#1a1a1a]/70 sm:flex">
                <span className="font-medium">for 15 nights</span>
                <span className="text-[#9a9a9a]">•</span>
                <span className="font-medium">2 Adults</span>
              </div>

              <button
                type="button"
                aria-label="Share"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-[#d5d5d5] bg-white text-[#1a1a1a] transition-all hover:border-[#0d7bb7] hover:text-[#0d7bb7]"
              >
                <Share2 className="h-4 w-4" />
              </button>

              <button
                type="button"
                aria-label="Save"
                onClick={() => setLiked((value) => !value)}
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-full border bg-white transition-all hover:border-[#0d7bb7]",
                  liked
                    ? "border-[#f87171] text-[#ef4444]"
                    : "border-[#d5d5d5] text-[#1a1a1a] hover:text-[#0d7bb7]",
                )}
              >
                <Heart className={cn("h-4 w-4", liked && "fill-current")} />
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[980px] pb-16 pt-10 sm:pt-16">
          <h1 className="text-[26px] font-semibold tracking-[-0.04em] text-[#1a1a1a] sm:text-[36px]">
            Ratings &amp; reviews
          </h1>

          <div className="mt-14 flex flex-col items-center">
            <div className="flex items-center gap-3 text-[32px] font-semibold tracking-[-0.04em] text-[#1a1a1a] sm:text-[52px]">
              <span>{rating.toFixed(1)}</span>
              <span className="text-[14px] font-medium text-[#1a1a1a]/70 sm:text-[18px]">
                ({reviewCount})
              </span>
            </div>

            <div className="mt-4 flex items-center gap-1 text-[#1a1a1a]">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star
                  key={index}
                  className={cn(
                    "h-5 w-5 sm:h-6 sm:w-6",
                    index < Math.round(rating)
                      ? "fill-[#1a1a1a] text-[#1a1a1a]"
                      : "fill-[#d1d5db] text-[#d1d5db]",
                  )}
                />
              ))}
            </div>

            <div className="mt-8 space-y-2">
              {ratingBreakdown.map(({ value, width }) => (
                <RatingBar key={value} value={value} width={width} />
              ))}
            </div>
          </div>

          <div className="mt-16 flex flex-col gap-5 md:flex-row md:items-stretch md:justify-between">
            {reviewCards.map((review, index) => (
              <div key={`${review.id}-${index}`} className="flex-1">
                <ReviewCard review={review} />
              </div>
            ))}

            <button
              type="button"
              aria-label="Next review"
              className="mt-2 flex h-12 w-12 shrink-0 items-center justify-center self-center rounded-full border border-[#d5d5d5] bg-white text-[#1a1a1a] shadow-sm transition-all hover:border-[#0d7bb7] hover:text-[#0d7bb7] md:mt-0 md:self-end"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-8">
            <button
              type="button"
              className="rounded-[12px] border border-[#0d7bb7] bg-white px-5 py-3 text-[16px] font-medium text-[#0d7bb7] transition-all hover:-translate-y-0.5 hover:bg-[#0d7bb7] hover:text-white"
            >
              View all reviews
            </button>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
