// Fire-and-forget call into mlg-admin's lead-routing engine (team.mlrecloud.com),
// mirroring the MLG mini-sites' src/lib/route-lead-client.ts. mlg-admin owns the
// routing_rules table, creates/merges the native contact, assigns the agent,
// fires the alerts (email + CRM bell + SMS), and logs the decision.
//
// Auth is the shared MLG_SERVICE_TOKEN env var (server-only — never client).
// If the token isn't set on this Vercel project, routing is skipped gracefully
// and the lead still lands in Supabase; wiring the token is a cutover step.

const ADMIN_BASE = process.env.MLG_ADMIN_BASE_URL ?? "https://team.mlrecloud.com";
const TOKEN = process.env.MLG_SERVICE_TOKEN;

export interface RouteLeadInput {
  source?: string;
  contact?: { id?: string | null; name?: string | null; email?: string | null; phone?: string | null };
  listing?: {
    mls_id?: string | null;
    community_slug?: string | null;
    zip?: string | null;
    city?: string | null;
    price?: number | null;
  };
  tags?: string[];
  /** Buyer / Seller / Renter / Landlord — drives contacts.client_type. */
  userType?: string | null;
  /** MLS ids the visitor has browsed — drives the whole lead profile. */
  viewedMlsIds?: string[];
  meta?: Record<string, unknown>;
}

export interface RouteLeadResult {
  agent_id: string | null;
  reason: string;
  decision_id: string | null;
  contact_id?: string | null;
}

/** Returns null on any failure — never throws. A routing outage must never
 *  break the user-facing form submission. */
export async function recordLeadRouting(
  input: RouteLeadInput,
): Promise<RouteLeadResult | null> {
  if (!TOKEN) {
    console.warn("[route-lead] MLG_SERVICE_TOKEN missing — skipping routing record");
    return null;
  }
  try {
    const res = await fetch(`${ADMIN_BASE}/api/leads/route`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-MLG-Service-Token": TOKEN },
      body: JSON.stringify(input),
      cache: "no-store",
    });
    if (!res.ok) {
      console.warn("[route-lead] non-2xx from mlg-admin:", res.status);
      return null;
    }
    return (await res.json()) as RouteLeadResult;
  } catch (e) {
    console.warn("[route-lead] network error:", e);
    return null;
  }
}
