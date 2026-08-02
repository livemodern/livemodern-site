"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { mls, mlsSrcSet, money } from "@/lib/listings";
import { listingHref } from "@/lib/listing-slug";
import { AUTH_CONFIGURED, getSupabase, rememberReturnTo, useUser } from "@/lib/auth";
import type { MapPoint } from "@/components/SearchMap";

// Map is client-only (mapbox-gl touches window); ssr:false keeps it out of the
// server render. If the token is unset the component renders null and the
// layout falls back to full-width results.
const SearchMap = dynamic(() => import("@/components/SearchMap"), { ssr: false });
const HAS_MAP = Boolean(process.env.NEXT_PUBLIC_MAPBOX_TOKEN);

// The county-wide search, LiveModern skin. Location autocomplete + full filter
// set feed the shared /api/search engine; results render as LiveModern cards.
// Filter state lives in the URL (shareable + the source a saved search captures),
// so "Run search" from the account page reproduces the exact set here.

type Row = {
  mls_id: string;
  status: string | null;
  property_subtype: string | null;
  list_price: number | null;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  unit_number: string | null;
  street_address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  image_urls: string[] | null;
  year_built: number | null;
  latitude: number | null;
  longitude: number | null;
};

type Suggestion = { type: string; name: string; count: number; filter: Record<string, unknown> };
type Loc = { name: string; type: string; filter: Record<string, unknown> } | null;

const SUBTYPES: { label: string; value: string }[] = [
  { label: "Any type", value: "" },
  { label: "Condo", value: "Condominium,Apartment" },
  { label: "House", value: "SingleFamilyResidence,Villa" },
  { label: "Townhouse", value: "Townhouse" },
];
const PRICES_SALE = [0, 1_000_000, 2_000_000, 3_000_000, 5_000_000, 10_000_000, 20_000_000, 50_000_000];
const PRICES_RENT = [0, 5_000, 7_500, 10_000, 15_000, 25_000, 50_000, 100_000];
const BEDS = ["", "1", "2", "3", "4", "5"];
const SORTS = [
  { label: "Price ↓", value: "price_desc" },
  { label: "Price ↑", value: "price_asc" },
  { label: "Newest", value: "dom_asc" },
];

function priceLabel(v: number, rent: boolean) {
  if (!v) return rent ? "No min" : "No min";
  if (v >= 1_000_000) return `$${v / 1_000_000}M`;
  if (v >= 1_000) return `$${(v / 1_000).toLocaleString()}k`;
  return `$${v}`;
}

