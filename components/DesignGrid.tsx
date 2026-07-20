"use client";

import { useState } from "react";
import { mls, mlsSrcSet, money } from "@/lib/listings";
import type { DesignHome } from "@/lib/design";

export default function DesignGrid({ homes }: { homes: DesignHome[] }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? homes : homes.slice(0, 12);
  const hidden = homes.length - 12;

  return (
    <>
      <div className="unit-grid">
        {shown.map((h) => {
          const photo = (h.image_urls ?? [])[0];
          return (
            <a className="unit" key={h.mls_id} href={`/listing/${h.mls_id}`}>
              <div className="unit-im">
                {photo ? (
                  <img
                    src={mls(photo, 600)}
                    srcSet={mlsSrcSet(photo, [390, 600])}
                    sizes="(max-width:640px) 100vw, 33vw"
                    alt={`${h.street_address} — ${h.arch_style}`}
                    loading="lazy"
                  />
                ) : null}
                <span className="unit-tag dz-tag">{h.arch_style}</span>
              </div>
              <div className="unit-bd">
                <div className="unit-p serif">{money(h.list_price)}</div>
                <div className="unit-a">{h.street_address}</div>
                <div className="unit-s">
                  <span>{h.beds ?? "—"} Bed</span>
                  <span>{h.baths ?? "—"} Bath</span>
                  <span>{h.sqft ? h.sqft.toLocaleString() : "—"} SF</span>
                </div>
                <div className="dz-loc">
                  {h.city}
                  {h.city && h.county ? " · " : ""}
                  {h.county === "Miami-Dade" ? "Dade" : h.county}
                </div>
              </div>
            </a>
          );
        })}
      </div>
      {hidden > 0 ? (
        <button type="button" className="unit-more" onClick={() => setExpanded((e) => !e)}>
          {expanded ? "Show fewer" : `View all ${homes.length} homes`}
          <span className="unit-more-i" aria-hidden="true">
            {expanded ? " \u2191" : " \u2193"}
          </span>
        </button>
      ) : null}
    </>
  );
}
