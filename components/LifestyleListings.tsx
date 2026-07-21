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

export default function LifestyleListings({ listings }: { listings: LifestyleListing[] }) {
  const [county, setCounty] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const counties = useMemo(() => {
    const present = new Set(listings.map((l) => l.county).filter(Boolean));
    return ["Palm Beach", "Broward", "Miami-Dade", "Martin"].filter((c) => present.has(c));
  }, [listings]);

  const filtered = county ? listings.filter((l) => l.county === county) : listings;
  const shown = expanded ? filtered : filtered.slice(0, 12);
  const hidden = filtered.length - 12;

  return (
    <>
      {counties.length > 1 ? (
        <div className="idx-chips" style={{ marginBottom: 24 }}>
          <button
            type="button"
            className={`chip${county === null ? " on" : ""}`}
            onClick={() => {
              setCounty(null);
              setExpanded(false);
            }}
          >
            All
          </button>
          {counties.map((c) => (
            <button
              key={c}
              type="button"
              className={`chip${county === c ? " on" : ""}`}
              onClick={() => {
                setCounty(c);
                setExpanded(false);
              }}
            >
              {COUNTY_LABEL[c] ?? c}
            </button>
          ))}
        </div>
      ) : null}

      <div className="unit-grid">
        {shown.map((l) => {
          const photo = (l.image_urls ?? [])[0];
          const isCondo = l.property_subtype === "Condominium" || l.property_subtype === "Apartment";
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
