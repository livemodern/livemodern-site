"use client";

import { useState, useMemo } from "react";
import { mls, mlsSrcSet, money } from "@/lib/listings";
import type { DesignHome } from "@/lib/design";

/**
 * By-Design grid with interactive style filter chips. The chips (British West
 * Indies, Bermuda, etc.) filter the grid in place. Style label sits on the
 * card's lower-right, off the photo — consistent with the lifestyle cards.
 */
export default function DesignGrid({
  homes,
  styles,
}: {
  homes: DesignHome[];
  styles: string[];
}) {
  const [style, setStyle] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  // Counts come from the homes actually loaded, so a chip never promises more
  // than the grid can show.
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const h of homes) if (h.arch_style) c[h.arch_style] = (c[h.arch_style] ?? 0) + 1;
    return c;
  }, [homes]);
  const stylesPresent = useMemo(
    () => styles.filter((s) => (counts[s] ?? 0) > 0),
    [styles, counts],
  );

  const filtered = style ? homes.filter((h) => h.arch_style === style) : homes;
  const shown = expanded ? filtered : filtered.slice(0, 12);
  const hidden = filtered.length - 12;

  return (
    <>
      {stylesPresent.length > 1 ? (
        <div className="dz-substyles">
          <button
            type="button"
            className={`dz-substyle${style === null ? " on" : ""}`}
            onClick={() => {
              setStyle(null);
              setExpanded(false);
            }}
          >
            All
            <span className="dz-chip-n">{homes.length}</span>
          </button>
          {stylesPresent.map((s) => (
            <button
              key={s}
              type="button"
              className={`dz-substyle${style === s ? " on" : ""}`}
              onClick={() => {
                setStyle(style === s ? null : s);
                setExpanded(false);
              }}
            >
              {s}
              <span className="dz-chip-n">{counts[s]}</span>
            </button>
          ))}
        </div>
      ) : null}

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
              </div>
              <div className="unit-bd">
                <div className="unit-p serif">{money(h.list_price)}</div>
                <div className="unit-a">{h.street_address}</div>
                <div className="unit-s">
                  <span>{h.beds ?? "—"} Bed</span>
                  <span>{h.baths ?? "—"} Bath</span>
                  <span>{h.sqft ? h.sqft.toLocaleString() : "—"} SF</span>
                </div>
                <div className="dz-loc dz-loc-row">
                  <span>
                    {h.city}
                    {h.city && h.county ? " · " : ""}
                    {h.county === "Miami-Dade" ? "Dade" : h.county}
                  </span>
                  {h.arch_style ? <span className="dz-loc-style">{h.arch_style}</span> : null}
                </div>
              </div>
            </a>
          );
        })}
      </div>

      {hidden > 0 ? (
        <button type="button" className="unit-more" onClick={() => setExpanded((e) => !e)}>
          {expanded ? "Show fewer" : `View all ${filtered.length} homes`}
          <span className="unit-more-i" aria-hidden="true">
            {expanded ? " \u2191" : " \u2193"}
          </span>
        </button>
      ) : null}
    </>
  );
}
