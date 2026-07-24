import { useState } from "react";
import Image from "next/image";
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
      className="bg-white rounded-[35px] overflow-hidden cursor-pointer group transition-shadow duration-200"
      style={{ boxShadow: "0px 4px 30px 0px rgba(0,0,0,0.25)" }}
      onClick={() => router.push(`/property/${property.id}`)}
    >
      {/* Image -- Figma: rounded-tl/tr-[35px] matching the card radius */}
      <div className="relative overflow-hidden rounded-t-[35px]" style={{ height: 190 }}>
        <Image
          src={imgErr ? FALLBACK : (property.images[0] || FALLBACK)}
          alt={property.propertyName}
          onError={() => setImgErr(true)}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover group-hover:scale-110 transition-transform duration-500"
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

      {/* Details -- typography pulled exactly from Figma node 3007:xxxxx:
          title 18px/medium, location 14px/medium @80% opacity, rating &
          review-count both 16px/medium, price 25px/semibold -- all #1a1a1a. */}
      <div className="px-5 py-4">
        <h3
          className="font-medium leading-[1.4] tracking-[0.054px] text-figma-ink line-clamp-1 mb-1"
          style={{ fontSize: 18 }}
        >
          {property.propertyName}
        </h3>
        <p
          className="font-medium leading-[1.4] tracking-[0.042px] text-figma-ink/80 line-clamp-1 mb-2"
          style={{ fontSize: 14 }}
        >
          {property.city}, {property.state}
        </p>
        <div className="flex items-center gap-1.5 mb-3">
          <Star className="w-4 h-4 text-amber-400 fill-amber-400 flex-shrink-0" />
          <span className="font-medium text-figma-ink" style={{ fontSize: 16 }}>
            {property.rating > 0 ? property.rating.toFixed(1) : 'New'}
          </span>
          <span className="font-medium text-figma-ink/60" style={{ fontSize: 16 }}>
            · {property.reviewCount} reviews
          </span>
        </div>
        <div className="flex items-baseline gap-1.5 w-fit">
          <span className="font-semibold text-figma-ink" style={{ fontSize: 25 }}>
            ₹{property.price.toLocaleString("en-IN")}
          </span>
          <span className="font-medium text-figma-ink" style={{ fontSize: 16 }}>/night</span>
        </div>
        <p className="text-[11px] text-figma-ink/50 mt-1.5">+₹{feesAndTaxes.toLocaleString("en-IN")} taxes and fees</p>
      </div>
    </div>
  );
}
