// ─── View tracker — counts unique listings a visitor has seen ────────
//
// Ported from mlg-site so both sites gate on the same mechanism and the same
// knob: site_settings.listing_view_limit (per-site key first, shared key as
// fallback). LiveModern's is set to 3.
//
// localStorage-backed, entirely client-side. Deliberately so — Compass, Zillow
// and Realtor.com all do it this way. Server-side counting means IP heuristics
// (there's no user_id before signup) and is defeated by clearing cookies
// anyway. The point isn't lockdown, it's friction at the moment of highest
// engagement: an anonymous visitor on their third listing is a hot lead.
//
// One difference from mlg-site worth knowing: LiveModern's getSupabase() is
// ASYNC (it lazy-loads the client), so fetchConfig awaits it.

'use client';

import { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/auth';
import { readPlansViewed } from '@/lib/floorplan-tracker';

const STORAGE_KEY = 'lm.viewed_listings';

function readViewed(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function writeViewed(ids: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    /* storage disabled — the gate simply never fires, which is the safe way to fail */
  }
}

/** Record a listing view. Returns the resulting unique count; re-viewing the
 *  same listing doesn't increment. */
export function recordView(mlsId: string): number {
  const cur = readViewed();
  if (cur.includes(mlsId)) return cur.length;
  cur.push(mlsId);
  writeViewed(cur);
  return cur.length;
}

export function getViewCount(): number {
  return readViewed().length;
}

/** Combined gate counter: listings AND floor plans each count as ONE
 *  toward the SAME allowance. Two listings + one floor plan = 3 things.
 *  Wall pops on the Nth thing regardless of type. Patrick 2026-07-30. */
export function gateCount(): number {
  return readViewed().length + readPlansViewed().length;
}

/** Everything they've looked at — handed to the routing engine at signup so a
 *  new account routes on real browsing intent rather than on the one page the
 *  wall happened to appear on. */
export function getViewedListings(): string[] {
  return readViewed();
}

// ─── Settings ────────────────────────────────────────────────────────
// Cached for the life of the page: an admin changing the limit shouldn't move
// the wall under someone mid-session, and a fresh page load picks it up.

type ViewLimitConfig = { limit: number; enabled: boolean };

const SITE_SLUG = process.env.NEXT_PUBLIC_SITE_SLUG || 'livemodern';
const DEFAULT_CONFIG: ViewLimitConfig = { limit: 3, enabled: true };

let _cached: ViewLimitConfig | null = null;
let _cachedPromise: Promise<ViewLimitConfig> | null = null;

async function fetchConfig(): Promise<ViewLimitConfig> {
  if (_cached) return _cached;
  if (_cachedPromise) return _cachedPromise;

  _cachedPromise = (async () => {
    try {
      const sb = await getSupabase();
      const { data } = await sb
        .from('site_settings')
        .select('key,value')
        .in('key', [`listing_view_limit:${SITE_SLUG}`, 'listing_view_limit']);
      const rows = (data ?? []) as Array<{ key: string; value: ViewLimitConfig | null }>;
      const perSite = rows.find((r) => r.key === `listing_view_limit:${SITE_SLUG}`)?.value;
      const shared = rows.find((r) => r.key === 'listing_view_limit')?.value;
      _cached = perSite || shared || DEFAULT_CONFIG;
      return _cached;
    } catch {
      // Network hiccup must never lock anyone out of the site.
      _cached = DEFAULT_CONFIG;
      return _cached;
    }
  })();

  return _cachedPromise;
}

/** Returns { shouldShow, limit, viewCount }. Goes true once an anonymous
 *  visitor reaches the limit and the feature is enabled. Uses the combined
 *  gateCount so that floor-plan opens count toward the same allowance as
 *  listing views. */
export function useViewPaywall(opts: { isSignedIn: boolean; currentMlsId?: string | null }) {
  const { isSignedIn, currentMlsId } = opts;
  const [config, setConfig] = useState<ViewLimitConfig | null>(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    void fetchConfig().then((cfg) => {
      if (mounted) setConfig(cfg);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (currentMlsId) recordView(String(currentMlsId));
    setCount(gateCount());
  }, [currentMlsId]);

  const limit = config?.limit ?? DEFAULT_CONFIG.limit;
  const enabled = config?.enabled ?? DEFAULT_CONFIG.enabled;
  const shouldShow = enabled && !isSignedIn && limit > 0 && count >= limit;

  return { shouldShow, limit, viewCount: count };
}

/** Load just the gate config — for callers that decide when to record
 *  their own view (like Floorplans, which checks the wall BEFORE opening
 *  a plan). Returns { limit, enabled, loading }. */
export function useGateConfig(): { limit: number; enabled: boolean; loading: boolean } {
  const [config, setConfig] = useState<ViewLimitConfig | null>(null);
  useEffect(() => {
    let mounted = true;
    void fetchConfig().then((cfg) => {
      if (mounted) setConfig(cfg);
    });
    return () => {
      mounted = false;
    };
  }, []);
  return {
    limit: config?.limit ?? DEFAULT_CONFIG.limit,
    enabled: config?.enabled ?? DEFAULT_CONFIG.enabled,
    loading: config == null,
  };
}
