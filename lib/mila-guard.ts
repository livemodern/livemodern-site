// lib/mila-guard.ts
//
// The "belt" behind the "suspenders" — defense-in-depth for consumer MiLa, per
// the security review (output scanning, rate limiting, audit logging).
//
// These are backstops, not the primary lock. The primary lock is that consumer
// MiLa has no tool that reaches private data. These catch the residual cases:
// a leaked contact detail slipping into a reply, a burst of enumeration probes,
// and an audit trail to SEE an attack ("100 slightly different requests").

const SB_URL = process.env.SUPABASE_URL ?? "https://ezcikavnfchqaenweygw.supabase.co";
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

// ── OUTPUT SCANNER ──────────────────────────────────────────────────────────
// Catch contact details in a reply that the visitor did NOT themselves provide.
// MiLa has no tool that returns another person's email/phone, so any such string
// in her output is either (a) something the visitor typed (fine to echo) or
// (b) a leak/hallucination (scrub it). We compare against what the visitor said.

const EMAIL_G = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
// US-style phone: 10 digits in common groupings. Deliberately conservative.
const PHONE_G = /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;

function digitsOnly(s: string): string {
  return s.replace(/\D/g, "");
}

export interface ScanResult {
  clean: string;
  leaked: boolean;
  kinds: string[];
}

/**
 * Redact any email/phone in MiLa's reply that doesn't appear in what the visitor
 * has said this conversation. Office contact info (the team's own published
 * number/email) is allowed via an allowlist.
 */
export function scanOutput(reply: string, visitorText: string, allow: { emails?: string[]; phones?: string[] } = {}): ScanResult {
  const kinds: string[] = [];
  const allowedEmails = new Set((allow.emails ?? []).map((e) => e.toLowerCase()));
  const allowedPhones = new Set((allow.phones ?? []).map(digitsOnly));

  // Everything the visitor typed is fair to echo back.
  for (const m of visitorText.matchAll(EMAIL_G)) allowedEmails.add(m[0].toLowerCase());
  for (const m of visitorText.matchAll(PHONE_G)) allowedPhones.add(digitsOnly(m[0]));

  let clean = reply.replace(EMAIL_G, (m) =>
    allowedEmails.has(m.toLowerCase()) ? m : (kinds.push("email"), "[removed]"),
  );
  clean = clean.replace(PHONE_G, (m) => {
    const d = digitsOnly(m);
    // ignore obvious non-phones (prices, years handled by the 10-digit shape)
    if (d.length !== 10 && d.length !== 11) return m;
    return allowedPhones.has(d.slice(-10)) ? m : (kinds.push("phone"), "[removed]");
  });

  return { clean, leaked: kinds.length > 0, kinds: Array.from(new Set(kinds)) };
}

// ── RATE LIMIT (in-memory, per-instance) ────────────────────────────────────
// Catches abusive bursts (enumeration, injection spamming) within a single
// serverless instance's lifetime. Not a durable global limit — that moves to KV
// when we add it — but enough to blunt a scripted attack against one session.

type Bucket = { count: number; windowStart: number; blockedUntil: number };
const buckets = new Map<string, Bucket>();
const WINDOW_MS = 60_000;   // 1 minute
const MAX_PER_WINDOW = 20;  // generous for a real chat, tight for a script
const BLOCK_MS = 120_000;   // 2-minute cool-off on trip

export function rateLimit(key: string): { ok: boolean; retryAfterS?: number } {
  const now = Date.now();
  let b = buckets.get(key);
  if (!b) { b = { count: 0, windowStart: now, blockedUntil: 0 }; buckets.set(key, b); }

  if (b.blockedUntil > now) return { ok: false, retryAfterS: Math.ceil((b.blockedUntil - now) / 1000) };

  if (now - b.windowStart > WINDOW_MS) { b.count = 0; b.windowStart = now; }
  b.count++;
  if (b.count > MAX_PER_WINDOW) {
    b.blockedUntil = now + BLOCK_MS;
    return { ok: false, retryAfterS: Math.ceil(BLOCK_MS / 1000) };
  }
  // opportunistic cleanup so the map can't grow unbounded
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (v.blockedUntil < now && now - v.windowStart > WINDOW_MS * 5) buckets.delete(k);
  }
  return { ok: true };
}

