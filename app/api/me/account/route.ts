import { NextRequest, NextResponse } from "next/server";

// ── /api/me/account — the LiveModern client account hub ──────────────────
// Ports mlg-site's resolver: a consumer's assigned agent and full profile live
// behind tables (contacts, agents) the anon/RLS client can't read, so we resolve
// them here with the service role. One shared CRM → LiveModern shows the same
// agent (e.g. Mariah), same details, as modernlivingre.com; only the skin differs.
//   GET  → { profile, agent }
//   POST → { action: 'profile' }  updates registrations + syncs auth metadata,
//          drops a note on the CRM contact timeline (best-effort).

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SB_URL = process.env.SUPABASE_URL ?? "https://ezcikavnfchqaenweygw.supabase.co";
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const HOUSE_DEFAULT_AGENT = "Jonathan Santiago";

type SbUser = { id: string; email: string | null; created_at?: string };

async function sb(path: string, init?: RequestInit) {
  return fetch(`${SB_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
}

async function userFromToken(req: NextRequest): Promise<SbUser | null> {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token || !SB_KEY) return null;
  const res = await fetch(`${SB_URL}/auth/v1/user`, {
    headers: { apikey: SB_KEY, Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const u = (await res.json()) as SbUser;
  return u?.id ? u : null;
}

type Agent = {
  name: string;
  title: string | null;
  photo_url: string | null;
  phone: string | null;
  email: string | null;
};

async function agentRow(filter: string): Promise<Agent | null> {
  const res = await sb(
    `agents?${filter}&active=eq.true&select=name,title,photo_url,telnyx_number,cell_phone,office_phone,email&limit=1`,
  );
  if (!res.ok) return null;
  const rows = (await res.json()) as Array<Record<string, string | null>>;
  const a = rows[0];
  if (!a) return null;
  return {
    name: a.name as string,
    title: (a.title as string) ?? null,
    photo_url: (a.photo_url as string) ?? null,
    // Telnyx DID (public, forwards to cell) → cell → office.
    phone: (a.telnyx_number || a.cell_phone || a.office_phone) as string | null,
    email: (a.email as string) ?? null,
  };
}

async function houseDefault(): Promise<Agent | null> {
  return agentRow(`name=eq.${encodeURIComponent(HOUSE_DEFAULT_AGENT)}`);
}

// contacts → assigned_to_id (fub_id) / assigned_to (name) → agents. Pond / no
// owner / inactive owner all fall back to the house default so a signed-in
// client never sees "unassigned". Mirrors mlg-site resolveAssignedAgent.
async function resolveAgent(email: string | null): Promise<Agent | null> {
  if (!email) return houseDefault();
  const enc = encodeURIComponent(JSON.stringify([{ value: email }]));
  const res = await sb(
    `contacts?or=(email.eq.${encodeURIComponent(email)},emails.cs.${enc})&select=id,assigned_to,assigned_to_id,archived_at&limit=5`,
  );
  if (!res.ok) return houseDefault();
  const contacts = (await res.json()) as Array<{
    assigned_to: string | null;
    assigned_to_id: number | null;
    archived_at: string | null;
  }>;
  const contact = contacts.find((c) => !c.archived_at) ?? contacts[0];
  if (!contact || (!contact.assigned_to && contact.assigned_to_id == null)) {
    return houseDefault();
  }
  let agent: Agent | null = null;
  if (contact.assigned_to_id != null) {
    agent = await agentRow(`fub_id=eq.${contact.assigned_to_id}`);
  }
  if (!agent && contact.assigned_to) {
    agent = await agentRow(`name=eq.${encodeURIComponent(contact.assigned_to)}`);
  }
  return agent ?? houseDefault();
}

async function loadRegistration(userId: string) {
  const res = await sb(
    `registrations?user_id=eq.${userId}&select=first_name,last_name,phone,user_type,sms_consent,created_at,email&limit=1`,
  );
  if (!res.ok) return null;
  const rows = (await res.json()) as Array<Record<string, unknown>>;
  return rows[0] ?? null;
}

async function contactIdFor(email: string | null): Promise<string | null> {
  if (!email) return null;
  const enc = encodeURIComponent(JSON.stringify([{ value: email }]));
  const res = await sb(
    `contacts?or=(email.eq.${encodeURIComponent(email)},emails.cs.${enc})&select=id,archived_at&limit=5`,
  );
  if (!res.ok) return null;
  const rows = (await res.json()) as Array<{ id: string; archived_at: string | null }>;
  const c = rows.find((x) => !x.archived_at) ?? rows[0];
  return c?.id ?? null;
}

async function timelineNote(email: string | null, body: string) {
  const cid = await contactIdFor(email);
  if (!cid) return;
  try {
    await sb("contact_activity", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        contact_id: cid,
        type: "note",
        body,
        created_by: "system:livemodern-account",
        activity_at: new Date().toISOString(),
      }),
    });
  } catch {
    /* non-fatal */
  }
}

export async function GET(req: NextRequest) {
  const user = await userFromToken(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const reg = (await loadRegistration(user.id)) as Record<string, unknown> | null;
  const agent = await resolveAgent(user.email ?? (reg?.email as string) ?? null);

  return NextResponse.json({
    profile: {
      first_name: (reg?.first_name as string) ?? null,
      last_name: (reg?.last_name as string) ?? null,
      email: user.email ?? (reg?.email as string) ?? null,
      phone: (reg?.phone as string) ?? null,
      user_type: (reg?.user_type as string) ?? null,
      sms_consent: (reg?.sms_consent as boolean) ?? null,
      member_since: (reg?.created_at as string) ?? user.created_at ?? null,
    },
    agent,
  });
}

export async function POST(req: NextRequest) {
  const user = await userFromToken(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (body.action === "profile") {
    const first = String(body.first_name ?? "").trim();
    const last = String(body.last_name ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const userType = String(body.user_type ?? "").trim();
    const sms = Boolean(body.sms_consent);
    if (first.length > 60 || last.length > 60) {
      return NextResponse.json({ error: "That name looks too long" }, { status: 400 });
    }
    const res = await sb(`registrations?user_id=eq.${user.id}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        first_name: first || null,
        last_name: last || null,
        phone: phone || null,
        user_type: userType || null,
        sms_consent: sms,
      }),
    });
    if (!res.ok) {
      return NextResponse.json({ error: "Could not save" }, { status: 500 });
    }
    // Keep Auth metadata (the hero greeting) in step.
    try {
      await fetch(`${SB_URL}/auth/v1/admin/users/${user.id}`, {
        method: "PUT",
        headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ user_metadata: { first_name: first, last_name: last || null } }),
        cache: "no-store",
      });
    } catch {
      /* non-fatal */
    }
    void timelineNote(
      user.email,
      `Client updated their details from the LiveModern account page${phone ? ` (phone ${phone})` : ""}.`,
    );
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
