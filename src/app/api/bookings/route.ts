import { NextRequest, NextResponse } from "next/server";
import { bookingsAPI } from "@/lib/services/bookings";
import { errorMessage } from "@/lib/api-error";
import { getAuthenticatedUserId, UnauthorizedError } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

const jsonError = (err: unknown, status = 500) => {
  console.error("[/api/bookings] error:", err);
  return NextResponse.json({ error: errorMessage(err, "Request failed") }, { status });
};

export async function GET(req: NextRequest) {
  try {
    // userId is always the caller's own verified identity, never a query
    // param -- this endpoint returns booking history (guest name, phone,
    // stay dates), so a client-claimed userId would let anyone read anyone
    // else's bookings just by knowing their id. See getAuthenticatedUserId().
    const userId = await getAuthenticatedUserId(req);
    const role = req.nextUrl.searchParams.get("role") ?? "host";
    const label = req.nextUrl.searchParams.get("label") as
      | "upcoming"
      | "completed"
      | "cancelled"
      | null;
    const page = Number(req.nextUrl.searchParams.get("page") ?? 0);
    const limit = Number(req.nextUrl.searchParams.get("limit") ?? 20);

    const data =
      role === "guest" && label
        ? await bookingsAPI.fetchGuestBookings(userId, label, page, limit)
        : await bookingsAPI.fetchBookings(userId);
    return NextResponse.json({ data });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    return jsonError(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, bookingId } = body;
    if (!bookingId) return NextResponse.json({ error: "bookingId is required" }, { status: 400 });

    // status/dates/guests all mutate an existing guest booking, and "review"
    // writes one under this user's name -- all four need the caller's real,
    // verified identity (see assertOwnsBooking in bookings.ts), never a
    // client-claimed userId from the body. A demo guest was previously able
    // to edit another guest's booking this way; see the comment on
    // assertOwnsBooking for the confirmed incident this line prevents.
    const userId = await getAuthenticatedUserId(req);

    if (action === "status") {
      const data = await bookingsAPI.updateBookingStatus(
        bookingId,
        body.status,
        body.cancelledBy,
        body.reason,
        userId,
      );
      return NextResponse.json({ data });
    }

    if (action === "dates") {
      const data = await bookingsAPI.updateBookingDates(bookingId, body.checkIn, body.checkOut, userId);
      return NextResponse.json({ data });
    }

    if (action === "guests") {
      const data = await bookingsAPI.updateBookingGuests(
        bookingId,
        Number(body.adults ?? 0),
        Number(body.children ?? 0),
        Number(body.pets ?? 0),
        userId,
      );
      return NextResponse.json({ data });
    }

    if (action === "review") {
      const data = await bookingsAPI.createReview({
        listing_id: Number(body.listingId),
        user_id: userId,
        rating: Number(body.rating),
        comment: body.comment ?? null,
      });
      return NextResponse.json({ data });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    return jsonError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { bookingId, addon } = await req.json();
    if (!bookingId || !addon) {
      return NextResponse.json({ error: "bookingId and addon are required" }, { status: 400 });
    }

    const data = await bookingsAPI.addBookingAddon(bookingId, addon);
    return NextResponse.json({ data });
  } catch (err) {
    return jsonError(err);
  }
}
