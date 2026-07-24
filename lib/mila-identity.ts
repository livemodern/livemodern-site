// lib/mila-identity.ts
//
// CONSUMER identity resolution — the narrow, hardened version (Patrick, 2026-07-24).
//
// Consumer MiLa may know WHO she's talking to and reflect back a SMALL, fixed set
// of that ONE person's own data — nothing else, ever:
//   1. core contact details (first name / email / phone — things they gave us)
//   2. their saved searches
//   3. the properties they've been looking at / saved
//
// EXPLICITLY OUT OF REACH (there is no code path to them here):
//   • DEALS — zero. This module never touches the deals table.
//   • any OTHER person's record, name, email, phone, or activity
//   • internal CRM fields even on the confirmed visitor: background, agent notes,
//     stage, assigned agent, lead source, tags. We never SELECT them.
//
// The design principle: the tool can only return the four allowed things for the
// one confirmed person. Everything else is unreachable by construction, not just
// by prompt. Prompt rules (lib/mila-persona) are the second layer.

const SB_URL = process.env.SUPABASE_URL ?? "https://ezcikavnfchqaenweygw.supabase.co";
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

async function sb(path: string): Promise<any[]> {
  if (!SB_KEY) return [];
  try {
    const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
      cache: "no-store",
    });
    if (!res.ok) return [];
    return (await res.json()) as any[];
  } catch {
    return [];
  }
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const norm = (s: string) => s.trim().toLowerCase();

export interface KnownVisitor {
  known: boolean;
  firstName?: string | null;
  savedSearches?: Array<{ name: string | null; created_at: string }>;
  savedListings?: string[];          // mls ids they saved
  recentlyViewed?: string[];         // mls ids they browsed
}

/**
 * Resolve the visitor by a session-confirmed contact_id (logged in) OR by an
 * email/phone they typed in chat that matches EXACTLY ONE contact. Ambiguous or
 * no match → { known: false }. Never guesses between two people.
 *
 * Returns ONLY the four allowed things. No deals. No internal fields. No one
 * else's data.
 */
export async function resolveKnownVisitor(opts: {
  sessionContactId?: string | null;
  email?: string | null;
  phone?: string | null;
}): Promise<KnownVisitor> {
  let contactId: string | null = null;
  let firstName: string | null = null;

  // 1. Logged-in session (strongest). SELECT ONLY id + first_name — nothing else.
  if (opts.sessionContactId) {
    const rows = await sb(
      `contacts?id=eq.${encodeURIComponent(opts.sessionContactId)}&select=id,first_name&limit=1`,
    );
    if (rows[0]) { contactId = rows[0].id; firstName = rows[0].first_name; }
  }

  // 2. Email typed in chat → EXACTLY ONE contact. SELECT ONLY id, first_name.
  if (!contactId && opts.email && EMAIL_RE.test(opts.email)) {
    const rows = await sb(
      `contacts?email=eq.${encodeURIComponent(norm(opts.email))}&select=id,first_name&limit=2`,
    );
    if (rows.length === 1) { contactId = rows[0].id; firstName = rows[0].first_name; }
  }

  // 3. Phone typed in chat → EXACTLY ONE contact.
  if (!contactId && opts.phone) {
    const digits = opts.phone.replace(/\D/g, "").slice(-10);
    if (digits.length === 10) {
      const rows = await sb(
        `contacts?phone=ilike.${encodeURIComponent("%" + digits)}&select=id,first_name&limit=2`,
      );
      if (rows.length === 1) { contactId = rows[0].id; firstName = rows[0].first_name; }
    }
  }

  if (!contactId) return { known: false };

  // Bridge to the auth user_id (saved_* key on user_id) via a same-email
  // registration. If none, we simply return no saved data — never widen.
  const emailRows = await sb(`contacts?id=eq.${contactId}&select=email&limit=1`);
  const email = emailRows[0]?.email ? norm(emailRows[0].email) : null;

  let savedSearches: Array<{ name: string | null; created_at: string }> = [];
  let savedListings: string[] = [];
  if (email) {
    const reg = await sb(`registrations?email=eq.${encodeURIComponent(email)}&select=user_id&limit=1`);
    const uid = reg[0]?.user_id;
    if (uid) {
      const [ss, sl] = await Promise.all([
        sb(`saved_searches?user_id=eq.${uid}&select=name,created_at&order=created_at.desc&limit=8`),
        sb(`saved_listings?user_id=eq.${uid}&select=mls_id&order=saved_at.desc&limit=12`),
      ]);
      savedSearches = ss.map((r: any) => ({ name: r.name, created_at: r.created_at }));
      savedListings = sl.map((r: any) => r.mls_id).filter(Boolean);
    }
  }

  // Their own browsing — listing_view events tied to THIS contact only.
  const events = await sb(
    `site_events?contact_id=eq.${contactId}&event_type=eq.listing_view&select=page_url&order=id.desc&limit=12`,
  );
  const recentlyViewed = Array.from(
    new Set(
      events
        .map((e: any) => String(e.page_url ?? "").match(/([A-Z]?\d{6,})/)?.[1])
        .filter(Boolean) as string[],
    ),
  ).slice(0, 8);

  return { known: true, firstName, savedSearches, savedListings, recentlyViewed };
}
