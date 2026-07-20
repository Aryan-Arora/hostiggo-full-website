import { useState } from "react";
import { Heart, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Property } from "@/types";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useWishlist } from "@/hooks/useWishlist";
import { toast } from "sonner";
import { calculateBookingInvoice } from "@/lib/billing/invoice";

interface PropertyCardProps {
  property: Property;
}

const FALLBACK = "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&h=300&fit=crop&q=80";

export default function PropertyCard({ property }: PropertyCardProps) {
  const [imgErr, setImgErr] = useState(false);
  const router = useRouter();
  const { isAuthenticated, userId } = useAuth();
  const { isSaved, toggle } = useWishlist(userId);
  const liked = isSaved(property.id);
  const invoice = calculateBookingInvoice({ basePropertyPrice: property.price });
  const feesAndTaxes = Math.round(invoice.grandTotalPaise / 100 - property.price);

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

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden border border-figma-border cursor-pointer group transition-shadow duration-200 hover:shadow-card-hover"
      onClick={() => router.push(`/property/${property.id}`)}
    >
      {/* Image */}
      <div className="relative overflow-hidden" style={{ height: 190 }}>
        <img
          src={imgErr ? FALLBACK : (property.images[0] || FALLBACK)}
          alt={property.propertyName}
          onError={() => setImgErr(true)}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <button
          onClick={handleToggleLike}
          aria-label={liked ? "Remove from favourites" : "Add to favourites"}
          className={cn(
            "absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 shadow-md",
            liked ? "bg-rose-500 text-white" : "bg-white/90 text-gray-500 hover:text-rose-400"
          )}
        >
          <Heart className={cn("w-3.5 h-3.5", liked && "fill-white")} />
        </button>
        {property.isNew && (
          <span className="absolute top-2.5 left-2.5 bg-figma-success text-white text-[9px] font-bold px-2 py-0.5 rounded-full tracking-wide shadow">NEW</span>
        )}
        <div className="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-black/20 to-transparent" />
      </div>

      {/* Details */}
      <div className="p-3.5">
        <h3 className="text-[13.5px] font-semibold text-figma-ink leading-snug line-clamp-1 mb-0.5">{property.propertyName}</h3>
        <p className="text-[11.5px] text-figma-muted mb-2 line-clamp-1">{property.city}, {property.state}</p>
        <div className="flex items-center gap-1 mb-3">
          <Star className="w-3 h-3 text-amber-400 fill-amber-400 flex-shrink-0" />
          <span className="text-[11.5px] font-bold text-figma-ink">{property.rating > 0 ? property.rating.toFixed(2) : 'New'}</span>
          <span className="text-[11.5px] text-figma-muted-light">· {property.reviewCount} reviews</span>
        </div>
        <div className="flex items-baseline gap-1.5 pt-2.5 border-t border-figma-border">
          <span className="text-[16px] font-extrabold text-figma-ink">₹{property.price.toLocaleString("en-IN")}</span>
          <span className="text-[11.5px] text-figma-muted font-medium border-l border-figma-border pl-1.5">/night</span>
        </div>
        <p className="text-[10.5px] text-figma-muted-light mt-0.5">+₹{feesAndTaxes.toLocaleString("en-IN")} taxes and fees</p>
      </div>
    </div>
  );
}
