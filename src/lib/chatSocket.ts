/**
 * Chat Monitor WebSocket Integration
 * Connects to: https://ai-chat-monitor.onrender.com/ws/chat
 * 
 * Features:
 * - Real-time message validation
 * - Blocks messages with contact info (phone, email, social media)
 * - Pre-flight message validation via REST
 * - Automatic reconnection
 * - Heartbeat (PING/PONG)
 */

export interface ChatMessage {
  id: string;
  text: string;
  recipientId: string;
  senderId: string;
  action: 'SENT' | 'BLOCK' | 'PING' | 'PONG';
  timestamp?: string;
}

export interface BlockedMessage {
  clientMsgId: string;
  reason: string[];
  message: string;
}

const MONITOR_URL = process.env.NEXT_PUBLIC_CHAT_MONITOR_URL || 'https://ai-chat-monitor.onrender.com';

/**
 * Validate message using REST endpoint before sending via WebSocket
 * @param userId - User sending the message
 * @param content - Message content to validate
 * @returns { action, reasons } - ALLOW or BLOCK with reasons if blocked
 */
export async function validateMessage(userId: string, content: string) {
  try {
    const response = await fetch(`${MONITOR_URL}/monitor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        content,
      }),
    });

    if (!response.ok) {
      console.error('[chatSocket] Validation request failed:', response.status);
      return { action: 'ALLOW', reasons: [] };
    }

    return await response.json();
  } catch (error) {
    console.error('[chatSocket] Validation error:', error);
    return { action: 'ALLOW', reasons: [] };
  }
}

/**
 * Check if chat monitor service is online
 */
export async function checkChatMonitorHealth() {
  try {
    const response = await fetch(`${MONITOR_URL}/health`);
    if (!response.ok) return false;
    const data = await response.json();
    return data.status === 'online';
  } catch (error) {
    console.error('[chatSocket] Health check failed:', error);
    return false;
  }
}

/**
 * Create a WebSocket connection to chat monitor
 * @param userId - Authenticated user ID
 * @param token - JWT token for authentication
 * @param onMessage - Callback when message is received/blocked
 * @param onError - Callback on error
 * @returns Object with sendMessage method and cleanup function
 */
export function createChatSocket(
  userId: string,
  token: string,
  onMessage?: (msg: ChatMessage) => void,
  onError?: (error: any) => void,
  onConnect?: () => void,
  onDisconnect?: () => void,
) {
  let ws: WebSocket | null = null;
  let reconnectTimeout: NodeJS.Timeout | null = null;
  let heartbeatInterval: NodeJS.Timeout | null = null;
  let isManualClose = false;

  const connect = () => {
    if (ws && ws.readyState === WebSocket.OPEN) return;

    try {
      const wsUrl = `${MONITOR_URL.replace(/^https?:/, 'wss:')}/ws/chat?token=${token}`;
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('[chatSocket] Connected');
        onConnect?.();

        // Start heartbeat
        heartbeatInterval = setInterval(() => {
          if (ws?.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ action: 'PING' }));
          }
        }, 30000); // Every 30 seconds
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.action === 'PONG') {
            // Respond to heartbeat
            return;
          }

          if (data.action === 'PING') {
            // Respond to server ping
            ws?.send(JSON.stringify({ action: 'PONG' }));
            return;
          }

          onMessage?.(data);
        } catch (err) {
          console.error('[chatSocket] Message parse error:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('[chatSocket] WebSocket error:', error);
        onError?.(error);
      };

      ws.onclose = () => {
        console.log('[chatSocket] Disconnected');
        if (heartbeatInterval) clearInterval(heartbeatInterval);
        onDisconnect?.();

        // Attempt reconnect if not manual close
        if (!isManualClose && !reconnectTimeout) {
          reconnectTimeout = setTimeout(() => {
            reconnectTimeout = null;
            connect();
          }, 3000); // Retry after 3 seconds
        }
      };
    } catch (err) {
      console.error('[chatSocket] Connection error:', err);
      onError?.(err);
    }
  };

  const sendMessage = (text: string, recipientId: string) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.error('[chatSocket] WebSocket not connected');
      return null;
    }

    const clientMsgId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    try {
      ws.send(
        JSON.stringify({
          text,
          recipient_id: recipientId,
          client_msg_id: clientMsgId,
        }),
      );
      return clientMsgId;
    } catch (err) {
      console.error('[chatSocket] Send error:', err);
      return null;
    }
  };

  const close = () => {
    isManualClose = true;
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    if (reconnectTimeout) clearTimeout(reconnectTimeout);
    if (ws) {
      ws.close();
      ws = null;
    }
  };

  const isConnected = () => ws?.readyState === WebSocket.OPEN;

  // Auto-connect
  connect();

  return {
    sendMessage,
    close,
    isConnected,
    connect,
  };
}

/**
 * Format block reasons into user-friendly message
 */
export function formatBlockReasons(reasons: string[]): string {
  const blockMessages: Record<string, string> = {
    phone_number: "Phone numbers can't be shared in this chat.",
    email_address: "Email addresses can't be shared in this chat.",
    social_media_handle: "Social media handles can't be shared in this chat.",
    website: "Websites and URLs can't be shared without permission.",
    payment_info: "Payment information can't be shared in this chat.",
  };

  return reasons
    .map((r) => blockMessages[r] || `${r.replace(/_/g, ' ')} not allowed in chat.`)
    .join(' ');
}
