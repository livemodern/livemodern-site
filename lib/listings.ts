import sample from "@/data/sample-listings.json";

/** The MLS photo host (auth-free, Cloudflare-transformable). */
const MLS_CF = "https://images.mlrecloud.com/cdn-cgi/image";

/** Transform an MLS photo URL at a given width. */
export function mls(url: string, w: number, q = 80): string {
  return url ? `${MLS_CF}/width=${w},quality=${q},format=auto/${url}` : "";
}
export function mlsSrcSet(url: string, widths: number[], q = 80): string {
  return url ? widths.map((w) => `${mls(url, w, q)} ${w}w`).join(", ") : "";
}

/**
 * THE FEATURED AGENT — this is a lead-gen site.
 *
 * The contact card ALWAYS features one of our agents, never the listing agent.
 * Leads route to us (or a referred Compass agent), not the listing brokerage.
 * The listing agent's *email* appears once, in the compliance line only
 * (BeachesMLS §20) — matching mlg-site's app/listings/[mlsId]/page.tsx.
 *
 * For now every community features Patrick. When Miami / Fort Lauderdale
 * referral agents come online, resolve per-community here (a `featured_agent_id`
 * on the community, or a market → agent map) — this is the single swap point.
 */
export type FeaturedAgent = {
  name: string;
  title: string;
  phone: string; // display format
  phoneHref: string; // tel: digits
  email: string;
  photo: string;
};

export const PATRICK: FeaturedAgent = {
  name: "Patrick Lafferty",
  title: "Founding Agent · Modern Living Group at Compass",
  phone: "561.603.4329",
  phoneHref: "5616034329",
  email: "patrick@modernlivingre.com",
  photo:
    "https://ezcikavnfchqaenweygw.supabase.co/storage/v1/object/public/agent-photos/a34fe83e-10cd-4a3f-9f4a-a3e58e358069/headshot-1781048024794.jpg",
};

export function featuredAgentFor(_listing: Listing): FeaturedAgent {
  // TODO: per-market resolution (Miami / FLL referral agents). Patrick for now.
  return PATRICK;
}

export type Listing = {
  mls_id: string;
  listing_id: string | null;
  street_address: string | null;
  unit_number: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  list_price: number | null;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  year_built: number | null;
  property_type: string | null;
  property_subtype: string | null;
  building_name: string | null;
  subdivision_name: string | null;
  image_urls: string[] | null;
  description: string | null;
  list_office_name: string | null;
  list_agent_email: string | null;
  view: string | null;
  waterfront_features: string | null;
  days_on_market: number | null;
  hoa_fee: number | null;
  tax_annual: number | null;
  garage_spaces: number | null;
  stories: number | null;
  lot_size_acres: number | null;
  has_pool: boolean | null;
  flooring: string | null;
  building_amenities: string | null;
  community_slug: string | null;
  status: string | null;
  close_price?: number | null;
  close_date?: string | null;
};

const SAMPLE = sample as Listing[];

const SB_URL = process.env.SUPABASE_URL ?? "https://ezcikavnfchqaenweygw.supabase.co";
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

const COLS =
  "mls_id,listing_id,street_address,unit_number,city,state,zip,list_price,beds,baths,sqft,year_built,property_type,property_subtype,building_name,subdivision_name,image_urls,description,list_office_name,list_agent_email,view,waterfront_features,days_on_market,hoa_fee,tax_annual,garage_spaces,stories,lot_size_acres,has_pool,flooring,building_amenities,community_slug,status";

/**
 * Fetch a listing by MLS id. Uses live Supabase when the service key is set on
 * Vercel; otherwise falls back to the baked sample set so the page is always
 * demonstrable. Same pattern as the community loader.
 */
export async function getListing(mlsId: string): Promise<Listing | null> {
  if (SB_KEY) {
    try {
      const res = await fetch(
        `${SB_URL}/rest/v1/properties?mls_id=eq.${encodeURIComponent(mlsId)}&select=${COLS}&limit=1`,
        {
          headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
          next: { revalidate: 900 }, // 15 min, matches the sync cadence
        },
      );
      if (res.ok) {
        const rows = (await res.json()) as Listing[];
        if (rows[0]) return rows[0];
      }
    } catch {
      /* fall through to sample */
    }
  }
  return SAMPLE.find((l) => l.mls_id === mlsId) ?? null;
}

