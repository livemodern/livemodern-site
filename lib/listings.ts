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
export function fullAddress(l: Listing): string {
  const unit = l.unit_number ? ` #${l.unit_number}` : "";
  return `${l.street_address ?? ""}${unit}`.trim();
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
