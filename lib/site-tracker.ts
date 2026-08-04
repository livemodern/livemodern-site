"use client";

/**
 * First-party event tracking for LiveModern. Fires batched beacons to
 * /api/track, which persists to `site_events` (site_slug='livemodern') — the
 * same table MLG Admin's marketing dashboard reads.
 *
 * Runs in PARALLEL with GTM/GA4. Google needs its own pixels for ad-platform
 * bidding feedback; this is the never-blocked source of truth for the admin
 * dashboards.
 *
 * Identity is kept in first-party cookies rather than in memory, because the
 * first pageview fires before any auth check resolves — mlg-site had 100% of
 * tracked sessions come through anonymous for exactly that reason. Attribution
 * (utm/gclid/fbclid) is captured once on the landing page and persists for the
 * session, so a conversion 6 pages later still knows which campaign paid for it.
 */

const COOKIE_UID = "lm_uid";
const COOKIE_UEM = "lm_uem";
const COOKIE_ATTR = "lm_attr";
const SESSION_KEY = "lm_sid";
const SESSION_COOKIE = "lm_sid";
const VIEWED_KEY = "lm_viewed";
const YEAR = 31_536_000;

type SiteEventType =
  | "pageview"
  | "listing_view"
  | "search"
  | "save_listing"
  | "cta_click"
  | "scroll"
  | "phone_click"
  | "email_click"
  | "form_start"
  | "form_abandon"
  | "form_submit";

type Attribution = {
  source: string | null;
  medium: string | null;
  campaign: string | null;
  gclid: string | null;
  fbclid: string | null;
};

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const re = new RegExp(
    "(?:^|; )" + name.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1") + "=([^;]*)",
  );
  const m = document.cookie.match(re);
  return m ? decodeURIComponent(m[1]) : null;
}

function writeCookie(name: string, value: string, maxAge = YEAR): void {
  if (typeof document === "undefined") return;
  const host = window.location.hostname;
  const isLM = /livemodern\.com$/i.test(host);
  const isLocal = /localhost|127\.0\.0\.1/i.test(host);
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    `Max-Age=${maxAge}`,
    "Path=/",
    "SameSite=Lax",
  ];
  // Scope to the apex so bare + www share identity (we serve www-canonical,
  // but the apex 308 means a first hit can land there).
  if (isLM) parts.push("Domain=.livemodern.com");
  if (!isLocal) parts.push("Secure");
  document.cookie = parts.join("; ");
}

function clearCookie(name: string): void {
  if (typeof document === "undefined") return;
  const parts = [`${name}=`, "Max-Age=0", "Path=/"];
  if (/livemodern\.com$/i.test(window.location.hostname)) parts.push("Domain=.livemodern.com");
  document.cookie = parts.join("; ");
}

// Seed identity from cookies at module load so even the first pageview is stamped.
let identity: { user_id: string | null; email: string | null } =
  typeof document === "undefined"
    ? { user_id: null, email: null }
    : { user_id: readCookie(COOKIE_UID), email: readCookie(COOKIE_UEM) };

export function setTrackerIdentity(id: { user_id: string | null; email: string | null }): void {
  identity = id;
  if (id.user_id) writeCookie(COOKIE_UID, id.user_id);
  if (id.email) writeCookie(COOKIE_UEM, id.email);
}

export function clearTrackerIdentity(): void {
  identity = { user_id: null, email: null };
  clearCookie(COOKIE_UID);
  clearCookie(COOKIE_UEM);
}

export function trackedEmail(): string | null {
  return identity.email;
}

/** The current session id, so a form submit can hand it to the server and let
 *  it back-stitch this session's earlier anonymous events onto the contact. */
export function trackedSessionId(): string {
  return sessionId();
}

/**
 * MLS ids this browser has looked at, newest first. mlg-site sends this list
 * with every lead so computeLeadProfile can derive price band, community, zip,
 * city and sale-vs-lease from what the person ACTUALLY browsed rather than from
 * the one page the form happened to sit on. LiveModern sent nothing, so every
 * lead arrived with an empty profile. Capped at 40 — the profile only needs a
 * representative sample, and this rides along in a form POST.
 */
export function viewedMlsIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(VIEWED_KEY);
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function rememberViewed(mlsId: string): void {
  if (typeof window === "undefined" || !mlsId) return;
  try {
    const cur = viewedMlsIds().filter((x) => x !== mlsId);
    cur.unshift(mlsId);
    window.localStorage.setItem(VIEWED_KEY, JSON.stringify(cur.slice(0, 40)));
  } catch {
    /* storage disabled — the lead still routes, just without the profile */
  }
}

function writeSessionCookie(sid: string): void {
  if (typeof document === "undefined" || !sid) return;
  try {
    document.cookie = `${SESSION_COOKIE}=${encodeURIComponent(sid)}; path=/; SameSite=Lax`;
  } catch { /* cookies disabled */ }
}

function sessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    let sid = window.sessionStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : String(Date.now()) + Math.random().toString(36).slice(2);
      window.sessionStorage.setItem(SESSION_KEY, sid);
      // Mirror to a cookie so /api/leads can read the session SERVER-side —
      // every form is then covered without having to send it, including ones
      // added later.
      writeSessionCookie(sid);
    }
    // Re-assert each read: the cookie can be cleared independently of
    // sessionStorage, and losing it silently costs the browsing bridge.
    writeSessionCookie(sid);
    return sid;
  } catch {
    return "";
  }
}

function deviceType(): string {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent;
  if (/iPad|Tablet|Android(?!.*Mobile)/i.test(ua)) return "tablet";
  if (/Mobi|iPhone|Android/i.test(ua)) return "mobile";
  return "desktop";
}

/** Capture campaign attribution on the landing page; first touch of a session wins. */
export function captureAttribution(): void {
  if (typeof window === "undefined") return;
  const existing = readCookie(COOKIE_ATTR);
  const q = new URLSearchParams(window.location.search);
  const utmSource = q.get("utm_source");
  const gclid = q.get("gclid");
  const fbclid = q.get("fbclid");
  const hasNew = Boolean(utmSource || gclid || fbclid);
  if (existing && !hasNew) return;

  let source = utmSource;
  let medium = q.get("utm_medium");
  if (!source) {
    if (gclid) {
      source = "google";
      medium = medium ?? "cpc";
    } else if (fbclid) {
      source = "facebook";
      medium = medium ?? "paid_social";
    } else if (document.referrer) {
      try {
        const h = new URL(document.referrer).hostname;
        if (!/livemodern\.com$/i.test(h)) {
          source = h.replace(/^www\./, "");
          medium = medium ?? "referral";
        }
      } catch {
        /* malformed referrer — ignore */
      }
    }
  }
  const attr: Attribution = {
    source: source ?? "(direct)",
    medium: medium ?? "(none)",
    campaign: q.get("utm_campaign"),
    gclid,
    fbclid,
  };
  try {
    writeCookie(COOKIE_ATTR, JSON.stringify(attr));
  } catch {
    /* cookie disabled — events still fire, just unattributed */
  }
}

function currentAttribution(): Attribution {
  const raw = readCookie(COOKIE_ATTR);
  if (raw) {
    try {
      return JSON.parse(raw) as Attribution;
    } catch {
      /* fall through */
    }
  }
  return { source: "(direct)", medium: "(none)", campaign: null, gclid: null, fbclid: null };
}

// ---------------------------------------------------------------------------
// Batching. Events queue briefly and flush together so a busy page doesn't
// fire twenty requests, and always flush on unload via sendBeacon.
// ---------------------------------------------------------------------------
type Queued = Record<string, unknown>;
let queue: Queued[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;
const FLUSH_MS = 1200;

function post(events: Queued[], useBeacon: boolean): void {
  if (!events.length) return;
  const payload = JSON.stringify({ events, email: identity.email });
  try {
    if (useBeacon && typeof navigator !== "undefined" && navigator.sendBeacon) {
      const ok = navigator.sendBeacon(
        "/api/track",
        new Blob([payload], { type: "application/json" }),
      );
      if (ok) return;
    }
    void fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* tracking must never throw into the app */
  }
}

export function flush(useBeacon = false): void {
  if (!queue.length) return;
  const batch = queue;
  queue = [];
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  post(batch, useBeacon);
}

export function fire(
  eventType: SiteEventType,
  opts: { data?: Record<string, unknown>; immediate?: boolean } = {},
): void {
  if (typeof window === "undefined") return;
  // Keep the browsing list in sync off the same call that reports the view, so
  // there's no second thing to remember to wire up on a new page template.
  if (eventType === "listing_view") {
    const mls = opts.data?.mls_id;
    if (typeof mls === "string" || typeof mls === "number") rememberViewed(String(mls));
  }
  const attr = currentAttribution();
  queue.push({
    event_type: eventType,
    session_id: sessionId(),
    user_id: identity.user_id,
    page_url: window.location.href,
    page_path: window.location.pathname,
    referrer: document.referrer || null,
    attribution_source: attr.source,
    attribution_medium: attr.medium,
    attribution_campaign: attr.campaign,
    gclid: attr.gclid,
    fbclid: attr.fbclid,
    device_type: deviceType(),
    user_agent: navigator.userAgent,
    site_slug: "livemodern",
    data: opts.data ?? null,
    occurred_at: new Date().toISOString(),
  });

  if (opts.immediate) {
    flush();
    return;
  }
  if (!timer) timer = setTimeout(() => flush(), FLUSH_MS);
}

/** Flush on tab hide / unload. Returns a cleanup function. */
export function attachUnloadFlush(): () => void {
  if (typeof window === "undefined") return () => {};
  const onHide = () => {
    if (document.visibilityState === "hidden") flush(true);
  };
  const onUnload = () => flush(true);
  document.addEventListener("visibilitychange", onHide);
  window.addEventListener("pagehide", onUnload);
  return () => {
    document.removeEventListener("visibilitychange", onHide);
    window.removeEventListener("pagehide", onUnload);
  };
}
