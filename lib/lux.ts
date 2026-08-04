// LiveModern is a curated luxury brand — Palm Beach to Miami, design-forward,
// expensive. Its search should never surface the low end (sub-luxury condos,
// 55+ communities, mobile/manufactured homes, commercial, land). These are the
// single source of truth for those thresholds — tune the two numbers here and
// both the search engine and the location-count autocomplete follow.
//
// The floors apply to /search results + counts ONLY. A direct listing link
// (mls_id) bypasses them, so a client who saved a lower-priced listing on
// modernlivingre.com can still open it from their account here.

export const LUX_SALE_FLOOR = 2_000_000; // no for-sale listing under $2M (matches
// the Miami / Fort Lauderdale load floor so every market reads consistently).
// NOTE: this is a SEARCH FILTER only — the $1M–$2M Palm Beach inventory stays in
// the DB (the MLG main site still shows it); LiveModern just doesn't surface it.
export const LUX_RENT_FLOOR = 10_000; // no rental under $10,000 / month

// Residential dwellings only — excludes ManufacturedHome, MobileHome, land,
// agriculture, and every commercial subtype (Retail, Office, Business, etc.).
export const LUX_SUBTYPES = [
  "Condominium",
  "Apartment",
  "SingleFamilyResidence",
  "Villa",
  "Townhouse",
] as const;
