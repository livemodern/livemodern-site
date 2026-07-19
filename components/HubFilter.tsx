"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { cf } from "@/lib/communities";

type Tower = { slug: string; name: string; city: string; county: string; hero: string };

const COUNTY_LABEL: Record<string, string> = {
  "Palm Beach": "Palm Beach",
  Broward: "Fort Lauderdale",
  "Miami-Dade": "Miami",
};

export default function HubFilter({ buildings }: { buildings: Tower[] }) {
  const counties = useMemo(() => {
    const present = new Set(buildings.map((b) => b.county).filter(Boolean));
    return ["Palm Beach", "Broward", "Miami-Dade"].filter((c) => present.has(c));
  }, [buildings]);

  const [active, setActive] = useState<string | null>(null);

  const shown = active ? buildings.filter((b) => b.county === active) : buildings;

  return (
    <>
      {counties.length > 1 ? (
        <div className="idx-chips" style={{ marginBottom: 24 }}>
          <button
            type="button"
            className={`chip${active === null ? " on" : ""}`}
            onClick={() => setActive(null)}
          >
            All
          </button>
          {counties.map((c) => (
            <button
              key={c}
              type="button"
              className={`chip${active === c ? " on" : ""}`}
              onClick={() => setActive(c)}
            >
              {COUNTY_LABEL[c] ?? c}
            </button>
          ))}
        </div>
      ) : null}

      <div className="col-rail">
        {shown.map((b) => (
          <Link className="tile" key={b.slug} href={`/${b.slug}`}>
            <img src={cf(b.hero, 720)} alt={b.name} loading="lazy" />
            <div className="tile-in">
              <p className="caps">{b.city || COUNTY_LABEL[b.county] || "South Florida"}</p>
              <h3>{b.name}</h3>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
