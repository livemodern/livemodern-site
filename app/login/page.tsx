"use client";

import { useEffect, useState } from "react";
import { trackConversion, ConversionLabel } from "@/lib/google-ads-conversions";
import Link from "next/link";
import Masthead from "@/components/Masthead";
import Footer from "@/components/Footer";
import { AUTH_CSS } from "./auth-css";
import {
  AUTH_CONFIGURED,
  SMS_CONSENT_TEXT,
  rememberReturnTo,
  sendMagicLink,
  signIn,
  signInWithGoogle,
  signUp,
  takeReturnTo,
  useUser,
} from "@/lib/auth";
import { fire } from "@/lib/site-tracker";

// Account surface. Deliberately pages rather than a modal, because the Masthead
// already links to /login and /account — one less pattern to maintain.
//
// Three deviations from a stock signup that are all deliberate:
//   - SMS consent is a separate, UNCHECKED-by-default box, and the verbatim
//     disclosure text is persisted with the timestamp. That's the TCPA/A2P
//     evidence; a pre-checked box is worthless as consent.
//   - "What best describes you?" writes registrations.user_type, which the
//     routing engine reads as a signal (not a decision — the rules pair it with
//     transaction guards).
//   - Sign-up failures for a known email return code 'exists' and we flip the
//     visitor to sign-in rather than letting them create a ghost account.

type Mode = "signup" | "signin";

