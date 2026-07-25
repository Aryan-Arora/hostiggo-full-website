import { useState } from "react";
import Image from "next/image";
import { Heart, Star, Wifi, Car, Coffee } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Property } from "@/types";
import { cn, toISODate } from "@/lib/utils";
import { useListingState } from "@/context/ListingFilterContext";
import { useAuth } from "@/context/AuthContext";
import { useWishlist } from "@/hooks/useWishlist";
import { toast } from "sonner";
import { calculateBookingInvoice } from "@/lib/billing/invoice";

interface PropertyCardListProps {
  property: Property;
}

const FALLBACK = "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&h=400&fit=crop&q=80";

export default function PropertyCardList({ property }: PropertyCardListProps) {
  const [imgErr, setImgErr] = useState(false);
  const router = useRouter();
  const { dates, guests } = useListingState();

  const nights =
    dates.checkIn && dates.checkOut
      ? Math.max(0, Math.round((dates.checkOut.getTime() - dates.checkIn.getTime()) / 86400000))
      : null;
  const totalGuests = guests.adults + guests.children;
  const invoice = calculateBookingInvoice({ basePropertyPrice: property.price });
  const feesAndTaxes = Math.round(invoice.grandTotalPaise / 100 - property.price);
  const { isAuthenticated, userId } = useAuth();
  const { isSaved, toggle } = useWishlist(userId);
  const liked = isSaved(property.id);

  const handleToggleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated || !userId) {
      toast("Sign in to save properties to your wishlist.");
      router.push(`/signin?redirect=${encodeURIComponent(`/property/${property.id}`)}`);
      return;
    }
    try {
      await toggle(property.id);
    } catch {
      toast.error("Could not update your wishlist. Please try again.");
    }
  };

  const handleNavigate = () => {
    const checkIn = toISODate(dates.checkIn);
    const checkOut = toISODate(dates.checkOut);
    const params = new URLSearchParams();
    if (checkIn) params.set('checkIn', checkIn);
    if (checkOut) params.set('checkOut', checkOut);
    const qs = params.toString();
    router.push(`/property/${property.id}${qs ? `?${qs}` : ''}`);
  };

  const discount = property.originalPrice
    ? Math.round(((property.originalPrice - property.price) / property.originalPrice) * 100)
    : null;

  const amenityTags = [
    property.breakfast && { label: "Breakfast", icon: <Coffee className="w-3 h-3" /> },
    property.wifi && { label: "Wifi", icon: <Wifi className="w-3 h-3" /> },
    property.parking && { label: "Parking", icon: <Car className="w-3 h-3" /> },
  ].filter(Boolean) as { label: string; icon: React.ReactNode }[];

  return (
    // Figma node 3122:18947 -- rounded-[45px], border #d9d9d9, shadow
    // 0px 4px 75.4px rgba(0,0,0,0.08), image ~35% of card width (square).
    <div
      className="bg-white rounded-[45px] p-4 flex flex-col sm:flex-row gap-5 sm:gap-8 cursor-pointer group transition-shadow duration-200 border border-[#d9d9d9]"
      style={{ boxShadow: "0px 4px 75.4px 0px rgba(0,0,0,0.08)" }}
      onClick={handleNavigate}
    >
      {/* Image — Figma uses a square (299x299 at an 855-wide card, ~35%) */}
      <div className="relative flex-shrink-0 w-full sm:w-[35%] aspect-square rounded-[35px] overflow-hidden">
        <Image
          src={imgErr ? FALLBACK : (property.images[0] || FALLBACK)}
          alt={property.propertyName}
          onError={() => setImgErr(true)}
          fill
          sizes="(max-width: 640px) 100vw, 35vw"
          className="object-cover group-hover:scale-105 transition-transform duration-700"
        />
        {/* Heart button */}
        <button
          onClick={handleToggleLike}
          className={cn(
            "absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all bg-white/90 backdrop-blur-sm shadow-sm",
            liked ? "text-rose-500" : "text-gray-500 hover:text-rose-400 hover:scale-110"
          )}
        >
          <Heart className={cn("w-4 h-4", liked && "fill-rose-500")} />
        </button>
      </div>

      {/* Content Container */}
      <div className="flex-1 flex flex-col justify-between py-1 pr-2 min-w-0">

        {/* Top Header Row */}
        <div className="flex justify-between items-start gap-4">
          <div className="min-w-0 flex-1">
            <h3
              className="font-semibold leading-[1.4] tracking-[0.075px] text-figma-ink line-clamp-1 mb-2"
              style={{ fontSize: 25 }}
            >
              {property.propertyName}
            </h3>

            {/* Rating Block — show an honest "New" badge instead of a fake
                score when the listing has no real reviews yet, so this
                doesn't contradict the guest-rating filter which correctly
                excludes listings with no genuine rating. */}
            <div className="flex items-center gap-2 mb-2">
              {property.rating > 0 ? (
                <div className="flex items-center gap-1.5 bg-figma-navy/5 border border-figma-navy/20 rounded-md px-2 py-0.5">
                  <span className="text-[14px] font-semibold text-figma-ink">{property.rating.toFixed(1)}</span>
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                </div>
              ) : (
                <div className="flex items-center gap-1.5 bg-figma-surface rounded-md px-2 py-0.5">
                  <span className="text-[14px] font-semibold text-figma-muted">New</span>
                </div>
              )}
              <span className="text-[14px] text-figma-ink/70">· {property.reviewCount} reviews</span>
            </div>

            {/* Location + distance row */}
            <p className="text-[14px] text-figma-ink/60 font-medium line-clamp-1 mb-3">
              {property.city}, {property.state}
              {property.distanceFromCenter ? ` · ${property.distanceFromCenter} from centre` : ''}
            </p>

            {/* Badges/Tags */}
            <div className="flex flex-wrap gap-2 mb-3">
              {property.freeCancellation && (
                <span className="text-[11px] font-bold text-figma-navy bg-figma-navy/5 border border-figma-navy/20 px-2.5 py-1 rounded-md">
                  Free cancellation
                </span>
              )}
              {amenityTags.map((tag) => (
                <span
                  key={tag.label}
                  className="flex items-center gap-1 text-[11px] font-medium text-figma-ink/70 border border-figma-border px-2.5 py-1 rounded-md"
                >
                  {tag.icon}
                  {tag.label}
                </span>
              ))}
            </div>

            {/* Room details text */}
            <p className="text-[11px] text-figma-ink/50 font-medium">
              Up to {property.maxGuests} guest{property.maxGuests === 1 ? '' : 's'}
            </p>
          </div>

          {/* Pricing Column (Right side) */}
          <div className="flex-shrink-0 flex flex-col items-end text-right">
            {nights !== null && nights > 0 && (
              <p className="text-[12px] text-figma-ink/60 font-medium mb-1">
                {nights} night{nights === 1 ? '' : 's'}, {totalGuests} guest{totalGuests === 1 ? '' : 's'}
              </p>
            )}
            {property.originalPrice && (
              <p className="text-[13px] text-figma-ink/40 font-medium line-through mb-0.5">₹ {property.originalPrice.toLocaleString("en-IN")}</p>
            )}
            <p className="font-semibold text-figma-ink leading-none mb-1" style={{ fontSize: 25 }}>
              ₹ {property.price.toLocaleString("en-IN")}
            </p>
            <p className="text-[11px] text-figma-ink/50">+₹ {feesAndTaxes.toLocaleString("en-IN")} taxes and fees</p>
          </div>
        </div>

      </div>
    </div>
  );
}
