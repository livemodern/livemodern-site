"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Masthead from "@/components/Masthead";
import Footer from "@/components/Footer";
import { AUTH_CSS } from "../login/auth-css";
import { ACCOUNT_CSS } from "./account-css";
import { AUTH_CONFIGURED, firstNameOf, getSupabase, signOut, useUser } from "@/lib/auth";
import { slugifyListing } from "@/lib/listing-slug";

// Consumer account home. Three panels, all reading the same tables the rest of
// the Modern Living ecosystem writes — saves follow the user across every site,
// so reads are keyed on user_id only, not site_slug.
//   1. Your details      — editable, writes back to registrations
//   2. Saved homes       — saved_listings x properties, with unsave
//   3. Saved searches    — saved_searches, re-run + delete

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

type SavedSearch = {
  id: string;
  name: string | null;
  location: string | null;
  transaction: string | null;
  filters: Record<string, unknown> | null;
  alert_frequency: string | null;
  created_at: string | null;
};

const LOOKING = ["Buyer", "Seller", "Renter", "Landlord", "Just browsing"];

function money(v: number | null): string {
  if (v == null) return "\u2014";
  return `$${Math.round(v).toLocaleString()}`;
}

export default function AccountPage() {
  const { user, loading } = useUser();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [homes, setHomes] = useState<SavedHome[] | null>(null);
  const [searches, setSearches] = useState<SavedSearch[] | null>(null);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    if (!loading && !user) window.location.replace("/login");
  }, [loading, user]);

  const loadProfile = useCallback(async () => {
    if (!user || !AUTH_CONFIGURED) return;
    const sb = await getSupabase();
    const { data } = await sb
      .from("registrations")
      .select("first_name,last_name,email,phone,user_type,sms_consent")
      .eq("user_id", user.id)
      .maybeSingle();
    setProfile((data as Profile) ?? null);
  }, [user]);

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
        .select("id,name,location,transaction,filters,alert_frequency,created_at")
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
      const sb = await getSupabase();
      await sb
        .from("registrations")
        .update({
          first_name: draft.first_name,
          last_name: draft.last_name,
          phone: draft.phone,
          user_type: draft.user_type,
          sms_consent: draft.sms_consent ?? false,
        })
        .eq("user_id", user.id);
      await loadProfile();
      setEditing(false);
      setSavedMsg(true);
    } finally {
      setSaving(false);
    }
  }

  if (loading || !user) {
    return (
      <main style={{ minHeight: "60vh", display: "grid", placeItems: "center" }}>
        <p style={{ fontSize: 14, color: "#667" }}>Loading\u2026</p>
      </main>
    );
  }

  const name = firstNameOf(user);
  const p = profile;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: AUTH_CSS + ACCOUNT_CSS }} />
      <Masthead />
      <div className="wrap">
        <div className="auth-shell acct-wide">
          <p className="eyebrow">Account</p>
          <h1 className="serif">
            Hello, <em>{name}</em>.
          </h1>
          <p className="auth-lede">
            Your saved homes, searches, and details live here \u2014 and they follow you across every
            Modern Living site. Anything to change, or a building you want watched, just{" "}
            <Link href="/contact">tell us</Link>.
          </p>

          <div className="acct-card">
            <div className="acct-card-head">
              <h2>Your details</h2>
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
                  <span>{[p?.first_name, p?.last_name].filter(Boolean).join(" ") || name || "\u2014"}</span>
                </div>
                <div className="acct-row">
                  <span>Email</span>
                  <span>{p?.email || user.email || "\u2014"}</span>
                </div>
                <div className="acct-row">
                  <span>Phone</span>
                  <span>{p?.phone || "\u2014"}</span>
                </div>
                <div className="acct-row">
                  <span>Looking to</span>
                  <span>{p?.user_type || "\u2014"}</span>
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
                    <option value="">\u2014</option>
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
                    onChange={(e) => setDraft((d) => (d ? { ...d, sms_consent: e.target.checked } : d))}
                  />
                  <span>Text me the occasional new-listing alert (opt-in, reply STOP anytime)</span>
                </label>
                <div className="acct-actions">
                  <button className="auth-btn" onClick={saveDetails} disabled={saving}>
                    {saving ? "Saving\u2026" : "Save changes"}
                  </button>
                  <button className="acct-link" onClick={() => setEditing(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="acct-card">
            <div className="acct-card-head">
              <h2>
                Saved homes{" "}
                {homes && homes.length ? <em className="acct-count">{homes.length}</em> : null}
              </h2>
            </div>
            {homes === null ? (
              <p className="acct-empty">Loading\u2026</p>
            ) : homes.length === 0 ? (
              <p className="acct-empty">
                No saved homes yet. Tap the heart on any residence and it&rsquo;ll wait for you here.{" "}
                <Link href="/collections">Browse collections \u2192</Link>
              </p>
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
                          {h.beds ?? "\u2014"} bd \u00b7 {h.baths ?? "\u2014"} ba \u00b7{" "}
                          {h.sqft ? h.sqft.toLocaleString() : "\u2014"} sf
                        </div>
                      </div>
                      <button
                        className="acct-unsave"
                        onClick={() => void unsaveHome(String(h.mls_id))}
                        aria-label="Remove from saved"
                        title="Remove"
                      >
                        \u00d7
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="acct-card">
            <div className="acct-card-head">
              <h2>
                Saved searches{" "}
                {searches && searches.length ? <em className="acct-count">{searches.length}</em> : null}
              </h2>
            </div>
            {searches === null ? (
              <p className="acct-empty">Loading\u2026</p>
            ) : searches.length === 0 ? (
              <p className="acct-empty">
                No saved searches yet. Save one from any collection and we&rsquo;ll keep it fresh.{" "}
                <Link href="/collections">Browse collections \u2192</Link>
              </p>
            ) : (
              <div className="acct-searches">
                {searches.map((s) => (
                  <div className="acct-search" key={s.id}>
                    <div>
                      <div className="acct-search-name">{s.name || s.location || "Saved search"}</div>
                      <div className="acct-search-sub">
                        {[s.location, s.transaction].filter(Boolean).join(" \u00b7 ") || "Custom filters"}
                        {s.alert_frequency && s.alert_frequency !== "none"
                          ? ` \u00b7 alerts ${s.alert_frequency}`
                          : ""}
                      </div>
                    </div>
                    <div className="acct-search-actions">
                      {s.location ? (
                        <Link className="acct-link" href={`/${s.location}`}>
                          View
                        </Link>
                      ) : null}
                      <button className="acct-link acct-danger" onClick={() => void deleteSearch(s.id)}>
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            className="auth-btn acct-signout"
            onClick={async () => {
              await signOut();
              window.location.replace("/");
            }}
          >
            Sign out
          </button>
        </div>
      </div>
      <Footer />
    </>
  );
}
