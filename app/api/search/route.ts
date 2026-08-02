import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { LUX_SALE_FLOOR, LUX_RENT_FLOOR, LUX_SUBTYPES } from "@/lib/lux";

// LiveModern /api/search — the county-wide query engine, ported from mlg-search.
// Same shared `properties_search` view, same filter contract, so a saved search
// runs identically here or on modernlivingre.com. Design-agnostic: this only
// returns data; the LiveModern skin lives in the UI.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Card payload: keep the first few photos only so a 150-listing page stays light.
function trimPhotos<T extends { image_urls?: string[] | null }>(rows: T[]): T[] {
  return rows.map((r) => ({ ...r, image_urls: (r.image_urls ?? []).slice(0, 5) }));
}

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const bounds = p.get("bounds");
  const status = p.get("status") || "OnMarket";
  const forRent = p.get("for_rent") === "true";
  const bedsMin = p.get("beds_min") ? Number(p.get("beds_min")) : null;
  const bedsMax = p.get("beds_max") ? Number(p.get("beds_max")) : null;
  const bathsMin = p.get("baths_min") ? Number(p.get("baths_min")) : null;
  const bathsMax = p.get("baths_max") ? Number(p.get("baths_max")) : null;
  const priceMin = p.get("priceMin")
    ? Number(p.get("priceMin"))
    : p.get("price_min")
      ? Number(p.get("price_min"))
      : null;
  const priceMax = p.get("priceMax")
    ? Number(p.get("priceMax"))
    : p.get("price_max")
      ? Number(p.get("price_max"))
      : null;
  const sqftMin = p.get("sqft_min") ? Number(p.get("sqft_min")) : null;
  const sqftMax = p.get("sqft_max") ? Number(p.get("sqft_max")) : null;
  const city = p.get("city") || null;
  const zip = p.get("zip") || null;
  const building_name = p.get("building_name") || null;
  const subdivision_like = p.get("subdivision_like") || null;
  const subdivision_pats = p.get("subdivision_patterns")
    ? (JSON.parse(p.get("subdivision_patterns")!) as string[])
    : null;
  const street_address_like = p.get("street_address_like") || null;
  const mls_id_exact = p.get("mls_id") || null;
  const subtype = p.get("property_subtype") || null;
  const transaction = (p.get("transaction") || "sale").toLowerCase();
  const domMax = p.get("domMax")
    ? Number(p.get("domMax"))
    : p.get("dom_max")
      ? Number(p.get("dom_max"))
      : null;
  const hoaMax = p.get("hoa_max") ? Number(p.get("hoa_max")) : null;
  const yearMin = p.get("year_built_min") ? Number(p.get("year_built_min")) : null;
  const yearMax = p.get("year_built_max") ? Number(p.get("year_built_max")) : null;
  const keywords = p.get("keywords")?.trim() || null;
  const amenities =
    p.get("amenities")?.split(",").map((a) => a.trim().toLowerCase()).filter(Boolean) || [];
  const statuses = p.get("statuses") || null;
  const limit = Math.min(Number(p.get("limit") || 60), 300);
  const offset = Number(p.get("offset") || 0);

  const supabase = createClient(
    process.env.SUPABASE_URL ?? "https://ezcikavnfchqaenweygw.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = supabase
    .from("properties_search")
    .select(
      "id,mls_id,status,property_type,property_subtype,list_price,beds,baths,sqft,unit_number,street_address,city,state,zip,latitude,longitude,image_urls,days_on_market,hoa_fee,year_built,building_name,office_priority",
      { count: "exact" },
    )
    .not("latitude", "is", null)
    .not("longitude", "is", null);

  // ── Status ──
  if (statuses) {
    const values = statuses.split(",").map((s) => s.trim()).filter(Boolean);
    if (values.length > 0) query = query.in("status", values);
  } else if (status === "OnMarket") {
    query = query.in("status", ["Active", "ComingSoon", "ActiveUnderContract", "Pending"]);
  } else if (status === "New") {
    query = query.eq("status", "Active").lte("days_on_market", 10);
  } else if (status === "ComingSoon") {
    query = query.eq("status", "ComingSoon");
  } else if (status === "Active") {
    query = query.eq("status", "Active");
  } else if (status === "Pending") {
    query = query.in("status", ["Pending", "ActiveUnderContract"]);
  } else if (status === "Closed") {
    query = query.eq("status", "Closed");
  } else if (status === "All") {
    query = query.in("status", ["Active", "ComingSoon", "Pending", "ActiveUnderContract", "Closed"]);
  }

  // ── Duplicate suppression (properties_search doesn't expose the flag) ──
  if (!mls_id_exact) {
    const { data: suppressed } = await supabase
      .from("properties")
      .select("mls_id")
      .eq("dup_suppressed", true);
    const ids = (suppressed ?? []).map((r: { mls_id: string }) => r.mls_id).filter(Boolean);
    if (ids.length > 0) query = query.not("mls_id", "in", `(${ids.join(",")})`);
  }

  // ── Closed 3-year cutoff (broad searches only) ──
  const includesClosed =
    (statuses && statuses.split(",").map((s) => s.trim()).includes("Closed")) ||
    status === "Closed" ||
    status === "All";
  const isBuildingDrillIn = Boolean(
    building_name || subdivision_like || subdivision_pats || mls_id_exact,
  );
  if (includesClosed && !isBuildingDrillIn) {
    const cutoff = new Date();
    cutoff.setFullYear(cutoff.getFullYear() - 3);
    query = query.or(`status.neq.Closed,close_date.gte.${cutoff.toISOString().slice(0, 10)}`);
  }

  // ── Transaction (sale vs rent) ──
  if (transaction === "sale") {
    query = query.or("property_type.is.null,property_type.neq.ResidentialLease");
  } else if (transaction === "rent") {
    query = query.eq("property_type", "ResidentialLease");
  }

  // ── LiveModern luxury curation ──────────────────────────────────────────
  // Apply the floors + residential-only + no-55+ filters to every real search,
  // but NOT to a direct listing lookup (mls_id) — a client opening a lower-priced
  // listing they saved elsewhere must still resolve.
  if (!mls_id_exact) {
    if (transaction === "rent") {
      query = query.gte("list_price", LUX_RENT_FLOOR).lt("list_price", 50000);
    } else {
      query = query.gte("list_price", LUX_SALE_FLOOR);
    }
    // Residential dwellings only (no mobile/manufactured/commercial/land).
    query = query.in("property_subtype", LUX_SUBTYPES as unknown as string[]);
    // Exclude 55+ / age-restricted; keep rows where the flag is false or unset.
    query = query.or(
      "trestle_raw->>SeniorCommunityYN.is.null,trestle_raw->>SeniorCommunityYN.neq.true",
    );
  } else if (forRent) {
    query = query.lt("list_price", 50000);
  }

  // ── Viewport bounds (unless drilled into a specific set) ──
  const lockToBuilding = Boolean(
    building_name || subdivision_like || subdivision_pats || street_address_like || mls_id_exact,
  );
  if (bounds && !lockToBuilding) {
    const [lngMin, latMin, lngMax, latMax] = bounds.split(",").map(Number);
    query = query
      .gte("latitude", latMin)
      .lte("latitude", latMax)
      .gte("longitude", lngMin)
      .lte("longitude", lngMax);
  }

  if (priceMin) query = query.gte("list_price", priceMin);
  if (priceMax) query = query.lte("list_price", priceMax);
  if (bedsMin) query = query.gte("beds", bedsMin);
  if (bedsMax) query = query.lte("beds", bedsMax);
  if (bathsMin) query = query.gte("baths", bathsMin);
  if (bathsMax) query = query.lte("baths", bathsMax);
  if (sqftMin) query = query.gte("sqft", sqftMin);
  if (sqftMax) query = query.lte("sqft", sqftMax);
  if (city) {
    const list = city.split(",").map((s) => s.trim()).filter(Boolean);
    if (list.length > 1) query = query.in("city", list);
    else if (list.length === 1) query = query.ilike("city", list[0]);
  }
  if (zip) query = query.eq("zip", zip);
  if (street_address_like) query = query.ilike("street_address", `%${street_address_like}%`);
  if (mls_id_exact) query = query.eq("mls_id", mls_id_exact);
  if (building_name) query = query.eq("building_name", building_name);
  if (subdivision_like) query = query.ilike("subdivision_name", subdivision_like);
  if (subdivision_pats && subdivision_pats.length > 0) {
    query = query.or(subdivision_pats.map((pat) => `subdivision_name.ilike.${pat}`).join(","));
  }
  if (subtype) {
    const values = subtype.split(",").map((s) => s.trim()).filter(Boolean);
    if (values.length === 1) query = query.eq("property_subtype", values[0]);
    else if (values.length > 1) query = query.in("property_subtype", values);
  }
  if (domMax) query = query.lte("days_on_market", domMax);
  if (hoaMax) query = query.lte("hoa_fee", hoaMax);
  if (keywords) {
    const safe = keywords.replace(/[%_]/g, "");
    if (safe) query = query.ilike("description", `%${safe}%`);
  }
  for (const a of amenities) {
    const safe = a.replace(/[%_]/g, "");
    if (safe) query = query.ilike("description", `%${safe}%`);
  }
  if (yearMin) query = query.gte("year_built", yearMin);
  if (yearMax) query = query.lte("year_built", yearMax);

  // LiveModern opens with the marquee estates first (price high → low).
  const sortParam = p.get("sort") || "price_desc";
  if (sortParam === "price_asc") {
    query = query.order("list_price", { ascending: true });
  } else if (sortParam === "price_desc") {
    query = query.order("list_price", { ascending: false });
  } else {
    // LiveModern is a South-Florida-wide luxury brand (Palm Beach → Miami →
    // Treasure Coast). Unlike mlg-site, we do NOT lead with office_priority —
    // that tier forces all MLG (Palm Beach) office listings to the top and
    // buries every other county, so Miami/Fort Lauderdale never surface on
    // page one. Newest-first gives a genuine region-wide mix.
    query = query.order("days_on_market", { ascending: true, nullsFirst: false });
  }
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    listings: trimPhotos((data ?? []) as Array<{ image_urls?: string[] | null }>),
    count: count ?? data?.length ?? 0,
    pageSize: data?.length ?? 0,
    offset,
    limit,
  });
}
