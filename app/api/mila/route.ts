// app/api/mila/route.ts
//
// Consumer MiLa's brain — the tool-use loop for the on-site concierge chat.
//
// TOOLS (deliberately minimal — least privilege):
//   search_listings   — the enriched discovery search (public MLS data)
//   search_knowledge  — HUB building facts / policies (read-only, no PII)
//   mlg_track_record  — aggregate, de-identified closings ("we've done X here")
//   who_is_this       — resolve the CURRENT visitor's OWN saved searches / viewed
//                       listings / first name (ONLY once they give an email that
//                       matches exactly one contact, or a confirmed session)
//   capture_lead      — hand a warm lead to a real MLG agent
//
// THERE IS NO DEALS TOOL. Consumer MiLa cannot see deals, other clients, or any
// internal CRM field. The firewall is the tool set itself + the persona rules.

import { NextRequest, NextResponse } from "next/server";
import { MILA_CONSUMER_SYSTEM, MILA_TAXONOMY_NOTE } from "@/lib/mila-persona";
import { milaSearch, LIFESTYLES, ATTRIBUTES, COUNTIES, MilaListing } from "@/lib/mila-search";
import { mlgTrackRecord } from "@/lib/mila-track-record";
import { resolveKnownVisitor } from "@/lib/mila-identity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-6";
const MAX_ROUNDS = 6;

const SB_URL = process.env.SUPABASE_URL ?? "https://ezcikavnfchqaenweygw.supabase.co";
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

const TOOLS = [
  {
    name: "search_listings",
    description:
      "Find real active listings by lifestyle + attributes + budget + kind. Call this once you " +
      "understand enough of what they want. Lifestyles combine with AND. Returns count + a few matches.",
    input_schema: {
      type: "object",
      properties: {
        lifestyles: { type: "array", items: { type: "string", enum: LIFESTYLES as unknown as string[] }, description: "Lifestyle tags (AND). e.g. [\"Boating & Deepwater\"]." },
        attributes: { type: "array", items: { type: "string", enum: ATTRIBUTES as unknown as string[] }, description: "gated, penthouse, walkable, pet-friendly, new-construction." },
        arch_style: { type: "string", description: "Architectural style if they care, e.g. \"British West Indies\", \"Contemporary\"." },
        kind: { type: "string", enum: ["condos", "homes", "any"] },
        county: { type: "string", enum: COUNTIES as unknown as string[] },
        city: { type: "string" },
        min_price: { type: "number" },
        max_price: { type: "number" },
        beds_min: { type: "number" },
      },
    },
  },
  {
    name: "search_knowledge",
    description:
      "Look up a building/community FACT or policy from our knowledge base — pet policy, HOA, lease " +
      "minimums, amenities, what a building offers. Read-only reference. When you use a dated figure, " +
      "say the source and add 'confirm with the association before anything with money on it.'",
    input_schema: {
      type: "object",
      properties: { query: { type: "string" } },
      required: ["query"],
    },
  },
  {
    name: "mlg_track_record",
    description:
      "Our aggregate, de-identified track record in a building or city — roughly how many closings " +
      "we've represented and over what years. SOCIAL PROOF ONLY. Never returns a specific sale, price, " +
      "or client. Use when someone asks 'have you done deals here' / 'do you know this building.'",
    input_schema: {
      type: "object",
      properties: { building: { type: "string" }, city: { type: "string" }, since_year: { type: "number" } },
    },
  },
  {
    name: "who_is_this",
    description:
      "Resolve the CURRENT visitor's OWN record so you can pick up where they left off — their first " +
      "name, their saved searches, and listings they've looked at. Only works if they've given an email " +
      "(or phone) that matches exactly one of our contacts, or they're a confirmed logged-in session. " +
      "Returns ONLY that one person's own saved/viewed items. It CANNOT return anyone else's data. Use " +
      "when a returning person gives their email and you want to personalize.",
    input_schema: {
      type: "object",
      properties: { email: { type: "string" }, phone: { type: "string" } },
    },
  },
  {
    name: "capture_lead",
    description:
      "Hand this person to a real MLG agent. Call when they show intent (want to see a place, want to " +
      "talk to someone, financing/timing questions) or ask to be contacted. Needs at least a name and " +
      "one of email/phone.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string" },
        email: { type: "string" },
        phone: { type: "string" },
        summary: { type: "string", description: "One line on what they're looking for, for the agent." },
      },
      required: ["name"],
    },
  },
];

