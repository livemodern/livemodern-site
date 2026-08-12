// ─── Floor-plan view tracker ──────────────────────────────────────────
// Mirrors lib/view-tracker.ts, but for floor plans. Ported from
// bristol-palm-beach 2026-08-12 so listings AND floor plans share ONE
// allowance on livemodern.com — a visitor who's opened two listings and
// one floor plan has "seen three things," and the 3rd is when the wall
// pops.
//
// Why a MODULE and not component state:
//
// Floor plans can appear on multiple surfaces of the same building page
// (grid + lightbox re-opens) and across different building pages within a
// session. A useRef/useState counter inside one component resets on
// navigation, so a visitor could open two plans on one building and two
// more on another and never hit the wall. localStorage is the only place
// the count survives the route change.
//
// Distinct plans only: reopening one you already looked at is free — the
// gate never punishes someone for closing a modal by accident.

'use client';

const STORAGE_KEY = 'lm.viewed_floorplans';

// Different callers may name the same plan differently — e.g. "A" on a
// homepage grid and "Unit A" on a detail page. Normalise here rather than
// at every call site so the two surfaces cannot drift apart and a new
// caller with its own naming transform still lands on the same key.
const PLAN_PREFIX = /^(unit|plan|residence|floor\s*plan)\s+/i;

function planKey(name: string): string {
  return String(name).trim().replace(PLAN_PREFIX, '').replace(/\s+/g, ' ').toLowerCase();
}

export function readPlansViewed(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function writePlansViewed(names: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(names));
  } catch {
    /* storage disabled — the gate simply never fires, which is the safe way to fail */
  }
}

/** Record a plan view. Returns the number of DISTINCT plans seen so far. */
export function recordPlanView(name: string): number {
  const key = planKey(name);
  if (!key) return getPlanViewCount();
  const cur = readPlansViewed();
  if (cur.includes(key)) return cur.length;
  cur.push(key);
  writePlansViewed(cur);
  return cur.length;
}

/** True if the visitor has already opened this plan — used to allow free
 *  re-opens of a plan that already counted. */
export function hasSeenPlan(name: string): boolean {
  const key = planKey(name);
  if (!key) return false;
  return readPlansViewed().includes(key);
}

export function getPlanViewCount(): number {
  return readPlansViewed().length;
}
