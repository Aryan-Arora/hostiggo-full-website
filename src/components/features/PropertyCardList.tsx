import { useState } from "react";
import { Heart, Star, Wifi, Car, Coffee, Zap, Droplets, UtensilsCrossed, CheckCircle, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Property } from "@/types";
import { cn, toISODate } from "@/lib/utils";
import { useListingState } from "@/context/ListingFilterContext";

interface PropertyCardListProps {
  property: Property;
}

const FALLBACK = "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&h=400&fit=crop&q=80";

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  "WiFi": <Wifi className="w-3 h-3" />,
  "Parking": <Car className="w-3 h-3" />,
  "Breakfast": <Coffee className="w-3 h-3" />,
  "AC": <Zap className="w-3 h-3" />,
  "Pool": <Droplets className="w-3 h-3" />,
  "Kitchen": <UtensilsCrossed className="w-3 h-3" />,
};

export default function PropertyCardList({ property }: PropertyCardListProps) {
  const [liked, setLiked] = useState(property.isFavorite ?? false);
  const [imgErr, setImgErr] = useState(false);
  const router = useRouter();
  const { dates } = useListingState();

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

  return (
    <div
      className="bg-white rounded-[2rem] p-3 flex flex-col sm:flex-row gap-4 sm:gap-6 cursor-pointer group transition-all duration-200 border border-gray-100 hover:shadow-md"
      onClick={handleNavigate}
    >
      {/* Image Container */}
      <div className="relative flex-shrink-0 w-full sm:w-[280px] h-[200px] sm:h-auto rounded-[1.5rem] overflow-hidden">
        <img
          src={imgErr ? FALLBACK : (property.images[0] || FALLBACK)}
          alt={property.propertyName}
          onError={() => setImgErr(true)}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        {/* Heart button */}
        <button
          onClick={(e) => { e.stopPropagation(); setLiked(v => !v); }}
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
            <h3 className="text-[17px] font-bold text-gray-900 leading-tight mb-1">{property.propertyName}</h3>
            <p className="text-[13px] text-gray-500 font-medium line-clamp-1 mb-2">
              {property.city}, {property.state} • <button className="text-blue-600 hover:underline">View on map</button> • {property.distanceFromCenter ?? "15.8km from centre"}
            </p>

            {/* Rating Block */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-1.5 bg-emerald-500 rounded-md px-2 py-0.5 shadow-sm">
                <span className="text-[12px] font-bold text-white">{property.rating.toFixed(1)}</span>
                <Star className="w-3 h-3 text-white fill-white" />
              </div>
              <span className="text-[12px] font-bold text-gray-700">{property.reviewCount} reviews</span>
            </div>

            {/* Badges/Tags */}
            <div className="flex flex-wrap gap-2 mb-3">
              {property.freeCancellation && (
                <span className="text-[11px] font-bold text-blue-600 bg-blue-50/50 border border-blue-100 px-2 py-1 rounded-md">
                  Free cancellation
                </span>
              )}
              {property.breakfast && (
                <span className="text-[11px] font-medium text-gray-500 border border-gray-200 px-2 py-1 rounded-md">
                  Crib
                </span>
              )}
            </div>

            {/* Room details text */}
            <p className="text-[11px] text-gray-500 font-medium mt-3">
              1 bedroom <br /> 1 double bed • 1 bathroom
            </p>
          </div>

          {/* Pricing Column (Right side) */}
          <div className="flex-shrink-0 flex flex-col items-end text-right">
            <p className="text-[12px] text-gray-500 font-medium mb-1">10 nights, 2 adults</p>
            {property.originalPrice && (
              <p className="text-[13px] text-gray-400 font-medium line-through mb-0.5">₹ {property.originalPrice.toLocaleString("en-IN")}</p>
            )}
            <p className="text-[22px] font-extrabold text-blue-800 leading-none mb-1">
              ₹ {property.price.toLocaleString("en-IN")}
            </p>
            <p className="text-[11px] text-gray-400">+₹ {Math.round(property.price * 0.12).toLocaleString("en-IN")} taxes and fees</p>
          </div>
        </div>

      </div>
    </div>
  );
}
