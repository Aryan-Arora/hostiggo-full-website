import { NextRequest, NextResponse } from "next/server";
import {
  deleteChat,
  fetchChatHistory,
  postMessageFallback,
  resolveHostInfo,
} from "@/lib/services/chat";

export const dynamic = "force-dynamic";

const jsonError = (err: unknown, status = 500) =>
  NextResponse.json({ error: err instanceof Error ? err.message : "Request failed" }, { status });

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");
    const hostUuid = req.nextUrl.searchParams.get("hostUuid");

    if (hostUuid) {
      // Resolve host_uuid to user_id
      const data = await resolveHostInfo(hostUuid);
      return NextResponse.json({ data });
    }

    if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });
    const data = await fetchChatHistory(userId);
    return NextResponse.json({ data });
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { senderId, recipientId, text, senderType } = await req.json();
    if (!senderId || !recipientId || !text) {
      return NextResponse.json(
        { error: "senderId, recipientId, and text are required" },
        { status: 400 },
      );
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

    const data = await postMessageFallback(senderId, recipientId, trimmed, senderType);
    return NextResponse.json({ data });
  } catch (err) {
    return jsonError(err);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId, hostId } = await req.json();
    if (!userId || !hostId) {
      return NextResponse.json({ error: "userId and hostId are required" }, { status: 400 });
    }

    await deleteChat(userId, hostId);
    return NextResponse.json({ data: true });
  } catch (err) {
    return jsonError(err);
  }
}
