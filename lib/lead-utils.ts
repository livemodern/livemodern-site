// Lead sanitation shared by /api/leads. Mirrors the bot heuristics used on the
// MLG mini-sites (src/lib/fub.ts botScore / isBot) so a LiveModern lead is held
// to the same bar: realistic name, ASCII message, a plausible contact method.
// isBot returns true → the caller silently accepts ({success:true}, no leadId)
// so scrapers get no signal that they were filtered.

export type LeadContact = {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  message?: string | null;
};

/** Split a single "name" field into first / last. */
export function splitName(name?: string | null): { first?: string; last?: string } {
  if (!name) return {};
  const parts = String(name).trim().split(/\s+/);
  return { first: parts[0], last: parts.slice(1).join(" ") || undefined };
}

const CAPS = /[A-Z]/g;

function botScore(c: LeadContact): number {
  let score = 0;
  const name = `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim();
  const email = (c.email ?? "").trim();
  const phone = (c.phone ?? "").replace(/\D/g, "");
  const msg = c.message ?? "";

  // A long name crammed with internal capitals ("SMOKETEST DeLeTeMe") reads bot.
  if (name.length > 24 && (name.match(CAPS) ?? []).length >= 3) score += 40;
  // Email local-part stuffed with dots is a classic throwaway pattern.
  const local = email.split("@")[0] ?? "";
  if ((local.match(/\./g) ?? []).length >= 3) score += 30;
  // Non-ASCII in a short inquiry (em-dashes, homoglyphs) trends spammy.
  if (msg && /[^\u0000-\u007F]/.test(msg)) score += 25;
  // Links in the body of a "contact us" note.
  if (/https?:\/\//i.test(msg) || /<a\s/i.test(msg)) score += 40;
  // No usable contact method at all.
  if (!email && phone.length < 10) score += 50;
  // Obviously fake phone (all same digit, or too short when present).
  if (phone && (phone.length < 10 || /^(\d)\1+$/.test(phone))) score += 20;

  return score;
}

export function isBot(c: LeadContact): boolean {
  return botScore(c) >= 50;
}