export default function SearchExperience() {
  const { user } = useUser();

  // ── filter state (hydrated from URL on mount) ──
  const [transaction, setTransaction] = useState<"sale" | "rent">("sale");
  const [loc, setLoc] = useState<Loc>(null);
  const [q, setQ] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSug, setShowSug] = useState(false);
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(0);
  const [beds, setBeds] = useState("");
  const [baths, setBaths] = useState("");
  const [subtype, setSubtype] = useState("");
  const [sqftMin, setSqftMin] = useState("");
  const [sqftMax, setSqftMax] = useState("");
  const [yearMin, setYearMin] = useState("");
  const [yearMax, setYearMax] = useState("");
  const [hoaMax, setHoaMax] = useState("");
  const [status, setStatus] = useState("OnMarket");
  const [keywords, setKeywords] = useState("");
  const [sort, setSort] = useState("price_desc");
  const [moreOpen, setMoreOpen] = useState(false);

  // ── results ──
  const [rows, setRows] = useState<Row[] | null>(null);
  const [count, setCount] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [savedSearch, setSavedSearch] = useState(false);
  // map state
  const [bounds, setBounds] = useState<string | null>(null);
  const [fitToken, setFitToken] = useState(0);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "map">("list");

  const hydrated = useRef(false);
  const PAGE = 60;

  // Hydrate from URL once.
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    // Prefer the URL (a shared/saved link); otherwise restore the last search
    // from sessionStorage so returning to /search keeps your filters (MLG parity).
    const hasUrl = window.location.search.replace(/^\?/, "").length > 0;
    if (hasUrl) {
      const sp = new URLSearchParams(window.location.search);
      if (sp.get("transaction") === "rent") setTransaction("rent");
      if (sp.get("status")) setStatus(sp.get("status")!);
      if (sp.get("priceMin")) setPriceMin(Number(sp.get("priceMin")));
      if (sp.get("priceMax")) setPriceMax(Number(sp.get("priceMax")));
      if (sp.get("beds_min")) setBeds(sp.get("beds_min")!);
      if (sp.get("baths_min")) setBaths(sp.get("baths_min")!);
      if (sp.get("property_subtype")) setSubtype(sp.get("property_subtype")!);
      if (sp.get("sqft_min")) setSqftMin(sp.get("sqft_min")!);
      if (sp.get("sqft_max")) setSqftMax(sp.get("sqft_max")!);
      if (sp.get("year_built_min")) setYearMin(sp.get("year_built_min")!);
      if (sp.get("year_built_max")) setYearMax(sp.get("year_built_max")!);
      if (sp.get("hoa_max")) setHoaMax(sp.get("hoa_max")!);
      if (sp.get("keywords")) setKeywords(sp.get("keywords")!);
      if (sp.get("sort")) setSort(sp.get("sort")!);
      const city = sp.get("city");
      const zip = sp.get("zip");
      const bld = sp.get("building_name");
      const sub = sp.get("subdivision_like");
      if (bld) setLoc({ name: bld, type: "building", filter: { building_name: bld } });
      else if (city) setLoc({ name: city, type: "city", filter: { city } });
      else if (zip) setLoc({ name: zip, type: "zip", filter: { zip } });
      else if (sub) setLoc({ name: sub.replace(/%/g, ""), type: "community", filter: { subdivision_like: sub } });
    } else {
      try {
        const saved = JSON.parse(sessionStorage.getItem("livemodern_search") || "null");
        if (saved && typeof saved === "object") {
          if (saved.transaction) setTransaction(saved.transaction);
          if (saved.status) setStatus(saved.status);
          if (saved.priceMin) setPriceMin(Number(saved.priceMin));
          if (saved.priceMax) setPriceMax(Number(saved.priceMax));
          if (saved.beds) setBeds(saved.beds);
          if (saved.baths) setBaths(saved.baths);
          if (saved.subtype) setSubtype(saved.subtype);
          if (saved.sqftMin) setSqftMin(saved.sqftMin);
          if (saved.sqftMax) setSqftMax(saved.sqftMax);
          if (saved.yearMin) setYearMin(saved.yearMin);
          if (saved.yearMax) setYearMax(saved.yearMax);
          if (saved.hoaMax) setHoaMax(saved.hoaMax);
          if (saved.keywords) setKeywords(saved.keywords);
          if (saved.sort) setSort(saved.sort);
          if (saved.loc) setLoc(saved.loc);
        }
      } catch {
        /* ignore */
      }
    }
    setReady(true);
  }, []);
  const [ready, setReady] = useState(false);

  // Build the query params from current state.
  const params = useMemo(() => {
    const p = new URLSearchParams();
    p.set("transaction", transaction);
    p.set("status", status);
    if (priceMin) p.set("priceMin", String(priceMin));
    if (priceMax) p.set("priceMax", String(priceMax));
    if (beds) p.set("beds_min", beds);
    if (baths) p.set("baths_min", baths);
    if (subtype) p.set("property_subtype", subtype);
    if (sqftMin) p.set("sqft_min", sqftMin);
    if (sqftMax) p.set("sqft_max", sqftMax);
    if (yearMin) p.set("year_built_min", yearMin);
    if (yearMax) p.set("year_built_max", yearMax);
    if (hoaMax) p.set("hoa_max", hoaMax);
    if (keywords.trim()) p.set("keywords", keywords.trim());
    if (sort) p.set("sort", sort);
    if (bounds) p.set("bounds", bounds);
    if (loc?.filter) {
      for (const [k, v] of Object.entries(loc.filter)) {
        if (v == null) continue;
        p.set(k, Array.isArray(v) ? JSON.stringify(v) : String(v));
      }
    }
    return p;
  }, [transaction, status, priceMin, priceMax, beds, baths, subtype, sqftMin, sqftMax, yearMin, yearMax, hoaMax, keywords, sort, loc, bounds]);

  // Reflect state into the URL (shareable + what a saved search captures).
  useEffect(() => {
    if (!ready) return;
    const url = `/search?${params.toString()}`;
    window.history.replaceState(null, "", url);
    setSavedSearch(false); // filters changed → allow re-save
    // Persist the full state so returning to /search restores it (MLG parity).
    try {
      sessionStorage.setItem(
        "livemodern_search",
        JSON.stringify({ transaction, status, priceMin, priceMax, beds, baths, subtype, sqftMin, sqftMax, yearMin, yearMax, hoaMax, keywords, sort, loc }),
      );
    } catch {
      /* ignore */
    }
  }, [params, ready, transaction, status, priceMin, priceMax, beds, baths, subtype, sqftMin, sqftMax, yearMin, yearMax, hoaMax, keywords, sort, loc]);

  // Fetch results whenever filters change.
  const run = useCallback(
    async (nextOffset: number, append: boolean) => {
      setLoading(true);
      try {
        const p = new URLSearchParams(params);
        p.set("limit", String(PAGE));
        p.set("offset", String(nextOffset));
        const res = await fetch(`/api/search?${p.toString()}`);
        const data = (await res.json()) as { listings: Row[]; count: number };
        setCount(data.count ?? 0);
        setRows((prev) => (append && prev ? [...prev, ...(data.listings ?? [])] : data.listings ?? []));
        setOffset(nextOffset);
      } catch {
        if (!append) setRows([]);
      } finally {
        setLoading(false);
      }
    },
    [params],
  );

  useEffect(() => {
    if (!ready) return;
    // Debounce: map pan/zoom changes `bounds` rapidly; without this every frame
    // of a drag would refetch and swap the list out, which reads as scroll jank.
    const t = setTimeout(() => void run(0, false), 320);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, ready]);

  // Location autocomplete (debounced).
  useEffect(() => {
    if (q.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search/suggest?q=${encodeURIComponent(q.trim())}&transaction=${transaction}`,
        );
        const data = (await res.json()) as { results: Suggestion[] };
        setSuggestions(data.results ?? []);
        setShowSug(true);
      } catch {
        setSuggestions([]);
      }
    }, 180);
    return () => clearTimeout(t);
  }, [q, transaction]);

  function pickSuggestion(s: Suggestion) {
    setLoc({ name: s.name, type: s.type, filter: s.filter });
    setQ("");
    setSuggestions([]);
    setShowSug(false);
    // Load the full set for this place first (drop stale viewport bounds), then
    // the map flies to fit it and its own bounds take over from there.
    setBounds(null);
    setFitToken((t) => t + 1);
  }

  // Map moved: refine to the viewport. A user pan/zoom over a city/zip chip
  // turns the search into a free map-area search (clear that chip); a building
  // or community chip is an explicit "show all of X", so it's kept (the server
  // ignores bounds for those anyway).
  const handleBounds = useCallback(
    (b: string, userMove: boolean) => {
      setBounds(b);
      if (userMove) {
        setLoc((cur) => (cur && (cur.type === "city" || cur.type === "zip") ? null : cur));
      }
    },
    [],
  );

  function focusCard(id: string) {
    setActiveId(id);
    setMobileView("list");
    requestAnimationFrame(() => {
      document.getElementById(`card-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  function clearLocation() {
    setLoc(null);
    setQ("");
  }

  const prices = transaction === "rent" ? PRICES_RENT : PRICES_SALE;

  const mapPoints: MapPoint[] = useMemo(
    () =>
      (rows ?? []).map((l) => ({
        mls_id: l.mls_id,
        latitude: l.latitude,
        longitude: l.longitude,
        list_price: l.list_price,
      })),
    [rows],
  );

  async function saveSearch() {
    if (!AUTH_CONFIGURED) return;
    if (!user) {
      rememberReturnTo();
      window.location.assign(`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }
    const name = searchSummary(loc, priceMin, priceMax, beds, transaction);
    try {
      const sb = await getSupabase();
      await sb.from("saved_searches").insert({
        user_id: user.id,
        site_slug: "livemodern",
        name,
        location: loc ? { name: loc.name, type: loc.type, filter: loc.filter } : null,
        transaction,
        // Store the full filter blob (MLG-compatible keys) so this runs anywhere.
        filters: {
          priceMin: priceMin || "",
          priceMax: priceMax || "",
          beds: beds || "Any",
          baths: baths || "Any",
          property_subtype: subtype || "",
          sqftMin: sqftMin || "",
          yearBuiltMin: yearMin || "",
          keywords: keywords.trim() || "",
          city: (loc?.filter?.city as string) || "Any",
        },
        alert_frequency: "daily",
      });
      setSavedSearch(true);
    } catch {
      /* ignore */
    }
  }

  return (
    <>
      {/* ── Filter bar ─────────────────────────────────────────────── */}
      <div className="srch-bar">
        <div className="srch-bar-in">
          <div className="srch-toggle">
            <button className={transaction === "sale" ? "on" : ""} onClick={() => setTransaction("sale")}>
              For Sale
            </button>
            <button className={transaction === "rent" ? "on" : ""} onClick={() => setTransaction("rent")}>
              For Rent
            </button>
          </div>

          <div className="srch-loc">
            {loc ? (
              <div className="srch-chip">
                <span>{loc.name}</span>
                <button onClick={clearLocation} aria-label="Clear location">
                  ×
                </button>
              </div>
            ) : (
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onFocus={() => q && setShowSug(true)}
                onBlur={() => setTimeout(() => setShowSug(false), 150)}
                placeholder="City, building, neighborhood, or address"
                aria-label="Search location"
              />
            )}
            {showSug && suggestions.length > 0 ? (
              <div className="srch-sug">
                {suggestions.map((s, i) => (
                  <button key={`${s.type}-${s.name}-${i}`} onMouseDown={() => pickSuggestion(s)}>
                    <span className="srch-sug-name">{s.name}</span>
                    <span className="srch-sug-meta">
                      {s.type}
                      {s.count ? ` · ${s.count}` : ""}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <select className="srch-sel" value={priceMin} onChange={(e) => setPriceMin(Number(e.target.value))}>
            {prices.map((v) => (
              <option key={v} value={v}>
                {v ? priceLabel(v, transaction === "rent") + " min" : "No min"}
              </option>
            ))}
          </select>
          <select className="srch-sel" value={priceMax} onChange={(e) => setPriceMax(Number(e.target.value))}>
            <option value={0}>No max</option>
            {prices.filter((v) => v).map((v) => (
              <option key={v} value={v}>
                {priceLabel(v, transaction === "rent")} max
              </option>
            ))}
          </select>
          <select className="srch-sel" value={beds} onChange={(e) => setBeds(e.target.value)}>
            {BEDS.map((b) => (
              <option key={b} value={b}>
                {b ? `${b}+ bd` : "Beds"}
              </option>
            ))}
          </select>
          <select className="srch-sel" value={subtype} onChange={(e) => setSubtype(e.target.value)}>
            {SUBTYPES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <button className="srch-more" onClick={() => setMoreOpen((o) => !o)}>
            More {moreOpen ? "−" : "+"}
          </button>
        </div>

        {moreOpen ? (
          <div className="srch-more-panel">
            <label>
              <span>Baths</span>
              <select value={baths} onChange={(e) => setBaths(e.target.value)}>
                {BEDS.map((b) => (
                  <option key={b} value={b}>
                    {b ? `${b}+` : "Any"}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Status</span>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="OnMarket">On market</option>
                <option value="Active">Active only</option>
                <option value="ComingSoon">Coming soon</option>
                <option value="Pending">Under contract</option>
                <option value="Closed">Sold</option>
                <option value="All">All</option>
              </select>
            </label>
            <label>
              <span>Min sq ft</span>
              <input inputMode="numeric" value={sqftMin} onChange={(e) => setSqftMin(e.target.value.replace(/\D/g, ""))} placeholder="Any" />
            </label>
            <label>
              <span>Max sq ft</span>
              <input inputMode="numeric" value={sqftMax} onChange={(e) => setSqftMax(e.target.value.replace(/\D/g, ""))} placeholder="Any" />
            </label>
            <label>
              <span>Built after</span>
              <input inputMode="numeric" value={yearMin} onChange={(e) => setYearMin(e.target.value.replace(/\D/g, ""))} placeholder="Any" />
            </label>
            <label>
              <span>Built before</span>
              <input inputMode="numeric" value={yearMax} onChange={(e) => setYearMax(e.target.value.replace(/\D/g, ""))} placeholder="Any" />
            </label>
            <label>
              <span>Max HOA / mo</span>
              <input inputMode="numeric" value={hoaMax} onChange={(e) => setHoaMax(e.target.value.replace(/\D/g, ""))} placeholder="Any" />
            </label>
            <label className="srch-kw">
              <span>Keywords</span>
              <input value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="pool, waterfront, renovated…" />
            </label>
          </div>
        ) : null}
      </div>

      {/* ── Body: results (left, scrolls) + map (right, pinned) ───── */}
      <div className={`srch-body${HAS_MAP ? "" : " no-map"} mv-${mobileView}`}>
        <div className="srch-results">
          <div className="srch-results-head">
            <p className="srch-count">
              {loading && !rows ? "Searching…" : `${count.toLocaleString()} ${transaction === "rent" ? "rentals" : "homes"}`}
              {loc ? <> in <strong>{loc.name}</strong></> : " · South Florida"}
            </p>
            <div className="srch-head-right">
              <button className={`srch-save${savedSearch ? " is-saved" : ""}`} onClick={saveSearch}>
                {savedSearch ? "Saved ✓" : "Save search"}
              </button>
              <select className="srch-sort" value={sort} onChange={(e) => setSort(e.target.value)}>
                {SORTS.map((so) => (
                  <option key={so.value} value={so.value}>
                    {so.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="srch-scroll">
        {rows === null ? (
          <p className="srch-empty">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="srch-empty">Nothing matches those filters — try widening the price or beds.</p>
        ) : (
          <>
            <div className="srch-grid">
              {rows.map((l) => {
                const photo = (l.image_urls ?? [])[0];
                const isCondo = l.property_subtype === "Condominium" || l.property_subtype === "Apartment";
                const full = l.street_address ?? "";
                const includesCity = Boolean(l.city && full.toLowerCase().includes(l.city.toLowerCase()));
                return (
                  <a
                    className={`srch-card${activeId === l.mls_id ? " is-active" : ""}`}
                    id={`card-${l.mls_id}`}
                    key={l.mls_id}
                    href={listingHref(l)}
                    onMouseEnter={() => setActiveId(l.mls_id)}
                  >
                    <div className="srch-card-im">
                      {photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={mls(photo, 600)}
                          srcSet={mlsSrcSet(photo, [390, 600])}
                          sizes="(max-width:640px) 100vw, 33vw"
                          alt={l.street_address ?? ""}
                          loading="lazy"
                        />
                      ) : (
                        <div className="srch-card-noim" />
                      )}
                    </div>
                    <div className="srch-card-bd">
                      <div className="srch-card-p serif">
                        {money(l.list_price)}
                        {transaction === "rent" ? <span className="srch-mo">/mo</span> : null}
                      </div>
                      <div className="srch-card-a">
                        {includesCity
                          ? full
                          : `${full}${isCondo && l.unit_number ? ` #${l.unit_number}` : ""}`}
                      </div>
                      {includesCity ? null : (
                        <div className="srch-card-sub">
                          {[l.city, l.state].filter(Boolean).join(", ")}
                          {l.zip ? ` ${l.zip}` : ""}
                        </div>
                      )}
                      <div className="srch-card-s">
                        <span>{l.beds ?? "—"} bd</span>
                        <span>{l.baths ?? "—"} ba</span>
                        <span>{l.sqft ? l.sqft.toLocaleString() : "—"} sf</span>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>

            {rows.length < count ? (
              <div className="srch-more-wrap">
                <button className="srch-loadmore" onClick={() => void run(offset + PAGE, true)} disabled={loading}>
                  {loading ? "Loading…" : `Show more (${(count - rows.length).toLocaleString()} more)`}
                </button>
              </div>
            ) : null}
          </>
        )}
          </div>
        </div>

        {HAS_MAP ? (
          <div className="srch-map">
            <SearchMap
              points={mapPoints}
              fitToken={fitToken}
              activeId={activeId}
              onBounds={handleBounds}
              onMarkerClick={focusCard}
            />
          </div>
        ) : null}
      </div>

      {HAS_MAP ? (
        <button
          className="srch-mobile-toggle"
          onClick={() => setMobileView((v) => (v === "list" ? "map" : "list"))}
        >
          {mobileView === "list" ? "Map" : "List"}
        </button>
      ) : null}
    </>
  );
}

function searchSummary(
  loc: Loc,
  priceMin: number,
  priceMax: number,
  beds: string,
  transaction: "sale" | "rent",
): string {
  const parts: string[] = [];
  if (loc) parts.push(loc.name);
  if (beds) parts.push(`${beds}+ bed`);
  if (priceMin && priceMax) parts.push(`$${(priceMin / 1000).toLocaleString()}k–$${(priceMax / 1000).toLocaleString()}k`);
  else if (priceMax) parts.push(`Under $${priceMax.toLocaleString()}`);
  else if (priceMin) parts.push(`Over $${priceMin.toLocaleString()}`);
  parts.push(transaction === "rent" ? "For Rent" : "For Sale");
  return parts.join(" · ") || "My Search";
}