function money(v: number | null | undefined): string {
  if (!v) return "price on request";
  return "$" + Number(v).toLocaleString();
}

function listingLine(l: MilaListing): string {
  const addr = [l.street_address, l.unit_number ? `#${l.unit_number}` : null].filter(Boolean).join(" ");
  const bits = [addr || l.community_slug || "Listing", l.city, money(l.list_price),
    l.beds ? `${l.beds}BR` : null, l.baths ? `${l.baths}BA` : null,
    l.arch_style || null].filter(Boolean);
  return bits.join(" · ") + ` [mls:${l.mls_id}]`;
}

async function runTool(name: string, input: any, ctx: { sessionContactId?: string | null }): Promise<any> {
  if (name === "search_listings") {
    const { count, listings } = await milaSearch({
      lifestyles: input.lifestyles, attributes: input.attributes, archStyle: input.arch_style,
      kind: input.kind, county: input.county, city: input.city,
      minPrice: input.min_price, maxPrice: input.max_price, bedsMin: input.beds_min, limit: 6,
    });
    return {
      total_matches: count,
      showing: listings.length,
      listings: listings.map(listingLine),
      note: count === 0 ? "No exact matches — suggest the closest real alternative and be honest about the trade-off." : undefined,
    };
  }

  if (name === "search_knowledge") {
    // Query the shared knowledge base directly (embeddings live in Supabase).
    // We reuse the hybrid RPC via a thin call; if unavailable, return empty.
    return await knowledgeSearch(String(input.query ?? ""));
  }

  if (name === "mlg_track_record") {
    const t = await mlgTrackRecord({ building: input.building, city: input.city, sinceYear: input.since_year });
    // Return ONLY the de-identified phrasing + counts. No raw prices.
    return { count: t.count, years: t.yearMin && t.yearMax ? `${t.yearMin}-${t.yearMax}` : null, say: t.phrasing };
  }

  if (name === "who_is_this") {
    const v = await resolveKnownVisitor({ sessionContactId: ctx.sessionContactId, email: input.email, phone: input.phone });
    if (!v.known) return { known: false, note: "No single confident match — treat them as a new guest, don't guess." };
    return {
      known: true,
      first_name: v.firstName,
      saved_searches: v.savedSearches?.map((s) => s.name).filter(Boolean),
      saved_listings: v.savedListings,
      recently_viewed: v.recentlyViewed,
      note: "This is ONLY this person's own data. Never reference anyone else.",
    };
  }

  if (name === "capture_lead") {
    return await captureLead(input);
  }

  return { error: "unknown tool" };
}

// ── HUB knowledge search (hybrid RPC over shared knowledge_chunks) ──
async function knowledgeSearch(query: string): Promise<any> {
  if (!query.trim() || !SB_KEY) return { results: [] };
  // Embed via OpenAI (same model the hub uses), then hybrid RPC.
  const key = process.env.OPENAI_API_KEY;
  if (!key) return { results: [], note: "knowledge unavailable" };
  try {
    const emb = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "text-embedding-3-large", input: query, dimensions: 1536, encoding_format: "float" }),
    });
    if (!emb.ok) return { results: [] };
    const vec = (await emb.json()).data[0].embedding as number[];
    const res = await fetch(`${SB_URL}/rest/v1/rpc/match_knowledge_chunks_hybrid`, {
      method: "POST",
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        query_embedding: vec, query_text: query, match_count: 6,
        filter_agent: null, filter_contact: null,
        // Consumer scope: building/community facts + docs only. NEVER transcripts
        // (those contain real client conversations) or agent_intel.
        filter_source_types: ["community", "minisite", "page", "document"],
      }),
    });
    if (!res.ok) return { results: [] };
    const rows = (await res.json()) as any[];
    return {
      results: rows.map((r) => ({ text: String(r.content ?? "").slice(0, 600), source: r.source_id })),
      note: "Building facts from our knowledge base. Cite source + date for anything with money on it.",
    };
  } catch {
    return { results: [] };
  }
}

