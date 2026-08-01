"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Masthead from "@/components/Masthead";
import Footer from "@/components/Footer";
import { AUTH_CSS } from "../login/auth-css";
import { ACCOUNT_CSS, AGENT_CSS } from "./account-css";
import { AUTH_CONFIGURED, firstNameOf, getSupabase, signOut, useUser } from "@/lib/auth";
import { slugifyListing } from "@/lib/listing-slug";

// Consumer account. Layout mirrors mlg-site — a navy hero, then a two-column
// grid (saved searches + saved homes in the main column, details + team card in
// a sticky sidebar) — rendered in the LiveModern design language: Playfair
// serif, hairline cards, generous white space. All saved data reads by user_id
// only (not site-scoped) so it follows the visitor across every Modern Living
// site.

type Profile = {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  user_type: string | null;
  sms_consent: boolean | null;
};

type SavedHome = {
  mls_id: string;
  street_address: string | null;
  unit_number: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  list_price: number | null;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  image_urls: string[] | null;
  property_subtype: string | null;
};

type Agent = {
  name: string;
  title: string | null;
  photo_url: string | null;
  phone: string | null;
  email: string | null;
} | null;

type LocObj = { name?: string | null; type?: string | null; filter?: Record<string, unknown> | null };
type SavedSearch = {
  id: string;
  name: string | null;
  // LiveModern saves store a slug string; MLG/mini-site saves store an object.
  location: string | LocObj | null;
  transaction: string | null;
  filters: Record<string, unknown> | null;
  alert_frequency: string | null;
  created_at: string | null;
  site_slug: string | null;
};

// site_slug -> where a saved search actually runs. All sites read one shared
// property DB, so an off-site search reproduces the same listings; it just has
// to run on the surface that can render it. LiveModern-origin searches run here.
const SITE_META: Record<string, { label: string; origin: string; searchPath?: string }> = {
  livemodern: { label: "LiveModern", origin: "", searchPath: "/search" },
  "mlg-site": { label: "modernlivingre.com", origin: "https://modernlivingre.com", searchPath: "/search" },
  "mlg-search": { label: "our county search", origin: "https://search.mlrecloud.com", searchPath: "/" },
  "one-city-plaza": { label: "onecityplazacondos.com", origin: "https://onecityplazacondos.com" },
  twocityplaza: { label: "twocityplazacondos.com", origin: "https://twocityplazacondos.com" },
  "city-palms": { label: "citypalms.com", origin: "https://citypalms.com" },
  "bristol-palm-beach": { label: "bristolpalmbeach.com", origin: "https://bristolpalmbeach.com" },
  "cityplace-south-tower": { label: "southtowercityplace.com", origin: "https://southtowercityplace.com" },
  "5000-north-ocean": { label: "5000noceancondos.com", origin: "https://5000noceancondos.com" },
  "nautilus-220": { label: "nautilus220condos.com", origin: "https://nautilus220condos.com" },
  "esplanade-grande": { label: "esplanadegrande.com", origin: "https://esplanadegrande.com" },
  "el-cid-homes": { label: "elcidhomes.com", origin: "https://elcidhomes.com" },
  "rocky-point-stuart": { label: "rockypointstuartfl.com", origin: "https://rockypointstuartfl.com" },
  "modern-living-palm-beach": { label: "modernlivingpalmbeach.com", origin: "https://modernlivingpalmbeach.com" },
};

function locName(loc: SavedSearch["location"]): string | null {
  if (!loc) return null;
  if (typeof loc === "string") return loc;
  return loc.name ?? null;
}

