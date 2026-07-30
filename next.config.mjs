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

      // LiveModern adopts the MLG slug for these two buildings so both sites'
      // pages are fed by the same community_slug — properties.community_slug is
      // single-valued, so two slugs for one building means one page is always
      // empty.
      { source: "/alina-residences-boca-raton", destination: "/alina-boca-raton", permanent: true },
      { source: "/residences-mandarin-oriental-boca-raton", destination: "/mandarin-oriental", permanent: true },

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

      // Old browse/search surfaces -> Collections
      { source: "/search-by-lifestyle", destination: "/collections", permanent: true },
      { source: "/search", destination: "/collections", permanent: true },
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

      // Old REW listing detail URLs were /listing/{mlsid}-{address-slug}
      // (e.g. /listing/a12033838-11834-island-lakes-lane-boca-raton-fl-33498).
      // Those MLS ids don't exist in our feed (ours are numeric), so they can't
      // resolve 1:1. The dash pattern only matches the OLD shape — the live
      // route /listing/{numeric mls_id} is never caught by this.
      { source: "/listing/:slug(.*-.*)", destination: "/collections", permanent: true },
    ];
  },
};
export default nextConfig;
