"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

type Item = { slug: string; name: string; city: string | null; county: string | null };

export default function BuildingSearch({
  items,
  onNavigate,
}: {
  items: Item[];
  onNavigate?: () => void;
}) {
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const router = useRouter();
  const wrapRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (s.length < 2) return [];
    return items
      .filter(
        (i) =>
          i.name.toLowerCase().includes(s) ||
          (i.city ?? "").toLowerCase().includes(s) ||
          (i.county ?? "").toLowerCase().includes(s),
      )
      .slice(0, 7);
  }, [q, items]);

  useEffect(() => setActive(0), [q]);

  const go = (slug: string) => {
    setQ("");
    onNavigate?.();
    router.push(`/${slug}`);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (!results.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(results[active].slug);
    }
  };

  return (
    <div className="bsearch" ref={wrapRef}>
      <input
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={onKey}
        placeholder="Search buildings & towers…"
        aria-label="Search buildings"
        autoComplete="off"
      />
      {results.length > 0 ? (
        <ul className="bsearch-menu" role="listbox">
          {results.map((r, i) => (
            <li key={r.slug} role="option" aria-selected={i === active}>
              <button
                type="button"
                className={i === active ? "on" : undefined}
                onMouseEnter={() => setActive(i)}
                onClick={() => go(r.slug)}
              >
                <span className="bs-name">{r.name}</span>
                {r.city ? <span className="bs-city">{r.city}</span> : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
