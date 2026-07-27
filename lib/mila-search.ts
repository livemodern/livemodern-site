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
// Single-family = detached homes ONLY. Townhouse and Villa are attached/semi-
// attached and are NOT what someone means by "single-family home" — the MLS
// spells it "SingleFamilyResidence" (no spaces), which the old list missed.
const HOME_SUBTYPES = ["SingleFamilyResidence", "Single Family Residence", "Single Family Detached"];
const TOWNHOME_SUBTYPES = ["Townhouse", "Villa"];

export interface MilaSearchInput {
  lifestyles?: string[];
  attributes?: string[];
  archStyle?: string;
  kind?: "condos" | "homes" | "townhomes" | "any";
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

// LiveModern is a CURATED luxury site — condos surface at $2M+, homes at $3M+,
// and only tagged/enriched inventory shows. This is the site's identity, not a
// limitation to route around. When a request falls below the floor, MiLa should
// redirect to the main site (modernlivingre.com), NOT scrape the full MLS.
const LM_CONDO_FLOOR = 2_000_000;
const LM_HOME_FLOOR = 3_000_000;

async function runQuery(sbUrl: string, key: string, params: string[], sel: string): Promise<any[]> {
  const url = `${sbUrl}/rest/v1/properties?${params.join("&")}&select=${sel}&order=list_price.desc&limit=1000`;
  const res = await fetch(url, { headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: "no-store" });
  if (!res.ok) return [];
  return (await res.json()) as any[];
}

export interface MilaSearchResult {
  count: number;
  listings: MilaListing[];
  belowFloor?: boolean;   // the request's budget is under LiveModern's luxury floor
  floor?: number;         // the applicable floor, so MiLa can name it
}

/**
 * LiveModern curated search. Respects the site's luxury floors ($2M condos /
 * $3M homes) and its tagged inventory. If the visitor's max budget is below the
 * floor, returns belowFloor=true with NO listings — MiLa uses that to say "on
 * this site our condos start at $2M, but our sister site modernlivingre.com has
 * lots in your range" rather than showing off-brand cheap inventory or wrongly
 * claiming nothing exists.
 */
export async function milaSearch(input: MilaSearchInput): Promise<MilaSearchResult> {
  if (!SB_KEY) return { count: 0, listings: [] };

  const floor = input.kind === "homes" ? LM_HOME_FLOOR : LM_CONDO_FLOOR;

  // If they've named a ceiling below our floor, don't search — signal a redirect.
  if (input.maxPrice != null && input.maxPrice < floor) {
    return { count: 0, listings: [], belowFloor: true, floor };
  }

  const sel =
    "mls_id,street_address,unit_number,city,county,zip,list_price,beds,baths,sqft,image_urls," +
    "property_subtype,arch_style,community_slug,lifestyle_tags,lifestyle_attributes";

  // Curated inventory only: tagged listings at/above the floor.
  const params: string[] = ["status=eq.Active", `list_price=gte.${Math.max(input.minPrice ?? 0, floor)}`];
  params.push("lifestyle_tags=not.is.null"); // curated/enriched set only

  if (input.lifestyles?.length) {
    const arr = "{" + input.lifestyles.map((l) => `"${l}"`).join(",") + "}";
    params.push(`lifestyle_tags=cs.${encodeURIComponent(arr)}`);
  }
  if (input.attributes?.length) {
    const arr = "{" + input.attributes.map((a) => `"${a}"`).join(",") + "}";
    params.push(`lifestyle_attributes=cs.${encodeURIComponent(arr)}`);
  }
  if (input.archStyle) params.push(`arch_style=eq.${encodeURIComponent(input.archStyle)}`);
  if (input.county) params.push(`county=eq.${encodeURIComponent(input.county)}`);
  if (input.zip) params.push(`zip=eq.${encodeURIComponent(input.zip)}`);
  else if (input.city) params.push(`city=ilike.${encodeURIComponent("%" + input.city + "%")}`);
  if (input.maxPrice) params.push(`list_price=lte.${input.maxPrice}`);
  if (input.bedsExact != null) params.push(`beds=eq.${input.bedsExact}`);
  else if (input.bedsMin) params.push(`beds=gte.${input.bedsMin}`);
  if (input.bathsMin) params.push(`baths=gte.${input.bathsMin}`);

  try {
    let rows = await runQuery(SB_URL, SB_KEY, params, sel);
    if (input.kind === "condos") rows = rows.filter((r) => CONDO_SUBTYPES.includes(r.property_subtype ?? ""));
    else if (input.kind === "homes") {
      // "home" / "single-family home" = detached only. Townhomes/villas are a
      // different product — do NOT return them when someone asked for a house.
      rows = rows.filter((r) => HOME_SUBTYPES.includes(r.property_subtype ?? ""));
    } else if (input.kind === "townhomes") {
      rows = rows.filter((r) => TOWNHOME_SUBTYPES.includes(r.property_subtype ?? ""));
    }
    // For "any", keep everything residential-ish; drop land/commercial noise.
    if (!input.kind || input.kind === "any") {
      const RESIDENTIAL = new Set([...CONDO_SUBTYPES, ...HOME_SUBTYPES, ...TOWNHOME_SUBTYPES]);
      rows = rows.filter((r) => RESIDENTIAL.has(r.property_subtype ?? ""));
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
    return { count, listings, floor };
  } catch {
    return { count: 0, listings: [] };
  }
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
