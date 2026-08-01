"use client";

/**
 * LiveModern account layer. Mirrors mlg-site's src/lib/auth.ts, trimmed to what
 * this site needs, with the same hard-won guards:
 *
 *   - duplicate-account pre-check, so an email we already know (FUB contact,
 *     existing login, secondary email) can't create a ghost row that never
 *     reconciles with the CRM;
 *   - the central registration verifier (Telnyx number lookup + email MX /
 *     disposable checks + a model verdict on obvious fakes), FAIL-OPEN so a
 *     real buyer is never blocked by an infra hiccup;
 *   - registrations row written explicitly, with a defensive retry that strips
 *     columns the schema cache hasn't picked up yet;
 *   - the CRM hand-off is fire-and-forget and never blocks account creation.
 *
 * A signup is three things that must all happen: an auth.users row, a
 * registrations profile row, and a routed contact in MLG Admin. Only the first
 * is allowed to fail loudly.
 */

import type { SupabaseClient, Session, User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { setTrackerIdentity, clearTrackerIdentity, fire } from "@/lib/site-tracker";

const SB_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://ezcikavnfchqaenweygw.supabase.co";
const SB_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** False when the anon key isn't configured on the deployment — the UI uses
 *  this to show a "contact us" path instead of a broken form. */
export const AUTH_CONFIGURED = Boolean(SB_ANON);

// ── Return-to after auth ──────────────────────────────────────────────────
// After Google/email sign-in we should land the visitor back on the page they
// were on (the listing they registered from), not a generic /account. We stash
// the path before leaving for the OAuth round-trip and read it in the callback.
// localStorage survives the Google redirect (same origin); we also pass ?next=
// on redirectTo as a belt-and-suspenders for magic links opened elsewhere.
const RETURN_KEY = "lm-auth-next";

/** Only same-origin absolute paths — never an off-site or protocol-relative URL. */
function safePath(p: string | null | undefined): string | null {
  if (!p) return null;
  if (!p.startsWith("/") || p.startsWith("//")) return null;
  // Don't bounce back onto an auth surface.
  if (/^\/(login|account|auth)\b/.test(p)) return null;
  return p;
}

export function rememberReturnTo(explicit?: string): string | null {
  if (typeof window === "undefined") return null;
  const path = safePath(explicit ?? window.location.pathname + window.location.search);
  try {
    if (path) window.localStorage.setItem(RETURN_KEY, path);
    else window.localStorage.removeItem(RETURN_KEY);
  } catch {
    /* private mode */
  }
  return path;
}

/** Read + clear the stored destination. */
export function takeReturnTo(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const v = safePath(window.localStorage.getItem(RETURN_KEY));
    window.localStorage.removeItem(RETURN_KEY);
    return v;
  } catch {
    return null;
  }
}

const STORAGE_KEY = "lm-auth";

let client: SupabaseClient | null = null;

/**
 * supabase-js is ~66kB gzipped. Importing it statically put it in the shared
 * chunk of EVERY page, because Masthead (which is on every page) calls useUser.
 * That undoes the perf work done across the fleet. So: dynamic import, resolved
 * only when auth is actually needed.
 */
export async function getSupabase(): Promise<SupabaseClient> {
  if (!client) {
    const { createClient } = await import("@supabase/supabase-js");
    client = createClient(SB_URL, SB_ANON, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        // Distinct from mlg-site's 'mlg-auth' so the two brands never fight
        // over the same localStorage slot if a browser visits both.
        storageKey: STORAGE_KEY,
      },
    });
  }
  return client;
}

/**
 * Is there plausibly a session to restore? Anonymous visitors — nearly all
 * traffic — answer no, so they never download supabase-js at all. Reading the
 * storage key directly is a few microseconds; instantiating the client to ask
 * the same question costs the whole library.
 */
