// Shared XML builders for the split sitemap (index + child urlsets).
// Ported from mlg-site so both sites emit byte-identical sitemap shapes.
// Used by app/sitemap.xml (index), app/sitemap-pages.xml, app/sitemap-listings.xml.
export type SitemapEntry = { loc: string; lastmod?: string; changefreq?: string; priority?: number };

export function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function isoLastmod(d?: string | null): string | undefined {
  if (!d) return undefined;
  const t = new Date(d);
  return isNaN(t.getTime()) ? undefined : t.toISOString();
}

export function buildUrlset(entries: SitemapEntry[]): string {
  const rows = entries
    .map((e) => {
      const p = [`<loc>${xmlEscape(e.loc)}</loc>`];
      if (e.lastmod) p.push(`<lastmod>${e.lastmod}</lastmod>`);
      if (e.changefreq) p.push(`<changefreq>${e.changefreq}</changefreq>`);
      if (e.priority != null) p.push(`<priority>${e.priority}</priority>`);
      return `<url>${p.join("")}</url>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows}\n</urlset>`;
}

export function buildSitemapIndex(children: { loc: string; lastmod?: string }[]): string {
  const rows = children
    .map((c) => `<sitemap><loc>${xmlEscape(c.loc)}</loc>${c.lastmod ? `<lastmod>${c.lastmod}</lastmod>` : ""}</sitemap>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows}\n</sitemapindex>`;
}

export const XML_HEADERS = { "Content-Type": "application/xml; charset=utf-8" };
