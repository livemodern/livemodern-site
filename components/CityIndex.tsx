"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { areaAnchor } from "@/lib/communities";

const CF = "https://images.livemodern.com/cdn-cgi/image";
const cf = (u: string, w: number, q = 80) =>
  u ? `${CF}/width=${w},quality=${q},format=auto/${u}` : "";

type B = { slug: string; name: string; city: string | null; hero: string; lifestyles?: string[] };

/** "New Construction" applies to every building here, so it isn't a useful chip. */
const HIDDEN_CHIPS = new Set(["New Construction"]);

export default function CityIndex({ buildings }: { buildings: B[] }) {
  const [active, setActive] = useState<Set<string>>(new Set());

  const chips = useMemo(() => {
    const counts = new Map<string, number>();
    for (const b of buildings)
      for (const t of b.lifestyles ?? [])
        if (!HIDDEN_CHIPS.has(t)) counts.set(t, (counts.get(t) ?? 0) + 1);
    return [...counts.entries()].sort((a, z) => z[1] - a[1]).map(([t]) => t);
  }, [buildings]);

  // Multi-select, AND (intersection) — matches the MLG platform convention.
  const matches = (b: B) => {
    if (!active.size) return true;
    const t = new Set(b.lifestyles ?? []);
    for (const a of active) if (!t.has(a)) return false;
    return true;
  };

  const areas = useMemo(() => {
    const byArea = new Map<string, B[]>();
    for (const b of buildings) {
      const a = b.city ?? "Other";
      if (!byArea.has(a)) byArea.set(a, []);
      byArea.get(a)!.push(b);
    }
    return [...byArea.entries()]
      .sort((a, z) => z[1].length - a[1].length)
      .map(([area, all]) => ({ area, all, shown: all.filter(matches) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildings, active]);

  const toggle = (t: string) =>
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });

  const shownTotal = areas.reduce((n, a) => n + a.shown.length, 0);

  return (
    <div className="cidx">
      <div className="cidx-chips" role="group" aria-label="Filter by lifestyle">
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
            Clear ({shownTotal})
          </button>
        ) : null}
      </div>

      {areas.map(({ area, shown }) =>
        shown.length ? (
          <section key={area} className="cidx-area" id={`area-${areaAnchor(area)}`}>
            <div className="cidx-head">
              <h3 className="serif">{area}</h3>
              <span className="cidx-n">
                {shown.length} building{shown.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="cidx-grid">
              {shown.map((b) => (
                <Link key={b.slug} href={`/${b.slug}`} className="cidx-card">
                  <span className="cidx-im">
                    <img
                      src={cf(b.hero, 480)}
                      alt={b.name}
                      loading="lazy"
                    />
                  </span>
                  <span className="cidx-bd">
                    <span className="cidx-name serif">{b.name}</span>
                    {(b.lifestyles ?? []).filter((t) => !HIDDEN_CHIPS.has(t)).length ? (
                      <span className="cidx-tags">
                        {(b.lifestyles ?? [])
                          .filter((t) => !HIDDEN_CHIPS.has(t))
                          .slice(0, 2)
                          .join(" · ")}
                      </span>
                    ) : null}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ) : null,
      )}

      {shownTotal === 0 ? (
        <p className="cidx-empty">No buildings match that combination — try removing a filter.</p>
      ) : null}
    </div>
  );
}
