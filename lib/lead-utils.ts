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

/**
 * Bot filter — a VERBATIM copy of mlg-site's `src/lib/lead-utils.ts` botScore.
 * LiveModern had its own weaker variant, which is how a dotted-local-part
 * throwaway (u.pen.ot.em.e.0.0.2@gmail.com) scored 30 against a 50 threshold
 * and landed as a real lead. One filter, tuned in one place, on both sites.
 *
 * Weights: a name word over 12 chars +30; 3+ internal capitals in a name word
 * +40; 3+ dots in the email local-part +30; a phone that isn't 10 or 11 digits
 * +20; any non-printable-ASCII in the message +40. 50 is the reject line.
 */
export function botScore(data: LeadContact): number {
  let score = 0;
  const words = [data.firstName, data.lastName].filter(Boolean) as string[];
  for (const word of words) {
    if (word.length > 12) score += 30;
    const internalUpper = (word.slice(1).match(/[A-Z]/g) || []).length;
    if (internalUpper >= 3) score += 40;
  }
  if (data.email) {
    const local = data.email.split("@")[0];
    if ((local.match(/\./g) || []).length >= 3) score += 30;
  }
  if (data.phone) {
    const digits = data.phone.replace(/\D/g, "");
    if (digits.length !== 10 && digits.length !== 11) score += 20;
  }
  if (data.message && /[^\x20-\x7E]/.test(data.message)) score += 40;
  return score;
}

export function isBot(data: LeadContact): boolean {
  return botScore(data) >= 50;
}
