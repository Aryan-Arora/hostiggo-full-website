import { NextRequest, NextResponse } from "next/server";
import { wishlistAPI } from "@/lib/services/wishlist";
import { forbiddenResponse, readJsonBody, requireUserId } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

// Wishlist category ids are uuids. The page's built-in "all" pseudo-group
// was once sent through as a category id and Postgres answered with
// 'invalid input syntax for type uuid: "all"' (a 500). Treat anything that
// isn't a uuid as "no specific category" on reads, and reject it on writes.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const asCategoryId = (value: unknown): string | undefined =>
  typeof value === "string" && UUID_RE.test(value) ? value : undefined;

const asListingId = (value: unknown): number | undefined => {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : undefined;
};

const jsonError = (err: unknown, status = 500) => {
  console.error("[/api/wishlist] error:", err);
  const message =
    err instanceof Error
      ? err.message
      : (err as any)?.message || (err as any)?.hint || "Request failed";
  return NextResponse.json({ error: message }, { status });
};

// Every operation acts on the caller's own wishlist; the verified token is
// the only identity used. A userId/user_id sent by older clients must match.
const mismatched = (claimed: unknown, userId: string) =>
  claimed != null && claimed !== "" && String(claimed) !== userId;

export async function GET(req: NextRequest) {
  try {
    const userId = await requireUserId(req);
    if (userId instanceof NextResponse) return userId;
    if (mismatched(req.nextUrl.searchParams.get("userId"), userId)) return forbiddenResponse();

    const resource = req.nextUrl.searchParams.get("resource") ?? "items";
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
    const userId = await requireUserId(req);
    if (userId instanceof NextResponse) return userId;
    const body = await readJsonBody(req);
    if (body instanceof NextResponse) return body;
    if (mismatched(body.user_id, userId)) return forbiddenResponse();
    const action = body.action ?? "add";

    if (action === "add") {
      const listing_id = asListingId(body.listing_id);
      if (!listing_id) return NextResponse.json({ error: "listing_id is required" }, { status: 400 });
      const category_id = asCategoryId(body.category_id);
      const data = await wishlistAPI.addToWishlist({ user_id: userId, listing_id: String(listing_id), category_id });
      return NextResponse.json({ data });
    }

    if (action === "create-category") {
      const name = String(body.name ?? "").trim();
      if (!name || name.length > 100) {
        return NextResponse.json({ error: "name must be 1-100 characters" }, { status: 400 });
      }
      const data = await wishlistAPI.addWishlistCategories({ user_id: userId, name });
      return NextResponse.json({ data });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    return jsonError(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const userId = await requireUserId(req);
    if (userId instanceof NextResponse) return userId;
    const body = await readJsonBody(req);
    if (body instanceof NextResponse) return body;
    if (mismatched(body.userId, userId)) return forbiddenResponse();

    const categoryId = asCategoryId(body.categoryId);
    const name = String(body.name ?? "").trim();
    if (!categoryId || !name) {
      return NextResponse.json({ error: "categoryId and name are required" }, { status: 400 });
    }
    if (name.length > 100) {
      return NextResponse.json({ error: "name must be 1-100 characters" }, { status: 400 });
    }

    const data = await wishlistAPI.renameWishlistCategory(categoryId, name, userId);
    return NextResponse.json({ data });
  } catch (err) {
    return jsonError(err);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = await requireUserId(req);
    if (userId instanceof NextResponse) return userId;
    const body = await readJsonBody(req);
    if (body instanceof NextResponse) return body;
    if (mismatched(body.userId, userId)) return forbiddenResponse();

    const { listingId, categoryId: rawCategoryId } = body;
    if (rawCategoryId && !listingId && !asCategoryId(rawCategoryId)) {
      return NextResponse.json({ error: "That list can't be removed." }, { status: 400 });
    }
    const categoryId = asCategoryId(rawCategoryId);

    if (categoryId && !listingId) {
      await wishlistAPI.deleteWishlistCategory(categoryId, userId);
      return NextResponse.json({ data: true });
    }

    if (!listingId) {
      return NextResponse.json({ error: "listingId is required" }, { status: 400 });
    }

    await wishlistAPI.removeFromWishlist(userId, listingId, categoryId);
    return NextResponse.json({ data: true });
  } catch (err) {
    return jsonError(err);
  }
}
