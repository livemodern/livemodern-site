// lib/spam-check-client.ts
//
// Calls mlg-admin's central lead spam classifier (/api/leads/spam-check) —
// keyword filter + Claude. Copied from mlg-site so both sites are gated by the
// SAME logic, tuned in one place. This is the layer that catches coherent B2B
// solicitation (SEO audits, lead-gen pitches, VA services) which the local
// gibberish filter reads as a perfectly well-formed human. LiveModern had no
// such gate, which is how "I have found some major errors that correspond to a
// drop in website traffic" landed as a lead on 2026-07-30.
//
// Auth: shared MLG_SERVICE_TOKEN (server-only — never client).
// FAIL-OPEN: returns { spam: false } on any error. A real lead must NEVER be
// dropped by an infra hiccup; the classifier is fail-open on its side too.

const ADMIN_BASE = process.env.MLG_ADMIN_BASE_URL ?? "https://team.mlrecloud.com";
const TOKEN = process.env.MLG_SERVICE_TOKEN;

export interface SpamCheckInput {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  message?: string | null;
}

export async function checkLeadSpam(
  input: SpamCheckInput,
): Promise<{ spam: boolean; reason: string }> {
  if (!TOKEN) return { spam: false, reason: "no-token" };
  try {
    const controller = new AbortController();
    const to = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(`${ADMIN_BASE}/api/leads/spam-check`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-MLG-Service-Token": TOKEN,
      },
      body: JSON.stringify(input),
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(to);
    if (!res.ok) return { spam: false, reason: `http-${res.status}` };
    const data = (await res.json()) as { spam?: boolean; reason?: string };
    return { spam: !!data.spam, reason: String(data.reason ?? "") };
  } catch {
    return { spam: false, reason: "error" };
  }
}