export default function LoginPage() {
  const { user, loading } = useUser();
  const [mode, setMode] = useState<Mode>("signup");
  // A visitor sent here from a listing arrives with ?next=<path>; stash it so it
  // survives the password / Google / magic-link round-trips.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const n = new URLSearchParams(window.location.search).get("next");
    if (n) rememberReturnTo(n);
  }, []);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  // Defaults to Buyer, visibly selected so it can be changed.
  //
  // It used to start blank and was never validated, so registrations sailed
  // through with no client_type at all: 37% captured on this site against 74%
  // on modernlivingre.com, where the field is required. That matters more than
  // it used to, because MILA picks her template from client_type - a landlord
  // with none gets an email about buying.
  //
  // Defaulting rather than requiring keeps registration frictionless. Most
  // people here are buying, and the ones who are not can see the answer sitting
  // there and change it.
  const [userType, setUserType] = useState("Buyer");
  const [smsConsent, setSmsConsent] = useState(false);

  useEffect(() => {
    if (!loading && user) window.location.replace(takeReturnTo() ?? "/account");
  }, [loading, user]);

  useEffect(() => {
    fire("form_start", { data: { form: "account", mode } });
  }, [mode]);

  async function onSignUp() {
    setErr(null);
    setOk(null);
    if (!firstName.trim() || !lastName.trim()) return setErr("Please enter your first and last name.");
    if (!email.trim()) return setErr("Please enter your email.");
    {
      // A registration with no phone lands on an agent's desk unworkable — the
      // first thing they do is call. Same 10/11-digit floor the lead form uses.
      const digits = phone.replace(/\D/g, "");
      if (digits.length < 10 || digits.length > 11)
        return setErr("Please enter a mobile phone number we can reach you on.");
    }
    if (password.length < 8) return setErr("Please choose a password of at least 8 characters.");
    setBusy(true);
    const { error } = await signUp({
      email: email.trim(),
      password,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      userType: userType || "Buyer",
      smsConsent,
    });
    setBusy(false);
    if (!error) {
      trackConversion(ConversionLabel.IdxRegistration);
      setOk("You're in. Taking you to your account…");
      return;
    }
    if (error.code === "exists") {
      setMode("signin");
      setErr("You already have an account with this email — sign in below, or use a sign-in link.");
      return;
    }
    setErr(error.message);
  }

  async function onSignIn() {
    setErr(null);
    setOk(null);
    if (!email.trim() || !password) return setErr("Enter your email and password.");
    setBusy(true);
    const { error } = await signIn(email.trim(), password);
    setBusy(false);
    if (error) setErr(error.message);
  }

  async function onMagicLink() {
    setErr(null);
    setOk(null);
    if (!email.trim()) return setErr("Enter your email and we'll send you a sign-in link.");
    setBusy(true);
    const { error } = await sendMagicLink(email.trim());
    setBusy(false);
    if (error) setErr(error.message);
    else setOk("Check your email — we sent you a sign-in link.");
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: AUTH_CSS }} />
      <Masthead />
      <div className="wrap">
        <div className="auth-shell">
          <p className="eyebrow">Account</p>
          <h1 className="serif">
            {mode === "signup" ? (
              <>
                Save what you <em>love</em>.
              </>
            ) : (
              <>
                Welcome <em>back</em>.
              </>
            )}
          </h1>
          <p className="auth-lede">
            {mode === "signup"
              ? "Create an account to save residences, follow buildings as pricing and availability change, and get straight through to the specialist who covers them."
              : "Sign in to your saved residences and building alerts."}
          </p>

          {!AUTH_CONFIGURED ? (
            <div className="auth-err">
              Accounts aren&rsquo;t switched on for this deployment yet. In the meantime,{" "}
              <Link href="/contact">send us a note</Link> and we&rsquo;ll follow up the same day.
            </div>
          ) : (
            <>
              <div className="auth-tabs" role="tablist">
                <button
                  className="auth-tab"
                  role="tab"
                  aria-selected={mode === "signup"}
                  onClick={() => setMode("signup")}
                >
                  Create account
                </button>
                <button
                  className="auth-tab"
                  role="tab"
                  aria-selected={mode === "signin"}
                  onClick={() => setMode("signin")}
                >
                  Sign in
                </button>
              </div>

              {mode === "signup" && (
                <div className="auth-row">
                  <label className="auth-field">
                    <span>First name</span>
                    <input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      autoComplete="given-name"
                    />
                  </label>
                  <label className="auth-field">
                    <span>Last name</span>
                    <input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      autoComplete="family-name"
                    />
                  </label>
                </div>
              )}

              <label className="auth-field">
                <span>Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  inputMode="email"
                />
              </label>

              {mode === "signup" && (
                <>
                  <label className="auth-field">
                    <span>Mobile phone</span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      autoComplete="tel"
                      inputMode="tel"
                      placeholder="(561) 228-8420"
                      required
                    />
                  </label>
                  <label className="auth-field">
                    <span>What best describes you?</span>
                    <select value={userType} onChange={(e) => setUserType(e.target.value)}>
                      {/* Values match mlg-site exactly (Buyer / Seller /
                          Buyer & Seller / Investor / Renter / Landlord) so
                          client_type is one vocabulary across both sites and
                          reports do not split. Labels stay in this site's
                          friendlier phrasing.

                          "Just looking" is gone: it told us nothing, routed to
                          the buyer templates anyway, and gave people an easy
                          way to answer without answering. */}
                      <option value="Buyer">Buying</option>
                      <option value="Seller">Selling</option>
                      <option value="Buyer & Seller">Buying &amp; selling</option>
                      <option value="Investor">Investment</option>
                      <option value="Renter">Renting</option>
                      <option value="Landlord">Leasing my property</option>
                    </select>
                  </label>
                </>
              )}

              <label className="auth-field">
                <span>Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                />
              </label>

              {mode === "signup" && (
                <div className="auth-consent">
                  <input
                    id="sms"
                    type="checkbox"
                    checked={smsConsent}
                    onChange={(e) => setSmsConsent(e.target.checked)}
                  />
                  <label htmlFor="sms">
                    {SMS_CONSENT_TEXT.replace(
                      " See our Privacy Policy and Terms of Use.",
                      "",
                    )}{" "}
                    See our <Link href="/privacy-policy">Privacy Policy</Link> and{" "}
                    <Link href="/terms">Terms of Use</Link>.
                  </label>
                </div>
              )}

              <button
                className="auth-btn"
                disabled={busy}
                onClick={mode === "signup" ? onSignUp : onSignIn}
              >
                {busy ? "One moment…" : mode === "signup" ? "Create account" : "Sign in"}
              </button>

              {err && <p className="auth-err">{err}</p>}
              {ok && <p className="auth-ok">{ok}</p>}

              <p className="auth-alt">
                <button onClick={onMagicLink} disabled={busy}>
                  Email me a sign-in link instead
                </button>
              </p>
              <p className="auth-alt">
                <button onClick={() => void signInWithGoogle()} disabled={busy}>
                  Continue with Google
                </button>
              </p>

              <p className="auth-fine">
                We use your details to answer your inquiry and connect you with the licensed agent
                who covers the building or area you&rsquo;re asking about. We never sell your
                information. Real-estate services are provided by Modern Living Group at Compass.
              </p>
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
