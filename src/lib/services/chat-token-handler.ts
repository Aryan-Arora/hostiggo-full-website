/**
 * Chat Token Handler Service
 * 
 * Manages JWT token acquisition and integration with chat WebSocket system.
 * Step-by-step token flow for real-time chat authentication.
 * 
 * Token Flow:
 * 1. Get current session from Supabase auth
 * 2. Extract JWT token from session.access_token
 * 3. Pass token to createChatSocket for WebSocket authentication
 * 4. Backend validates token on connection
 * 5. WebSocket establishes authenticated connection
 */

import { supabase } from '@/lib/supabase';
import { createChatSocket } from '@/lib/chatSocket';

export interface ChatTokenConfig {
  token: string;
  userId: string;
  expiresAt?: number;
}

export interface ChatSocketOptions {
  onMessage?: (msg: any) => void;
  onError?: (error: any) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

/**
 * Step 1: Get the JWT token from Supabase session
 * This is the authentication token that identifies the user
 * 
 * @returns JWT token string or null if not authenticated
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    // Get current session from Supabase
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('[chatTokenHandler] Auth session error:', error);
      return null;
    }

    if (!data?.session?.access_token) {
      console.warn('[chatTokenHandler] No access token in session');
      return null;
    }

    const token = data.session.access_token;
    console.log('[chatTokenHandler] Successfully retrieved JWT token');
    
    return token;
  } catch (error) {
    console.error('[chatTokenHandler] Failed to get auth token:', error);
    return null;
  }
}

/**
 * Step 2: Get current authenticated user ID
 * Required to identify who is sending/receiving messages
 * 
 * @returns User ID string or null if not authenticated
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const { data, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('[chatTokenHandler] User fetch error:', error);
      return null;
    }

    if (!data?.user?.id) {
      console.warn('[chatTokenHandler] No user ID available');
      return null;
    }

    return data.user.id;
  } catch (error) {
    console.error('[chatTokenHandler] Failed to get user ID:', error);
    return null;
  }
}

/**
 * Step 3: Verify token is still valid
 * Checks token expiration before attempting connection
 * 
 * @param token JWT token to verify
 * @returns true if token is valid, false otherwise
 */
export function isTokenValid(token: string): boolean {
  if (!token) {
    console.warn('[chatTokenHandler] Token is empty');
    return false;
  }

  try {
    // JWT format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.warn('[chatTokenHandler] Invalid JWT format');
      return false;
    }

    // Decode payload (second part)
    const payload = JSON.parse(atob(parts[1]));
    
    // Check expiration
    if (payload.exp) {
      const expiresAt = payload.exp * 1000; // Convert to milliseconds
      const now = Date.now();
      
      if (now > expiresAt) {
        console.warn('[chatTokenHandler] Token has expired');
        return false;
      }
      
      // Warn if token expires soon (within 5 minutes)
      const timeUntilExpiry = expiresAt - now;
      if (timeUntilExpiry < 5 * 60 * 1000) {
        console.warn(`[chatTokenHandler] Token expires in ${Math.round(timeUntilExpiry / 1000)} seconds`);
      }
    }

    console.log('[chatTokenHandler] Token is valid');
    return true;
  } catch (error) {
    console.error('[chatTokenHandler] Token validation error:', error);
    return false;
  }
}

/**
 * Step 4: Refresh token if needed
 * Gets a new token if current one is expired or about to expire
 * 
 * @returns New JWT token or null if refresh failed
 */
export async function refreshAuthToken(): Promise<string | null> {
  try {
    console.log('[chatTokenHandler] Attempting to refresh token');
    
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error('[chatTokenHandler] Token refresh error:', error);
      return null;
    }

    if (!data?.session?.access_token) {
      console.warn('[chatTokenHandler] No access token after refresh');
      return null;
    }

    console.log('[chatTokenHandler] Token refreshed successfully');
    return data.session.access_token;
  } catch (error) {
    console.error('[chatTokenHandler] Failed to refresh token:', error);
    return null;
  }
}