// ── AUDIT LOG (fire-and-forget → site_events) ───────────────────────────────
// One row per MiLa turn: session, the tools she called, whether the output
// scanner tripped, and a refusal/injection flag. Lets us SEE an enumeration or
// injection campaign after the fact. Deliberately does NOT store the full
// message bodies — minimal by design (the security doc's logging caution).

export function logMilaTurn(entry: {
  sessionId: string | null;
  tools: string[];
  outputLeaked: boolean;
  flags: string[];           // e.g. ["rate_limited"], ["injection_suspected"]
  known: boolean;
}): void {
  if (!SB_KEY) return;
  try {
    void fetch(`${SB_URL}/rest/v1/site_events`, {
      method: "POST",
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({
        event_type: "mila_turn",
        session_id: entry.sessionId,
        site_slug: "livemodern",
        data: { tools: entry.tools, output_leaked: entry.outputLeaked, flags: entry.flags, known_visitor: entry.known },
      }),
    }).catch(() => {});
  } catch {
    /* logging must never break the chat */
  }
}

// ── INPUT HEURISTIC (soft signal for logging only) ──────────────────────────
// Not a blocker — the model's own firewall handles refusal. This just FLAGS
// likely injection/enumeration attempts so the log can surface a campaign.
const INJECTION_HINTS = [
  /ignore (all |your |previous )?(instructions|rules)/i,
  /system prompt|reveal (your )?(prompt|instructions|tools)/i,
  /developer mode|admin mode|jailbreak|dan mode/i,
  /base64|rot13|reverse the (text|characters)/i,
  /you are now|pretend (to be|you are)|act as/i,
  /(seller'?s|buyer'?s|client'?s) (notes|offer|contract|motivation)/i,
  /who (bought|sold|owns|lives)/i,
];

export function looksSuspicious(text: string): boolean {
  return INJECTION_HINTS.some((re) => re.test(text));
}

// ── FULL-TRANSCRIPT CAPTURE (fire-and-forget → mila_conversations) ──────────
// The human-review record: the WHOLE conversation, upserted per turn keyed on
// (session_id, site_slug). Separate from the security-minimal site_events log —
// this one intentionally keeps message bodies so you can read a chat back,
// analyze accuracy, and spot a problem conversation. No UI here; the viewer
// lives in mlg-admin.

type TranscriptTurn = { role: "user" | "assistant"; content: string; at?: string };

export function captureConversation(entry: {
  sessionId: string | null;
  siteSlug?: string;
  transcript: TranscriptTurn[];
  toolsUsed: string[];
  listingsShown: string[];
  flags: string[];
  knownVisitor: boolean;
  leadCaptured: boolean;
  userAgent?: string | null;
  referrer?: string | null;
}): void {
  if (!SB_KEY || !entry.sessionId) return;
  const siteSlug = entry.siteSlug ?? "livemodern";
  const now = new Date().toISOString();
  const row = {
    session_id: entry.sessionId,
    site_slug: siteSlug,
    surface: "consumer",
    transcript: entry.transcript,
    message_count: entry.transcript.length,
    tools_used: Array.from(new Set(entry.toolsUsed)),
    listings_shown: Array.from(new Set(entry.listingsShown)),
    flags: Array.from(new Set(entry.flags)),
    known_visitor: entry.knownVisitor,
    lead_captured: entry.leadCaptured,
    user_agent: entry.userAgent ?? null,
    referrer: entry.referrer ?? null,
    updated_at: now,
  };
  try {
    // Upsert on the (session_id, site_slug) unique index — merge-duplicates so
    // each turn overwrites the growing transcript for this session.
    void fetch(`${SB_URL}/rest/v1/mila_conversations?on_conflict=session_id,site_slug`, {
      method: "POST",
      headers: {
        apikey: SB_KEY,
        Authorization: `Bearer ${SB_KEY}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify(row),
    }).catch(() => {});
  } catch {
    /* capture must never break the chat */
  }
}