export function sampleListings(): Listing[] {
  return SAMPLE;
}

// ── Classification ──────────────────────────────────────────────────────────

/** Pre-construction: year_built in the future, or no tax record yet. */
export function isPresale(l: Listing): boolean {
  const yr = l.year_built ?? 0;
  const nextYear = new Date().getFullYear() + 1;
  return yr >= nextYear;
}

export type ListingKind = "presale" | "home" | "condo";

export function listingKind(l: Listing): ListingKind {
  if (isPresale(l)) return "presale";
  const sub = (l.property_subtype ?? "").toLowerCase();
  if (sub.includes("condo") || sub.includes("apartment") || l.building_name) return "condo";
  return "home";
}

// ── Formatting ──────────────────────────────────────────────────────────────

export function money(v: number | null | undefined): string {
  return v == null ? "—" : `$${Math.round(v).toLocaleString()}`;
}
export function pricePerSqft(l: Listing): string {
  if (!l.list_price || !l.sqft) return "—";
  return `$${Math.round(l.list_price / l.sqft).toLocaleString()}`;
}
/**
 * Trestle bakes the unit onto the end of street_address
 * ("3550 S Ocean Boulevard 3d") AND exposes it in unit_number ("3d"), so naive
 * concatenation double-prints it ("...Boulevard 3d #3d"). Strip a trailing unit
 * token from the street line, then re-append it cleanly as " #unit".
 */
function streetWithUnit(streetRaw: string, unitRaw: string | null | undefined): string {
  let street = streetRaw.trim();
  const unit = (unitRaw ?? "").trim();
  if (unit) {
    // Remove the unit if it's the final whitespace-delimited token (case-insensitive).
    const re = new RegExp("\\s+" + unit.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&") + "$", "i");
    street = street.replace(re, "").trim();
    // "#" reads right for numeric units (#1814, #3d) but odd for word units
    // ("#Penthouse"). Prefix only when the unit contains a digit.
    const label = /\\d/.test(unit) ? `#${unit}` : unit;
    return `${street} ${label}`.trim();
  }
  return street;
}

export function fullAddress(l: Listing): string {
  // street_address includes the ", City, ST ZIP" tail; keep it for the full form
  // but de-dupe the unit. Split off the locality tail, fix the unit, re-attach.
  const [street, ...tail] = (l.street_address ?? "").split(",");
  const fixed = streetWithUnit(street, l.unit_number);
  return [fixed, ...tail.map((t) => t.trim())].filter(Boolean).join(", ");
}

/**
 * Just the street line — strips the ", City, ST ZIP" tail that Trestle bakes
 * into street_address, and de-dupes the unit. "3550 S Ocean Boulevard 3d" +
 * unit "3d" -> "3550 S Ocean Boulevard #3d". Used in breadcrumbs.
 */
export function streetOnly(l: Listing): string {
  const street = (l.street_address ?? "").split(",")[0];
  return streetWithUnit(street, l.unit_number);
}
export function mlsDisplay(l: Listing): string {
  return l.listing_id ? l.listing_id : `RX-${l.mls_id}`;
}

/** Amenities come as a comma-joined token string; humanize a few. */
export function amenityList(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.replace(/([a-z])([A-Z])/g, "$1 $2"));
}


// ── Building inventory (for community pages that map to real MLS rows) ───────

export type BuildingInventory = {
  forSale: Listing[]; // truly available (Active/ComingSoon/New) + pending, in that order
  forRent: Listing[];
  recentSales: Listing[];
  activeCount: number; // AVAILABLE only — excludes Pending / Under Contract
  pendingCount: number;
};

// What counts as genuinely AVAILABLE. Pending + ActiveUnderContract are under
// contract — shown in the grid (sorted last, tagged) but NOT counted as
// available and NOT labeled "For Sale". Matches mlg-site/src/lib/community.ts.
const AVAILABLE = new Set(["Active", "ComingSoon"]);
const PENDING = new Set(["Pending", "ActiveUnderContract"]);

