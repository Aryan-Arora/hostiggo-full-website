"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

function playNotificationSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, context.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.18);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.2);
    oscillator.addEventListener("ended", () => void context.close());
  } catch {
    // Browsers can block audio until the user has interacted with the page.
  }
}

export default function NotificationListener() {
  const { userId } = useAuth();

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`global-notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "hostiggo_testing_schema",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          toast(payload.new.title ?? "New notification", {
            description: payload.new.message,
          });
          playNotificationSound();
          window.dispatchEvent(new CustomEvent("hostiggo:notification", { detail: payload.new }));
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  return null;
}