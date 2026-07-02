'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Archive,
  ArrowDown,
  ArrowLeft,
  BadgeIndianRupee,
  Bell,
  Check,
  ChevronDown,
  CircleSlash,
  Flag,
  Globe2,
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

const GUEST_CONVERSATIONS: Conversation[] = [
  {
    id: 'daksh-basin',
    name: 'Daksh Basin',
    role: 'host',
    avatar: 'https://i.pravatar.cc/120?img=12',
    propertyImage: '/hero-bg.jpg',
    preview: 'hi can i have a night with...',
    date: 'Today',
    unread: 1,
    subtitle: 'Show listing',
    messages: [
      {
        id: 'm1',
        from: 'them',
        body: 'Hi Sanjay, the room is available tonight. I can also arrange a late check-in.',
        time: '19:42 pm',
      },
      {
        id: 'm2',
        from: 'me',
        body: 'Great, can I have a night with breakfast included?',
        time: '19:48 pm',
      },
    ],
  },
  {
    id: 'aarsi-bhasin',
    name: 'Aarsi Bhasin',
    role: 'host',
    avatar: 'https://i.pravatar.cc/120?img=32',
    propertyImage: '/auth-bg.jpg',
    preview: 'Sent: hi, baby can we have a...',
    date: '20/12/25',
    subtitle: 'Show listing',
    messages: [
      {
        id: 'm1',
        from: 'me',
        body: 'Hi, I wanted to confirm whether early check-in is possible for my booking.',
        time: '18:10 pm',
      },
      {
        id: 'm2',
        from: 'them',
        body: 'Yes, early check-in is possible after 11 am. I will keep the listing ready for you.',
        time: '18:24 pm',
      },
    ],
  },
  {
    id: 'aarsi-kitchen',
    name: 'Aarsi Bhasin',
    role: 'host',
    avatar: 'https://i.pravatar.cc/120?img=32',
    propertyImage: '/auth-bg.jpg',
    preview: 'Sent: hi, baby can we have a...',
    date: '20/12/25',
    subtitle: 'Show listing',
    messages: [
      {
        id: 'm1',
        from: 'them',
        body: 'The kitchen is shared, but you will have your own shelf and utensils during the stay.',
        time: '15:31 pm',
      },
    ],
  },
  {
    id: 'aarsi-window',
    name: 'Aarsi Bhasin',
    role: 'host',
    avatar: 'https://i.pravatar.cc/120?img=32',
    propertyImage: '/auth-bg.jpg',
    preview: 'Sent: hi, baby can we have a...',
    date: '20/12/25',
    subtitle: 'Show listing',
    messages: [
      {
        id: 'm1',
        from: 'me',
        body: 'Can you share a photo of the balcony view?',
        time: '12:08 pm',
      },
    ],
  },
  {
    id: 'support-guest',
    name: 'Hostiggo',
    role: 'support',
    avatar: 'https://i.pravatar.cc/120?img=47',
    preview: 'Sent: trust me i only love you and...',
    date: '20/12/25',
    subtitle: 'Support Team',
    messages: [
      {
        id: 'm1',
        from: 'me',
        body: 'Hi, I faced an issue with the host during my stay and would like to report it. Please guide me on the next steps',
        time: '21:00 pm',
      },
      {
        id: 'm2',
        from: 'them',
        body: "Hi Sanjay. Thanks for reaching out to us. We're sorry to hear that you're facing this issue. We're currently checking the details of your booking and will get back to you shortly with an update. If you have any additional information or screenshots, feel free to share them here. It will help us resolve this faster.",
        time: '21:02 pm',
      },
    ],
  },
];

const HOST_CONVERSATIONS: Conversation[] = [
  {
    id: 'sanjay-booking',
    name: 'Sanjay Mehra',
    role: 'guest',
    avatar: 'https://i.pravatar.cc/120?img=15',
    propertyImage: '/hero-bg.jpg',
    preview: 'Can I check in around 9 pm today?',
    date: 'Today',
    unread: 2,
    subtitle: 'Garden studio booking',
    messages: [
      {
        id: 'm1',
        from: 'them',
        body: 'Hi, can I check in around 9 pm today? My train reaches a little late.',
        time: '17:30 pm',
      },
      {
        id: 'm2',
        from: 'me',
        body: 'That works. I will keep the keys at reception and message you the entry instructions before 8 pm.',
        time: '17:35 pm',
      },
      {
        id: 'm3',
        from: 'them',
        body: 'Perfect, thank you. Please also confirm if parking is available.',
        time: '17:38 pm',
      },
    ],
  },
  {
    id: 'riya-inquiry',
    name: 'Riya Sharma',
    role: 'guest',
    avatar: 'https://i.pravatar.cc/120?img=44',
    propertyImage: '/auth-bg.jpg',
    preview: 'Is the balcony private?',
    date: 'Today',
    subtitle: 'Listing inquiry',
    messages: [
      {
        id: 'm1',
        from: 'them',
        body: 'Is the balcony private or shared with other guests?',
        time: '11:14 am',
      },
    ],
  },
  {
    id: 'support-host',
    name: 'Hostiggo',
    role: 'support',
    avatar: 'https://i.pravatar.cc/120?img=47',
    preview: 'Your payout ticket is being reviewed...',
    date: '20/12/25',
    subtitle: 'Support Team',
    messages: [
      {
        id: 'm1',
        from: 'them',
        body: 'Your payout ticket is being reviewed. We will notify you as soon as the bank response arrives.',
        time: '10:05 am',
      },
    ],
  },
  {
    id: 'archived-guest',
    name: 'Ankit Roy',
    role: 'guest',
    avatar: 'https://i.pravatar.cc/120?img=59',
    propertyImage: '/hero-bg.jpg',
    preview: 'Thanks for hosting us.',
    date: '18/12/25',
    archived: true,
    subtitle: 'Completed stay',
    messages: [
      {
        id: 'm1',
        from: 'them',
        body: 'Thanks for hosting us. The place was exactly as shown.',
        time: '09:20 am',
      },
    ],
  },
];

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

