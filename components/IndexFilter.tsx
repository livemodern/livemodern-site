"use client";

import { useState, useMemo, useEffect } from "react";
import IndexRow from "@/components/IndexRow";
import type { Community } from "@/lib/communities";

// Tags that shouldn't be offered as filters on this index. "New Construction"
// applies to every building, so it filters nothing. "Golf & Country Club" is a
// HOMES lifestyle — this register is towers, and only one condo (Akoya, inside
// Boca West) genuinely qualifies, so a chip leading to ~1 result reads broken.
// Golf is served on the listing side via the Golf & Club lifestyle pages.
const HIDDEN = new Set(["New Construction", "Golf & Country Club"]);

/**
 * All county sections + rows render (SEO + no-JS friendly — this is not gated
 * behind useSearchParams). The chip bar is progressive enhancement: toggling
 * chips hides non-matching rows and collapses empty county sections.
 * Deep-link: ?lifestyle=<tag> pre-selects a chip on mount.
 */
export default function IndexFilter({
  buildings,
  counties,
}: {
  buildings: Community[];
  counties: string[];
}) {
  const [active, setActive] = useState<Set<string>>(new Set());

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("lifestyle");
    if (q) setActive(new Set([q]));
  }, []);

  const chips = useMemo(() => {
    const counts = new Map<string, number>();
    for (const b of buildings)
      for (const t of b.lifestyles ?? [])
        if (!HIDDEN.has(t)) counts.set(t, (counts.get(t) ?? 0) + 1);
    return [...counts.entries()].sort((a, z) => z[1] - a[1]).map(([t]) => t);
  }, [buildings]);

  const grouped = useMemo(
    () =>
      counties
        .map((county) => ({
          county,
          rows: buildings
            .filter((b) => b.county === county)
            .sort((a, b) => a.name.localeCompare(b.name)),
        }))
        .filter((g) => g.rows.length),
    [buildings, counties],
  );

  const rowMatches = (b: Community) => {
    if (!active.size) return true;
    const t = new Set(b.lifestyles ?? []);
    for (const a of active) if (!t.has(a)) return false;
    return true;
  };

  const total = active.size ? buildings.filter(rowMatches).length : buildings.length;

  const toggle = (t: string) =>
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });

  return (
    <div>
      <div className="idx-filter">
        <div className="idx-chips" role="group" aria-label="Filter by lifestyle">
          {chips.map((t) => (
            <button
              key={t}
              type="button"
              className={`chip${active.has(t) ? " on" : ""}`}
              onClick={() => toggle(t)}
            >
              {t}
            </button>
          ))}
          {active.size ? (
            <button type="button" className="chip chip-clear" onClick={() => setActive(new Set())}>
              Clear
            </button>
          ) : null}
        </div>
        {active.size ? (
          <p className="idx-count">
            {total} tower{total === 1 ? "" : "s"} match
          </p>
        ) : null}
      </div>

      {grouped.map(({ county, rows }) => {
        const shown = rows.filter(rowMatches);
        return (
          <section
            className="sec"
            key={county}
            style={{ paddingBottom: 0, display: shown.length ? undefined : "none" }}
          >
            <div className="sec-head">
              <div>
                <p className="eyebrow">
                  {county} &middot; {shown.length || rows.length} tower
                  {(shown.length || rows.length) === 1 ? "" : "s"}
                </p>
                <h2 className="serif">{county}</h2>
              </div>
            </div>
            <div style={{ marginTop: 8 }}>
              {rows.map((c) => (
                <div key={c.slug} style={{ display: rowMatches(c) ? undefined : "none" }}>
                  <IndexRow c={c} />
                </div>
              ))}
            </div>
          </section>
        );
      })}

      {active.size && total === 0 ? (
        <p className="cidx-empty" style={{ marginTop: 24 }}>
          No towers match that combination — try removing a filter.
        </p>
      ) : null}
    </div>
  );
}