// Reconstruct the origin site's search URL. Mirrors mlg-site's buildSavedSearchHref
// param shape so an MLG/mlg-search "Run search" reproduces the real result set.
// Building/mini-site saves have no search page — those just open the site.
function runHref(s: SavedSearch): { href: string; external: boolean; label: string } {
  const meta = SITE_META[s.site_slug ?? ""] ?? null;

  const isLive = s.site_slug === "livemodern" || !s.site_slug;
  // LiveModern collection-page saves store a slug string → run at that page.
  if (isLive && typeof s.location === "string" && s.location) {
    return { href: `/${s.location}`, external: false, label: "Run search" };
  }
  // LiveModern full-search saves (object location / filters) → run at /search.
  if (isLive) {
    const p = new URLSearchParams();
    p.set("transaction", s.transaction === "rent" ? "rent" : "sale");
    const f = (s.filters ?? {}) as Record<string, unknown>;
    if (f.priceMin) p.set("priceMin", String(f.priceMin));
    if (f.priceMax) p.set("priceMax", String(f.priceMax));
    if (f.beds && f.beds !== "Any") p.set("beds_min", String(f.beds).replace(/\D/g, ""));
    if (f.baths && f.baths !== "Any") p.set("baths_min", String(f.baths).replace(/\D/g, ""));
    if (f.property_subtype) p.set("property_subtype", String(f.property_subtype));
    if (f.sqftMin) p.set("sqft_min", String(f.sqftMin));
    if (f.yearBuiltMin) p.set("year_built_min", String(f.yearBuiltMin));
    if (f.keywords) p.set("keywords", String(f.keywords));
    const loc = s.location;
    if (loc && typeof loc === "object" && loc.filter) {
      for (const [k, v] of Object.entries(loc.filter)) {
        if (v == null) continue;
        p.set(k, Array.isArray(v) ? JSON.stringify(v) : String(v));
      }
    }
    return { href: `/search?${p.toString()}`, external: false, label: "Run search" };
  }
  if (!meta) {
    return { href: "/collections", external: false, label: "Browse" };
  }
  // Sites with a real search page: serialize filters into their /search params.
  if (meta.searchPath) {
    const p = new URLSearchParams();
    p.set("transaction", s.transaction === "rent" ? "rent" : "sale");
    const loc = s.location;
    if (loc) p.set("loc", typeof loc === "string" ? loc : JSON.stringify(loc));
    const f = (s.filters ?? {}) as Record<string, unknown>;
    const pass = ["priceMin","priceMax","sqftMin","sqftMax","domMax","hoaMax","subtype","yearBuiltMin","yearBuiltMax","keywords","statusesCsv","amenitiesCsv"];
    for (const k of pass) if (f[k]) p.set(k, String(f[k]));
    if (f.beds && f.beds !== "Any") p.set("beds", String(f.beds));
    if (f.baths && f.baths !== "Any") p.set("baths", String(f.baths));
    if (f.city && f.city !== "Any") p.set("city", String(f.city));
    if (f.status && f.status !== "On Market") p.set("status", String(f.status));
    const sep = meta.searchPath.includes("?") ? "&" : "?";
    return { href: `${meta.origin}${meta.searchPath}${sep}${p.toString()}`, external: true, label: `Run on ${meta.label}` };
  }
  // Building / mini-site: no search page — open the site.
  return { href: meta.origin || "/", external: true, label: `View on ${meta.label}` };
}

const LOOKING = ["Buyer", "Seller", "Renter", "Landlord", "Just browsing"];

function money(v: number | null): string {
  if (v == null) return "—";
  return `$${Math.round(v).toLocaleString()}`;
}