/**
 * Step 5: Initialize chat socket with token
 * Main function to connect to chat WebSocket with authentication
 * 
 * Complete flow:
 * 1. Get user ID
 * 2. Get JWT token from session
 * 3. Verify token is valid
 * 4. Create and return WebSocket connection
 * 
 * @param options - Callback options for WebSocket events
 * @returns WebSocket connection object or null if initialization failed
 */
export async function initializeChatSocketWithToken(
  options?: ChatSocketOptions
): Promise<ReturnType<typeof createChatSocket> | null> {
  try {
    console.log('[chatTokenHandler] Initializing chat socket with token');

    // Step 1: Get current user ID
    const userId = await getCurrentUserId();
    if (!userId) {
      console.error('[chatTokenHandler] Unable to get user ID - cannot connect to chat');
      options?.onError?.(new Error('User not authenticated'));
      return null;
    }
    console.log(`[chatTokenHandler] User ID: ${userId}`);

    // Step 2: Get JWT token
    let token = await getAuthToken();
    if (!token) {
      console.error('[chatTokenHandler] Unable to get auth token - cannot connect to chat');
      options?.onError?.(new Error('Unable to get authentication token'));
      return null;
    }
    console.log('[chatTokenHandler] JWT token obtained');

    // Step 3: Verify token validity
    if (!isTokenValid(token)) {
      console.log('[chatTokenHandler] Token invalid or expired - attempting refresh');
      
      token = await refreshAuthToken();
      if (!token) {
        console.error('[chatTokenHandler] Token refresh failed - cannot connect');
        options?.onError?.(new Error('Authentication token refresh failed'));
        return null;
      }
      console.log('[chatTokenHandler] Token refreshed successfully');
    }

    // Step 4: Create WebSocket connection with token
    console.log('[chatTokenHandler] Creating WebSocket connection...');
    const chatSocket = createChatSocket(
      userId,
      token,
      options?.onMessage,
      options?.onError,
      options?.onConnect,
      options?.onDisconnect
    );

    console.log('[chatTokenHandler] Chat socket created successfully');
    return chatSocket;
  } catch (error) {
    console.error('[chatTokenHandler] Error initializing chat socket:', error);
    options?.onError?.(error);
    return null;
  }
}

/**
 * Step 6: Handle token expiration during connection
 * Monitors token expiration and refreshes when needed
 * 
 * Call this periodically to ensure token stays valid
 * 
 * @param token Current JWT token
 * @returns true if token is still valid, false if refresh needed or failed
 */
export async function ensureTokenFresh(token: string): Promise<boolean> {
  try {
    if (isTokenValid(token)) {
      return true;
    }

    console.log('[chatTokenHandler] Token no longer valid - refreshing');
    const newToken = await refreshAuthToken();
    
    if (newToken) {
      console.log('[chatTokenHandler] Token successfully refreshed');
      return true;
    }

    console.error('[chatTokenHandler] Failed to refresh token');
    return false;
  } catch (error) {
    console.error('[chatTokenHandler] Error ensuring token freshness:', error);
    return false;
  }
}

/**
 * Step 7: Extract token claims/metadata
 * Useful for debugging and understanding token content
 * 
 * @param token JWT token to decode
 * @returns Token claims object or null if invalid
 */
export function getTokenClaims(token: string): Record<string, any> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.warn('[chatTokenHandler] Invalid JWT format for claims extraction');
      return null;
    }

    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch (error) {
    console.error('[chatTokenHandler] Error extracting token claims:', error);
    return null;
  }
}

/**
 * Step 8: Logout and cleanup
 * Invalidates token and cleans up authentication
 * 
 * @returns true if logout successful
 */
export async function logoutAndCleanup(): Promise<boolean> {
  try {
    console.log('[chatTokenHandler] Logging out');
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('[chatTokenHandler] Logout error:', error);
      return false;
    }

    console.log('[chatTokenHandler] Logout successful - token invalidated');
    return true;
  } catch (error) {
    console.error('[chatTokenHandler] Error during logout:', error);
    return false;
  }
}
