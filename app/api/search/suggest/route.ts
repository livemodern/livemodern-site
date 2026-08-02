import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// LiveModern /api/search/suggest — typeahead for the search box. Ported from
// mlg-search: buildings → communities → cities → zips → addresses, ranked, with
// live active counts per the sale/rent transaction. Reads the shared
// location_index + properties, so it covers the same South Florida geography.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Lazy: creating the client at module scope throws at build time ("supabaseKey
// is required") during page-data collection when the key isn't a build env.
function getClient() {
  return createClient(
    process.env.SUPABASE_URL ?? "https://ezcikavnfchqaenweygw.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    { auth: { persistSession: false } },
  );
}

const TYPE_RANK: Record<string, number> = { address: 0, building: 1, community: 2, city: 3, zip: 4 };

type LocRow = {
  type: string;
  canonical_name: string;
  filter_type?: string | null;
  filter_value?: string | null;
  filter_like?: string | null;
  active_count?: number | null;
  aliases?: string[] | null;
  is_parent?: boolean | null;
};
type Suggestion = {
  type: string;
  name: string;
  count: number;
  is_parent?: boolean;
  filter: Record<string, unknown>;
  score?: number;
};

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  const transaction = req.nextUrl.searchParams.get("transaction") || "sale";
  if (!q || q.length < 2) return NextResponse.json({ results: [] });

  const search = q.toLowerCase();
  const supabase = getClient();

  const [{ data: priority }, { data: communities }] = await Promise.all([
    supabase
      .from("location_index")
      .select("type,canonical_name,filter_type,filter_value,filter_like,active_count,aliases,is_parent")
      .in("type", ["building", "city", "zip"])
      .ilike("search_text", `${search}%`)
      .neq("hide_from_suggest", true)
      .order("active_count", { ascending: false })
      .limit(10),
    supabase
      .from("location_index")
      .select("type,canonical_name,filter_type,filter_value,filter_like,active_count,aliases,is_parent")
      .eq("type", "community")
      .ilike("search_text", `${search}%`)
      .neq("hide_from_suggest", true)
      .gte("active_count", 2)
      .order("is_parent", { ascending: false })
      .order("active_count", { ascending: false })
      .limit(8),
  ]);

  // Address search when the query looks like an address.
  const looksLikeAddress = /^\d/.test(search) || search.split(" ").length >= 2;
  let addressResults: Suggestion[] = [];
  if (looksLikeAddress) {
    const tokens = search.trim().split(/\s+/);
    const lastToken = tokens[tokens.length - 1];
    const isLikelyUnit = tokens.length >= 3 && /^\d+[a-z]?$/i.test(lastToken);
    const addrPart = isLikelyUnit ? tokens.slice(0, -1).join(" ") : search;
    const unitPart = isLikelyUnit ? lastToken : null;

    let addrQuery = supabase
      .from("properties")
      .select("mls_id,street_address,unit_number,city,status,list_price")
      .ilike("street_address", `%${addrPart}%`)
      .eq("status", "Active")
      .order("list_price", { ascending: false })
      .limit(6);
    if (unitPart) addrQuery = addrQuery.ilike("unit_number", `%${unitPart}%`);

    const [{ data: addrData }, { data: fallbackData }] = await Promise.all([
      addrQuery,
      isLikelyUnit
        ? supabase
            .from("properties")
            .select("mls_id,street_address,unit_number,city,status,list_price")
            .ilike("street_address", `%${search}%`)
            .eq("status", "Active")
            .limit(3)
        : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
    ]);

    const seen = new Set<string>();
    const merged = [...(addrData ?? []), ...((fallbackData as Array<Record<string, unknown>>) ?? [])].filter(
      (r) => {
        const id = String((r as { mls_id: string }).mls_id);
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      },
    );
    addressResults = merged.slice(0, 5).map((r) => {
      const row = r as { street_address: string; unit_number: string | null; city: string; mls_id: string };
      return {
        type: "address",
        name: [row.street_address, row.unit_number ? `#${row.unit_number}` : null, row.city]
          .filter(Boolean)
          .join(", "),
        count: 1,
        is_parent: false,
        filter: { street_address_like: row.street_address, mls_id: row.mls_id },
        score: 600,
      };
    });
  }

  const all = [...(priority ?? []), ...(communities ?? [])] as LocRow[];
  const ranked = rankAndFormat(addressResults, all, search);

  // Live counts per transaction so the number matches what the user will see.
  const withCounts = await Promise.all(
    ranked.map(async (r) => {
      try {
        let cq = supabase.from("properties").select("id", { count: "exact", head: true }).eq("status", "Active");
        if (transaction === "rent") cq = cq.eq("property_type", "ResidentialLease");
        const f = r.filter as Record<string, string | string[]>;
        if (f.building_name) cq = cq.eq("building_name", f.building_name as string);
        else if (f.city) cq = cq.ilike("city", `%${f.city}%`);
        else if (f.zip) cq = cq.eq("zip", f.zip as string);
        else if (f.subdivision_like) cq = cq.ilike("subdivision_name", f.subdivision_like as string);
        else if (f.subdivision_patterns) {
          cq = cq.or((f.subdivision_patterns as string[]).map((x) => `subdivision_name.ilike.${x}`).join(","));
        }
        const { count } = await cq;
        return { ...r, count: count ?? r.count };
      } catch {
        return r;
      }
    }),
  );

  return NextResponse.json({ results: withCounts.filter((r) => (r.count ?? 0) > 0) });
}