function ChatTopBar() {
  return (
    <header className="h-[72px] flex-shrink-0 bg-white shadow-[0_8px_28px_rgba(0,71,114,0.10)]">
      <div className="mx-auto flex h-full max-w-[1160px] items-center justify-between px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#004772] text-[18px] font-bold leading-none text-white">
            H
          </span>
          <span className="text-[18px] font-black uppercase tracking-wide text-[#4b5563]">
            Hosti<span className="text-blue-600">ggo</span>
          </span>
        </Link>

        <nav className="flex items-center gap-2 text-[13px] font-bold text-[#004772]">
          <button className="hidden items-center gap-1.5 border-r border-gray-200 px-3 py-2 sm:flex">
            <BadgeIndianRupee className="h-4 w-4" />
            INR.
          </button>
          <button className="hidden items-center gap-1.5 border-r border-gray-200 px-3 py-2 sm:flex">
            <Globe2 className="h-4 w-4" />
            English
          </button>
          <Link href="/signin" className="hidden px-3 py-2 sm:block">
            Sign In
          </Link>
          <Link
            href="/host/list/property-type"
            className="hidden rounded-lg border-2 border-[#004772] px-6 py-2.5 font-bold text-[#004772] transition-colors hover:bg-blue-50 md:block"
          >
            List your property
          </Link>
          <Link
            href="/account/profile"
            className="ml-1 h-10 w-10 overflow-hidden rounded-full border border-gray-200"
            aria-label="Open profile"
          >
            <img
              src="https://i.pravatar.cc/120?img=11"
              alt="Profile"
              className="h-full w-full object-cover"
            />
          </Link>
        </nav>
      </div>
    </header>
  );
}

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
        className="inline-flex h-8 items-center gap-1 rounded-full border border-blue-600 bg-blue-50 px-4 text-sm font-medium text-blue-700"
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
              conversation.date === 'Today' ? 'text-blue-600' : 'text-gray-500',
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
            <span className="ml-auto flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-[9px] font-bold text-white">
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
        You don't have any chat for this moment
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
              ? 'rounded-2xl rounded-br-md bg-blue-600 text-white shadow-[0_2px_9px_rgba(15,23,42,0.12)]'
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
}: {
  conversation?: Conversation;
  onBack?: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [draft, setDraft] = useState('');

  if (!conversation) {
    return (
      <section className="h-[70vh] min-w-0 rounded-[2rem] border border-gray-300 bg-white md:h-[calc(100vh-220px)] md:min-h-[520px]">
        <EmptyThread />
      </section>
    );
  }

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
            <Link
              href="#"
              className="text-[12px] font-semibold leading-tight text-gray-800 underline underline-offset-2"
            >
              {conversation.subtitle}
            </Link>
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
        {conversation.messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            avatar={conversation.avatar}
          />
        ))}
      </div>

      <button
        aria-label="Jump to latest message"
        className="absolute bottom-[78px] right-7 flex h-8 w-8 items-center justify-center rounded-full bg-[#004772] text-white shadow-md"
      >
        <ArrowDown className="h-4 w-4" />
      </button>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          setDraft('');
        }}
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
          disabled={!draft.trim()}
          className={cn(
            'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-white transition-colors',
            draft.trim() ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300',
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
}: {
  audience: 'guest' | 'host';
  initialSelectedId?: string;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterKey>('all');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId ?? null);

  const conversations = audience === 'host' ? HOST_CONVERSATIONS : GUEST_CONVERSATIONS;

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
      <ChatTopBar />

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
              selectedId || filtered.length === 0 ? 'border-blue-600' : 'border-gray-300',
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
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
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
              {filtered.length === 0 ? (
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
                className="mx-auto mt-3 h-7 rounded-md border border-[#004772] px-4 text-[11px] font-semibold text-[#004772] hover:bg-blue-50"
              >
                Clear filters
              </button>
            )}
          </aside>

          <div className={cn('min-w-0', selectedId ? 'block' : 'hidden md:block')}>
            <ConversationPanel
              conversation={selectedConversation}
              onBack={() => setSelectedId(null)}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
