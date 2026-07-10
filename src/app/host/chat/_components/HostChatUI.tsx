'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Send, Search, MoreVertical, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/hooks/useChat';
import { supabase } from '@/lib/supabase';
import type { ChatMessage } from '@/lib/chatSocket';

interface ConversationUser {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: string;
  isFromMe: boolean;
}

export default function HostChatUI() {
  const { user, userId } = useAuth();
  const { socket, isConnected } = useChat({ autoConnect: true });
  
  const [conversations, setConversations] = useState<ConversationUser[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversations on mount
  useEffect(() => {
    const fetchConversations = async () => {
      if (!userId) return;

      try {
        setLoading(true);
        const response = await fetch(`/api/chat?userId=${encodeURIComponent(userId)}`);
        
        if (!response.ok) throw new Error('Failed to fetch conversations');
        
        const data = await response.json();
        
        const formattedConversations: ConversationUser[] = (data.data || []).map((chat: any) => ({
          id: chat.participant_id,
          name: chat.participant_name || 'Guest',
          avatar: chat.participant_avatar || 'https://i.pravatar.cc/150',
          lastMessage: chat.last_message || 'No messages yet',
          lastMessageTime: chat.last_message_time ? formatTime(new Date(chat.last_message_time)) : 'Never',
          unreadCount: chat.unread_count || 0,
        }));
        
        setConversations(formattedConversations);
        
        // Set first conversation as selected by default
        if (formattedConversations.length > 0 && !selectedConversationId) {
          setSelectedConversationId(formattedConversations[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch conversations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [userId, selectedConversationId]);

  // Fetch messages for selected conversation
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedConversationId || !userId) return;

      try {
        const response = await fetch(`/api/chat?userId=${encodeURIComponent(userId)}&conversationId=${selectedConversationId}`);
        
        if (!response.ok) throw new Error('Failed to fetch messages');
        
        const data = await response.json();
        
        const formattedMessages: Message[] = (data.data?.messages || []).map((msg: any) => ({
          id: msg.id,
          text: msg.text,
          senderId: msg.sender_id,
          senderName: msg.sender_name || 'Unknown',
          timestamp: formatTime(new Date(msg.timestamp)),
          isFromMe: msg.sender_id === userId,
        }));
        
        setMessages(formattedMessages);
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      }
    };

    fetchMessages();
  }, [selectedConversationId, userId]);

  // Subscribe to real-time messages
  useEffect(() => {
    if (!userId || !selectedConversationId) return;

    const channel = supabase
      .channel(`chat:${selectedConversationId}:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `recipient_id.eq.${selectedConversationId},sender_id.eq.${userId}`,
        },
        (payload: any) => {
          const newMsg = payload.new;
          const formattedMessage: Message = {
            id: newMsg.id,
            text: newMsg.content,
            senderId: newMsg.sender_id,
            senderName: newMsg.sender_name || 'Unknown',
            timestamp: formatTime(new Date(newMsg.created_at)),
            isFromMe: newMsg.sender_id === userId,
          };
          
          setMessages((prev) => [...prev, formattedMessage]);
          
          // Update conversation list
          setConversations((prev) =>
            prev.map((conv) =>
              conv.id === selectedConversationId
                ? { ...conv, lastMessage: newMsg.content, lastMessageTime: 'Now' }
                : conv
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, selectedConversationId]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedConversationId || !userId || sending) return;

    setSending(true);
    const textToSend = messageText.trim();

    // Optimistically add message to UI
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      text: textToSend,
      senderId: userId,
      senderName: user?.name || 'You',
      timestamp: 'now',
      isFromMe: true,
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setMessageText('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: userId,
          recipientId: selectedConversationId,
          text: textToSend,
          senderType: 'host',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const result = await response.json();
      
      // Replace optimistic message with real one
      if (result.data) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === optimisticMessage.id
              ? {
                  id: result.data.id,
                  text: result.data.text,
                  senderId: result.data.sender_id,
                  senderName: user?.name || 'You',
                  timestamp: formatTime(new Date(result.data.timestamp)),
                  isFromMe: true,
                }
              : msg
          )
        );
      }

      // Update conversation preview
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === selectedConversationId
            ? { ...conv, lastMessage: textToSend, lastMessageTime: 'Now' }
            : conv
        )
      );
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((msg) => msg.id !== optimisticMessage.id));
      // Restore text
      setMessageText(textToSend);
    } finally {
      setSending(false);
    }
  }, [messageText, selectedConversationId, userId, user, sending]);

  const selectedConversation = conversations.find((c) => c.id === selectedConversationId);
  
  const filteredConversations = conversations.filter((conv) =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-full gap-4">
      {/* Conversations Sidebar */}
      <div className="w-full md:w-80 flex flex-col bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Guest Conversations</h2>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search guests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-500">Loading conversations...</p>
              </div>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-gray-500 text-center px-4">
                {searchQuery ? 'No conversations found' : 'No conversations yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-2 p-2">
              {filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversationId(conv.id)}
                  className={`w-full text-left p-3 rounded-lg transition-all ${
                    selectedConversationId === conv.id
                      ? 'bg-blue-100 border border-blue-300'
                      : 'hover:bg-gray-100 border border-transparent'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={conv.avatar}
                      alt={conv.name}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      onError={(e) => {
                        e.currentTarget.src = 'https://i.pravatar.cc/150';
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-semibold text-gray-900 truncate text-sm">
                          {conv.name}
                        </h3>
                        <span className="text-xs text-gray-500 flex-shrink-0">
                          {conv.lastMessageTime}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-1">
                        {conv.lastMessage}
                      </p>
                    </div>
                    {conv.unreadCount > 0 && (
                      <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-600 text-white text-xs font-bold rounded-full flex-shrink-0">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl border border-gray-200 overflow-hidden md:min-w-0">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={selectedConversation.avatar}
                  alt={selectedConversation.name}
                  className="w-10 h-10 rounded-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'https://i.pravatar.cc/150';
                  }}
                />
                <div>
                  <h3 className="font-bold text-gray-900">{selectedConversation.name}</h3>
                  <p className="text-xs text-gray-500">
                    {isConnected ? 'Connected' : 'Connecting...'}
                  </p>
                </div>
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <MoreVertical className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-gray-500">No messages yet. Start a conversation!</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.isFromMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        msg.isFromMe
                          ? 'bg-blue-600 text-white rounded-br-none'
                          : 'bg-gray-200 text-gray-900 rounded-bl-none'
                      }`}
                    >
                      <p className="text-sm break-words">{msg.text}</p>
                      <p
                        className={`text-xs mt-1 ${
                          msg.isFromMe ? 'text-blue-100' : 'text-gray-600'
                        }`}
                      >
                        {msg.timestamp}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form
              onSubmit={handleSendMessage}
              className="p-4 border-t border-gray-200 bg-white flex gap-2"
            >
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type your message..."
                disabled={sending || !isConnected}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={sending || !messageText.trim() || !isConnected}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-gray-500 text-lg font-medium">Select a conversation to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to format time
function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString();
}
