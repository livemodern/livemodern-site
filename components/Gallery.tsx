"use client";

import { useState, useCallback, useEffect } from "react";

const CF = "https://images.livemodern.com/cdn-cgi/image";
const cf = (u: string, w: number, q = 82) =>
  u ? `${CF}/width=${w},quality=${q},format=auto/${u}` : "";
const cfSet = (u: string, ws: number[], q = 82) =>
  u ? ws.map((w) => `${cf(u, w, q)} ${w}w`).join(", ") : "";

const VISIBLE_CAP = 8; // 2 rows of 4 on desktop; the rest behind "Show all"

export default function Gallery({
  images,
  name,
}: {
  images: string[];
  name: string;
}) {
  const [idx, setIdx] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);

  const open = idx != null;
  const close = useCallback(() => setIdx(null), []);
  const prev = useCallback(
    () => setIdx((i) => (i == null ? i : (i - 1 + images.length) % images.length)),
    [images.length],
  );
  const next = useCallback(
    () => setIdx((i) => (i == null ? i : (i + 1) % images.length)),
    [images.length],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, close, prev, next]);

  if (!images.length) return null;

  const visible = expanded ? images : images.slice(0, VISIBLE_CAP);
  const hidden = images.length - VISIBLE_CAP;
  const active = idx != null ? images[idx] : null;

  return (
    <>
      <div className="gal">
        {visible.map((g, i) => (
          <button key={g} type="button" className="gal-cell" onClick={() => setIdx(i)}>
            <img
              src={cf(g, 640)}
              srcSet={cfSet(g, [390, 640, 800])}
              sizes="(max-width:900px) 50vw, 25vw"
              alt={`${name} — image ${i + 1}`}
              loading={i > 3 ? "lazy" : undefined}
            />
            <span className="gal-zoom" aria-hidden>
              View
            </span>
          </button>
        ))}
      </div>

      {hidden > 0 && !expanded ? (
        <button className="fp-more" type="button" onClick={() => setExpanded(true)}>
          Show all {images.length} images
        </button>
      ) : null}

      {open && active ? (
        <div className="fp-lb" onClick={close} role="dialog" aria-modal="true">
          <button className="fp-x" onClick={close} aria-label="Close" type="button">
            &times;
          </button>
          <button
            className="fp-nav fp-prev"
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            aria-label="Previous"
            type="button"
          >
            &#8249;
          </button>
          <figure className="fp-stage gal-stage" onClick={(e) => e.stopPropagation()}>
            <img
              src={cf(active, 1600, 86)}
              srcSet={cfSet(active, [900, 1400, 1600, 2000], 86)}
              sizes="92vw"
              alt={`${name} — image ${(idx ?? 0) + 1}`}
            />
            <figcaption>
              <span className="serif">{name}</span>
              <span className="fp-cap-count">
                {(idx ?? 0) + 1} / {images.length}
              </span>
            </figcaption>
          </figure>
          <button
            className="fp-nav fp-next"
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            aria-label="Next"
            type="button"
          >
            &#8250;
          </button>
        </div>
      ) : null}
    </>
  );
}