function hasStoredSession(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (window.localStorage.getItem(STORAGE_KEY)) return true;
  } catch {
    /* storage blocked */
  }
  // An OAuth/magic-link return carries its token in the URL, not storage yet.
  return /[?&#](access_token|code|token_hash)=/.test(window.location.href);
}

export type AuthState = { user: User | null; loading: boolean };

export function useUser(): AuthState {
  const [state, setState] = useState<AuthState>({ user: null, loading: true });

  useEffect(() => {
    if (!AUTH_CONFIGURED) {
      setState({ user: null, loading: false });
      return;
    }
    if (!hasStoredSession()) {
      setState({ user: null, loading: false });
      return;
    }

    let mounted = true;
    let unsub: (() => void) | null = null;

    void (async () => {
      const sb = await getSupabase();
      if (!mounted) return;

      const {
        data: { session },
      } = await sb.auth.getSession();
      if (mounted) {
        const u = session?.user ?? null;
        if (u) setTrackerIdentity({ user_id: u.id, email: u.email ?? null });
        setState({ user: u, loading: false });
      }

      const { data: sub } = sb.auth.onAuthStateChange((_e: string, s2: Session | null) => {
        if (!mounted) return;
        const u = s2?.user ?? null;
        if (u) setTrackerIdentity({ user_id: u.id, email: u.email ?? null });
        else clearTrackerIdentity();
        setState({ user: u, loading: false });
      });
      unsub = () => sub.subscription.unsubscribe();
    })();

    return () => {
      mounted = false;
      unsub?.();
    };
  }, []);

  return state;
}

export function firstNameOf(user: User | null): string | null {
  if (!user) return null;
  const m = user.user_metadata as Record<string, unknown> | undefined;
  const fn = m?.first_name;
  if (typeof fn === "string" && fn.trim()) return fn.trim();
  return user.email ? user.email.split("@")[0] : null;
}

export type AuthError = { code?: string; message: string };

export const SMS_CONSENT_TEXT =
  "I agree to receive text messages from LiveModern / Modern Living Group at Compass about " +
  "properties and my inquiry. Message frequency varies. Msg & data rates may apply. " +
  "Reply STOP to opt out, HELP for help. See our Privacy Policy and Terms of Use.";

export type SignUpArgs = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  userType?: string;
  smsConsent?: boolean;
  /** Context from whatever gate opened signup, so routing gets geography. */
  communitySlug?: string | null;
  communityName?: string | null;
  mlsId?: string | null;
};

