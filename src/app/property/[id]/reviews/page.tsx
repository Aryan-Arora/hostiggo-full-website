"use client";

import { ArrowLeft, Share2, Star } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import { UserAvatar } from "@/components/ui/user-avatar";
import { api, mapListingToProperty } from "@/lib/api";
import { formatINR, reviewMonth } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Property, Review } from "@/types";

type SortKey = "newest" | "highest" | "lowest";
const PAGE_SIZE = 8;


function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          aria-hidden
          className={cn(
            className ?? "h-3.5 w-3.5",
            i < Math.round(value) ? "fill-[#1a1a1a] text-[#1a1a1a]" : "fill-[#d1d5db] text-[#d1d5db]",
          )}
        />
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const [expanded, setExpanded] = useState(false);
  const text = review.reviewText || "";
  const isLong = text.length > 220;

  return (
    <article className="min-w-0 rounded-[22px] border border-[#e1e1e1] bg-white p-5">
      <div className="flex items-center gap-3">
        <UserAvatar src={review.userAvatar} name={review.userName} size={42} />
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold text-[#1a1a1a]">{review.userName}</p>
          <div className="mt-1 flex items-center gap-2">
            <Stars value={review.rating} />
            {review.reviewDate && (
              <span className="text-[12px] text-[#7a7a7a]">{reviewMonth(review.reviewDate)}</span>
            )}
          </div>
        </div>
      </div>
      {text ? (
        <>
          <p className="mt-4 whitespace-pre-line break-words text-[15px] leading-[1.7] text-[#1a1a1a]/85">
            {isLong && !expanded ? `${text.slice(0, 220).trimEnd()}…` : text}
          </p>
          {isLong && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-2 text-[14px] font-semibold text-[#0d7bb7] hover:underline"
            >
              {expanded ? "Show less" : "Read more"}
            </button>
          )}
        </>
      ) : (
        <p className="mt-4 text-[14px] italic text-[#1a1a1a]/50">Rated without a written review.</p>
      )}
    </article>
  );
}

