import { NextRequest, NextResponse } from "next/server";
import {
  ChatPermissionError,
  deleteChat,
  detectContactSharing,
  fetchChatHistory,
  logModeration,
  postMessage,
  resolveHostInfo,
} from "@/lib/services/chat";
import { errorMessage } from "@/lib/api-error";
import { forbiddenResponse, readJsonBody, requireUserId } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

const jsonError = (err: unknown, status = 500) => {
  console.error("[/api/chat] error:", err);
  return NextResponse.json({ error: errorMessage(err, "Request failed") }, { status });
};

export async function GET(req: NextRequest) {
  try {
    const hostUuid = req.nextUrl.searchParams.get("hostUuid");
    if (hostUuid) {
      // Public: resolves a listing's host to their chat id + display name.
      const data = await resolveHostInfo(hostUuid);
      return NextResponse.json({ data });
    }

    const userId = await requireUserId(req);
    if (userId instanceof NextResponse) return userId;
    const requested = req.nextUrl.searchParams.get("userId");
    if (requested && requested !== userId) return forbiddenResponse();

    const data = await fetchChatHistory(userId);
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

    const { senderId, recipientId, text } = body;
    const senderType = body.senderType === "host" ? "host" : "user";
    if (senderId && senderId !== userId) return forbiddenResponse();
    if (!recipientId || typeof recipientId !== "string" || !text) {
      return NextResponse.json({ error: "recipientId and text are required" }, { status: 400 });
    }
    const trimmed = String(text).trim();
    if (!trimmed) {
      return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });
    }
    if (trimmed.length > 4000) {
      return NextResponse.json(
        { error: "Message must be 4000 characters or fewer" },
        { status: 400 },
      );
    }

    const moderation = detectContactSharing(trimmed);
    if (moderation.blocked) {
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
      await logModeration(userId, trimmed, moderation, ip);
      return NextResponse.json(
        {
          error:
            "For your safety, phone numbers, emails, UPI ids and outside links can't be shared in chat. Contact details are shared automatically once a booking is confirmed.",
          code: "CONTACT_SHARING_BLOCKED",
        },
        { status: 422 },
      );
    }

    const data = await postMessage(userId, recipientId, trimmed, senderType);
    return NextResponse.json({ data });
  } catch (err) {
    if (err instanceof ChatPermissionError) return forbiddenResponse(err.message);
    return jsonError(err);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = await requireUserId(req);
    if (userId instanceof NextResponse) return userId;
    const body = await readJsonBody(req);
    if (body instanceof NextResponse) return body;

    // The caller may be either side of the thread; `hostId` names the other
    // participant (kept for the existing client payload shape).
    if (body.userId && body.userId !== userId) return forbiddenResponse();
    const otherId = body.hostId ?? body.participantId;
    if (!otherId || typeof otherId !== "string") {
      return NextResponse.json({ error: "hostId is required" }, { status: 400 });
    }

    await deleteChat(userId, otherId);
    return NextResponse.json({ data: true });
  } catch (err) {
    return jsonError(err);
  }
}
