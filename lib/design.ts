/**
 * By Design — the architecture lens.
 *
 * The vision-enrichment pipeline writes `arch_style` (one of the exact styles
 * below) onto each home's property row. This module groups those exact styles
 * into presentation FAMILIES, and provides the query that powers the /design
 * pages. Store exact, group for users — same principle as the lifestyle spine.
 */

const SB_URL = process.env.SUPABASE_URL ?? "https://ezcikavnfchqaenweygw.supabase.co";
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

/** LiveModern home floor — matches the enrichment/curation scope. */
const HOME_FLOOR = 3000000;

export type DesignFamily = {
  family: string;
  slug: string;
  blurb: string;
  styles: string[]; // exact arch_style values that roll up here
};

/** The 7 presentation families over the ~26 exact DB styles. */
export const DESIGN_FAMILIES: DesignFamily[] = [
  {
    family: "Modern & Contemporary",
    slug: "modern",
    blurb: "Clean lines, glass, and open volumes — the current vernacular of South Florida luxury.",
    styles: ["Modern", "Contemporary", "Mid-Century Modern", "Tropical Modern", "MiMo"],
  },
  {
    family: "Mediterranean & Spanish",
    slug: "mediterranean",
    blurb: "Barrel-tile roofs, stucco, and arches — the enduring Florida estate look.",
    styles: ["Mediterranean Revival", "Spanish Revival", "Italian / Tuscan"],
  },
  {
    family: "Coastal & Island",
    slug: "coastal",
    blurb: "British West Indies, Bermuda, and Key West — breezy, veranda'd, made for the water.",
    styles: ["British West Indies", "Bermuda", "Key West / Florida Cracker", "Coastal Traditional"],
  },
  {
    family: "Traditional & Historic",
    slug: "traditional",
    blurb: "Colonial, Georgian, and Craftsman — symmetry and craft from another era.",
    styles: ["Colonial", "Georgian", "Craftsman / Bungalow", "Tudor", "Ranch"],
  },
  {
    family: "European & Formal",
    slug: "european",
    blurb: "French, Regency, and Neoclassical — columns, pediments, and formal grandeur.",
    styles: ["French / Chateauesque", "Regency", "Neoclassical"],
  },
  {
    family: "Art Deco Era",
    slug: "deco",
    blurb: "1930s geometry and Streamline Moderne — Miami Beach's signature.",
    styles: ["Art Deco", "Streamline Moderne"],
  },
];

/** exact style -> family slug */
const STYLE_TO_FAMILY: Record<string, string> = Object.fromEntries(
  DESIGN_FAMILIES.flatMap((f) => f.styles.map((s) => [s, f.slug])),
);

export function familyBySlug(slug: string): DesignFamily | undefined {
  return DESIGN_FAMILIES.find((f) => f.slug === slug);
}

/** URL-safe slug for an exact style (e.g. "British West Indies" -> "british-west-indies"). */
export function styleSlug(style: string): string {
  return style.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function styleFromSlug(slug: string): string | undefined {
  return Object.keys(STYLE_TO_FAMILY).find((s) => styleSlug(s) === slug);
}

export type DesignHome = {
  mls_id: string;
  street_address: string;
  city: string;
  county: string;
  list_price: number | null;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  image_urls: string[] | null;
  arch_style: string;
  arch_style_secondary: string | null;
};

type CountRow = { arch_style: string };

/**
 * Counts per exact style across enriched homes at/above the floor. Powers the
 * landing + family pages without fetching full rows.
 */
export async function styleCounts(): Promise<Record<string, number>> {
  if (!SB_KEY) return {};
  const out: Record<string, number> = {};
  let offset = 0;
  // paginate (PostgREST 1000 cap)
  for (let i = 0; i < 10; i++) {
    const url =
      `${SB_URL}/rest/v1/properties?arch_style=not.is.null` +
      `&status=eq.Active&list_price=gte.${HOME_FLOOR}` +
      `&select=arch_style&limit=1000&offset=${offset}`;
    const res = await fetch(url, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
      next: { revalidate: 3600 },
    });
    if (!res.ok) break;
    const rows = (await res.json()) as CountRow[];
    for (const r of rows) out[r.arch_style] = (out[r.arch_style] ?? 0) + 1;
    if (rows.length < 1000) break;
    offset += 1000;
  }
  return out;
}

/** Homes for one exact style (or all styles in a family), newest/priciest first. */
export async function homesByStyle(
  styles: string[],
  limit = 60,
): Promise<DesignHome[]> {
  if (!SB_KEY || !styles.length) return [];
  const inList = styles.map((s) => `"${s.replace(/"/g, '\\"')}"`).join(",");
  const url =
    `${SB_URL}/rest/v1/properties?arch_style=in.(${encodeURIComponent(inList)})` +
    `&status=eq.Active&list_price=gte.${HOME_FLOOR}` +
    `&select=mls_id,street_address,city,county,list_price,beds,baths,sqft,image_urls,arch_style,arch_style_secondary` +
    `&order=list_price.desc&limit=${limit}`;
  const res = await fetch(url, {
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
    next: { revalidate: 900 },
  });
  if (!res.ok) return [];
  return (await res.json()) as DesignHome[];
}

export function familyForStyle(style: string): string | undefined {
  return STYLE_TO_FAMILY[style];
}
