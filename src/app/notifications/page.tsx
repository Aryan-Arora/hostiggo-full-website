"use client";

import { Bell, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import Navbar from "@/components/layout/Navbar";

export default function NotificationsPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<any[] | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    api.notifications().then(setNotifications).catch(() => setNotifications([]));
  }, [isAuthenticated]);

  useEffect(() => {
    const handler = (event: Event) => {
      const notification = (event as CustomEvent<any>).detail;
      if (notification) {
        setNotifications((current) => [notification, ...(current ?? [])]);
      }
    };
    window.addEventListener("hostiggo:notification", handler);
    return () => window.removeEventListener("hostiggo:notification", handler);
  }, []);

  const loading = authLoading || (isAuthenticated && notifications === null);
  const items = notifications ?? [];

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 px-4 py-10 sm:px-8">
        <section className="mx-auto max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <Bell className="h-5 w-5 text-figma-navy" />
          <h1 className="text-xl font-semibold text-gray-900">Notifications</h1>
        </div>
        {loading ? (
          <Loader2 className="mx-auto h-5 w-5 animate-spin text-gray-400" />
        ) : items.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-500">Your inbox is empty.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {items.map((notification) => (
              <article key={notification.notification_id ?? notification.id} className="py-4 first:pt-0 last:pb-0">
                <h2 className="font-medium text-gray-900">{notification.title}</h2>
                <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
                {notification.created_at && (
                  <time className="mt-2 block text-xs text-gray-400">
                    {new Date(notification.created_at).toLocaleString("en-IN")}
                  </time>
                )}
              </article>
            ))}
          </div>
        )}
        </section>
      </main>
    </>
  );
}