/**
 * useChat Hook
 * 
 * Custom React hook for managing chat WebSocket connections with JWT authentication.
 * Handles token management, connection lifecycle, and message handling.
 * 
 * Usage:
 * const { socket, isConnected, error } = useChat({
 *   onMessage: (msg) => console.log('New message:', msg),
 *   autoConnect: true
 * });
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  initializeChatSocketWithToken,
  ensureTokenFresh,
  getAuthToken,
} from '@/lib/services/chat-token-handler';
import type { ChatMessage } from '@/lib/chatSocket';

export interface UseChatOptions {
  onMessage?: (message: ChatMessage) => void;
  onError?: (error: any) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  autoConnect?: boolean;
  tokenRefreshInterval?: number; // ms - how often to check token freshness
}

export interface UseChatReturn {
  socket: Awaited<ReturnType<typeof initializeChatSocketWithToken>> | null;
  isConnected: boolean;
  isLoading: boolean;
  error: Error | null;
  sendMessage: (text: string, recipientId: string) => string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  currentToken: string | null;
}

export function useChat(options: UseChatOptions = {}): UseChatReturn {
  const {
    onMessage,
    onError,
    onConnect,
    onDisconnect,
    autoConnect = true,
    tokenRefreshInterval = 60000, // Check token every minute
  } = options;

  const [socket, setSocket] = useState<Awaited<ReturnType<typeof initializeChatSocketWithToken>> | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentToken, setCurrentToken] = useState<string | null>(null);
  
  const tokenRefreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  /**
   * Connect to chat with JWT token
   */
  const connect = useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log('[useChat] Connecting to chat...');

      // Initialize socket with all options
      const chatSocket = await initializeChatSocketWithToken({
        onMessage: (msg) => {
          if (isMountedRef.current) {
            onMessage?.(msg);
          }
        },
        onError: (err) => {
          if (isMountedRef.current) {
            console.error('[useChat] Chat error:', err);
            setError(err instanceof Error ? err : new Error(String(err)));
            onError?.(err);
          }
        },
        onConnect: () => {
          if (isMountedRef.current) {
            console.log('[useChat] Chat connected');
            setIsConnected(true);
            onConnect?.();
          }
        },
        onDisconnect: () => {
          if (isMountedRef.current) {
            console.log('[useChat] Chat disconnected');
            setIsConnected(false);
            onDisconnect?.();
          }
        },
      });

      if (chatSocket) {
        setSocket(chatSocket);
        
        // Get current token for display/debugging
        const token = await getAuthToken();
        if (token) {
          setCurrentToken(token);
        }
      } else {
        const err = new Error('Failed to initialize chat socket');
        setError(err);
        onError?.(err);
      }
    } catch (err) {
      if (isMountedRef.current) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error('[useChat] Connection error:', error);
        setError(error);
        onError?.(error);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [isLoading, onMessage, onError, onConnect, onDisconnect]);

  /**
   * Disconnect from chat
   */
  const disconnect = useCallback(() => {
    console.log('[useChat] Disconnecting from chat');
    
    if (socket) {
      socket.close();
      setSocket(null);
      setIsConnected(false);
    }

    if (tokenRefreshTimeoutRef.current) {
      clearTimeout(tokenRefreshTimeoutRef.current);
      tokenRefreshTimeoutRef.current = null;
    }
  }, [socket]);

  /**
   * Send a message
   */
  const sendMessage = useCallback(
    (text: string, recipientId: string): string | null => {
      if (!socket || !isConnected) {
        console.warn('[useChat] Cannot send message - not connected');
        return null;
      }

      console.log('[useChat] Sending message...');
      return socket.sendMessage(text, recipientId);
    },
    [socket, isConnected]
  );

  /**
   * Token refresh monitoring
   */
  const setupTokenRefreshCheck = useCallback(() => {
    if (tokenRefreshTimeoutRef.current) {
      clearTimeout(tokenRefreshTimeoutRef.current);
    }

    tokenRefreshTimeoutRef.current = setInterval(async () => {
      if (!isMountedRef.current) return;

      try {
        const token = await getAuthToken();
        if (token) {
          const isValid = await ensureTokenFresh(token);
          
          if (!isValid && socket) {
            console.warn('[useChat] Token refresh failed - reconnecting');
            disconnect();
            // Small delay before reconnecting
            setTimeout(() => {
              if (isMountedRef.current) {
                connect();
              }
            }, 1000);
          }
        }
      } catch (err) {
        console.error('[useChat] Token refresh check error:', err);
      }
    }, tokenRefreshInterval) as unknown as NodeJS.Timeout;
  }, [socket, disconnect, connect, tokenRefreshInterval]);

  /**
   * Auto-connect on mount
   */
  useEffect(() => {
    isMountedRef.current = true;

    if (autoConnect) {
      connect();
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [autoConnect, connect]);

  /**
   * Setup token refresh monitoring
   */
  useEffect(() => {
    if (isConnected && socket) {
      setupTokenRefreshCheck();
    }

    return () => {
      if (tokenRefreshTimeoutRef.current) {
        clearTimeout(tokenRefreshTimeoutRef.current);
      }
    };
  }, [isConnected, socket, setupTokenRefreshCheck]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      disconnect();
    };
  }, [disconnect]);

  return {
    socket,
    isConnected,
    isLoading,
    error,
    sendMessage,
    connect,
    disconnect,
    currentToken,
  };
}
