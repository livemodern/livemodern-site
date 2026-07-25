// lib/mila-search.ts
//
// MiLa's discovery search — the multi-tag intersection engine she calls once she
// has enough of a picture. Intersects lifestyle + attributes + budget + kind +
// county + beds against the enriched properties. This is the thing that turns a
// conversation ("British West Indies, on the water, with a dock, under $4M")
// into a real shortlist.
//
// Reuses the same Supabase/enriched-tag approach as lib/listings.ts.

const SB_URL = process.env.SUPABASE_URL ?? "https://ezcikavnfchqaenweygw.supabase.co";
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

const CONDO_SUBTYPES = ["Condominium", "Apartment", "Co-Op", "Condo/Co-Op"];
const HOME_SUBTYPES = ["Single Family Residence", "Single Family Detached", "Villa", "Townhouse"];

export interface MilaSearchInput {
  lifestyles?: string[];     // soft boost + precise pass — NOT a hard filter anymore
  attributes?: string[];     // soft boost (gated/pet-friendly/walkable often untagged)
  archStyle?: string;
  kind?: "condos" | "homes" | "any";
  county?: string;
  city?: string;
  zip?: string;
  minPrice?: number;
  maxPrice?: number;
  bedsMin?: number;
  bedsExact?: number;
  bathsMin?: number;
  limit?: number;
}

const DOWNTOWN_WPB_ZIPS = ["33401"];

async function runQuery(sbUrl: string, key: string, params: string[], sel: string): Promise<any[]> {
  const url = `${sbUrl}/rest/v1/properties?${params.join("&")}&select=${sel}&order=list_price.desc&limit=1000`;
  const res = await fetch(url, { headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: "no-store" });
  if (!res.ok) return [];
  return (await res.json()) as any[];
}

/**
 * Facts-first search. The lifestyle-tag layer only covers ~17% of active
 * inventory (the curated set), so tags/attributes can NEVER be hard filters —
 * that made MiLa blind to real listings ("nothing checks every box" when 20
 * existed). Strategy:
 *   1. Build the query from REAL MLS fields that are always populated: price,
 *      beds/baths, city/zip, property type. These are the hard filters.
 *   2. If lifestyles/attributes were given AND enough tagged matches exist, use
 *      them to PRECISE-filter; otherwise fall back to the facts-only set and use
 *      tags/attributes only to RANK (boost matches to the top).
 * Result: she searches the actual inventory and surfaces real homes, using
 * lifestyle as a preference signal, not an exclusion.
 */
