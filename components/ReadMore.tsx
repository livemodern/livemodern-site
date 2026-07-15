"use client";

import { useState, useRef, useLayoutEffect } from "react";

/**
 * Collapsible long-form text. Two modes:
 *  - `text`: a single long string (listing remarks) — collapses by max-height.
 *  - `paragraphs`: an array of paragraphs (building story) — shows the first
 *    `keep` paragraphs, hides the rest behind the toggle.
 *
 * A fade mask sits over the collapsed edge. The toggle only renders when the
 * content actually overflows the collapsed size, so short entries are untouched.
 */
export default function ReadMore({
  text,
  paragraphs,
  keep = 3,
  collapsedHeight = 260,
  className,
}: {
  text?: string;
  paragraphs?: string[];
  keep?: number;
  collapsedHeight?: number;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  // Text mode: assume long strings overflow so the FIRST paint is already
  // clamped (no post-load height shrink that would shift a restored scroll
  // position on refresh). useLayoutEffect corrects it precisely after mount.
  const initialOverflow = !Array.isArray(paragraphs) && (text?.length ?? 0) > 320;
  const [overflows, setOverflows] = useState(initialOverflow);
  const ref = useRef<HTMLDivElement>(null);

  const paraMode = Array.isArray(paragraphs);

  // Paragraph mode: overflow is simply "more paragraphs than we keep".
  // Text mode: measure against the collapsed height.
  useLayoutEffect(() => {
    if (paraMode) {
      setOverflows((paragraphs?.length ?? 0) > keep);
      return;
    }
    const el = ref.current;
    if (!el) return;
    setOverflows(el.scrollHeight > collapsedHeight + 24);
  }, [paraMode, paragraphs, keep, collapsedHeight, text]);

  if (paraMode) {
    const visible = open ? paragraphs! : paragraphs!.slice(0, keep);
    return (
      <div className={className}>
        {visible.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
        {overflows ? (
          <button className="readmore-btn" onClick={() => setOpen((o) => !o)} type="button">
            {open ? "Read less" : "Read more"}
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className={className}>
      <div
        ref={ref}
        className={`readmore-body${!open && overflows ? " clamped" : ""}`}
        style={!open && overflows ? { maxHeight: collapsedHeight } : undefined}
      >
        <p>{text}</p>
      </div>
      {overflows ? (
        <button className="readmore-btn" onClick={() => setOpen((o) => !o)} type="button">
          {open ? "Read less" : "Read more"}
        </button>
      ) : null}
    </div>
  );
}
