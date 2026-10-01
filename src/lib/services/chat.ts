import "server-only";
import { supabaseAdmin } from "../supabase-admin";

// All chat reads/writes happen server-side with the service-role client,
// after /api/chat has verified the caller's identity from their token. The
// caller is always one of the two participants of every row touched here.

export type MessageDto = {
  id: string;
  chat_id: string;
  sender_id: string;
  sender_name?: string;
  text: string;
  timestamp: string;
  is_blocked?: boolean;
};

export type ChatDto = {
  id: string;
  participant_id: string;
  participant_name?: string;
  participant_avatar?: string | null;
  type?: "host" | "support" | "user";
  messages: MessageDto[];
  last_message?: string;
  last_message_time?: string;
};

export class ChatPermissionError extends Error {}

export const fetchChatHistory = async (userId: string): Promise<ChatDto[]> => {
  const { data, error } = await supabaseAdmin
    .from("chat_messages")
    .select("id, user_id, host_id, sender_type, content, is_blocked, created_at")
    .or(`user_id.eq.${userId},host_id.eq.${userId}`)
    .order("created_at", { ascending: true })
    .limit(2000);
  if (error) throw error;
  if (!data || data.length === 0) return [];

  const conversations = new Map<string, typeof data>();
  for (const msg of data) {
    const otherId = msg.user_id === userId ? msg.host_id : msg.user_id;
    if (!conversations.has(otherId)) conversations.set(otherId, []);
    conversations.get(otherId)!.push(msg);
  }

  const participantIds = [...conversations.keys()];
  const { data: people } = await supabaseAdmin
    .from("users")
    .select("user_id, name, profile_pic_url")
    .in("user_id", participantIds);
  const byId = new Map((people ?? []).map((p) => [p.user_id, p]));

  const result: ChatDto[] = [];
  for (const [participantId, msgs] of conversations.entries()) {
    const lastMsg = msgs[msgs.length - 1];
    const person = byId.get(participantId);
    // The caller is the host in this thread when they sit in host_id.
    const callerIsHost = msgs[0].host_id === userId;
    result.push({
      id: participantId,
      participant_id: participantId,
      participant_name: person?.name || (callerIsHost ? "Guest" : "Host"),
      participant_avatar: person?.profile_pic_url ?? null,
      type: callerIsHost ? "user" : "host",
      messages: msgs.map((m) => ({
        id: m.id,
        chat_id: participantId,
        sender_id: m.sender_type === "user" ? m.user_id : m.host_id,
        text: m.content,
        timestamp: m.created_at ?? "",
        is_blocked: m.is_blocked ?? false,
      })),
      last_message: lastMsg.content,
      last_message_time: lastMsg.created_at ?? undefined,
    });
  }

  // Most recent conversation first.
  result.sort((a, b) => (b.last_message_time ?? "").localeCompare(a.last_message_time ?? ""));
  return result;
};

export const resolveHostInfo = async (
  hostUuid: string,
): Promise<{ userId: string; name: string } | null> => {
  const { data: hostRow, error: hostErr } = await supabaseAdmin
    .from("host")
    .select("user_id")
    .eq("host_uuid", hostUuid)
    .maybeSingle();
  if (hostErr || !hostRow?.user_id) return null;

  const { data: userRow } = await supabaseAdmin
    .from("users")
    .select("name")
    .eq("user_id", hostRow.user_id)
    .maybeSingle();

  return { userId: hostRow.user_id, name: userRow?.name ?? "Host" };
};

const isHostUser = async (userId: string) => {
  const { data } = await supabaseAdmin
    .from("host")
    .select("host_uuid")
    .eq("user_id", userId)
    .maybeSingle();
  return data?.host_uuid ?? null;
};

/**
 * Who may message whom:
 *  - a guest may start a conversation with any host (to ask about a stay);
 *  - a host may message a guest who has already written to them or holds a
 *    booking at one of their listings -- never cold-message arbitrary users.
 */
async function assertCanMessage(senderId: string, recipientId: string, senderType: "user" | "host") {
  if (senderId === recipientId) throw new ChatPermissionError("You can't message yourself.");

  if (senderType === "user") {
    if (!(await isHostUser(recipientId))) {
      throw new ChatPermissionError("You can only message hosts.");
    }
    return;
  }

  const hostUuid = await isHostUser(senderId);
  if (!hostUuid) throw new ChatPermissionError("Only hosts can reply as a host.");

  const { count: threadCount } = await supabaseAdmin
    .from("chat_messages")
    .select("id", { count: "exact", head: true })
    .eq("user_id", recipientId)
    .eq("host_id", senderId);
  if ((threadCount ?? 0) > 0) return;

  const { count: bookingCount } = await supabaseAdmin
    .from("bookings")
    .select("booking_id", { count: "exact", head: true })
    .eq("user_id", recipientId)
    .eq("host_uuid", hostUuid);
  if ((bookingCount ?? 0) > 0) return;

  throw new ChatPermissionError("You can only message guests who contacted or booked you.");
}

export const postMessage = async (
  senderId: string,
  recipientId: string,
  text: string,
  senderType: "user" | "host" = "user",
): Promise<MessageDto> => {
  await assertCanMessage(senderId, recipientId, senderType);
  const row = {
    user_id: senderType === "user" ? senderId : recipientId,
    host_id: senderType === "host" ? senderId : recipientId,
    sender_type: senderType,
    content: text,
    is_blocked: false,
  };
  const { data, error } = await supabaseAdmin.from("chat_messages").insert(row).select().single();
  if (error) throw error;
  return {
    id: data.id,
    chat_id: recipientId,
    sender_id: senderId,
    text: data.content,
    timestamp: data.created_at ?? new Date().toISOString(),
    is_blocked: data.is_blocked ?? false,
  };
};

export const deleteChat = async (userId: string, otherId: string): Promise<void> => {
  const { error } = await supabaseAdmin
    .from("chat_messages")
    .delete()
    .or(
      `and(user_id.eq.${userId},host_id.eq.${otherId}),and(user_id.eq.${otherId},host_id.eq.${userId})`,
    );
  if (error) throw error;
};

// ---------------------------------------------------------------------------
// Off-platform contact moderation
// ---------------------------------------------------------------------------
// Payments, refunds, reviews and the host's payout protection all depend on
// the booking happening on Hostiggo, so messages that try to move the
// conversation elsewhere (phone numbers, emails, UPI ids, WhatsApp links)
// are blocked and logged to chat_moderation. Once a booking is confirmed the
// guest receives the host's contact details through the booking itself.

export { detectContactSharing } from "../chatModeration";

export async function logModeration(
  userId: string,
  text: string,
  result: { reasons: string[]; sequence?: string },
  clientIp: string | null,
) {
  const { error } = await supabaseAdmin.from("chat_moderation").insert({
    user_id: userId,
    original_text: text.slice(0, 4000),
    extracted_sequence: result.sequence ?? null,
    action_taken: "BLOCK",
    client_ip: clientIp,
    flag_reasons: result.reasons.join(","),
  });
  if (error) console.error("[chat] failed to log moderation event:", error);
}
