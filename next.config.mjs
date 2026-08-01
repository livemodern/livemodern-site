/** @type {import('next').NextConfig} */
const nextConfig = {
  // Images are served + resized by Cloudflare (images.livemodern.com/cdn-cgi/image),
  // not the Next/Vercel optimizer — see lib/communities.ts cf(). No images config needed.
  async redirects() {
    return [
      // ---------------------------------------------------------------
      // Internal renames (pre-existing)
      // ---------------------------------------------------------------
      { source: "/modern-homes", destination: "/collections", permanent: true },
      { source: "/design", destination: "/collections#theme-design", permanent: true },
      { source: "/fort-lauderdale-golf-course-homes", destination: "/golf", permanent: true },
      { source: "/fort-lauderdale-equestrian-homes", destination: "/palm-beach-equestrian-homes", permanent: true },
      // Community slug corrected to city-suffixed canonical (was a live indexed URL)
      { source: "/mr-c-residences", destination: "/mr-c-residences-coconut-grove", permanent: true },

      // ---------------------------------------------------------------
      // REW livemodern.com URL parity (built from real site_events traffic).
      // Order matters: specific entries before their catch-alls.
      // ---------------------------------------------------------------

      // Blog -> Journal. Only 3 posts have been rebuilt so far, so the
      // remaining ~30 old post URLs land on the Journal index rather than 404.
      { source: "/blog", destination: "/journal", permanent: true },
      { source: "/blogs", destination: "/journal", permanent: true },
      { source: "/blog-directory", destination: "/journal", permanent: true },
      { source: "/blog/:slug*", destination: "/journal", permanent: true },

      // REW's IDX search app (644 old pageviews) -> the register
      { source: "/idx", destination: "/new-construction", permanent: true },
      { source: "/idx/:path*", destination: "/new-construction", permanent: true },

      // Old browse/search surfaces -> Collections. NOTE: /search itself is now a
      // real page (the full county-wide search), so it is intentionally NOT
      // redirected here anymore. /search-by-lifestyle + /communities still go
      // to Collections (the lifestyle front door).
      { source: "/search-by-lifestyle", destination: "/collections", permanent: true },
      { source: "/communities", destination: "/collections", permanent: true },

      // Old static pages with no new equivalent
      { source: "/about", destination: "/", permanent: true },
      { source: "/agents", destination: "/contact", permanent: true },
      { source: "/seller", destination: "/contact", permanent: true },
      { source: "/home-valuation", destination: "/contact", permanent: true },
      { source: "/mortgage-calculator", destination: "/", permanent: true },
      { source: "/test-snippet", destination: "/", permanent: true },
      { source: "/sitemap", destination: "/sitemap.xml", permanent: true },
      { source: "/office/:path*", destination: "/contact", permanent: true },

      // REW served .php twins of every page — strip the extension.
      { source: "/:slug([^/]+)\\.php", destination: "/:slug", permanent: true },

      // Legacy REW listing URLs (/listing/{rew-mlsid}-{address-slug}) are handled
      // in app/listing/[mls]/page.tsx, NOT here. The rule that used to live at
      // this spot matched "/listing/:slug(.*-.*)" — any listing path containing
      // a hyphen — on the assumption that our own URLs were always bare numeric
      // ids. The moment listings moved to SEO slugs, that assumption inverted
      // and every real listing 301'd to /collections. A redirect written around
      // the shape of today's URLs is a trap for tomorrow's; the page can just
      // look the id up and decide.
    ];
  },
};
export default nextConfig;
