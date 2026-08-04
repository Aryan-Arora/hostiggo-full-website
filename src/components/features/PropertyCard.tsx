import { useState } from "react";
import { Heart, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Property } from "@/types";
import { cn } from "@/lib/utils";

interface PropertyCardProps {
  property: Property;
}

const FALLBACK = "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&h=300&fit=crop&q=80";

export default function PropertyCard({ property }: PropertyCardProps) {
  const [liked, setLiked] = useState(property.isFavorite ?? false);
  const [imgErr, setImgErr] = useState(false);
  const router = useRouter();

  return (
    <div
      className="card-base rounded-3xl cursor-pointer group"
      onClick={() => router.push(`/property/${property.id}`)}
    >
      {/* Image */}
      <div className="relative overflow-hidden" style={{ height: 200 }}>
        <img
          src={imgErr ? FALLBACK : (property.images[0] || FALLBACK)}
          alt={property.propertyName}
          onError={() => setImgErr(true)}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <button
          onClick={(e) => { e.stopPropagation(); setLiked(v => !v); }}
          aria-label={liked ? "Remove from favourites" : "Add to favourites"}
          className={cn(
            "absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 shadow-md",
            liked ? "bg-white text-rose-500" : "bg-white/95 text-gray-600 hover:text-rose-400"
          )}
        >
          <Heart className={cn("w-4 h-4", liked && "fill-rose-500")} />
        </button>
        {property.isNew && (
          <span className="absolute top-2.5 left-2.5 bg-emerald-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full tracking-wide shadow">NEW</span>
        )}
        <div className="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-black/20 to-transparent" />
      </div>

      {/* Details */}
      <div className="p-3.5">
        <h3 className="text-[13px] font-semibold text-gray-800 leading-snug line-clamp-1 mb-0.5">{property.propertyName}</h3>
        <p className="text-[11px] text-gray-400 mb-2 line-clamp-1">{property.city}, {property.state}</p>
        <div className="flex items-center gap-1 mb-3">
          <Star className="w-3 h-3 text-amber-400 fill-amber-400 flex-shrink-0" />
          <span className="text-[11px] font-bold text-gray-700">{property.rating.toFixed(1)}</span>
          <span className="text-[11px] text-gray-400">• {property.reviewCount} reviews</span>
        </div>
        {/* Price — flush to the card's left edge, straight (un-curved) left side, rounded right */}
        <div className="-ml-3.5 flex w-fit items-baseline gap-1.5 bg-white border border-[#5B8DEF] border-l-0 pl-4 pr-4 py-2.5 rounded-r-2xl transition-all duration-200 hover:border-[#3f6fd1] hover:shadow-sm">
          <span className="text-xl font-semibold text-gray-900 leading-none whitespace-nowrap">₹ {property.price.toLocaleString("en-IN")}</span>
          <span className="text-[13px] font-medium text-gray-500 whitespace-nowrap">/ Night</span>
        </div>
      </div>
    </div>
  );
}