export async function milaSearch(input: MilaSearchInput): Promise<{ count: number; listings: MilaListing[] }> {
  if (!SB_KEY) return { count: 0, listings: [] };

  const sel =
    "mls_id,street_address,unit_number,city,county,zip,list_price,beds,baths,sqft,image_urls," +
    "property_subtype,arch_style,community_slug,lifestyle_tags,lifestyle_attributes";

  // Hard filters = real, always-populated MLS facts only.
  const base: string[] = ["status=eq.Active"];
  if (input.county) base.push(`county=eq.${encodeURIComponent(input.county)}`);
  if (input.zip) base.push(`zip=eq.${encodeURIComponent(input.zip)}`);
  else if (input.city && /down\s?town.*(wpb|west palm)|wpb downtown/i.test(input.city)) {
    base.push(`zip=in.(${DOWNTOWN_WPB_ZIPS.join(",")})`);
  } else if (input.city) base.push(`city=ilike.${encodeURIComponent("%" + input.city + "%")}`);
  if (input.minPrice) base.push(`list_price=gte.${input.minPrice}`);
  if (input.maxPrice) base.push(`list_price=lte.${input.maxPrice}`);
  if (input.bedsExact != null) base.push(`beds=eq.${input.bedsExact}`);
  else if (input.bedsMin) base.push(`beds=gte.${input.bedsMin}`);
  if (input.bathsMin) base.push(`baths=gte.${input.bathsMin}`);
  if (input.archStyle) base.push(`arch_style=eq.${encodeURIComponent(input.archStyle)}`);

  try {
    // Pass 1 — precise: same facts + lifestyle tags as hard filters. Only worth
    // it if tags were requested.
    let rows: any[] = [];
    if (input.lifestyles?.length || input.attributes?.length) {
      const precise = [...base];
      if (input.lifestyles?.length) {
        const arr = "{" + input.lifestyles.map((l) => `"${l}"`).join(",") + "}";
        precise.push(`lifestyle_tags=cs.${encodeURIComponent(arr)}`);
      }
      if (input.attributes?.length) {
        const arr = "{" + input.attributes.map((a) => `"${a}"`).join(",") + "}";
        precise.push(`lifestyle_attributes=cs.${encodeURIComponent(arr)}`);
      }
      rows = await runQuery(SB_URL, SB_KEY, precise, sel);
    }

    // Pass 2 — fallback: if precise gave us too few (or none), search on FACTS
    // only. This is the fix — untagged downtown condos show up here.
    let usedFallback = false;
    if (rows.length < 3) {
      rows = await runQuery(SB_URL, SB_KEY, base, sel);
      usedFallback = true;
    }

    // kind gate in JS.
    if (input.kind === "condos") rows = rows.filter((r) => CONDO_SUBTYPES.includes(r.property_subtype ?? ""));
    else if (input.kind === "homes") rows = rows.filter((r) => HOME_SUBTYPES.includes(r.property_subtype ?? ""));

    // When we fell back, RANK by lifestyle/attribute match so the closest-in-
    // spirit listings float up even though we didn't hard-filter on them.
    if (usedFallback && (input.lifestyles?.length || input.attributes?.length)) {
      const wantLife = new Set((input.lifestyles ?? []).map((s) => s.toLowerCase()));
      const wantAttr = new Set((input.attributes ?? []).map((s) => s.toLowerCase()));
      rows.sort((a, b) => score(b, wantLife, wantAttr) - score(a, wantLife, wantAttr));
    }

    const count = rows.length;
    const limit = Math.min(input.limit ?? 6, 12);
    const listings: MilaListing[] = rows.slice(0, limit).map((r) => ({
      mls_id: r.mls_id,
      street_address: r.street_address,
      unit_number: r.unit_number,
      city: r.city,
      county: r.county,
      list_price: r.list_price,
      beds: r.beds,
      baths: r.baths,
      sqft: r.sqft,
      image_url: Array.isArray(r.image_urls) && r.image_urls.length ? r.image_urls[0] : null,
      property_subtype: r.property_subtype,
      arch_style: r.arch_style,
      community_slug: r.community_slug,
      lifestyle_tags: r.lifestyle_tags ?? null,
      lifestyle_attributes: r.lifestyle_attributes ?? null,
    }));
    return { count, listings };
  } catch {
    return { count: 0, listings: [] };
  }
}

function score(r: any, wantLife: Set<string>, wantAttr: Set<string>): number {
  let s = 0;
  const tags = (r.lifestyle_tags ?? []).map((x: string) => String(x).toLowerCase());
  const attrs = (r.lifestyle_attributes ?? []).map((x: string) => String(x).toLowerCase());
  for (const t of tags) if (wantLife.has(t)) s += 3;
  for (const a of attrs) if (wantAttr.has(a)) s += 2;
  return s;
}

export interface MilaListing {
  mls_id: string;
  street_address: string | null;
  unit_number: string | null;
  city: string | null;
  county: string | null;
  list_price: number | null;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  image_url: string | null;
  property_subtype: string | null;
  arch_style: string | null;
  community_slug: string | null;
  lifestyle_tags: string[] | null;
  lifestyle_attributes: string[] | null;
}

// The lifestyle + attribute vocabularies MiLa maps conversation onto. Locked
// taxonomy (2026-07-17): 8 lifestyles + cross-cutting attributes.
export const LIFESTYLES = [
  "Boating & Deepwater",
  "Beach & Oceanfront",
  "Waterfront",
  "Downtown & Urban",
  "Golf & Club",
  "Island",
  "Equestrian",
  "Historic",
] as const;

export const ATTRIBUTES = ["walkable", "gated", "pet-friendly", "penthouse", "new-construction"] as const;

export const COUNTIES = ["Palm Beach", "Martin", "Broward", "Miami-Dade"] as const;