/** Rentals come back as ResidentialLease from Trestle; also small $ list_price. */
function isRental(l: Listing): boolean {
  const t = (l.property_type ?? "").toLowerCase();
  if (t.includes("lease") || t.includes("rental")) return true;
  // Heuristic backstop: a "sale" under $50k in these buildings is a monthly rent.
  return (l.list_price ?? 0) > 0 && (l.list_price ?? 0) < 50000;
}

/** Is this listing under contract (not available)? Drives the card tag + count. */
export function isPending(l: Listing): boolean {
  return PENDING.has(l.status ?? "");
}

/**
 * Live inventory for a building, keyed on properties.community_slug. Returns
 * empty arrays when the building has no MLS rows (pre-construction / off-market),
 * so the page shows the "not on the MLS" state. Uses the service key when set,
 * else returns empty (baked build has no live listing data for arbitrary slugs).
 *
 * `activeCount` counts ONLY available units (Active/ComingSoon) — a pre-con
 * building with 42 developer-contract Pendings + 9 Actives reads "9 available",
 * not "52". Pending/AUC still render (sorted last, tagged "Under Contract").
 */
export async function getBuildingInventory(communitySlug: string): Promise<BuildingInventory> {
  const empty: BuildingInventory = {
    forSale: [],
    forRent: [],
    recentSales: [],
    activeCount: 0,
    pendingCount: 0,
  };
  if (!SB_KEY || !communitySlug) return empty;
  try {
    const url =
      `${SB_URL}/rest/v1/properties?community_slug=eq.${encodeURIComponent(communitySlug)}` +
      `&status=in.(Active,ComingSoon,Pending,ActiveUnderContract,Closed)` +
      `&dup_suppressed=eq.false` +
      `&select=${COLS},close_price,close_date&order=list_price.desc&limit=300`;
    const res = await fetch(url, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
      next: { revalidate: 900 },
    });
    if (!res.ok) return empty;
    const rows = (await res.json()) as (Listing & { close_price?: number; close_date?: string })[];

    const live = rows.filter((r) => AVAILABLE.has(r.status ?? "") || PENDING.has(r.status ?? ""));
    const forRent = live.filter(isRental);
    const sale = live.filter((r) => !isRental(r));

    // Order: available first (high→low, already sorted by the query), pending last.
    const available = sale.filter((r) => !isPending(r));
    const pending = sale.filter(isPending);
    const forSale = [...available, ...pending];

    const recentSales = rows
      .filter((r) => r.status === "Closed" && r.close_price)
      .sort((a, b) => (b.close_price ?? 0) - (a.close_price ?? 0))
      .slice(0, 24);

    return {
      forSale,
      forRent,
      recentSales,
      activeCount: available.length + forRent.length, // available only
      pendingCount: pending.length,
    };
  } catch {
    return empty;
  }
}


// ── Floorplans (community_floorplans, keyed by community_id) ─────────────────

export type Floorplan = {
  name: string | null;
  details: string | null; // "2 Beds, 3 Baths, 2085 Sqft"
  image_url: string;
  sort: number | null;
};

const LIVEMODERN_SITE_ID = "61134a2d-c231-47fc-897d-31f318e2f44d";

/**
 * Floorplans for a building, resolved by slug. Two hops: slug -> community id
 * (site_communities, scoped to the LiveModern tenant), then the floorplans.
 * Returns [] when the service key is unset or the building has none, so the
 * page simply omits the section. Mirrors mlg-site's community_floorplans model.
 */
