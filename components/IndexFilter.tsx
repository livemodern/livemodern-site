"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import IndexRow from "@/components/IndexRow";
import type { Community } from "@/lib/communities";

const HIDDEN = new Set(["New Construction"]);

export default function IndexFilter({
  buildings,
  counties,
}: {
  buildings: Community[];
  counties: string[];
}) {
  const params = useSearchParams();
  const [active, setActive] = useState<Set<string>>(new Set());

  // Seed from ?lifestyle= (homepage lifestyle rail deep-links here).
  useEffect(() => {
    const q = params.get("lifestyle");
    if (q) setActive(new Set([q]));
  }, [params]);

  const chips = useMemo(() => {
    const counts = new Map<string, number>();
    for (const b of buildings)
      for (const t of b.lifestyles ?? [])
        if (!HIDDEN.has(t)) counts.set(t, (counts.get(t) ?? 0) + 1);
    return [...counts.entries()].sort((a, z) => z[1] - a[1]).map(([t]) => t);
  }, [buildings]);

  const matches = (b: Community) => {
    if (!active.size) return true;
    const t = new Set(b.lifestyles ?? []);
    for (const a of active) if (!t.has(a)) return false;
    return true;
  };

  const grouped = useMemo(
    () =>
      counties.map((county) => ({
        county,
        rows: buildings
          .filter((b) => b.county === county && matches(b))
          .sort((a, b) => a.name.localeCompare(b.name)),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [buildings, counties, active],
  );

  const total = grouped.reduce((n, g) => n + g.rows.length, 0);

  const toggle = (t: string) =>
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });

  return (
    <>
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

      {grouped.map(({ county, rows }) =>
        rows.length ? (
          <section className="sec" key={county} style={{ paddingBottom: 0 }}>
            <div className="sec-head">
              <div>
                <p className="eyebrow">
                  {county} &middot; {rows.length} tower{rows.length === 1 ? "" : "s"}
                </p>
                <h2 className="serif">{county}</h2>
              </div>
            </div>
            <div style={{ marginTop: 8 }}>
              {rows.map((c) => (
                <IndexRow key={c.slug} c={c} />
              ))}
            </div>
          </section>
        ) : null,
      )}

      {total === 0 ? (
        <p className="cidx-empty" style={{ marginTop: 24 }}>
          No towers match that combination — try removing a filter.
        </p>
      ) : null}
    </>
  );
}
