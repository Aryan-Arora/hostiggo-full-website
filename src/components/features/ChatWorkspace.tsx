'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Archive,
  ArrowDown,
  ArrowLeft,
  Bell,
  Check,
  ChevronDown,
  CircleSlash,
  Flag,
  Headphones,
  Image as ImageIcon,
  MessageSquareText,
  MoreVertical,
  Pin,
  Search,
  Send,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

type ChatRole = 'guest' | 'host' | 'support';
type FilterKey = 'all' | 'primary' | 'support' | 'archived';

type Message = {
  id: string;
  body: string;
  time: string;
  from: 'me' | 'them';
};

type Conversation = {
  id: string;
  name: string;
  role: ChatRole;
  avatar: string;
  propertyImage?: string;
  preview: string;
  date: string;
  unread?: number;
  archived?: boolean;
  subtitle: string;
  messages: Message[];
};

const GUEST_CONVERSATIONS: Conversation[] = [];

const HOST_CONVERSATIONS: Conversation[] = [];

const FILTER_LABELS: Record<FilterKey, string> = {
  all: 'All',
  primary: 'Hosts',
  support: 'Support team',
  archived: 'Archived',
};

const MENU_ITEMS = [
  { label: 'Pin this chat', icon: Pin },
  { label: 'Mark as unread', icon: Bell },
  { label: 'Archive', icon: Archive },
  { label: 'Report', icon: Flag, separated: true },
];

