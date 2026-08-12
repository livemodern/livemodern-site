"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { Floorplan } from "@/lib/listings";
import { useUser } from "@/lib/auth";
import { gateCount, useGateConfig } from "@/lib/view-tracker";
import { recordPlanView, hasSeenPlan } from "@/lib/floorplan-tracker";
import { AuthModal } from "@/components/AuthModal";

const CF = "https://images.livemodern.com/cdn-cgi/image";
const cf = (u: string, w: number, q = 82) =>
  u ? `${CF}/width=${w},quality=${q},format=auto/${u}` : "";
const cfSet = (u: string, ws: number[], q = 82) =>
  u ? ws.map((w) => `${cf(u, w, q)} ${w}w`).join(", ") : "";

function specs(details: string | null): { beds?: string; baths?: string; sqft?: string } {
  if (!details) return {};
  return {
    beds: details.match(/(\d+(?:\.\d+)?)\s*Bed/i)?.[1],
    baths: details.match(/(\d+(?:\.\d+)?)\s*Bath/i)?.[1],
    sqft: details.match(/([\d,]+)\s*Sq/i)?.[1],
  };
}

const VISIBLE_CAP = 9; // 3×3; longer lists hide behind "Show all"

export default function Floorplans({
  plans,
  buildingName,
}: {
  plans: Floorplan[];
  buildingName: string;
}) {
  const { user, loading: userLoading } = useUser();
  const { limit, enabled: gateEnabled, loading: cfgLoading } = useGateConfig();
  const [idx, setIdx] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [justSignedIn, setJustSignedIn] = useState(false);
  const pendingIdx = useRef<number | null>(null);
  const signedIn = !!user || justSignedIn;

  // Gate-aware click handler. Signed-in users always through. Plans the
  // visitor has already opened are free re-opens (bristol/mini-site
  // parity). Otherwise we check the SHARED gateCount() against the site
  // limit BEFORE recording, so opening the Nth thing pops the wall
  // instead of the N+1th.
  const tryOpen = useCallback((i: number) => {
    const name = plans[i]?.name ?? String(i);
    if (signedIn || userLoading || cfgLoading || !gateEnabled) {
      recordPlanView(name);
      setIdx(i);
      return;
    }
    if (hasSeenPlan(name)) {
      setIdx(i);
      return;
    }
    if (limit > 0 && gateCount() >= limit) {
      pendingIdx.current = i;
      setAuthOpen(true);
      return;
    }
    recordPlanView(name);
    setIdx(i);
  }, [plans, signedIn, userLoading, cfgLoading, gateEnabled, limit]);

  const open = idx != null;
  const close = useCallback(() => setIdx(null), []);
  const prev = useCallback(
    () => setIdx((i) => (i == null ? i : (i - 1 + plans.length) % plans.length)),
    [plans.length],
  );
  const next = useCallback(
    () => setIdx((i) => (i == null ? i : (i + 1) % plans.length)),
    [plans.length],
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

  if (!plans.length) return null;

  const visible = expanded ? plans : plans.slice(0, VISIBLE_CAP);
  const hidden = plans.length - VISIBLE_CAP;
  const active = idx != null ? plans[idx] : null;
  const activeSpecs = active ? specs(active.details) : {};

  return (
    <>
      <div className="fp-grid">
        {visible.map((p, i) => {
          const s = specs(p.details);
          return (
            <button key={i} className="fp-card" onClick={() => tryOpen(i)} type="button">
              <div className="fp-im">
                <img
                  src={cf(p.image_url, 600)}
                  srcSet={cfSet(p.image_url, [390, 600])}
                  sizes="(max-width:640px) 100vw, 33vw"
                  alt={`${buildingName} — ${p.name ?? "floor plan"}`}
                  loading="lazy"
                />
                <span className="fp-zoom">View plan</span>
              </div>
              <div className="fp-bd">
                <div className="fp-name serif">{p.name ?? "Floor plan"}</div>
                {(s.beds || s.baths || s.sqft) && (
                  <div className="fp-specs">
                    {s.beds ? <span>{s.beds} Bed</span> : null}
                    {s.baths ? <span>{s.baths} Bath</span> : null}
                    {s.sqft ? <span>{s.sqft} SF</span> : null}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {hidden > 0 && !expanded ? (
        <button className="fp-more" onClick={() => setExpanded(true)} type="button">
          Show all {plans.length} floor plans
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
          <figure className="fp-stage" onClick={(e) => e.stopPropagation()}>
            <img
              src={cf(active.image_url, 1600, 88)}
              srcSet={cfSet(active.image_url, [900, 1400, 1600], 88)}
              sizes="90vw"
              alt={`${buildingName} — ${active.name ?? "floor plan"}`}
            />
            <figcaption>
              <span className="serif">{active.name ?? "Floor plan"}</span>
              {active.details ? <span className="fp-cap-det"> · {active.details}</span> : null}
              <span className="fp-cap-count">
                {(idx ?? 0) + 1} / {plans.length}
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

      <AuthModal
        open={authOpen}
        blocking
        defaultMode="signup"
        message={`Create a free account to see every floor plan${buildingName ? ` at ${buildingName}` : ''} — your saved homes and searches follow you across every Modern Living site.`}
        onClose={(result) => {
          setAuthOpen(false);
          if (result === 'signed-in') {
            setJustSignedIn(true);
            const i = pendingIdx.current;
            if (i != null) {
              const name = plans[i]?.name ?? String(i);
              recordPlanView(name);
              setIdx(i);
            }
          }
          pendingIdx.current = null;
        }}
      />
    </>
  );
}
