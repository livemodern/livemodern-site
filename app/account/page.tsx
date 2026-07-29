"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Masthead from "@/components/Masthead";
import Footer from "@/components/Footer";
import { AUTH_CSS } from "../login/auth-css";
import { AUTH_CONFIGURED, firstNameOf, getSupabase, signOut, useUser } from "@/lib/auth";

// Minimal account home: confirm who you are, show the profile we hold, sign out.
// Saved listings / saved searches are the next layer and will read from the same
// registrations row this page displays.
type Profile = {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  user_type: string | null;
  sms_consent: boolean | null;
};

export default function AccountPage() {
  const { user, loading } = useUser();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!loading && !user) window.location.replace("/login");
  }, [loading, user]);

  useEffect(() => {
    if (!user || !AUTH_CONFIGURED) return;
    void (async () => {
      const sb = await getSupabase();
      const { data } = await sb
        .from("registrations")
        .select("first_name,last_name,email,phone,user_type,sms_consent")
        .eq("user_id", user.id)
        .maybeSingle();
      setProfile((data as Profile) ?? null);
    })();
  }, [user]);

  if (loading || !user) {
    return (
      <main style={{ minHeight: "60vh", display: "grid", placeItems: "center" }}>
        <p style={{ fontSize: 14, color: "#667" }}>Loading…</p>
      </main>
    );
  }

  const name = firstNameOf(user);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: AUTH_CSS }} />
      <Masthead />
      <div className="wrap">
        <div className="auth-shell">
          <p className="eyebrow">Account</p>
          <h1 className="serif">
            Hello, <em>{name}</em>.
          </h1>
          <p className="auth-lede">
            Your details below are what your LiveModern specialist sees. Anything to change, or a
            building you want watched, just <Link href="/contact">tell us</Link>.
          </p>

          <div className="acct-card">
            <h2>Your details</h2>
            <div className="acct-row">
              <span>Name</span>
              <span>
                {[profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || name || "—"}
              </span>
            </div>
            <div className="acct-row">
              <span>Email</span>
              <span>{profile?.email || user.email || "—"}</span>
            </div>
            <div className="acct-row">
              <span>Phone</span>
              <span>{profile?.phone || "—"}</span>
            </div>
            <div className="acct-row">
              <span>Looking to</span>
              <span>{profile?.user_type || "—"}</span>
            </div>
            <div className="acct-row">
              <span>Text updates</span>
              <span>{profile?.sms_consent ? "On" : "Off"}</span>
            </div>
          </div>

          <button
            className="auth-btn"
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
