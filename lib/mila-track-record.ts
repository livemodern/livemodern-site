// lib/mila-track-record.ts
//
// Aggregate, de-identified sales track record for consumer MiLa — social proof
// ONLY. Counts, year span, and a rough price band for MLG-represented closings in
// a building/city. NO specific prices tied to a unit/person, NO client info, NO
// deals table. This is the only "sales" window the consumer AI gets.

const SB_URL = process.env.SUPABASE_URL ?? "https://ezcikavnfchqaenweygw.supabase.co";
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

// MLG office keys + team member ids — closings matched across agent slots.
const MLG_OFFICE_KEYS = new Set(["5929314", "5934426", "5920460", "5925495"]);
let teamIds: { ids: Set<string>; at: number } | null = null;

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

async function getTeamIds(): Promise<Set<string>> {
  if (teamIds && Date.now() - teamIds.at < 3_600_000) return teamIds.ids;
  const rows = await sb(`agents?mls_member_id=not.is.null&select=mls_member_id`);
  const ids = new Set(rows.map((r) => String(r.mls_member_id)).filter(Boolean));
  teamIds = { ids, at: Date.now() };
  return ids;
}

export interface TrackRecord {
  scope: string;
  count: number;
  yearMin: number | null;
  yearMax: number | null;
  priceBandLow: number | null;   // rounded, band only — never a specific sale
  priceBandHigh: number | null;
  phrasing: string;              // ready-to-say, de-identified
}

export async function mlgTrackRecord(opts: { building?: string; city?: string; sinceYear?: number }): Promise<TrackRecord> {
  const ids = await getTeamIds();
  const cols =
    "close_date,close_price,building_name,list_office_key,list_agent_mls_id,buyer_agent_mls_id,co_list_agent_mls_id,co_buyer_agent_mls_id";
  const parts = ["status=eq.Closed", "close_price=not.is.null"];
  let scope = "the area";
  if (opts.building) { parts.push(`building_name=ilike.${encodeURIComponent("%" + opts.building + "%")}`); scope = opts.building; }
  else if (opts.city) { parts.push(`city=ilike.${encodeURIComponent("%" + opts.city + "%")}`); scope = opts.city; }

  const rows: any[] = [];
  for (let off = 0; off < 6000; off += 1000) {
    const page = await sb(`properties?${parts.join("&")}&select=${cols}&limit=1000&offset=${off}`);
    rows.push(...page);
    if (page.length < 1000) break;
  }

  const isMlg = (r: any) =>
    ids.has(String(r.list_agent_mls_id ?? "")) ||
    ids.has(String(r.buyer_agent_mls_id ?? "")) ||
    ids.has(String(r.co_list_agent_mls_id ?? "")) ||
    ids.has(String(r.co_buyer_agent_mls_id ?? "")) ||
    MLG_OFFICE_KEYS.has(String(r.list_office_key ?? ""));

  let mlg = rows.filter(isMlg).filter((r) => r.close_date && Number(r.close_price) >= 50000);
  if (opts.sinceYear) mlg = mlg.filter((r) => new Date(r.close_date).getFullYear() >= opts.sinceYear!);

  const years = mlg.map((r) => new Date(r.close_date).getFullYear());
  const prices = mlg.map((r) => Number(r.close_price)).sort((a, b) => a - b);
  // Round the band hard so nothing maps to a specific sale.
  const round = (n: number) => Math.round(n / 100000) * 100000;
  const yearMin = years.length ? Math.min(...years) : null;
  const yearMax = years.length ? Math.max(...years) : null;

  // ENUMERATION FLOOR: below this many closings, a count could finger an
  // individual transaction (esp. a small/single-unit building). Return a
  // qualitative "we're active here" instead of a small-n number, and expose no
  // price band. This defeats building-by-building probing for specific sales.
  const MIN_COUNT = 5;

  let phrasing = "";
  if (mlg.length === 0) {
    phrasing = `I don't have a specific closed-sale count for ${scope} to share, but our team is active across the area.`;
  } else if (mlg.length < MIN_COUNT) {
    phrasing = `We've been active in ${scope} — I can't give you an exact deal count here, but one of our agents can walk you through our experience in this specific building.`;
  } else {
    const rounded = Math.floor(mlg.length / 5) * 5;
    phrasing = `We've represented around ${rounded}+ closings in ${scope}${yearMin && yearMax ? ` between ${yearMin} and ${yearMax}` : ""} — that's real, on-the-ground experience in this market.`;
  }

  const belowFloor = mlg.length > 0 && mlg.length < MIN_COUNT;
  return {
    scope,
    // Never expose a raw small-n count; report 0 as "under threshold" upstream.
    count: belowFloor ? 0 : mlg.length,
    yearMin: belowFloor ? null : yearMin,
    yearMax: belowFloor ? null : yearMax,
    priceBandLow: belowFloor || !prices.length ? null : round(prices[0]),
    priceBandHigh: belowFloor || !prices.length ? null : round(prices[prices.length - 1]),
    phrasing,
  };
}
