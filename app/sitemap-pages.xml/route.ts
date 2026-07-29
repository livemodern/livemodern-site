import { SITE_URL } from "@/lib/site-url";
import { getAll, LIFESTYLE_HUBS } from "@/lib/communities";
import { getArticles } from "@/lib/journal";
import { buildUrlset, XML_HEADERS, type SitemapEntry } from "@/lib/sitemap-xml";

// Stable, high-value URLs. Generated from the SAME sources app/[slug] uses in
// generateStaticParams (communities.json + LIFESTYLE_HUBS) plus the journal, so
// this can never drift out of sync with what the site actually serves.
export const revalidate = 3600;

const B = SITE_URL;

export async function GET() {
  const out: SitemapEntry[] = [
    { loc: `${B}/`, changefreq: "daily", priority: 1 },
    { loc: `${B}/new-construction`, changefreq: "daily", priority: 0.9 },
    { loc: `${B}/collections`, changefreq: "weekly", priority: 0.8 },
    { loc: `${B}/featured-buildings`, changefreq: "weekly", priority: 0.8 },
    { loc: `${B}/journal`, changefreq: "weekly", priority: 0.7 },
    { loc: `${B}/contact`, changefreq: "monthly", priority: 0.6 },
  ];

  const hubSlugs = new Set(LIFESTYLE_HUBS.map((h) => h.slug));
  for (const h of LIFESTYLE_HUBS) {
    out.push({ loc: `${B}/${h.slug}`, changefreq: "weekly", priority: 0.8 });
  }

  // Buildings, city hubs and lifestyle spokes all live in communities.json.
  for (const c of getAll()) {
    if (hubSlugs.has(c.slug)) continue;
    out.push({
      loc: `${B}/${c.slug}`,
      changefreq: "weekly",
      priority: c.type === "collection" ? 0.8 : 0.7,
    });
  }

  for (const a of getArticles()) {
    out.push({ loc: `${B}/journal/${a.slug}`, changefreq: "monthly", priority: 0.6 });
  }

  return new Response(buildUrlset(out), { headers: XML_HEADERS });
}
