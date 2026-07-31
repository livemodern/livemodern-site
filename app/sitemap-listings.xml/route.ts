import { SITE_URL } from "@/lib/site-url";
import { buildUrlset, isoLastmod, XML_HEADERS, type SitemapEntry } from "@/lib/sitemap-xml";
import communities from "@/data/communities.json";
import { listingHref } from "@/lib/listing-slug";

// Every live listing LiveModern actually surfaces, kept OUT of
// sitemap-pages.xml so Search Console reports the two sets separately (the
// same split modernlivingre.com uses).
//
// Scope mirrors what the site links to, not the whole MLS:
//   (a) inventory inside a LiveModern community — the units a building page
//       lists, at any price;
//   (b) curated lifestyle inventory — tagged listings at or above the site's
//       luxury floor ($2M), in the four counties LiveModern covers.
// Paginated (PostgREST caps at 1,000 rows) with a 50,000-URL ceiling, which is
// the per-sitemap limit. If eligible listings ever pass 50k, shard this into
// numbered children behind the index.
export const revalidate = 3600;
export const maxDuration = 60;

const SB_URL = process.env.SUPABASE_URL ?? "https://ezcikavnfchqaenweygw.supabase.co";
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const LUXURY_FLOOR = 2_000_000;
const COUNTIES = ["Martin", "Palm Beach", "Broward", "Miami-Dade"];
const CAP = 50_000;

type Row = { mls_id: string; updated_at: string | null };

async function page(url: string): Promise<Row[]> {
  const res = await fetch(url, {
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
    next: { revalidate: 3600 },
  });
  if (!res.ok) return [];
  return (await res.json()) as Row[];
}

/** The columns the slug needs, plus updated_at for lastmod. Previously this
 *  map held just updated_at, because the sitemap emitted bare MLS ids. */
type ListingRow = {
  mls_id: string;
  updated_at?: string | null;
  street_address?: string | null;
  unit_number?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
};

async function collect(filter: string, into: Map<string, ListingRow>): Promise<void> {
  for (let offset = 0; offset < CAP; offset += 1000) {
    if (into.size >= CAP) return;
    const rows = await page(
      `${SB_URL}/rest/v1/properties?${filter}` +
        `&select=mls_id,updated_at,street_address,unit_number,city,state,zip&order=mls_id.asc&limit=1000&offset=${offset}`,
    );
    // Store the whole row: the sitemap must emit the SEO slug, not the bare
    // id, or we'd be publishing the URLs we just made non-canonical.
    for (const r of rows) if (r.mls_id) into.set(r.mls_id, r as ListingRow);
    if (rows.length < 1000) return;
  }
}

export async function GET() {
  const found = new Map<string, ListingRow>();

  if (SB_KEY) {
    const slugs = (communities as { slug: string }[]).map((c) => c.slug);
    const counties = `county=in.(${COUNTIES.map((c) => `"${c}"`).join(",")})`;

    // (a) building inventory — chunked so the slug list can't blow the URL length
    for (let i = 0; i < slugs.length; i += 60) {
      const chunk = slugs.slice(i, i + 60).map((s) => `"${s}"`).join(",");
      await collect(`community_slug=in.(${chunk})&status=eq.Active`, found);
    }

    // (b) curated lifestyle inventory at or above the luxury floor
    await collect(
      `status=eq.Active&list_price=gte.${LUXURY_FLOOR}&lifestyle_tags=not.is.null&${counties}`,
      found,
    );
  }

  const out: SitemapEntry[] = [...found.values()].map((r) => ({
    loc: `${SITE_URL}${listingHref(r)}`,
    lastmod: isoLastmod(r.updated_at),
    changefreq: "daily",
    priority: 0.5,
  }));

  return new Response(buildUrlset(out), { headers: XML_HEADERS });
}
