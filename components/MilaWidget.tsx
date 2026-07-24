"use client";

import { useState, useRef, useEffect } from "react";

type Msg = { role: "user" | "assistant"; content: string };

const GREETING =
  "Hi, my name is MiLa — I'm an AI agent for Modern Living Group. I'm great at narrowing down your home hunt, or matching you with the right agent based on their experience and areas of expertise. What brings you to the site today?";

export default function MilaWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const sessionId = useRef<string>("");

  useEffect(() => {
    // Per-tab session id — used for rate limiting + audit log correlation. Not
    // identity (never authenticates anyone), just a stable handle for this chat.
    if (!sessionId.current) {
      sessionId.current =
        (typeof crypto !== "undefined" && "randomUUID" in crypto)
          ? crypto.randomUUID()
          : "s_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    }
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 200);
  }, [open]);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/mila", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, sessionId: sessionId.current }),
      });
      const data = await res.json();
      setMessages([...next, { role: "assistant", content: data.reply || data.error || "Sorry — try me again?" }]);
    } catch {
      setMessages([...next, { role: "assistant", content: "I lost my connection for a second — say that again?" }]);
    } finally {
      setBusy(false);
    }
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  return (
    <>
      {/* Launcher */}
      <button
        className={`mila-launch ${open ? "hide" : ""}`}
        onClick={() => setOpen(true)}
        aria-label="Chat with MiLa"
      >
        <span className="mila-launch-dot" />
        Ask MiLa
      </button>

      {/* Panel */}
      <div className={`mila-panel ${open ? "on" : ""}`} role="dialog" aria-label="MiLa concierge">
        <header className="mila-head">
          <div>
            <div className="mila-name">MiLa</div>
            <div className="mila-sub">LiveModern concierge</div>
          </div>
          <button className="mila-x" onClick={() => setOpen(false)} aria-label="Close">×</button>
        </header>

        <div className="mila-body" ref={scrollRef}>
          <div className="mila-msg assistant"><p>{GREETING}</p></div>
          {messages.map((m, i) => (
            <div key={i} className={`mila-msg ${m.role}`}>
              {m.content.split("\n").filter(Boolean).map((line, j) => <p key={j}>{line}</p>)}
            </div>
          ))}
          {busy && (
            <div className="mila-msg assistant">
              <p className="mila-typing"><span /><span /><span /></p>
            </div>
          )}
        </div>

        <div className="mila-input">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            rows={1}
            placeholder="Tell MiLa what you're after…"
            aria-label="Message MiLa"
          />
          <button onClick={send} disabled={busy || !input.trim()} aria-label="Send">→</button>
        </div>
      </div>
    </>
  );
}
