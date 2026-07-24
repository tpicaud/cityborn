'use client';

import { useCallback, useEffect, useRef } from 'react';
import useSWR from 'swr';

interface ActiveUser {
  id: string;
  name: string;
  color: string;
  lastSeen: number;
  currentPage: string;
}

const getUserId = () => {
  if (typeof window === 'undefined') return '';

  try {
    let userId = localStorage.getItem('cryptoast-user-id');
    if (!userId) {
      userId = `user-${Math.random().toString(36).slice(2, 11)}-${Date.now()}`;
      localStorage.setItem('cryptoast-user-id', userId);
    }
    return userId;
  } catch {
    return `user-${Math.random().toString(36).slice(2, 11)}-${Date.now()}`;
  }
};

export function usePresence(currentPage = '/dashboard') {
  const userId = getUserId();
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef(0);

  const { data, mutate } = useSWR<{ users: ActiveUser[] }>('/api/presence', {
    refreshInterval: 15000,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });

  const sendHeartbeat = useCallback(async () => {
    if (!userId) return;

    try {
      const response = await fetch('/api/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'heartbeat',
          currentPage,
        }),
      });

      if (response.ok) {
        mutate();
      }
    } catch (error) {
      console.error('Heartbeat failed:', error);
    }
  }, [userId, currentPage, mutate]);

  const sendLeave = useCallback(async () => {
    if (!userId) return;

    try {
      await fetch('/api/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'leave',
        }),
      });
    } catch (error) {
      console.error('Leave signal failed:', error);
    }
  }, [userId]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <needed>
  useEffect(() => {
    if (!userId) return;

    sendHeartbeat();

    heartbeatRef.current = setInterval(sendHeartbeat, 15000);

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        sendHeartbeat();
      }
    };

    const handleActivity = () => {
      const now = Date.now();
      if (now - lastActivityRef.current > 10000) {
        lastActivityRef.current = now;
        sendHeartbeat();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('mousemove', handleActivity);
    document.addEventListener('keydown', handleActivity);
    document.addEventListener('click', handleActivity);

    const handleBeforeUnload = () => {
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          '/api/presence',
          JSON.stringify({
            userId,
            action: 'leave',
          }),
        );
      } else {
        sendLeave();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('mousemove', handleActivity);
      document.removeEventListener('keydown', handleActivity);
      document.removeEventListener('click', handleActivity);
      window.removeEventListener('beforeunload', handleBeforeUnload);

      sendLeave();
    };
  }, [userId, currentPage, sendHeartbeat, sendLeave]);

  return {
    activeUsers: data?.users || [],
    currentUserId: userId,
  };
}
