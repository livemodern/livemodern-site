"use client";

import { useState, Children } from "react";

/**
 * Renders a grid of unit cards, capped at `initial` (default 12). If there are
 * more, a "View more" button reveals the rest (and can collapse again). The
 * cards themselves are rendered on the server and passed as children — this
 * wrapper only toggles how many are shown, so no listing logic moves client-side.
 */
export default function UnitGrid({
  children,
  initial = 12,
  noun = "residences",
}: {
  children: React.ReactNode;
  initial?: number;
  noun?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const items = Children.toArray(children);
  const total = items.length;
  const hidden = total - initial;

  const shown = expanded ? items : items.slice(0, initial);

  return (
    <>
      <div className="unit-grid">{shown}</div>
      {hidden > 0 ? (
        <button
          type="button"
          className="unit-more"
          onClick={() => setExpanded((e) => !e)}
        >
          {expanded ? "Show fewer" : `View all ${total} ${noun}`}
          <span className="unit-more-i" aria-hidden="true">
            {expanded ? " \u2191" : " \u2193"}
          </span>
        </button>
      ) : null}
    </>
  );
}
