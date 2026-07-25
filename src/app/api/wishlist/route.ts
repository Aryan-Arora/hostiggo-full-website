import { NextRequest, NextResponse } from "next/server";
import { wishlistAPI } from "@/lib/services/wishlist";

export const dynamic = "force-dynamic";

const jsonError = (err: unknown, status = 500) => {
  console.error("[/api/wishlist] error:", err);
  const message =
    err instanceof Error
      ? err.message
      : (err as any)?.message || (err as any)?.hint || "Request failed";
  return NextResponse.json({ error: message }, { status });
};

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");
    const resource = req.nextUrl.searchParams.get("resource") ?? "items";
    if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });

    const categoryId = req.nextUrl.searchParams.get("categoryId") ?? undefined;
    const data =
      resource === "categories"
        ? await wishlistAPI.getWishlistCategories(userId)
        : resource === "listings"
          ? await wishlistAPI.fetchCategoricalWishlistListing(userId, categoryId)
          : resource === "ids"
            ? await wishlistAPI.getWishlistListingIds(userId)
            : await wishlistAPI.getWishlist(userId);

    return NextResponse.json({ data });
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action ?? "add";

    if (action === "add") {
      // Only pass the real wishlists columns through — the raw body also
      // carries `action`, which isn't a column and made every insert fail
      // with "Could not find the 'action' column of 'wishlists'".
      const { user_id, listing_id, category_id } = body;
      const data = await wishlistAPI.addToWishlist({ user_id, listing_id, category_id });
      return NextResponse.json({ data });
    }

    if (action === "create-category") {
      const { user_id, name } = body;
      const data = await wishlistAPI.addWishlistCategories({ user_id, name });
      return NextResponse.json({ data });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    return jsonError(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { categoryId, name, userId } = await req.json();
    if (!categoryId || !name || !userId) {
      return NextResponse.json(
        { error: "categoryId, name and userId are required" },
        { status: 400 },
      );
    }
    if (String(name).trim().length === 0 || String(name).length > 100) {
      return NextResponse.json(
        { error: "name must be 1-100 characters" },
        { status: 400 },
      );
    }

    const data = await wishlistAPI.renameWishlistCategory(categoryId, String(name).trim(), String(userId));
    return NextResponse.json({ data });
  } catch (err) {
    return jsonError(err);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId, listingId, categoryId } = await req.json();

    if (categoryId && !listingId) {
      if (!userId) {
        return NextResponse.json({ error: "userId is required" }, { status: 400 });
      }
      await wishlistAPI.deleteWishlistCategory(categoryId, String(userId));
      return NextResponse.json({ data: true });
    }

    if (!userId || !listingId) {
      return NextResponse.json({ error: "userId and listingId are required" }, { status: 400 });
    }

    await wishlistAPI.removeFromWishlist(userId, listingId, categoryId);
    return NextResponse.json({ data: true });
  } catch (err) {
    return jsonError(err);
  }
}
