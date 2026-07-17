"use client";

import { useState, useCallback, useEffect } from "react";
import { mls, mlsSrcSet } from "@/lib/listings";

/**
 * Listing gallery. Keeps the existing hero + 2×2 mosaic layout untouched.
 * Interaction:
 *  - Desktop: click any tile → full-screen lightbox popup (arrows / Esc / counter).
 *  - Mobile:  tapping the "View all N photos" control folds the full grid open
 *             inline (fast scanning); tapping any photo there opens the popup
 *             for that shot (full-screen look).
 * The popup is available on both; the fold-out grid is the mobile-first path in.
 */
export default function ListingGallery({
  photos,
  statusLabel,
  address,
}: {
  photos: string[];
  statusLabel: string;
  address: string;
}) {
  const [idx, setIdx] = useState<number | null>(null);
  const [folded, setFolded] = useState(false); // mobile inline fold-out

  const hero = photos[0];
  const grid = photos.slice(1, 5);

  const open = idx != null;
  const close = useCallback(() => setIdx(null), []);
  const prev = useCallback(
    () => setIdx((i) => (i == null ? i : (i - 1 + photos.length) % photos.length)),
    [photos.length],
  );
  const next = useCallback(
    () => setIdx((i) => (i == null ? i : (i + 1) % photos.length)),
    [photos.length],
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

  if (!photos.length) return null;
  const active = idx != null ? photos[idx] : null;

  return (
    <>
      {/* MOSAIC — unchanged layout, now interactive */}
      <section className="l-gallery">
        {hero ? (
          <button type="button" className="l-hero" onClick={() => setIdx(0)}>
            <span className="status-tag">{statusLabel}</span>
            <img
              src={mls(hero, 1400)}
              srcSet={mlsSrcSet(hero, [640, 960, 1400])}
              sizes="(max-width:900px) 100vw, 66vw"
              alt={address}
            />
          </button>
        ) : null}
        {grid.map((p, i) => (
          <button
            key={i}
            type="button"
            className="l-thumb"
            onClick={() => setIdx(i + 1)}
          >
            <img
              src={mls(p, 700)}
              srcSet={mlsSrcSet(p, [390, 700])}
              sizes="(max-width:900px) 50vw, 25vw"
              alt=""
              loading="lazy"
            />
            {/* "View all" control:
                 desktop → opens popup (browse there);
                 mobile  → folds the full grid open inline */}
            {i === grid.length - 1 && photos.length > 5 ? (
              <span
                className="more"
                onClick={(e) => {
                  e.stopPropagation();
                  // desktop opens popup at this tile; mobile folds the grid open
                  if (window.matchMedia("(max-width:900px)").matches) {
                    setFolded(true);
                    // let the grid mount, then scroll it into view
                    requestAnimationFrame(() =>
                      document
                        .getElementById("l-foldout")
                        ?.scrollIntoView({ behavior: "smooth", block: "start" }),
                    );
                  } else {
                    setIdx(i + 1);
                  }
                }}
              >
                View all {photos.length} photos
              </span>
            ) : null}
          </button>
        ))}
      </section>

      {/* MOBILE FOLD-OUT — full grid inline; tap a photo → popup */}
      {folded ? (
        <div id="l-foldout" className="l-foldout">
          <div className="l-foldout-head">
            <span className="serif">{photos.length} photos</span>
            <button type="button" className="l-fold-close" onClick={() => setFolded(false)}>
              Collapse &uarr;
            </button>
          </div>
          <div className="l-foldout-grid">
            {photos.map((p, i) => (
              <button key={i} type="button" className="l-fold-cell" onClick={() => setIdx(i)}>
                <img
                  src={mls(p, 700)}
                  srcSet={mlsSrcSet(p, [390, 700])}
                  sizes="(max-width:900px) 50vw, 33vw"
                  alt={`${address} — photo ${i + 1}`}
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* LIGHTBOX POPUP — both platforms */}
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
              src={mls(active, 1600, 86)}
              srcSet={mlsSrcSet(active, [900, 1400, 1600, 2000], 86)}
              sizes="92vw"
              alt={`${address} — photo ${(idx ?? 0) + 1}`}
            />
            <figcaption>
              <span className="serif">{address}</span>
              <span className="fp-cap-count">
                {(idx ?? 0) + 1} / {photos.length}
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