function buildFilter(row: LocRow): Record<string, unknown> {
  switch (row.filter_type) {
    case "building":
      return { building_name: row.canonical_name };
    case "city":
      return { city: row.filter_value };
    case "zip":
      return { zip: row.filter_value };
    case "subdivision_like":
      return { subdivision_like: row.filter_like || `${row.filter_value}%` };
    case "community_patterns":
      return { subdivision_patterns: row.aliases || [row.filter_value] };
    default:
      return { subdivision: row.filter_value };
  }
}

function rankAndFormat(addressRows: Suggestion[], rows: LocRow[], ql: string): Suggestion[] {
  const seen = new Set<string>();
  const unique = rows.filter((r) => {
    const key = `${r.type}:${r.canonical_name}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const buildingNames = unique
    .filter((r) => r.type === "building")
    .map((r) => r.canonical_name.toLowerCase());
  const deduped = unique.filter((r) => {
    if (r.type !== "community") return true;
    const cl = r.canonical_name.toLowerCase();
    return !buildingNames.some((bn) => bn === cl || bn.startsWith(`${cl} `) || bn.startsWith(`${cl},`));
  });

  const locationRanked: Suggestion[] = deduped
    .map((r) => ({
      row: r,
      score:
        (r.canonical_name.toLowerCase() === ql ? 500 : 0) +
        (r.canonical_name.toLowerCase().startsWith(ql) ? 200 : 0) +
        (TYPE_RANK[r.type] !== undefined ? (10 - TYPE_RANK[r.type]) * 10 : 0) +
        (r.is_parent ? 50 : 0) +
        Math.min(r.active_count || 0, 100),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map(({ row }) => ({
      type: row.type,
      name: row.canonical_name,
      count: row.active_count ?? 0,
      is_parent: row.is_parent ?? false,
      filter: buildFilter(row),
    }));

  if (/^\d{3,5}$/.test(ql)) {
    const zipRows = locationRanked.filter((r) => r.type === "zip");
    const nonZip = locationRanked.filter((r) => r.type !== "zip");
    return [...zipRows, ...addressRows, ...nonZip].slice(0, 8);
  }

  const topName = locationRanked[0]?.name?.toLowerCase() ?? "";
  if (topName && (topName === ql || topName.startsWith(ql))) {
    return [...locationRanked, ...addressRows].slice(0, 8);
  }
  return [...addressRows, ...locationRanked].slice(0, 8);
}
