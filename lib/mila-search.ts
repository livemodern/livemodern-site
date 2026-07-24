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
  lifestyles?: string[];     // AND intersection — "Boating & Deepwater" + "Beach & Oceanfront"
  attributes?: string[];     // gated, penthouse, pet-friendly, walkable, new-construction
  archStyle?: string;        // "British West Indies", "Contemporary", ...
  kind?: "condos" | "homes" | "any";
  county?: string;           // "Palm Beach" | "Martin" | "Broward" | "Miami-Dade"
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  bedsMin?: number;
  limit?: number;
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

/**
 * Intersect the enriched tags. lifestyle_tags uses AND (cs contains-all when we
 * pass multiple), attributes AND, plus arch/kind/price/beds/county filters.
 */
export async function milaSearch(input: MilaSearchInput): Promise<{ count: number; listings: MilaListing[] }> {
  if (!SB_KEY) return { count: 0, listings: [] };

  const sel =
    "mls_id,street_address,unit_number,city,county,list_price,beds,baths,sqft,image_urls," +
    "property_subtype,arch_style,community_slug,lifestyle_tags,lifestyle_attributes";

  const params: string[] = ["status=eq.Active"];

  // lifestyle_tags contains ALL requested (AND / intersection).
  if (input.lifestyles?.length) {
    const arr = "{" + input.lifestyles.map((l) => `"${l}"`).join(",") + "}";
    params.push(`lifestyle_tags=cs.${encodeURIComponent(arr)}`);
  }
  // attributes contains ALL requested (AND).
  if (input.attributes?.length) {
    const arr = "{" + input.attributes.map((a) => `"${a}"`).join(",") + "}";
    params.push(`lifestyle_attributes=cs.${encodeURIComponent(arr)}`);
  }
  if (input.archStyle) params.push(`arch_style=eq.${encodeURIComponent(input.archStyle)}`);
  if (input.county) params.push(`county=eq.${encodeURIComponent(input.county)}`);
  if (input.city) params.push(`city=ilike.${encodeURIComponent("%" + input.city + "%")}`);
  if (input.minPrice) params.push(`list_price=gte.${input.minPrice}`);
  if (input.maxPrice) params.push(`list_price=lte.${input.maxPrice}`);
  if (input.bedsMin) params.push(`beds=gte.${input.bedsMin}`);

  const url =
    `${SB_URL}/rest/v1/properties?${params.join("&")}` +
    `&select=${sel}&order=list_price.desc&limit=1000`;

  try {
    const res = await fetch(url, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
      cache: "no-store",
    });
    if (!res.ok) return { count: 0, listings: [] };
    let rows = (await res.json()) as any[];

    // kind gate in JS (subtype lists).
    if (input.kind === "condos") rows = rows.filter((r) => CONDO_SUBTYPES.includes(r.property_subtype ?? ""));
    else if (input.kind === "homes") rows = rows.filter((r) => HOME_SUBTYPES.includes(r.property_subtype ?? ""));

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