function FilterDropdown({
  audience,
  filter,
  open,
  onOpenChange,
  onFilterChange,
}: {
  audience: ChatRole;
  filter: FilterKey;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFilterChange: (filter: FilterKey) => void;
}) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const primaryLabel = audience === 'host' ? 'Guests' : 'Hosts';
  const options: { key: FilterKey; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'primary', label: primaryLabel },
    { key: 'support', label: 'Support team' },
    { key: 'archived', label: 'Archived' },
  ];

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        onOpenChange(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [onOpenChange, open]);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => onOpenChange(!open)}
        className="inline-flex h-8 items-center gap-1 rounded-full border border-figma-navy bg-figma-navy/5 px-4 text-sm font-medium text-figma-navy/90"
      >
        {filter === 'primary' ? primaryLabel : FILTER_LABELS[filter]}
        <ChevronDown className="h-3.5 w-3.5" />
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+6px)] z-20 w-[172px] rounded-sm border border-gray-200 bg-white py-2 shadow-[0_7px_18px_rgba(0,0,0,0.18)]">
          {options.map((option) => (
            <button
              key={option.key}
              onClick={() => {
                onFilterChange(option.key);
                onOpenChange(false);
              }}
              className="flex w-full items-center justify-between px-5 py-2.5 text-left text-[13px] font-medium text-gray-700 hover:bg-gray-50"
            >
              {option.label}
              {option.key === filter && (
                <Check className="h-4 w-4 text-[#0074bd]" strokeWidth={2.5} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ConversationRow({
  conversation,
  selected,
  onClick,
}: {
  conversation: Conversation;
  selected: boolean;
  onClick: () => void;
}) {
  const isSupport = conversation.role === 'support';

  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative flex h-[58px] w-full items-center rounded-xl border border-gray-100 bg-white px-2 text-left transition-all',
        selected
          ? 'shadow-[0_8px_18px_rgba(15,23,42,0.17)]'
          : 'hover:shadow-[0_6px_16px_rgba(15,23,42,0.10)]',
      )}
    >
      <div className="relative mr-3 flex h-11 w-[70px] flex-shrink-0 items-center">
        {conversation.propertyImage && !isSupport ? (
          <img
            src={conversation.propertyImage}
            alt=""
            onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
            className="h-11 w-[58px] rounded-xl object-cover"
          />
        ) : (
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-500">
            <Headphones className="h-4 w-4" />
          </span>
        )}
        <img
          src={conversation.avatar}
          alt=""
          onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
          className={cn(
            'absolute h-9 w-9 rounded-full border-2 border-white object-cover',
            conversation.propertyImage && !isSupport ? 'right-0' : 'left-5',
          )}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <span className="truncate text-[12px] font-bold leading-tight text-gray-900">
            {conversation.name}
          </span>
          <span
            className={cn(
              'flex-shrink-0 text-[9px] leading-tight',
              conversation.date === 'Today' ? 'text-figma-navy' : 'text-gray-500',
            )}
          >
            {conversation.date}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <p className="truncate text-[11px] font-medium text-gray-500">
            {conversation.preview}
          </p>
          {conversation.unread && (
            <span className="ml-auto flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-figma-navy text-[9px] font-bold text-white">
              {conversation.unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function EmptyList() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
      <CircleSlash className="mb-5 h-9 w-9 text-gray-500" strokeWidth={1.8} />
      <p className="max-w-[190px] text-[13px] font-semibold leading-5 text-gray-500">
        You don&apos;t have any chat for this moment
      </p>
    </div>
  );
}

function EmptyThread() {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <MessageSquareText className="mb-5 h-12 w-12 text-gray-400" strokeWidth={1.6} />
      <p className="text-[15px] font-semibold text-gray-500">
        Open any chat to start messaging
      </p>
    </div>
  );
}

function ChatActionMenu({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onOpenChange(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [onOpenChange, open]);

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => onOpenChange(!open)}
        aria-label="Open chat actions"
        className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 transition-colors hover:bg-gray-50"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-30 w-[178px] rounded-sm border border-gray-200 bg-white py-2 shadow-[0_8px_18px_rgba(0,0,0,0.18)]">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                className={cn(
                  'flex w-full items-center gap-3 px-4 py-2.5 text-left text-[13px] font-medium text-gray-700 hover:bg-gray-50',
                  item.separated && 'mt-1 border-t border-gray-200 pt-3',
                )}
              >
                <Icon className="h-4 w-4 text-gray-600" />
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MessageBubble({
  message,
  avatar,
}: {
  message: Message;
  avatar: string;
}) {
  const mine = message.from === 'me';

  return (
    <div className={cn('flex items-end gap-2', mine ? 'justify-end' : 'justify-start')}>
      {!mine && (
        <img
          src={avatar}
          alt=""
          onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
          className="mb-1 h-8 w-8 flex-shrink-0 rounded-full border border-white object-cover"
        />
      )}
      <div className={cn('max-w-[74%]', mine ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'px-4 py-3 text-[13px] leading-5',
            mine
              ? 'rounded-2xl rounded-br-md bg-figma-navy text-white shadow-[0_2px_9px_rgba(15,23,42,0.12)]'
              : 'rounded-2xl rounded-bl-md bg-gray-100 text-gray-900',
          )}
        >
          {message.body}
        </div>
        <div
          className={cn(
            'mt-1 text-[11px] font-medium text-gray-500',
            mine ? 'text-right' : 'text-left',
          )}
        >
          {message.time}
        </div>
      </div>
    </div>
  );
}

function ConversationPanel({
  conversation,
  onBack,
  onMessageSent,
}: {
  conversation?: Conversation;
  onBack?: () => void;
  onMessageSent?: () => void;
}) {
  const { userId } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<Message[]>(conversation?.messages ?? []);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Update messages when conversation changes
  useEffect(() => {
    setMessages(conversation?.messages ?? []);
  }, [conversation?.messages]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!conversation) {
    return (
      <section className="h-[70vh] min-w-0 rounded-[2rem] border border-gray-300 bg-white md:h-[calc(100vh-220px)] md:min-h-[520px]">
        <EmptyThread />
      </section>
    );
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || !userId) return;

    const messageText = draft.trim();
    
    // Optimistically add message to UI
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      body: messageText,
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      from: 'me',
    };
    
    setMessages(prev => [...prev, optimisticMessage]);
    setDraft('');
    setSending(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: userId,
          recipientId: conversation.id,
          text: messageText,
          senderType: 'user',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send message');
      }

      // Remove the temporary message and fetch fresh data
      const result = await response.json();
      if (result.data) {
        // Replace temp message with real one
        setMessages(prev => 
          prev.map(msg => msg.id === optimisticMessage.id ? {
            id: result.data.id,
            body: result.data.text,
            time: new Date(result.data.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            from: 'me',
          } : msg)
        );
      }
      
      onMessageSent?.();
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove the optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="relative flex h-[70vh] min-w-0 flex-col rounded-[2rem] border border-gray-300 bg-white px-5 py-4 md:h-[calc(100vh-220px)] md:min-h-[520px]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={onBack}
            aria-label="Back to chats"
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-gray-700 hover:bg-gray-100 md:hidden"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <img
            src={conversation.avatar}
            alt=""
            onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
            className="h-11 w-11 rounded-full object-cover"
          />
          <div className="min-w-0">
            <h2 className="truncate text-[16px] font-black leading-tight text-gray-900">
              {conversation.name}
            </h2>
            <p className="text-[12px] font-semibold leading-tight text-gray-800">
              {conversation.subtitle}
            </p>
          </div>
        </div>
        <ChatActionMenu open={menuOpen} onOpenChange={setMenuOpen} />
      </div>

      <div className="my-4 flex items-center gap-3 px-20 text-[11px] font-medium text-gray-500">
        <span className="h-px flex-1 bg-gray-200" />
        Today
        <span className="h-px flex-1 bg-gray-200" />
      </div>

      <div className="reviews-scroll flex-1 space-y-6 overflow-y-auto pr-2">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            avatar={conversation.avatar}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <button
        aria-label="Jump to latest message"
        className="absolute bottom-[78px] right-7 flex h-8 w-8 items-center justify-center rounded-full bg-[#004772] text-white shadow-md"
      >
        <ArrowDown className="h-4 w-4" />
      </button>

      <form
        onSubmit={handleSendMessage}
        className="mt-2 flex h-[50px] items-center gap-2 rounded-full border border-gray-300 bg-white py-1 pl-4 pr-1"
      >
        <button
          type="button"
          aria-label="Attach image"
          className="hidden text-gray-400 hover:text-gray-600 sm:block"
        >
          <ImageIcon className="h-4 w-4" />
        </button>
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Type here..."
          className="min-w-0 flex-1 bg-transparent text-[13px] font-medium text-gray-700 outline-none placeholder:text-gray-400"
        />
        <button
          type="submit"
          aria-label="Send message"
          disabled={!draft.trim() || sending}
          className={cn(
            'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-white transition-colors',
            draft.trim() && !sending ? 'bg-figma-navy hover:bg-figma-navy/90' : 'bg-gray-300',
          )}
        >
          <Send className="h-5 w-5 fill-current" />
        </button>
      </form>
    </section>
  );
}

export default function ChatWorkspace({
  audience,
  initialSelectedId,
  initialHostName,
}: {
  audience: 'guest' | 'host';
  initialSelectedId?: string;
  initialHostName?: string;
}) {
  const router = useRouter();
  const { userId } = useAuth();
  const [filter, setFilter] = useState<FilterKey>('all');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId ?? null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  // Load conversations from API and subscribe to real-time updates
  useEffect(() => {
    const loadConversations = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Fetch conversations from the chat API
        const response = await fetch(`/api/chat?userId=${encodeURIComponent(userId)}`);
        if (!response.ok) throw new Error('Failed to load conversations');
        const data = await response.json();
        
        // Map API response to Conversation format
        let mappedConversations: Conversation[] = (data.data || []).map((chat: any) => ({
          id: chat.participant_id,
          name: chat.participant_name || 'Host',
          role: chat.type || 'host',
          avatar: 'https://i.pravatar.cc/150',
          preview: chat.last_message || 'No messages yet',
          date: chat.last_message_time ? 'Today' : 'Never',
          subtitle: 'Property host',
          messages: (chat.messages || []).map((msg: any) => ({
            id: msg.id,
            body: msg.text,
            time: new Date(msg.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            from: msg.sender_id === userId ? 'me' : 'them',
          })),
        }));
        
        // If we have an initialSelectedId but it's not in the conversations, create a new one
        if (initialSelectedId && !mappedConversations.find(c => c.id === initialSelectedId)) {
          const newConversation: Conversation = {
            id: initialSelectedId,
            name: initialHostName && initialHostName !== 'Host' ? initialHostName : 'Property host',
            role: 'host',
            avatar: 'https://i.pravatar.cc/150',
            preview: 'No messages yet',
            date: 'Now',
            subtitle: initialHostName && initialHostName !== 'Host' ? initialHostName : 'Property host',
            messages: [],
          };
          mappedConversations.unshift(newConversation);
        }
        
        setConversations(mappedConversations);
      } catch (error) {
        console.error('Failed to load conversations:', error);
        setConversations([]);
      } finally {
        setLoading(false);
      }
    };

    loadConversations();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`chat:user:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'hostiggo_testing_schema',
          table: 'chat_messages',
          filter: `or(user_id.eq.${userId},host_id.eq.${userId})`,
        },
        (payload: any) => {
          const newMsg = payload.new;
          const participantId = newMsg.user_id === userId ? newMsg.host_id : newMsg.user_id;
          
          setConversations((prev) => {
            const updated = [...prev];
            const convIndex = updated.findIndex(c => c.id === participantId);
            
            if (convIndex >= 0) {
              // Update existing conversation
              const senderIsCurrentUser = newMsg.sender_type === 'user' ? newMsg.user_id === userId : newMsg.host_id === userId;
              updated[convIndex].messages.push({
                id: newMsg.id,
                body: newMsg.content,
                time: new Date(newMsg.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
                from: senderIsCurrentUser ? 'me' : 'them',
              });
              updated[convIndex].preview = newMsg.content;
              updated[convIndex].date = 'Now';
              
              // Move to top
              const [conversation] = updated.splice(convIndex, 1);
              updated.unshift(conversation);
            } else {
              // Create new conversation if it doesn't exist
              const senderIsCurrentUser = newMsg.sender_type === 'user' ? newMsg.user_id === userId : newMsg.host_id === userId;
              const newConversation: Conversation = {
                id: participantId,
                name: 'New conversation',
                role: 'host',
                avatar: 'https://i.pravatar.cc/150',
                preview: newMsg.content,
                date: 'Now',
                subtitle: 'Property host',
                messages: [{
                  id: newMsg.id,
                  body: newMsg.content,
                  time: new Date(newMsg.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
                  from: senderIsCurrentUser ? 'me' : 'them',
                }],
              };
              updated.unshift(newConversation);
            }
            
            return updated;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, initialSelectedId, initialHostName]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return conversations.filter((conversation) => {
      if (filter === 'primary') {
        const expectedRole = audience === 'host' ? 'guest' : 'host';
        if (conversation.role !== expectedRole || conversation.archived) return false;
      }
      if (filter === 'support' && conversation.role !== 'support') return false;
      if (filter === 'archived' && !conversation.archived) return false;
      if (filter === 'all' && conversation.archived) return false;
      if (unreadOnly && !conversation.unread) return false;

      if (!normalizedQuery) return true;
      return [conversation.name, conversation.preview, conversation.subtitle]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [audience, conversations, filter, query, unreadOnly]);

  const selectedConversation = conversations.find(
    (conversation) => conversation.id === selectedId,
  );
  const primaryHeading = audience === 'host' ? 'Guests' : 'Hosts';
  const supportItems = filtered.filter((item) => item.role === 'support');
  const primaryItems = filtered.filter((item) => item.role !== 'support');
  const hasFilters = filter !== 'all' || unreadOnly || query.trim().length > 0;

  return (
    <div className="min-h-screen bg-[#fffdf8] text-gray-900">
      <main className="mx-auto flex max-w-[1520px] gap-6 px-4 pb-8 pt-8 sm:px-8 lg:gap-8">
        <button
          onClick={() => router.push('/')}
          aria-label="Go to home"
          className="mt-5 hidden h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-white text-[#004772] shadow-[0_8px_20px_rgba(15,23,42,0.18)] transition-transform hover:-translate-x-0.5 md:flex"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="grid min-w-0 flex-1 grid-cols-1 gap-5 md:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[400px_minmax(0,1fr)]">
          <aside
            className={cn(
              'h-[70vh] min-w-0 flex-col rounded-[2rem] border bg-white px-6 py-6 transition-colors md:flex md:h-[calc(100vh-220px)] md:min-h-[520px]',
              selectedId ? 'hidden' : 'flex',
              selectedId || filtered.length === 0 ? 'border-figma-navy' : 'border-gray-300',
            )}
          >
            <h1 className="text-[30px] font-semibold tracking-tight text-gray-950">Chats</h1>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <FilterDropdown
                audience={audience === 'host' ? 'host' : 'guest'}
                filter={filter}
                open={filterOpen}
                onOpenChange={setFilterOpen}
                onFilterChange={setFilter}
              />
              <button
                onClick={() => setUnreadOnly((value) => !value)}
                className={cn(
                  'h-8 rounded-full border px-4 text-sm font-medium transition-colors',
                  unreadOnly
                    ? 'border-figma-navy bg-figma-navy/5 text-figma-navy/90'
                    : 'border-gray-300 bg-white text-gray-900 hover:bg-gray-50',
                )}
              >
                Unread
              </button>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-full border border-gray-300 bg-white px-4">
                <Search className="h-5 w-5 flex-shrink-0 text-black" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search"
                  className="min-w-0 flex-1 bg-transparent text-[13px] font-medium text-gray-700 outline-none placeholder:text-gray-400"
                />
              </label>
              <button
                aria-label="Chat settings"
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              >
                <Settings className="h-5 w-5" />
              </button>
            </div>

            <div className="reviews-scroll mt-5 flex min-h-0 flex-1 flex-col overflow-y-auto pr-2">
              {loading ? (
                <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
                  <div className="w-7 h-7 border-2 border-figma-navy/40 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-[12px] text-figma-navy font-medium">
                    Loading conversations…
                  </p>
                </div>
              ) : filtered.length === 0 ? (
                <EmptyList />
              ) : (
                <div className="space-y-5">
                  {primaryItems.length > 0 && (
                    <section>
                      <h2 className="mb-2 text-[15px] font-semibold text-gray-900">
                        {filter === 'archived' ? 'Archived' : primaryHeading}
                      </h2>
                      <div className="space-y-3">
                        {primaryItems.map((conversation) => (
                          <ConversationRow
                            key={conversation.id}
                            conversation={conversation}
                            selected={conversation.id === selectedId}
                            onClick={() => setSelectedId(conversation.id)}
                          />
                        ))}
                      </div>
                    </section>
                  )}

                  {supportItems.length > 0 && (
                    <section>
                      <h2 className="mb-2 text-[15px] font-semibold text-gray-900">
                        Support Team
                      </h2>
                      <div className="space-y-3">
                        {supportItems.map((conversation) => (
                          <ConversationRow
                            key={conversation.id}
                            conversation={conversation}
                            selected={conversation.id === selectedId}
                            onClick={() => setSelectedId(conversation.id)}
                          />
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              )}
            </div>

            {hasFilters && (
              <button
                onClick={() => {
                  setFilter('all');
                  setUnreadOnly(false);
                  setQuery('');
                }}
                className="mx-auto mt-3 h-7 rounded-md border border-[#004772] px-4 text-[11px] font-semibold text-[#004772] hover:bg-figma-navy/5"
              >
                Clear filters
              </button>
            )}
          </aside>

          <div className={cn('min-w-0', selectedId ? 'block' : 'hidden md:block')}>
            <ConversationPanel
              conversation={selectedConversation}
              onBack={() => setSelectedId(null)}
              onMessageSent={() => {
                // Conversation will be updated automatically by the real-time subscription
              }}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