export default function PropertyReviewsPage() {
  const params = useParams<{ id?: string }>();
  const listingId = params?.id ? String(params.id) : "";
  const [property, setProperty] = useState<Property | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "not-found" | "error">("loading");
  const [attempt, setAttempt] = useState(0);
  const [sort, setSort] = useState<SortKey>("newest");
  const [starFilter, setStarFilter] = useState<number | null>(null);
  const [visible, setVisible] = useState(PAGE_SIZE);

  useEffect(() => {
    if (!listingId) {
      setStatus("not-found");
      return;
    }
    let mounted = true;
    setStatus("loading");
    api
      .propertyDetail(listingId)
      .then((row) => {
        if (!mounted) return;
        if (!row) {
          setStatus("not-found");
          return;
        }
        setProperty(mapListingToProperty(row));
        setStatus("ready");
      })
      .catch((err) => {
        if (!mounted) return;
        const message = err instanceof Error ? err.message : "";
        setStatus(/not found|404/i.test(message) ? "not-found" : "error");
      });
    return () => {
      mounted = false;
    };
  }, [listingId, attempt]);

  const reviews = useMemo(() => property?.reviews ?? [], [property]);
  const count = reviews.length;
  const average = count ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0;

  const breakdown = useMemo(
    () =>
      [5, 4, 3, 2, 1].map((star) => {
        const n = reviews.filter((r) => Math.round(r.rating) === star).length;
        return { star, n, pct: count ? Math.round((n / count) * 100) : 0 };
      }),
    [reviews, count],
  );

  const shown = useMemo(() => {
    const list = starFilter ? reviews.filter((r) => Math.round(r.rating) === starFilter) : reviews.slice();
    list.sort((a, b) => {
      if (sort === "highest") return b.rating - a.rating || b.reviewDate.localeCompare(a.reviewDate);
      if (sort === "lowest") return a.rating - b.rating || b.reviewDate.localeCompare(a.reviewDate);
      return b.reviewDate.localeCompare(a.reviewDate);
    });
    return list;
  }, [reviews, sort, starFilter]);

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: property?.propertyName ?? "Hostiggo", url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied");
      }
    } catch {
      /* dismissed */
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f4f3ef] text-[#1a1a1a]">
      <Navbar />

      <div className="mx-auto w-full max-w-[1100px] px-4 sm:px-6">
        {status === "loading" && (
          <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-label="Loading reviews">
            <div className="h-10 w-40 animate-pulse rounded-full bg-[#d9d9d9]" />
          </div>
        )}

        {(status === "not-found" || status === "error") && (
          <div className="mx-auto mt-12 max-w-[480px] rounded-[24px] border border-[#e1e1e1] bg-white p-8 text-center">
            <h1 className="text-[22px] font-semibold">
              {status === "not-found" ? "This stay isn't available" : "We couldn't load reviews"}
            </h1>
            <p className="mt-2 text-[14px] text-[#1a1a1a]/65">
              {status === "not-found"
                ? "It may have been removed by the host."
                : "Please check your connection and try again."}
            </p>
            {status === "error" ? (
              <button
                type="button"
                onClick={() => setAttempt((n) => n + 1)}
                className="mt-6 inline-flex h-11 items-center rounded-full bg-[#004772] px-7 text-[14px] font-semibold text-white"
              >
                Try again
              </button>
            ) : (
              <Link
                href="/search"
                className="mt-6 inline-flex h-11 items-center rounded-full bg-[#004772] px-7 text-[14px] font-semibold text-white"
              >
                Explore stays
              </Link>
            )}
          </div>
        )}

        {status === "ready" && property && (
          <>
            <header className="sticky top-[72px] z-20 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-[#e1e1e1] bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <Link
                  href={`/property/${listingId}`}
                  aria-label="Back to listing"
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-[#d5d5d5] hover:bg-gray-50"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Link>
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-semibold">{property.propertyName}</p>
                  {property.price > 0 && (
                    <p className="text-[13px] text-[#1a1a1a]/65">
                      From <span className="font-semibold text-[#1a1a1a]">{formatINR(property.price)}</span> / night
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Share"
                  onClick={handleShare}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d5d5d5] bg-white hover:border-[#0d7bb7] hover:text-[#0d7bb7]"
                >
                  <Share2 className="h-4 w-4" />
                </button>
                <Link
                  href={`/property/${listingId}#availability`}
                  className="inline-flex h-10 items-center rounded-full bg-[#0d7bb7] px-5 text-[14px] font-semibold text-white hover:bg-[#0a6ea5]"
                >
                  Check availability
                </Link>
              </div>
            </header>

            <main className="pb-16 pt-8 sm:pt-12">
              <h1 className="text-[26px] font-semibold sm:text-[34px]">Ratings &amp; reviews</h1>

              {count === 0 ? (
                <div className="mt-8 rounded-[22px] border border-[#e1e1e1] bg-white p-8 text-center">
                  <Star className="mx-auto h-8 w-8 text-[#c9c9c9]" aria-hidden />
                  <p className="mt-3 text-[17px] font-semibold">No reviews yet</p>
                  <p className="mx-auto mt-1 max-w-[420px] text-[14px] text-[#1a1a1a]/65">
                    Only guests who have completed a stay can review, so every review here is from a real booking. Be
                    the first to stay and share your experience.
                  </p>
                </div>
              ) : (
                <>
                  <section className="mt-8 grid grid-cols-1 gap-8 rounded-[22px] border border-[#e1e1e1] bg-white p-6 sm:grid-cols-[220px_minmax(0,1fr)] sm:p-8">
                    <div className="flex flex-col items-center justify-center sm:items-start">
                      <p className="text-[48px] font-semibold leading-none">{average.toFixed(1)}</p>
                      <Stars value={average} className="mt-3 h-5 w-5" />
                      <p className="mt-2 text-[14px] text-[#1a1a1a]/65">
                        {count} {count === 1 ? "review" : "reviews"} · verified stays only
                      </p>
                    </div>
                    <div className="space-y-2">
                      {breakdown.map(({ star, n, pct }) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => {
                            setStarFilter((cur) => (cur === star ? null : star));
                            setVisible(PAGE_SIZE);
                          }}
                          disabled={n === 0}
                          aria-pressed={starFilter === star}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-lg px-2 py-1 text-left transition-colors disabled:cursor-default",
                            starFilter === star ? "bg-[#0d7bb7]/10" : "hover:bg-gray-50",
                          )}
                        >
                          <span className="w-10 text-[13px] font-medium">{star} star</span>
                          <span className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-[#e5e5e5]">
                            <span className="block h-full rounded-full bg-[#1B8FD9]" style={{ width: `${pct}%` }} />
                          </span>
                          <span className="w-8 text-right text-[13px] text-[#1a1a1a]/65">{n}</span>
                        </button>
                      ))}
                    </div>
                  </section>

                  <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-[14px] text-[#1a1a1a]/70">
                      {starFilter ? `${shown.length} ${starFilter}-star ${shown.length === 1 ? "review" : "reviews"}` : `All ${count} reviews`}
                      {starFilter && (
                        <button
                          type="button"
                          onClick={() => setStarFilter(null)}
                          className="ml-2 font-semibold text-[#0d7bb7] hover:underline"
                        >
                          Clear filter
                        </button>
                      )}
                    </p>
                    <label className="flex items-center gap-2 text-[14px]">
                      <span className="text-[#1a1a1a]/70">Sort by</span>
                      <select
                        value={sort}
                        onChange={(e) => setSort(e.target.value as SortKey)}
                        className="h-9 rounded-full border border-[#d5d5d5] bg-white px-3 text-[14px] outline-none focus:border-[#0d7bb7]"
                      >
                        <option value="newest">Most recent</option>
                        <option value="highest">Highest rated</option>
                        <option value="lowest">Lowest rated</option>
                      </select>
                    </label>
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                    {shown.slice(0, visible).map((review) => (
                      <ReviewCard key={review.id} review={review} />
                    ))}
                  </div>

                  {visible < shown.length && (
                    <div className="mt-8 text-center">
                      <button
                        type="button"
                        onClick={() => setVisible((v) => v + PAGE_SIZE)}
                        className="rounded-full border border-[#0d7bb7] bg-white px-6 py-2.5 text-[15px] font-medium text-[#0d7bb7] hover:bg-[#0d7bb7] hover:text-white"
                      >
                        Show more reviews ({shown.length - visible} more)
                      </button>
                    </div>
                  )}
                </>
              )}
            </main>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
