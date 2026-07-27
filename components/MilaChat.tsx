"use client";

// The full MiLa conversation experience — used on the dedicated /mila page.
// Intake → discovery → she presents real listings as cards inline → back and
// forth like a live agent. Cards come from the /api/mila response `cards` array.

import { useState, useRef, useEffect } from "react";
import MilaAvatar from "@/components/MilaAvatar";
import { formatInline } from "@/lib/format-inline";
import { useMilaConversation, MilaMsg as Msg } from "@/lib/use-mila-conversation";

const OPENER =
  "Hi, my name is MiLa — I'm an AI agent for Modern Living Group. I'm great at narrowing down your home hunt, or matching you with the right agent based on their experience and areas of expertise. What brings you to the site today?";

const STARTERS = [
  "I want a waterfront home with a dock",
  "Show me new construction in Miami",
  "I'm not sure yet — help me figure it out",
  "Who's your Boca Raton expert?",
];

export default function MilaChat() {
  const { messages, setMessages, sessionId, hydrated } = useMilaConversation(OPENER);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // One-time handoff from the floating widget (takes precedence over storage
  // only if it has MORE than what's stored — otherwise persistence already has it).
  useEffect(() => {
    if (!hydrated) return;
    try {
      const raw = sessionStorage.getItem("mila_handoff");
      if (raw) {
        sessionStorage.removeItem("mila_handoff");
        const h = JSON.parse(raw);
        if (Array.isArray(h.messages) && h.messages.length > messages.length - 1) {
          setMessages([{ role: "assistant", content: OPENER }, ...h.messages]);
          if (h.sessionId) sessionId.current = h.sessionId;
        }
      }
    } catch { /* fresh start if handoff unreadable */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  async function send(text: string) {
    const t = text.trim();
    if (!t || busy) return;
    const outgoing: Msg[] = [...messages, { role: "user", content: t }];
    setMessages(outgoing);
    setInput("");
    setBusy(true);
    try {
      // Send only role/content to the API (strip cards from history).
      const apiMessages = outgoing.map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/mila", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages, sessionId: sessionId.current }),
      });
      const data = await res.json();
      setMessages([...outgoing, { role: "assistant", content: data.reply || data.error || "Let me try that again for you.", cards: data.cards?.length ? data.cards : undefined }]);
    } catch {
      setMessages([...outgoing, { role: "assistant", content: "I lost my connection for a second — say that again?" }]);
    } finally {
      setBusy(false);
    }
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
  }

  const started = messages.length > 1;

  return (
    <div className="mfull">
      <div className="mfull-scroll" ref={scrollRef}>
        <div className="mfull-inner">
          {messages.map((m, i) => (
            <div key={i} className={`mfull-row ${m.role}`}>
              {m.role === "assistant" && <div className="mfull-av"><MilaAvatar size={38} /></div>}
              <div className="mfull-bubble-wrap">
                <div className={`mfull-bubble ${m.role}`}>
                  {m.content.split("\n").filter(Boolean).map((line, j) => <p key={j}>{formatInline(line)}</p>)}
                </div>
                {m.cards && m.cards.length > 0 && (
                  <div className="mfull-cards">
                    {m.cards.map((c) => (
                      <a className="mfull-card" key={c.mls_id} href={c.href} target="_blank" rel="noopener noreferrer">
                        <div className="mfull-card-im" style={c.image ? { backgroundImage: `url(${c.image})` } : undefined}>
                          {!c.image && <span className="mfull-card-noim">Modern Living</span>}
                        </div>
                        <div className="mfull-card-body">
                          <div className="mfull-card-price">{c.price}</div>
                          <div className="mfull-card-addr">{c.address}</div>
                          <div className="mfull-card-meta">
                            {[c.city, c.beds ? `${c.beds} BD` : null, c.baths ? `${c.baths} BA` : null, c.sqft ? `${c.sqft.toLocaleString()} sf` : null].filter(Boolean).join(" · ")}
                          </div>
                          {c.arch_style && <div className="mfull-card-style">{c.arch_style}</div>}
                          <div className="mfull-card-cta">View listing →</div>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {busy && (
            <div className="mfull-row assistant">
              <div className="mfull-av"><MilaAvatar size={38} /></div>
              <div className="mfull-bubble assistant"><p className="mfull-typing"><span /><span /><span /></p></div>
            </div>
          )}

          {!started && (
            <div className="mfull-starters">
              {STARTERS.map((s) => (
                <button key={s} className="mfull-starter" onClick={() => send(s)}>{s}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mfull-input-bar">
        <div className="mfull-input-inner">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            rows={1}
            placeholder="Tell MiLa what you're looking for…"
            aria-label="Message MiLa"
          />
          <button onClick={() => send(input)} disabled={busy || !input.trim()} aria-label="Send">→</button>
        </div>
        <p className="mfull-disclaimer">MiLa is an AI assistant. She'll connect you with a licensed Modern Living Group agent when you're ready.</p>
      </div>
    </div>
  );
}
