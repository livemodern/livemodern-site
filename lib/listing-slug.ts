// SEO-friendly slugs for listing detail URLs.
// Pattern: /listing/<street>-<unit>-<city>-<state>-<zip>-<mls_id>
//
// Ported verbatim in behaviour from mlg-site's src/lib/listing-slug.ts so both
// sites produce the SAME slug shape for the same property — only the path
// prefix differs (/listing here, /listings there), which is settled and not
// worth churning existing URLs over.
//
// The trailing numeric segment is the MLS id and is what we look the property
// up by, so a bare-id URL still resolves; the page 308s it to the slug form.

type ListingMin = {
  mls_id: string | number;
  street_address?: string | null;
  unit_number?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
};

export function slugifyListing(p: ListingMin): string {
  const street = String(p.street_address || "").trim();
  const city = String(p.city || "").trim();

  // Trestle's street_address (from UnparsedAddress) often ALREADY contains
  // "<street> <unit> <city> <state> <zip>". Appending them again would double
  // every token in the URL.
  const streetIncludesCity = !!city && street.toLowerCase().includes(city.toLowerCase());

  const parts = streetIncludesCity
    ? [street, p.mls_id]
    : [street, city, p.state, p.zip, p.mls_id];

  return parts
    .filter(Boolean)
    .map(String)
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Canonical href. Falls back to the bare id when a caller only has mls_id —
 *  the detail page 308s that to the slug, so a thin call site degrades to one
 *  extra redirect rather than a broken link. */
export function listingHref(p: ListingMin): string {
  const slug = slugifyListing(p);
  return "/listing/" + (slug || String(p.mls_id));
}

/** Pull the MLS id back out. Handles the slug form, a bare id, and anything
 *  unexpected (returned as-is so the lookup 404s honestly rather than throwing). */
export function mlsIdFromSlug(slug: string): string {
  const m = slug.match(/-(\d+)$/);
  if (m) return m[1];
  if (/^\d+$/.test(slug)) return slug;
  return slug;
}