// ── Lead capture → Supabase leads ──
async function captureLead(input: any): Promise<any> {
  if (!input.name || (!input.email && !input.phone)) return { ok: false, error: "need a name and an email or phone" };
  const parts = String(input.name).trim().split(/\s+/);
  const first = parts[0] ?? input.name;
  const last = parts.slice(1).join(" ") || null;
  try {
    await fetch(`${SB_URL}/rest/v1/leads`, {
      method: "POST",
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({
        first_name: first,
        last_name: last,
        email: input.email ?? null,
        phone: input.phone ?? null,
        message: input.summary ?? "Chatted with MiLa",
        source_site: "livemodern",
        source_type: "mila-chat",
        ai_handled: true,
      }),
    }).catch(() => {});
    return { ok: true, say: "Perfect — I've passed you to one of our agents. They'll reach out shortly. Anything else I can line up in the meantime?" };
  } catch {
    return { ok: true, say: "Got it — I'll make sure an agent follows up with you." };
  }
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "MiLa isn't configured yet." }, { status: 500 });

  const body = await req.json().catch(() => ({}));
  const history = Array.isArray(body.messages) ? body.messages : [];
  if (!history.length) return NextResponse.json({ error: "messages required" }, { status: 400 });

  // Optional: a confirmed logged-in contact id from the site session (safe to
  // personalize). We DON'T trust an email in the body as "confirmed" — the model
  // must call who_is_this, which requires an exact match.
  const sessionContactId: string | null = body.sessionContactId ?? null;

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "America/New_York" });

  // Prime the visitor's first name for the greeting if we already have a session.
  let visitorFirstName: string | null = null;
  if (sessionContactId) {
    const v = await resolveKnownVisitor({ sessionContactId });
    if (v.known) visitorFirstName = v.firstName ?? null;
  }

  const system = MILA_CONSUMER_SYSTEM({ today, visitorFirstName }) + "\n\n" + MILA_TAXONOMY_NOTE;
  const messages: any[] = [...history];

  try {
    for (let round = 0; round < MAX_ROUNDS; round++) {
      const res = await fetch(ANTHROPIC_URL, {
        method: "POST",
        headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
        body: JSON.stringify({ model: MODEL, max_tokens: 1200, system, tools: TOOLS, messages }),
      });
      if (!res.ok) {
        console.error("[mila] anthropic", res.status, (await res.text()).slice(0, 300));
        return NextResponse.json({ error: "MiLa is having trouble right now." }, { status: 502 });
      }
      const data = await res.json();
      const toolUses = (data.content ?? []).filter((b: any) => b.type === "tool_use");

      if (!toolUses.length || data.stop_reason !== "tool_use") {
        const reply = (data.content ?? []).filter((b: any) => b.type === "text").map((b: any) => b.text).join("").trim();
        return NextResponse.json({ reply });
      }

      messages.push({ role: "assistant", content: data.content });
      const results: any[] = [];
      for (const tu of toolUses) {
        const out = await runTool(tu.name, tu.input ?? {}, { sessionContactId });
        results.push({ type: "tool_result", tool_use_id: tu.id, content: JSON.stringify(out).slice(0, 8000) });
      }
      messages.push({ role: "user", content: results });
    }
    return NextResponse.json({ reply: "Let me get an agent to help you directly — can I grab your name and the best number to reach you?" });
  } catch (e: any) {
    console.error("[mila] error", e?.message);
    return NextResponse.json({ error: "Something went wrong on my end." }, { status: 500 });
  }
}
