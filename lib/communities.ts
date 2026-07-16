import raw from "@/data/communities.json";

export type BuildingFacts = {
  status?: "presale" | "pre_construction" | "under_construction" | "new_construction";
  developer?: string;
  architect?: string;
  architect2?: string;
  unit_count?: number;
  stories?: number;
  completion?: number;
  price_from?: number;
};

/** The two-pill classification the page shows. presale/pre_construction/
 *  under_construction all read "Pre-Construction"; new_construction reads
 *  "New Construction". */
export function statusPill(f?: BuildingFacts): "Pre-Construction" | "New Construction" {
  return f?.status === "new_construction" ? "New Construction" : "Pre-Construction";
}

/** The granular stage label for the fact sheet (more detail than the pill). */
export function stageLabel(f?: BuildingFacts): string | null {
  switch (f?.status) {
    case "presale": return "Pre-Sale";
    case "pre_construction": return "Pre-Construction";
    case "under_construction": return "Under Construction";
    case "new_construction": return "New Construction";
    default: return null;
  }
}

export type Community = {
  slug: string;
  name: string;
  type: "building" | "collection" | string;
  city: string | null;
  county: string | null;
  hero: string;
  metaDescription: string;
  seoTitle: string;
  body: string[];
  gallery: string[];
  galleryW?: number[];
  lifestyles?: string[];
  facts?: BuildingFacts;
};

/** The three city hub pages (old-site "View All" URLs, preserved slugs). */
export const CITY_HUBS: { slug: string; county: string; label: string }[] = [
  { slug: "palm-beach-condos-for-sale", county: "Palm Beach", label: "Palm Beach" },
  { slug: "fort-lauderdale-condos-for-sale", county: "Broward", label: "Fort Lauderdale" },
  { slug: "miami-luxury-condos", county: "Miami-Dade", label: "Miami" },
];

export function hubForCounty(county: string | null): { slug: string; label: string } | undefined {
  return CITY_HUBS.find((h) => h.county === county);
}

export function hubBySlug(slug: string): { slug: string; county: string; label: string } | undefined {
  return CITY_HUBS.find((h) => h.slug === slug);
}

/** URL-safe anchor for an area heading, e.g. "Sunny Isles Beach" -> "sunny-isles-beach". */
export function areaAnchor(city: string): string {
  return city.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

/**
 * Content source.
 *
 * Today this reads a build-time snapshot of the `site_communities` rows for the
 * LiveModern tenant (site_id 61134a2d-c231-47fc-897d-31f318e2f44d), generated
 * from Supabase and committed to `data/communities.json`.
 *
 * TO GO LIVE AGAINST SUPABASE: set SUPABASE_SERVICE_ROLE_KEY on the Vercel
 * project and replace the body of getAll() with a fetch to
 *   /rest/v1/site_communities?site_id=eq.<LIVEMODERN_SITE_ID>&select=...
 * Nothing else in the app needs to change — every page reads through here.
 */
const ALL = raw as Community[];

export function getAll(): Community[] {
  return ALL;
}

export function getBuildings(): Community[] {
  return ALL.filter((c) => c.type === "building");
}

export function getCollections(): Community[] {
  return ALL.filter((c) => c.type === "collection");
}

export function getBySlug(slug: string): Community | undefined {
  return ALL.find((c) => c.slug === slug);
}

export function getByCounty(county: string): Community[] {
  return getBuildings().filter((c) => c.county === county);
}

/** Other buildings in the same county, for the "More from the index" rail. */
export function getRelated(c: Community, limit = 3): Community[] {
  return getBuildings()
    .filter((x) => x.slug !== c.slug && x.county === c.county && x.gallery.length > 0)
    .slice(0, limit);
}

export const COUNTIES = ["Palm Beach", "Broward", "Miami-Dade"] as const;

export function countyCounts(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const c of getBuildings()) {
    if (c.county) out[c.county] = (out[c.county] ?? 0) + 1;
  }
  return out;
}

/**
 * Cloudflare Image Transformations, matching the platform pattern in
 * mlg-site/src/lib/img.ts. images.livemodern.com is an R2 custom domain on the
 * livemodern.com zone with Transformations enabled, so /cdn-cgi/image/ resizes
 * on Cloudflare's edge — no Vercel Image Optimization, no per-transform Vercel
 * billing. Same mechanism every other MLG site uses.
 */
const CF = "https://images.livemodern.com/cdn-cgi/image";

/** Transformed image URL at a given width. Returns "" for a falsy input. */
export function cf(url: string, w: number, q = 78): string {
  return url ? `${CF}/width=${w},quality=${q},format=auto/${url}` : "";
}

/** srcset string across the given widths, for responsive <img>. */
export function cfSrcSet(url: string, widths: number[], q = 78): string {
  return url ? widths.map((w) => `${cf(url, w, q)} ${w}w`).join(", ") : "";
}


/** Count buildings per lifestyle tag (excludes the universal "New Construction"). */
export function lifestyleCounts(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const c of getBuildings())
    for (const t of c.lifestyles ?? [])
      if (t !== "New Construction") out[t] = (out[t] ?? 0) + 1;
  return out;
}

/** Buildings carrying a given lifestyle tag, best-hero first. */
export function buildingsByLifestyle(tag: string): Community[] {
  return getBuildings().filter((c) => (c.lifestyles ?? []).includes(tag));
}


/** Infer a display county for a collection (which store no county) from its
 *  slug. Uses the short forms Patrick prefers (Dade, Broward, Palm Beach). */
export function collectionCounty(slug: string): string | null {
  const s = slug.toLowerCase();
  if (s.startsWith("miami") || s.includes("brickell") || s.includes("hollywood")) return "Dade";
  if (s.startsWith("fort-lauderdale") || s.includes("pompano")) return "Broward";
  if (s.startsWith("palm-beach") || s.includes("downtown-palm-beach")) return "Palm Beach";
  return null; // south-florida-wide collections stay blank
}

/** Short county label for display (Miami-Dade -> Dade). */
export function countyShort(county?: string | null): string | null {
  if (!county) return null;
  if (county === "Miami-Dade") return "Dade";
  return county;
}