export default function AccountPage() {
  const { user, loading } = useUser();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [agent, setAgent] = useState<Agent>(null);
  const [homes, setHomes] = useState<SavedHome[] | null>(null);
  const [searches, setSearches] = useState<SavedSearch[] | null>(null);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    if (!loading && !user) window.location.replace("/login");
  }, [loading, user]);

  // Profile + assigned agent resolve behind contacts/agents RLS, so we read them
  // through the service-role route with the session token — same data mlg-site
  // pulls, so LiveModern shows the same details and the same agent (e.g. Mariah).
  const authedFetch = useCallback(async (init?: RequestInit) => {
    const sb = await getSupabase();
    const {
      data: { session },
    } = await sb.auth.getSession();
    const token = session?.access_token;
    return fetch("/api/me/account", {
      ...init,
      headers: { ...(init?.headers ?? {}), Authorization: `Bearer ${token ?? ""}` },
    });
  }, []);

  const loadProfile = useCallback(async () => {
    if (!user || !AUTH_CONFIGURED) return;
    try {
      const res = await authedFetch();
      if (!res.ok) return;
      const data = (await res.json()) as { profile: Profile | null; agent: Agent };
      setProfile(data.profile ?? null);
      setAgent(data.agent ?? null);
    } catch {
      /* leave nulls */
    }
  }, [user, authedFetch]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (!user || !AUTH_CONFIGURED) return;
    void (async () => {
      const sb = await getSupabase();
      const { data: rows } = await sb
        .from("saved_listings")
        .select("mls_id,saved_at")
        .eq("user_id", user.id)
        .order("saved_at", { ascending: false });
      const ids = (rows ?? []).map((r: { mls_id: string }) => r.mls_id);
      if (ids.length === 0) {
        setHomes([]);
        return;
      }
      const { data: props } = await sb
        .from("properties")
        .select(
          "mls_id,street_address,unit_number,city,state,zip,list_price,beds,baths,sqft,image_urls,property_subtype",
        )
        .in("mls_id", ids);
      const byId = new Map((props ?? []).map((pr: SavedHome) => [String(pr.mls_id), pr]));
      setHomes(ids.map((id) => byId.get(String(id))).filter(Boolean) as SavedHome[]);
    })();
  }, [user]);

  useEffect(() => {
    if (!user || !AUTH_CONFIGURED) return;
    void (async () => {
      const sb = await getSupabase();
      const { data } = await sb
        .from("saved_searches")
        .select("id,name,location,transaction,filters,alert_frequency,created_at,site_slug")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setSearches((data as SavedSearch[]) ?? []);
    })();
  }, [user]);

  async function unsaveHome(mlsId: string) {
    if (!user) return;
    setHomes((h) => (h ? h.filter((x) => String(x.mls_id) !== String(mlsId)) : h));
    const sb = await getSupabase();
    await sb.from("saved_listings").delete().eq("user_id", user.id).eq("mls_id", mlsId);
  }

  async function deleteSearch(id: string) {
    if (!user) return;
    setSearches((s) => (s ? s.filter((x) => x.id !== id) : s));
    const sb = await getSupabase();
    await sb.from("saved_searches").delete().eq("user_id", user.id).eq("id", id);
  }

  function startEdit() {
    setDraft(
      profile ?? {
        first_name: firstNameOf(user),
        last_name: null,
        email: user?.email ?? null,
        phone: null,
        user_type: null,
        sms_consent: false,
      },
    );
    setEditing(true);
    setSavedMsg(false);
  }

  async function saveDetails() {
    if (!user || !draft) return;
    setSaving(true);
    try {
      await authedFetch({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "profile",
          first_name: draft.first_name,
          last_name: draft.last_name,
          phone: draft.phone,
          user_type: draft.user_type,
          sms_consent: draft.sms_consent ?? false,
        }),
      });
      // Reflect the name in Auth metadata client-side too, so the hero greeting
      // updates without a reload (fires USER_UPDATED for useUser()).
      try {
        const sb = await getSupabase();
        await sb.auth.updateUser({
          data: { first_name: draft.first_name, last_name: draft.last_name || null },
        });
      } catch {
        /* non-fatal */
      }
      await loadProfile();
      setEditing(false);
      setSavedMsg(true);
    } finally {
      setSaving(false);
    }
  }

  const memberSince = useMemo(() => {
    const iso = (user as { created_at?: string } | null)?.created_at;
    if (!iso) return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }, [user]);

  if (loading || !user) {
    return (
      <main style={{ minHeight: "60vh", display: "grid", placeItems: "center" }}>
        <p style={{ fontSize: 14, color: "#667" }}>Loading…</p>
      </main>
    );
  }

  const name = firstNameOf(user);
  const p = profile;
  const first = p?.first_name || name || "";
  const last = p?.last_name || "";
  const initials =
    `${(first[0] || "").toUpperCase()}${(last[0] || "").toUpperCase()}` || (name?.[0] ?? "L").toUpperCase();

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: AUTH_CSS + ACCOUNT_CSS + AGENT_CSS }} />
      <Masthead />

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <div className="acct-hero">
        <div className="wrap acct-hero-in">
          <div className="acct-avatar" aria-hidden="true">
            {initials}
          </div>
          <div className="acct-hero-copy">
            <p className="acct-hero-eyebrow">Your account</p>
            <h1 className="serif acct-hero-h1">
              Hello,{" "}
              <em>{first || "there"}</em>
              {last ? <> {last}</> : null}.
            </h1>
            <p className="acct-hero-sub">
              {p?.email || user.email}
              {memberSince ? <> &middot; with LiveModern since {memberSince}</> : null}
            </p>
          </div>
        </div>
      </div>

      {/* ── BODY ──────────────────────────────────────────────────── */}
      <div className="wrap">
        <div className="acct-grid">
          {/* MAIN */}
          <div className="acct-main">
            {/* Saved searches */}
            <section className="acct-block">
              <div className="acct-sec-head">
                <h2 className="serif">Saved searches</h2>
                {searches && searches.length ? (
                  <span className="acct-count">{searches.length}</span>
                ) : null}
              </div>
              {searches === null ? (
                <p className="acct-empty">Loading…</p>
              ) : searches.length === 0 ? (
                <div className="acct-empty-card">
                  <p className="serif">Never miss a listing.</p>
                  <p>
                    Save a search from any collection and it&rsquo;ll wait for you here, ready to
                    re-run.
                  </p>
                  <Link className="acct-cta" href="/collections">
                    Browse collections &rarr;
                  </Link>
                </div>
              ) : (
                <div className="acct-searches">
                  {searches.map((s) => (
                    <div className="acct-search" key={s.id}>
                      <div className="acct-search-main">
                        <div className="acct-search-name">
                          {s.name || locName(s.location) || "Saved search"}
                        </div>
                        <div className="acct-search-sub">
                          {[
                            SITE_META[s.site_slug ?? ""]?.label && s.site_slug !== "livemodern"
                              ? `Saved on ${SITE_META[s.site_slug ?? ""]?.label}`
                              : null,
                            s.transaction === "rent" ? "For Rent" : s.transaction === "sale" ? "For Sale" : null,
                            s.alert_frequency && s.alert_frequency !== "none"
                              ? `alerts ${s.alert_frequency}`
                              : null,
                          ]
                            .filter(Boolean)
                            .join(" · ") || "Custom filters"}
                        </div>
                      </div>
                      <div className="acct-search-actions">
                        {(() => {
                          const r = runHref(s);
                          return r.external ? (
                            <a className="acct-run" href={r.href} target="_blank" rel="noopener noreferrer">
                              {r.label} ↗
                            </a>
                          ) : (
                            <Link className="acct-run" href={r.href}>
                              {r.label}
                            </Link>
                          );
                        })()}
                        <button
                          className="acct-x"
                          onClick={() => void deleteSearch(s.id)}
                          aria-label="Remove saved search"
                          title="Remove"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Saved homes */}
            <section className="acct-block">
              <div className="acct-sec-head">
                <h2 className="serif">Saved homes</h2>
                {homes && homes.length ? <span className="acct-count">{homes.length}</span> : null}
              </div>
              {homes === null ? (
                <p className="acct-empty">Loading…</p>
              ) : homes.length === 0 ? (
                <div className="acct-empty-card">
                  <p className="serif">Nothing saved yet.</p>
                  <p>Tap the heart on any residence and it&rsquo;ll collect here.</p>
                  <Link className="acct-cta" href="/collections">
                    Browse collections &rarr;
                  </Link>
                </div>
              ) : (
                <div className="acct-homes">
                  {homes.map((h) => {
                    const href = `/listing/${slugifyListing(h)}`;
                    const img = h.image_urls?.[0];
                    return (
                      <div className="acct-home" key={h.mls_id}>
                        <Link href={href} className="acct-home-img">
                          {img ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={img} alt={h.street_address ?? "Saved home"} loading="lazy" />
                          ) : (
                            <div className="acct-home-noimg" />
                          )}
                        </Link>
                        <div className="acct-home-body">
                          <Link href={href} className="acct-home-price serif">
                            {money(h.list_price)}
                          </Link>
                          <div className="acct-home-addr">{h.street_address}</div>
                          <div className="acct-home-sub">
                            {[h.city, h.state].filter(Boolean).join(", ")}
                            {h.zip ? ` ${h.zip}` : ""}
                          </div>
                          <div className="acct-home-specs">
                            {h.beds ?? "—"} bd · {h.baths ?? "—"} ba ·{" "}
                            {h.sqft ? h.sqft.toLocaleString() : "—"} sf
                          </div>
                        </div>
                        <button
                          className="acct-x acct-x-float"
                          onClick={() => void unsaveHome(String(h.mls_id))}
                          aria-label="Remove from saved"
                          title="Remove"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {/* SIDEBAR */}
          <aside className="acct-side">
            {/* Your details */}
            <div className="acct-card">
              <div className="acct-card-head">
                <h3>Your details</h3>
                {!editing ? (
                  <button className="acct-link" onClick={startEdit}>
                    Edit
                  </button>
                ) : null}
              </div>

              {!editing ? (
                <>
                  <div className="acct-row">
                    <span>Name</span>
                    <span>{[first, last].filter(Boolean).join(" ") || "—"}</span>
                  </div>
                  <div className="acct-row">
                    <span>Email</span>
                    <span>{p?.email || user.email || "—"}</span>
                  </div>
                  <div className="acct-row">
                    <span>Phone</span>
                    <span>{p?.phone || "—"}</span>
                  </div>
                  <div className="acct-row">
                    <span>Looking to</span>
                    <span>{p?.user_type || "—"}</span>
                  </div>
                  <div className="acct-row">
                    <span>Text updates</span>
                    <span>{p?.sms_consent ? "On" : "Off"}</span>
                  </div>
                  {savedMsg ? <p className="acct-saved">Saved.</p> : null}
                </>
              ) : (
                <div className="acct-edit">
                  <label>
                    <span>First name</span>
                    <input
                      value={draft?.first_name ?? ""}
                      onChange={(e) => setDraft((d) => (d ? { ...d, first_name: e.target.value } : d))}
                    />
                  </label>
                  <label>
                    <span>Last name</span>
                    <input
                      value={draft?.last_name ?? ""}
                      onChange={(e) => setDraft((d) => (d ? { ...d, last_name: e.target.value } : d))}
                    />
                  </label>
                  <label>
                    <span>Phone</span>
                    <input
                      inputMode="tel"
                      value={draft?.phone ?? ""}
                      onChange={(e) => setDraft((d) => (d ? { ...d, phone: e.target.value } : d))}
                    />
                  </label>
                  <label>
                    <span>Looking to</span>
                    <select
                      value={draft?.user_type ?? ""}
                      onChange={(e) => setDraft((d) => (d ? { ...d, user_type: e.target.value } : d))}
                    >
                      <option value="">—</option>
                      {LOOKING.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="acct-check">
                    <input
                      type="checkbox"
                      checked={draft?.sms_consent ?? false}
                      onChange={(e) =>
                        setDraft((d) => (d ? { ...d, sms_consent: e.target.checked } : d))
                      }
                    />
                    <span>Text me the occasional new-listing alert (opt-in, reply STOP anytime)</span>
                  </label>
                  <div className="acct-actions">
                    <button className="auth-btn" onClick={saveDetails} disabled={saving}>
                      {saving ? "Saving…" : "Save changes"}
                    </button>
                    <button className="acct-link" onClick={() => setEditing(false)}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Your agent (resolved from the CRM) — falls back to the house card */}
            <div className="acct-card acct-team">
              {agent ? (
                <>
                  <p className="acct-team-eyebrow">Your specialist</p>
                  <div className="acct-agent-head">
                    {agent.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img className="acct-agent-photo" src={agent.photo_url} alt={agent.name} />
                    ) : (
                      <div className="acct-agent-photo acct-agent-ph" aria-hidden="true">
                        {agent.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                    )}
                    <div>
                      <div className="acct-team-name serif">{agent.name}</div>
                      {agent.title ? <div className="acct-agent-title">{agent.title}</div> : null}
                    </div>
                  </div>
                  <p className="acct-team-copy">
                    Your personal specialist at Modern Living — developer previews, private tours,
                    allocations. Reach out any time.
                  </p>
                  <div className="acct-team-actions">
                    {agent.phone ? (
                      <a className="auth-btn acct-team-call" href={`tel:${agent.phone.replace(/[^\d+]/g, "")}`}>
                        Call {agent.name.split(" ")[0]}
                      </a>
                    ) : null}
                    {agent.email ? (
                      <a className="acct-link" href={`mailto:${agent.email}`}>
                        Email {agent.name.split(" ")[0]} &rarr;
                      </a>
                    ) : (
                      <Link className="acct-link" href="/contact">
                        Message us &rarr;
                      </Link>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <p className="acct-team-eyebrow">Your team</p>
                  <div className="acct-team-name serif">Modern Living Group</div>
                  <p className="acct-team-copy">
                    We&rsquo;ll pair you with the right specialist for your search — developer
                    previews, private tours, allocations. Call or message any time.
                  </p>
                  <div className="acct-team-actions">
                    <a className="auth-btn acct-team-call" href="tel:5612288420">
                      Call 561 228 8420
                    </a>
                    <Link className="acct-link" href="/contact">
                      Message us &rarr;
                    </Link>
                  </div>
                </>
              )}
            </div>

            <button
              className="acct-signout"
              onClick={async () => {
                await signOut();
                window.location.replace("/");
              }}
            >
              Sign out
            </button>
          </aside>
        </div>
      </div>

      <Footer />
    </>
  );
}
