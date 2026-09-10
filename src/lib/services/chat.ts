import { supabase } from "../supabase";

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
  type?: "host" | "support" | "user";
  messages: MessageDto[];
  last_message?: string;
  last_message_time?: string;
};

export const fetchChatHistory = async (userId: string): Promise<ChatDto[]> => {
  try {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .or(`user_id.eq.${userId},host_id.eq.${userId}`)
      .order("created_at", { ascending: true });

    if (error) throw error;
    if (!data || data.length === 0) return [];

    const conversations = new Map<string, typeof data>();
    for (const msg of data) {
      const otherId = msg.user_id === userId ? msg.host_id : msg.user_id;
      if (!conversations.has(otherId)) conversations.set(otherId, []);
      conversations.get(otherId)!.push(msg);
    }

    const result: ChatDto[] = [];
    
    for (const [participantId, msgs] of conversations.entries()) {
      const lastMsg = msgs[msgs.length - 1];
      
      // Fetch participant name from users table
      let participantName = "Host";
      try {
        const { data: userData } = await supabase
          .from("users")
          .select("name")
          .eq("user_id", participantId)
          .maybeSingle();
        
        if (userData?.name) {
          participantName = userData.name;
        }
      } catch (nameErr) {
        console.warn(`Failed to fetch name for participant ${participantId}:`, nameErr);
      }
      
      result.push({
        id: participantId,
        participant_id: participantId,
        participant_name: participantName,
        type: "host" as const,
        messages: msgs.map((m: any) => ({
          id: m.id ?? String(m.created_at),
          chat_id: participantId,
          sender_id: m.sender_type === "user" ? m.user_id : m.host_id,
          text: m.content,
          timestamp: m.created_at,
          is_blocked: m.is_blocked ?? false,
        })),
        last_message: lastMsg.content,
        last_message_time: lastMsg.created_at,
      });
    }
    
    return result;
  } catch (err) {
    console.error("fetchChatHistory error", err);
    throw err;
  }
};

export const resolveHostInfo = async (
  hostUuid: string,
): Promise<{ userId: string; name: string } | null> => {
  const { data: hostRow, error: hostErr } = await supabase
    .from("host")
    .select("user_id")
    .eq("host_uuid", hostUuid)
    .single();
  if (hostErr || !hostRow) return null;

  const { data: userRow } = await supabase
    .from("users")
    .select("name")
    .eq("user_id", hostRow.user_id)
    .maybeSingle();

  return { userId: hostRow.user_id, name: userRow?.name ?? "Host" };
};

export const postMessageFallback = async (
  senderId: string,
  recipientId: string,
  text: string,
  senderType: "user" | "host" = "user",
): Promise<MessageDto> => {
  try {
    const row = {
      user_id: senderType === "user" ? senderId : recipientId,
      host_id: senderType === "host" ? senderId : recipientId,
      sender_type: senderType,
      content: text,
      is_blocked: false,
    };
    const { data, error } = await supabase
      .from("chat_messages")
      .insert(row)
      .select()
      .single();

    if (error) throw error;
    return {
      id: data.id,
      chat_id: recipientId,
      sender_id: senderId,
      text: data.content,
      timestamp: data.created_at,
      is_blocked: data.is_blocked,
    };
  } catch (err) {
    console.error("postMessageFallback error", err);
    throw err;
  }
};

export const deleteChat = async (userId: string, hostId: string): Promise<void> => {
  const { error } = await supabase
    .from("chat_messages")
    .delete()
    .or(
      `and(user_id.eq.${userId},host_id.eq.${hostId}),and(user_id.eq.${hostId},host_id.eq.${userId})`,
    );
  if (error) throw error;
};
