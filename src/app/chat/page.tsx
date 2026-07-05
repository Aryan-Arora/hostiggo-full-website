'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import ChatWorkspace from '@/components/features/ChatWorkspace';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

function ChatContent() {
  const searchParams = useSearchParams();
  const hostUuid = searchParams.get('hostId');
  const [hostUserId, setHostUserId] = useState<string | null>(null);
  const [hostName, setHostName] = useState<string | null>(null);
  const [resolving, setResolving] = useState(!!hostUuid);

  // Resolve hostUuid to host's user_id and name
  useEffect(() => {
    if (!hostUuid) {
      setResolving(false);
      return;
    }

    const resolveHost = async () => {
      try {
        const response = await fetch(`/api/chat?hostUuid=${encodeURIComponent(hostUuid)}`);
        if (!response.ok) throw new Error('Failed to resolve host');
        const data = await response.json();
        if (data.data?.userId) {
          setHostUserId(data.data.userId);
          setHostName(data.data.name || 'Host');
        }
      } catch (error) {
        console.error('Failed to resolve host:', error);
      } finally {
        setResolving(false);
      }
    };

    resolveHost();
  }, [hostUuid]);

  if (resolving) {
    return (
      <div className="pt-4 min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <main className="pt-4">
      <ChatWorkspace 
        audience="guest" 
        initialSelectedId={hostUserId ?? undefined}
        initialHostName={hostName ?? undefined}
      />
    </main>
  );
}

export default function UserChatPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/signin');
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Suspense fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      }>
        <ChatContent />
      </Suspense>
    </div>
  );
}
