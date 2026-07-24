// lib/mila-agents.ts
//
// Agent matching for consumer MiLa — "match me with the right agent based on
// experience and areas of expertise." Uses ONLY public agent info (name, title,
// bio, coverage zips, specialties) — the same facts published on the agents
// page. No client data, no internal fields.

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

export interface AgentMatch {
  name: string;
  title: string | null;
  bio_snippet: string | null;
  why: string;              // why they're a fit, in plain words
}

/**
 * Find the best-fit public agent(s) for what the visitor described. Matches on:
 *  - specialty scope (city / area / lifestyle keyword in agent_specialties)
 *  - price band (agent_specialties price_min/max)
 *  - coverage zips (agents.zip_codes) if a zip/city maps
 *  - title keyword ("Boca Raton Specialist", "Historic Home Specialist")
 * Returns up to `limit` public agents. Public info only.
 */
export async function matchAgent(opts: {
  area?: string;        // city / neighborhood / "Boca", "Jupiter", "downtown"
  lifestyle?: string;   // "waterfront", "golf", "historic", "equestrian"…
  price?: number;
  limit?: number;
}): Promise<AgentMatch[]> {
  const limit = Math.min(opts.limit ?? 2, 3);
  const term = [opts.area, opts.lifestyle].filter(Boolean).join(" ").toLowerCase().trim();

  // Public agents only.
  const agents = await sb(
    `agents?show_on_site=eq.true&active=eq.true&select=id,name,title,bio,zip_codes`,
  );
  if (!agents.length) return [];

  // Their published specialties.
  const specs = await sb(
    `agent_specialties?active=eq.true&select=agent_id,scope_type,scope_value,price_min,price_max,priority`,
  );
  const specsByAgent = new Map<string, any[]>();
  for (const s of specs) {
    const arr = specsByAgent.get(s.agent_id) ?? [];
    arr.push(s);
    specsByAgent.set(s.agent_id, arr);
  }

  const scored = agents.map((a: any) => {
    let score = 0;
    const reasons: string[] = [];
    const title = (a.title ?? "").toLowerCase();

    // Title keyword match (e.g. "boca raton specialist", "historic home").
    if (term) {
      for (const word of term.split(/\s+/)) {
        if (word.length >= 4 && title.includes(word)) { score += 3; if (!reasons.includes(a.title)) reasons.push(a.title); }
      }
    }

    // Specialty scope match.
    for (const s of specsByAgent.get(a.id) ?? []) {
      const val = String(s.scope_value ?? "").toLowerCase();
      if (term && val && (term.includes(val) || val.includes(term))) {
        score += (s.priority ?? 1) + 2;
        reasons.push(`specializes in ${s.scope_value}`);
      }
      if (opts.price != null && s.price_min != null && s.price_max != null && opts.price >= s.price_min && opts.price <= s.price_max) {
        score += 2;
        reasons.push(`works in your price range`);
      } else if (opts.price != null && s.price_min != null && opts.price >= s.price_min) {
        score += 1;
      }
    }

    return { agent: a, score, reasons: Array.from(new Set(reasons)) };
  });

  const ranked = scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score);
  const pick = (ranked.length ? ranked : scored.sort(() => 0.5 - Math.random())).slice(0, limit);

  return pick.map(({ agent, reasons }) => ({
    name: agent.name,
    title: agent.title,
    bio_snippet: agent.bio ? String(agent.bio).slice(0, 220) : null,
    why: reasons.length ? reasons.join("; ") : (agent.title || "an experienced member of our team"),
  }));
}