export async function signUp(args: SignUpArgs): Promise<{ error?: AuthError }> {
  if (!AUTH_CONFIGURED) return { error: { code: "unconfigured", message: "Accounts aren't available yet." } };
  const sb = await getSupabase();
  const {
    email,
    password,
    firstName,
    lastName,
    phone,
    userType,
    smsConsent,
    communitySlug,
    communityName,
    mlsId,
  } = args;

  // 0) Duplicate guard — steer known emails to sign-in instead of creating a
  //    ghost account. Endpoint failure is treated as "unknown": proceed and let
  //    Supabase's own dedup catch it.
  try {
    const res = await fetch("/api/auth/exists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (res.ok) {
      const j = (await res.json()) as { exists?: boolean };
      if (j.exists) {
        return { error: { code: "exists", message: "An account already exists for this email." } };
      }
    }
  } catch {
    /* proceed */
  }

  // 0.5) Verification gate. FAIL-OPEN by design.
  try {
    const res = await fetch("/api/register/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName, lastName, email, phone }),
    });
    if (res.ok) {
      const v = (await res.json()) as { ok?: boolean; fieldErrors?: Record<string, string> };
      if (v.ok === false && v.fieldErrors && Object.keys(v.fieldErrors).length) {
        return {
          error: {
            code: "verification",
            message:
              v.fieldErrors.phone ||
              v.fieldErrors.email ||
              v.fieldErrors.name ||
              "Please double-check your information and try again.",
          },
        };
      }
    }
  } catch {
    /* fail open */
  }

  // 1) Auth user.
  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: {
      data: { first_name: firstName, last_name: lastName, phone, site_slug: "livemodern" },
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  if (error) {
    if (/already registered|user (?:with this )?email already|user_repeated_signup|email exists/i.test(error.message)) {
      return { error: { code: "exists", message: error.message } };
    }
    return { error: { message: error.message } };
  }
  if (!data.user) return { error: { message: "Sign up succeeded but no user was returned." } };

  // 2) Profile row. The rest of the app reads registrations, not auth metadata.
  const regRow: Record<string, unknown> = {
    user_id: data.user.id,
    first_name: firstName,
    last_name: lastName,
    email,
    phone: phone || null,
    source_site: "livemodern",
    user_type: userType || null,
    sms_consent: smsConsent ?? false,
    sms_consent_at: smsConsent ? new Date().toISOString() : null,
    sms_consent_text: smsConsent ? SMS_CONSENT_TEXT : null,
  };
  let { error: regErr } = await sb
    .from("registrations")
    .upsert(regRow, { onConflict: "user_id", ignoreDuplicates: true });
  if (regErr && /sms_consent|user_type|column|schema cache/i.test(regErr.message || "")) {
    delete regRow.sms_consent;
    delete regRow.sms_consent_at;
    delete regRow.sms_consent_text;
    delete regRow.user_type;
    ({ error: regErr } = await sb
      .from("registrations")
      .upsert(regRow, { onConflict: "user_id", ignoreDuplicates: true }));
  }
  if (regErr) console.error("[auth] registrations insert failed (non-fatal):", regErr.message);

  // 3) CRM hand-off — creates/merges the contact, assigns the agent, fires
  //    alerts, logs the routing decision. Never blocks signup.
  try {
    await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName,
        lastName,
        email,
        phone,
        userType,
        smsConsent: smsConsent ?? false,
        smsConsentText: smsConsent ? SMS_CONSENT_TEXT : null,
        isRegistration: true,
        source: "Registration",
        communitySlug: communitySlug ?? null,
        communityName: communityName ?? null,
        mlsId: mlsId ?? null,
        landingPage: window.location.href,
        referrer: document.referrer || null,
      }),
    });
  } catch (e) {
    console.warn("[auth] CRM hand-off failed (non-fatal):", e);
  }

  setTrackerIdentity({ user_id: data.user.id, email });
  fire("form_submit", { data: { form: "registration", user_type: userType ?? null }, immediate: true });

  return {};
}

export async function signIn(email: string, password: string): Promise<{ error?: AuthError }> {
  if (!AUTH_CONFIGURED) return { error: { code: "unconfigured", message: "Accounts aren't available yet." } };
  const sb = await getSupabase();
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) return { error: { message: error.message } };
  if (data.user) setTrackerIdentity({ user_id: data.user.id, email: data.user.email ?? null });
  return {};
}

/** Passwordless sign-in. Lands on /auth/confirm via the token_hash flow. */
export async function sendMagicLink(email: string): Promise<{ error?: AuthError }> {
  if (!AUTH_CONFIGURED) return { error: { code: "unconfigured", message: "Accounts aren't available yet." } };
  const sb = await getSupabase();
  const next = rememberReturnTo();
  const cb = `${window.location.origin}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ""}`;
  const { error } = await sb.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: cb },
  });
  if (error) return { error: { message: error.message } };
  return {};
}

export async function signInWithGoogle(): Promise<{ error?: AuthError }> {
  if (!AUTH_CONFIGURED) return { error: { code: "unconfigured", message: "Accounts aren't available yet." } };
  const sb = await getSupabase();
  const next = rememberReturnTo();
  const cb = `${window.location.origin}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ""}`;
  const { error } = await sb.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: cb },
  });
  if (error) return { error: { message: error.message } };
  return {};
}

export async function signOut(): Promise<void> {
  clearTrackerIdentity();
  try {
    const sb = await getSupabase();
    await sb.auth.signOut();
  } catch {
    /* ignore */
  }
}
