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
  | "form_view"
  | "form_start"
  | "form_abandon"
  | "form_submit";

type Attribution = {
  source: string | null;
  medium: string | null;
  campaign: string | null;
  content?: string | null;
  term?: string | null;
  gclid: string | null;
  fbclid: string | null;
  msclkid?: string | null;
  gbraid?: string | null;
  wbraid?: string | null;
  lp?: string | null;   // landing page path+query at touch time
  ref?: string | null;  // external referrer hostname
  ft?: string | null;   // first-touch ISO timestamp (survives overwrites)
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

/** Persist the visitor's acquisition touch. A page carrying new UTM/click-id
 *  data OVERWRITES the stored touch (last meaningful touch — a fresh paid
 *  click must not be swallowed by a stale "(direct)" cookie). A bare page
 *  load never overwrites. `ft` (first-touch time) survives every overwrite.
 *
 *  Google Ads auto-tagging appends gclid + gad_campaignid but NO utm params,
 *  so the campaign ID — the join key against marketing_spend — only exists
 *  via gad_campaignid. iOS-privacy ad clicks carry gbraid/wbraid INSTEAD of
 *  gclid; both are equally conclusive proof of a paid click. */
export function captureAttribution(): void {
  if (typeof window === "undefined") return;
  const q = new URLSearchParams(window.location.search);
  const g = (k: string) => q.get(k) || null;

  const gclid = g("gclid"), gbraid = g("gbraid"), wbraid = g("wbraid");
  const msclkid = g("msclkid"), fbclid = g("fbclid");
  const gadCampaign = g("gad_campaignid");
  const googleAdsClick = Boolean(gclid || gbraid || wbraid || g("gad_source") || gadCampaign);
  const hasNew = Boolean(g("utm_source") || g("utm_medium") || g("utm_campaign") ||
    g("utm_content") || g("utm_term") || gclid || gbraid || wbraid || msclkid || fbclid || googleAdsClick);

  const prevRaw = readCookie(COOKIE_ATTR);
  let prev: Attribution | null = null;
  if (prevRaw) { try { prev = JSON.parse(prevRaw) as Attribution; } catch { /* corrupt */ } }
  if (prev && !hasNew) return;

  let externalRef = "";
  try {
    const r = document.referrer ? new URL(document.referrer) : null;
    if (r && r.host !== window.location.host) externalRef = r.hostname.replace(/^www\./, "");
  } catch { /* malformed referrer — ignore */ }

  let source = g("utm_source");
  let medium = g("utm_medium");
  let campaign = g("utm_campaign");
  if (!medium) {
    if (googleAdsClick) { medium = "cpc"; source = source ?? "google"; campaign = campaign ?? gadCampaign; }
    else if (msclkid)   { medium = "cpc"; source = source ?? "bing"; }
    else if (fbclid)    { medium = "paid_social"; source = source ?? "facebook"; }
  }
  if (!source) {
    if (externalRef) { source = externalRef; medium = medium ?? "referral"; }
    else { source = "(direct)"; medium = medium ?? "(none)"; }
  }

  const attr: Attribution = {
    source, medium: medium ?? null, campaign,
    content: g("utm_content"), term: g("utm_term"),
    gclid, fbclid, msclkid, gbraid, wbraid,
    lp: (window.location.pathname + window.location.search).slice(0, 300),
    ref: externalRef || (prev?.ref ?? null),
    ft: prev?.ft || new Date().toISOString(),
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
  return { source: "(direct)", medium: "(none)", campaign: null, gclid: null, fbclid: null, msclkid: null, gbraid: null, wbraid: null };
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

// ---------------------------------------------------------------------------
// Human gate. Registration-funnel events (form_view / form_start /
// form_abandon) are held until the session shows a HUMAN signal — pointer
// movement, touch, scroll, or a key press. Headless scanners load pages and
// touch nothing: 20 of 21 "registration starts" on /login over two weeks in
// Aug–Sep 2026 were bots firing 1–27ms after pageview (the mount-effect +
// autofocus combination made every bot pageview read as a form start). The
// event is built at call time so occurred_at reflects when the form actually
// appeared; the gate only delays shipping. No human signal ever (a bot) →
// the held events are dropped at unload. navigator.webdriver → dropped
// outright. form_submit is NOT gated — a completed registration is real
// data, and gating it could lose a conversion racing page unload.
// ---------------------------------------------------------------------------
const HUMAN_GATED: ReadonlySet<SiteEventType> = new Set([
  "form_view",
  "form_start",
  "form_abandon",
]);
let humanSeen = false;
let humanPending: Queued[] = [];
let humanGateInstalled = false;

function installHumanGate(): void {
  if (humanGateInstalled || typeof window === "undefined") return;
  humanGateInstalled = true;
  const signals = ["pointermove", "pointerdown", "touchstart", "wheel", "scroll", "keydown"] as const;
  const onSignal = () => {
    humanSeen = true;
    for (const sig of signals) window.removeEventListener(sig, onSignal);
    if (humanPending.length) {
      queue.push(...humanPending);
      humanPending = [];
      if (!timer) timer = setTimeout(() => flush(), FLUSH_MS);
    }
  };
  for (const sig of signals) window.addEventListener(sig, onSignal, { passive: true });
}

export function fire(
  eventType: SiteEventType,
  opts: { data?: Record<string, unknown>; immediate?: boolean } = {},
): void {
  if (typeof window === "undefined") return;
  installHumanGate();
  // Keep the browsing list in sync off the same call that reports the view, so
  // there's no second thing to remember to wire up on a new page template.
  if (eventType === "listing_view") {
    const mls = opts.data?.mls_id;
    if (typeof mls === "string" || typeof mls === "number") rememberViewed(String(mls));
  }
  const attr = currentAttribution();
  const gated = HUMAN_GATED.has(eventType) && !humanSeen;
  if (gated && (navigator as { webdriver?: boolean }).webdriver) return; // headless: drop
  const target = gated ? humanPending : queue;
  target.push({
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

  if (gated) return; // held until the first human signal
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
