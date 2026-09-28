import { NextRequest, NextResponse } from "next/server";
import { wishlistAPI } from "@/lib/services/wishlist";

export const dynamic = "force-dynamic";

// Wishlist category ids are uuids. The page's built-in "all" pseudo-group
// was once sent through as a category id and Postgres answered with
// 'invalid input syntax for type uuid: "all"' (a 500). Treat anything that
// isn't a uuid as "no specific category" on reads, and reject it on writes.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const asCategoryId = (value: unknown): string | undefined =>
  typeof value === "string" && UUID_RE.test(value) ? value : undefined;

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

    const categoryId = asCategoryId(req.nextUrl.searchParams.get("categoryId"));
    const listingId = req.nextUrl.searchParams.get("listingId") ?? undefined;
    if (resource === "listing-categories" && !listingId) {
      return NextResponse.json({ error: "listingId is required" }, { status: 400 });
    }
    const data =
      resource === "categories"
        ? await wishlistAPI.getWishlistCategories(userId)
        : resource === "listings"
          ? await wishlistAPI.fetchCategoricalWishlistListing(userId, categoryId)
          : resource === "listing-categories"
            ? await wishlistAPI.getCategoriesForListing(userId, listingId as string)
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
      // Only pass the real wishlists columns through, the raw body also
      // carries `action`, which isn't a column and made every insert fail
      // with "Could not find the 'action' column of 'wishlists'".
      const { user_id, listing_id } = body;
      const category_id = asCategoryId(body.category_id);
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
    const { categoryId: rawCategoryId, name, userId } = await req.json();
    const categoryId = asCategoryId(rawCategoryId);
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
    const { userId, listingId, categoryId: rawCategoryId } = await req.json();
    if (rawCategoryId && !listingId && !asCategoryId(rawCategoryId)) {
      return NextResponse.json({ error: "That list can't be removed." }, { status: 400 });
    }
    const categoryId = asCategoryId(rawCategoryId);

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