export async function getFloorplans(slug: string): Promise<Floorplan[]> {
  if (!SB_KEY || !slug) return [];
  try {
    const cRes = await fetch(
      `${SB_URL}/rest/v1/site_communities?site_id=eq.${LIVEMODERN_SITE_ID}&slug=eq.${encodeURIComponent(slug)}&select=id&limit=1`,
      { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }, next: { revalidate: 3600 } },
    );
    if (!cRes.ok) return [];
    const c = (await cRes.json()) as { id: string }[];
    if (!c[0]) return [];
    const fRes = await fetch(
      `${SB_URL}/rest/v1/community_floorplans?community_id=eq.${c[0].id}&select=name,details,image_url,sort&order=sort.asc&limit=200`,
      { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }, next: { revalidate: 3600 } },
    );
    if (!fRes.ok) return [];
    return (await fRes.json()) as Floorplan[];
  } catch {
    return [];
  }
}

/** Pull beds/baths/sqft out of a details string for compact display. */
export function planSpecs(details: string | null): { beds?: string; baths?: string; sqft?: string } {
  if (!details) return {};
  const beds = details.match(/(\d+(?:\.\d+)?)\s*Bed/i)?.[1];
  const baths = details.match(/(\d+(?:\.\d+)?)\s*Bath/i)?.[1];
  const sqft = details.match(/([\d,]+)\s*Sq/i)?.[1];
  return { beds, baths, sqft };
}


/** LiveModern inventory floors for lifestyle queries. */
const LIFESTYLE_CONDO_FLOOR = 2000000;
const LIFESTYLE_HOME_FLOOR = 3000000;

export type LifestyleListing = {
  mls_id: string;
  street_address: string;
  unit_number: string | null;
  city: string;
  county: string;
  list_price: number | null;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  image_urls: string[] | null;
  property_subtype: string | null;
  arch_style: string | null;
  community_slug: string | null;
};

/**
 * Active listings carrying a lifestyle tag (written by the data-first tagger).
 * Condos surface at $2M+, homes at $3M+ — the curated LiveModern floors.
 * Priced high to low. Powers the lifestyle hub pages.
 */
export async function listingsByLifestyle(
  lifestyle: string,
  limit = 60,
  county?: string,
): Promise<LifestyleListing[]> {
  if (!SB_KEY) return [];
  const tag = encodeURIComponent(`{"${lifestyle}"}`);
  const sel =
    "mls_id,street_address,unit_number,city,county,list_price,beds,baths,sqft,image_urls,property_subtype,arch_style,community_slug";
  const countyFilter = county ? `&county=eq.${encodeURIComponent(county)}` : "";
  // Query by tag at the lower ($2M) floor, then apply the split floor in JS —
  // a single clean filter is far more robust than a PostgREST or=() in fetch.
  const url =
    `${SB_URL}/rest/v1/properties?lifestyle_tags=cs.${tag}` +
    `&status=eq.Active&list_price=gte.${LIFESTYLE_CONDO_FLOOR}${countyFilter}` +
    `&select=${sel}&order=list_price.desc&limit=${limit * 2}`;
  try {
    const res = await fetch(url, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
      next: { revalidate: 900 },
    });
    if (!res.ok) return [];
    const rows = (await res.json()) as LifestyleListing[];
    // condos surface at $2M+, homes at $3M+
    const isCondo = (t: string | null) => t === "Condominium" || t === "Apartment";
    return rows
      .filter(
        (r) =>
          isCondo(r.property_subtype) || (r.list_price ?? 0) >= LIFESTYLE_HOME_FLOOR,
      )
      .slice(0, limit);
  } catch {
    return [];
  }
}

/** Count of active tagged listings for a lifestyle (for hub headers). */
export async function lifestyleCount(lifestyle: string): Promise<number> {
  if (!SB_KEY) return 0;
  const tag = encodeURIComponent(`{"${lifestyle}"}`);
  const url =
    `${SB_URL}/rest/v1/properties?lifestyle_tags=cs.${tag}&status=eq.Active&select=id&limit=1`;
  try {
    const res = await fetch(url, {
      headers: {
        apikey: SB_KEY,
        Authorization: `Bearer ${SB_KEY}`,
        Prefer: "count=exact",
        Range: "0-0",
      },
      next: { revalidate: 900 },
    });
    const cr = res.headers.get("content-range") ?? "/0";
    return parseInt(cr.split("/").pop() ?? "0", 10);
  } catch {
    return 0;
  }
}
