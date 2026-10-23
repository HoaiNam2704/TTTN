"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Client, type StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import type { VideoStatusUpdateDto } from "@/types/lesson";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

/** SockJS expects `global` in some bundlers. */
function ensureGlobal() {
  if (typeof window === "undefined") return;
  const g = window as unknown as { global?: typeof globalThis };
  if (g.global === undefined) {
    g.global = globalThis;
  }
}

function normalizeLessonIds(lessonIds: string | string[] | undefined | null): string[] {
  if (!lessonIds) return [];
  const list = Array.isArray(lessonIds) ? lessonIds : [lessonIds];
  return [...new Set(list.filter(Boolean))];
}

/**
 * Subscribes to `/topic/lessons/{id}/video-status` for one or many lessons.
 * Uses SockJS + STOMP with JWT on CONNECT (and handshake query for browsers).
 */
export function useVideoStatusWs(
  lessonIds: string | string[] | undefined | null,
  onStatusChange?: (update: VideoStatusUpdateDto) => void
) {
  const [latestUpdate, setLatestUpdate] = useState<VideoStatusUpdateDto | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const clientRef = useRef<Client | null>(null);
  const subsRef = useRef<Map<string, StompSubscription>>(new Map());
  const onStatusChangeRef = useRef(onStatusChange);
  const wantedIdsRef = useRef<string[]>([]);

  const ids = useMemo(() => normalizeLessonIds(lessonIds), [lessonIds]);
  const idsKey = ids.join(",");
  wantedIdsRef.current = ids;

  useEffect(() => {
    onStatusChangeRef.current = onStatusChange;
  }, [onStatusChange]);

  const handleMessage = (messageBody: string) => {
    try {
      const data = JSON.parse(messageBody) as VideoStatusUpdateDto;
      setLatestUpdate(data);
      onStatusChangeRef.current?.(data);
    } catch (error) {
      console.error("Failed to parse video-status STOMP message", error);
    }
  };

  const syncSubscriptions = (client: Client) => {
    const wanted = new Set(wantedIdsRef.current);
    const current = subsRef.current;

    for (const [lessonId, sub] of current) {
      if (!wanted.has(lessonId)) {
        try {
          sub.unsubscribe();
        } catch {
          // ignore
        }
        current.delete(lessonId);
      }
    }

    for (const lessonId of wanted) {
      if (current.has(lessonId)) continue;
      const sub = client.subscribe(
        `/topic/lessons/${lessonId}/video-status`,
        (message) => {
          if (message.body) handleMessage(message.body);
        }
      );
      current.set(lessonId, sub);
    }
  };

  // Manage connection lifecycle: connect when there is at least one id
  useEffect(() => {
    if (ids.length === 0) {
      const client = clientRef.current;
      if (client) {
        for (const sub of subsRef.current.values()) {
          try {
            sub.unsubscribe();
          } catch {
            // ignore
          }
        }
        subsRef.current.clear();
        void client.deactivate();
        clientRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    ensureGlobal();

    if (clientRef.current?.active) {
      if (clientRef.current.connected) {
        syncSubscriptions(clientRef.current);
      }
      return;
    }

    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken") || ""
        : "";

    const wsUrl = token
      ? `${API_BASE}/ws?access_token=${encodeURIComponent(token)}`
      : `${API_BASE}/ws`;

    const client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      connectHeaders: token
        ? {
            Authorization: `Bearer ${token}`,
            access_token: token,
          }
        : {},
      reconnectDelay: 3000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        setIsConnected(true);
        syncSubscriptions(client);
      },
      onDisconnect: () => {
        setIsConnected(false);
        subsRef.current.clear();
      },
      onWebSocketClose: () => {
        setIsConnected(false);
        subsRef.current.clear();
      },
      onWebSocketError: (error) => {
        console.error("WebSocket error", error);
        setIsConnected(false);
      },
      onStompError: (frame) => {
        console.error("STOMP error:", frame.headers["message"], frame.body);
      },
    });

    clientRef.current = client;
    client.activate();

    return () => {
      // Only fully tear down when unmounting or when ids become empty (handled above).
      // When idsKey changes but stays non-empty, the effect re-runs: keep client if active.
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  // Sync subscriptions when ids change while already connected
  useEffect(() => {
    const client = clientRef.current;
    if (!client?.connected) return;
    syncSubscriptions(client);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  // Full cleanup on unmount
  useEffect(() => {
    return () => {
      for (const sub of subsRef.current.values()) {
        try {
          sub.unsubscribe();
        } catch {
          // ignore
        }
      }
      subsRef.current.clear();
      if (clientRef.current) {
        void clientRef.current.deactivate();
        clientRef.current = null;
      }
    };
  }, []);

  return { latestUpdate, isConnected, subscribedLessonIds: ids };
}
