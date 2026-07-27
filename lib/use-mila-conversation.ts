"use client";

// Shared, refresh-proof persistence for MiLa's conversation. The widget and the
// full /mila page both read/write the SAME stored conversation, so:
//   • refreshing the page no longer wipes the chat (the bug Patrick hit)
//   • expanding widget → /mila continues seamlessly
//   • collapsing /mila → widget keeps the thread
//
// Uses localStorage (survives refresh AND new tabs for ~the session) with a
// timestamp so a stale conversation from days ago doesn't resurrect awkwardly.

import { useState, useEffect, useCallback, useRef } from "react";

export type MilaCard = {
  mls_id: string; address: string; city: string | null; price: string;
  beds: number | null; baths: number | null; sqft: number | null;
  arch_style: string | null; image: string | null; href: string;
};
export type MilaMsg = { role: "user" | "assistant"; content: string; cards?: MilaCard[] };

const KEY = "mila_conversation_v1";
const MAX_AGE_MS = 1000 * 60 * 60 * 6; // 6 hours — a fresh visit after that starts clean

interface Stored {
  messages: MilaMsg[];
  sessionId: string;
  at: number;
}

function newSessionId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : "s_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function load(): Stored | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Stored;
    if (!s || !Array.isArray(s.messages) || Date.now() - (s.at ?? 0) > MAX_AGE_MS) return null;
    return s;
  } catch {
    return null;
  }
}

/**
 * @param opener the assistant's first greeting bubble; seeded when there's no
 *               stored conversation yet.
 */
export function useMilaConversation(opener: string) {
  // Start empty on the server / first client render to avoid hydration
  // mismatch; hydrate from storage in the effect below.
  const [messages, setMessages] = useState<MilaMsg[]>([{ role: "assistant", content: opener }]);
  const sessionId = useRef<string>("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = load();
    if (stored && stored.messages.length) {
      setMessages(stored.messages);
      sessionId.current = stored.sessionId || newSessionId();
    } else {
      sessionId.current = newSessionId();
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist on every change (after hydration so we don't clobber stored state
  // with the initial opener-only array).
  useEffect(() => {
    if (!hydrated) return;
    try {
      // Don't persist a lone opener bubble — wait until there's real conversation.
      if (messages.length <= 1) return;
      const payload: Stored = { messages, sessionId: sessionId.current, at: Date.now() };
      localStorage.setItem(KEY, JSON.stringify(payload));
    } catch { /* storage full / unavailable — non-fatal */ }
  }, [messages, hydrated]);

  const reset = useCallback(() => {
    try { localStorage.removeItem(KEY); } catch { /* noop */ }
    sessionId.current = newSessionId();
    setMessages([{ role: "assistant", content: opener }]);
  }, [opener]);

  return { messages, setMessages, sessionId, hydrated, reset };
}
