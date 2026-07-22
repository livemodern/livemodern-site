"use client";

import { useState, useMemo } from "react";
import { mls, mlsSrcSet, money } from "@/lib/listings";
import type { LifestyleListing } from "@/lib/listings";

const COUNTY_LABEL: Record<string, string> = {
  "Palm Beach": "Palm Beach",
  Broward: "Fort Lauderdale",
  "Miami-Dade": "Miami",
  Martin: "Martin",
};

/** Luxury price ladder — LiveModern inventory starts at $2M. */
const PRICE_STEPS = [
  2000000, 2500000, 3000000, 4000000, 5000000, 6000000, 7500000, 10000000,
  15000000, 20000000, 25000000, 30000000, 40000000, 50000000, 75000000, 100000000,
];

function priceLabel(n: number): string {
  const m = n / 1_000_000;
  return `$${m >= 10 ? Math.round(m) : m.toFixed(1).replace(/\.0$/, "")}M`;
}

const ROOM_STEPS = [1, 2, 3, 4, 5];

export default function LifestyleListings({ listings }: { listings: LifestyleListing[] }) {
  const [county, setCounty] = useState<string | null>(null);
  const [minPrice, setMinPrice] = useState<number | "">("");
  const [maxPrice, setMaxPrice] = useState<number | "">("");
  const [beds, setBeds] = useState<number | "">("");
  const [baths, setBaths] = useState<number | "">("");
  const [city, setCity] = useState<string>("");
  const [style, setStyle] = useState<string>("");
  const [sort, setSort] = useState<"asc" | "desc">("asc");
  const [expanded, setExpanded] = useState(false);

  const counties = useMemo(() => {
    const present = new Set(listings.map((l) => l.county).filter(Boolean));
    return ["Palm Beach", "Broward", "Miami-Dade", "Martin"].filter((c) => present.has(c));
  }, [listings]);

  // options come from what's actually present, so no dead choices
  const countyScoped = county ? listings.filter((l) => l.county === county) : listings;
  const cityOptions = useMemo(
    () => [...new Set(countyScoped.map((l) => l.city).filter(Boolean))].sort() as string[],
    [countyScoped],
  );
  const styleOptions = useMemo(
    () => [...new Set(countyScoped.map((l) => l.arch_style).filter(Boolean))].sort() as string[],
    [countyScoped],
  );

  const filtered = useMemo(() => {
    const out = countyScoped.filter((l) => {
      const p = l.list_price ?? 0;
      if (minPrice !== "" && p < minPrice) return false;
      if (maxPrice !== "" && p > maxPrice) return false;
      if (beds !== "" && (l.beds ?? 0) < beds) return false;
      if (baths !== "" && (l.baths ?? 0) < baths) return false;
      if (city && l.city !== city) return false;
      if (style && l.arch_style !== style) return false;
      return true;
    });
    return out.sort((a, b) =>
      sort === "asc"
        ? (a.list_price ?? 0) - (b.list_price ?? 0)
        : (b.list_price ?? 0) - (a.list_price ?? 0),
    );
  }, [countyScoped, minPrice, maxPrice, beds, baths, city, style, sort]);

  const shown = expanded ? filtered : filtered.slice(0, 12);
  const hidden = filtered.length - 12;

  const activeCount =
    (minPrice !== "" ? 1 : 0) + (maxPrice !== "" ? 1 : 0) + (beds !== "" ? 1 : 0) +
    (baths !== "" ? 1 : 0) + (city ? 1 : 0) + (style ? 1 : 0);

  const reset = () => {
    setMinPrice(""); setMaxPrice(""); setBeds(""); setBaths(""); setCity(""); setStyle("");
    setExpanded(false);
  };

  return (
    <>
      {counties.length > 1 ? (
        <div className="idx-chips" style={{ marginBottom: 16 }}>
          <button
            type="button"
            className={`chip${county === null ? " on" : ""}`}
            onClick={() => { setCounty(null); setCity(""); setExpanded(false); }}
          >
            All
          </button>
          {counties.map((c) => (
            <button
              key={c}
              type="button"
              className={`chip${county === c ? " on" : ""}`}
              onClick={() => { setCounty(c); setCity(""); setExpanded(false); }}
            >
              {COUNTY_LABEL[c] ?? c}
            </button>
          ))}
        </div>
      ) : null}

      {/* ── FILTER BAR ── */}
      <div className="lf-bar">
        <label className="lf-f">
          <span>Min price</span>
          <select
            value={minPrice}
            onChange={(e) => { setMinPrice(e.target.value ? Number(e.target.value) : ""); setExpanded(false); }}
          >
            <option value="">Any</option>
            {PRICE_STEPS.map((p) => (
              <option key={p} value={p}>{priceLabel(p)}</option>
            ))}
          </select>
        </label>

        <label className="lf-f">
          <span>Max price</span>
          <select
            value={maxPrice}
            onChange={(e) => { setMaxPrice(e.target.value ? Number(e.target.value) : ""); setExpanded(false); }}
          >
            <option value="">Any</option>
            {PRICE_STEPS.map((p) => (
              <option key={p} value={p}>{priceLabel(p)}</option>
            ))}
          </select>
        </label>

        <label className="lf-f">
          <span>Beds</span>
          <select
            value={beds}
            onChange={(e) => { setBeds(e.target.value ? Number(e.target.value) : ""); setExpanded(false); }}
          >
            <option value="">Any</option>
            {ROOM_STEPS.map((n) => (
              <option key={n} value={n}>{n}+</option>
            ))}
          </select>
        </label>

        <label className="lf-f">
          <span>Baths</span>
          <select
            value={baths}
            onChange={(e) => { setBaths(e.target.value ? Number(e.target.value) : ""); setExpanded(false); }}
          >
            <option value="">Any</option>
            {ROOM_STEPS.map((n) => (
              <option key={n} value={n}>{n}+</option>
            ))}
          </select>
        </label>

        {cityOptions.length > 1 ? (
          <label className="lf-f">
            <span>City</span>
            <select value={city} onChange={(e) => { setCity(e.target.value); setExpanded(false); }}>
              <option value="">All cities</option>
              {cityOptions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
        ) : null}

        {styleOptions.length > 1 ? (
          <label className="lf-f">
            <span>Design style</span>
            <select value={style} onChange={(e) => { setStyle(e.target.value); setExpanded(false); }}>
              <option value="">All styles</option>
              {styleOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
        ) : null}

        <label className="lf-f">
          <span>Sort</span>
          <select value={sort} onChange={(e) => setSort(e.target.value as "asc" | "desc")}>
            <option value="asc">Price: low to high</option>
            <option value="desc">Price: high to low</option>
          </select>
        </label>
      </div>

      <div className="lf-meta">
        <span>
          {filtered.length} {filtered.length === 1 ? "listing" : "listings"}
        </span>
        {activeCount ? (
          <button type="button" className="lf-reset" onClick={reset}>
            Clear filters
          </button>
        ) : null}
      </div>

      {filtered.length ? (
        <div className="unit-grid">
          {shown.map((l) => {
            const photo = (l.image_urls ?? [])[0];
            const isCondo =
              l.property_subtype === "Condominium" || l.property_subtype === "Apartment";
            return (
              <a className="unit" key={l.mls_id} href={`/listing/${l.mls_id}`}>
                <div className="unit-im">
                  {photo ? (
                    <img
                      src={mls(photo, 600)}
                      srcSet={mlsSrcSet(photo, [390, 600])}
                      sizes="(max-width:640px) 100vw, 33vw"
                      alt={l.street_address}
                      loading="lazy"
                    />
                  ) : null}
                </div>
                <div className="unit-bd">
                  <div className="unit-p serif">{money(l.list_price)}</div>
                  <div className="unit-a">
                    {l.street_address}
                    {isCondo && l.unit_number ? ` ${l.unit_number}` : ""}
                  </div>
                  <div className="unit-s">
                    <span>{l.beds ?? "—"} Bed</span>
                    <span>{l.baths ?? "—"} Bath</span>
                    <span>{l.sqft ? l.sqft.toLocaleString() : "—"} SF</span>
                  </div>
                  <div className="dz-loc dz-loc-row">
                    <span>
                      {l.city}
                      {l.city && l.county ? " · " : ""}
                      {l.county === "Miami-Dade" ? "Dade" : l.county}
                    </span>
                    {l.arch_style ? <span className="dz-loc-style">{l.arch_style}</span> : null}
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      ) : (
        <p className="cidx-empty" style={{ marginTop: 20 }}>
          Nothing matches those filters — try widening the price or bed count.
        </p>
      )}

      {hidden > 0 ? (
        <button type="button" className="unit-more" onClick={() => setExpanded((e) => !e)}>
          {expanded ? "Show fewer" : `View all ${filtered.length} listings`}
          <span className="unit-more-i" aria-hidden="true">
            {expanded ? " \u2191" : " \u2193"}
          </span>
        </button>
      ) : null}
    </>
  );
}
