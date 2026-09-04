'use client';

// ─── AuthModal — blocking registration wall ──────────────────────────
//
// LiveModern had no modal auth at all, only the full-page /login. A gate needs
// something it can put OVER the listing, so this is that: the same signUp /
// signIn / Google / magic-link calls /login already uses, in a dialog.
//
// Deliberately reuses lib/auth rather than reimplementing: signUp there already
// does the duplicate-email pre-check, the registration verify call, tracker
// identity, and accepts the communitySlug / communityName / mlsId gate context
// that routing needs. Nothing about the account flow is forked here.
//
// Phone is REQUIRED on signup, matching /login — an agent's first move on a new
// registration is to call, and a lead with no number is close to unworkable.

import { useEffect, useRef, useState } from 'react';
import { trackConversion, ConversionLabel } from '@/lib/google-ads-conversions';
import {
  SMS_CONSENT_TEXT,
  signIn,
  signInWithGoogle,
  signUp,
  sendMagicLink,
} from '@/lib/auth';
import { getViewedListings } from '@/lib/view-tracker';
import { fire } from '@/lib/site-tracker';

type Mode = 'signup' | 'signin';

export type AuthModalProps = {
  open: boolean;
  /** Blocking: no backdrop dismiss, no escape, no close button. */
  blocking?: boolean;
  message?: string;
  defaultMode?: Mode;
  /** Gate context, forwarded so the new contact routes on real geography. */
  mlsId?: string | null;
  communitySlug?: string | null;
  communityName?: string | null;
  onClose?: (result?: 'signed-in' | 'dismissed') => void;
};

function digitsOf(v: string): string {
  return v.replace(/\D/g, '');
}

export function AuthModal({
  open,
  blocking = false,
  message,
  defaultMode = 'signup',
  mlsId = null,
  communitySlug = null,
  communityName = null,
  onClose,
}: AuthModalProps) {
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  // Defaults to Buyer per Patrick 2026-08-12 — most livemodern.com visitors
  // are house-hunters, so the safe default is the common case and every
  // agent still gets a real value on the CRM contact. Selectable if the
  // visitor is actually a seller, investor, renter, etc.
  const [userType, setUserType] = useState('Buyer');
  const [smsConsent, setSmsConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  // Set when a signup attempt was intercepted because the email already has
  // an account. We flip mode to signin AND show a friendly magic-link CTA at
  // the top of the form so the visitor's first instinct isn't "guess my
  // password" — the fastest recovery is a one-tap email link. Duplicate
  // accounts are how leads get fragmented across contacts (Patrick 2026-08-12).
  const [existingEmailHint, setExistingEmailHint] = useState<string | null>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => firstFieldRef.current?.focus(), 40);
  }, [open]);

  // Lock the page behind the wall. Without this the listing scrolls under it,
  // which reads as "the wall is decorative".
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open || blocking) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.('dismissed');
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [open, blocking, onClose]);

  // ── Registration funnel ─────────────────────────────────────────────
  // form_view — the paywall came up (human-gated in the tracker, so bots
  // that trip the view limit without ever moving a pointer are excluded).
  // form_start — first field focus. NOTE the modal autofocuses at 40ms;
  // the human gate is what keeps that from counting headless visitors.
  // form_abandon — viewed but closed / hidden without a signed-in result.
  // form_submit — lib/auth.ts signUp fires it on success.
  const startedRef = useRef(false);
  const doneRef = useRef(false);
  const funnelRef = useRef<Record<string, unknown>>({});
  funnelRef.current = {
    form: 'registration',
    mode,
    blocking,
    mls_id: mlsId ?? null,
    community_slug: communitySlug ?? null,
  };
  const abandonRef = useRef<() => void>(() => {});
  abandonRef.current = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    fire('form_abandon', { data: { ...funnelRef.current, started: startedRef.current } });
  };
  useEffect(() => {
    if (!open) return;
    startedRef.current = false;
    doneRef.current = false;
    fire('form_view', { data: funnelRef.current });
    const onHide = () => {
      if (document.visibilityState === 'hidden') abandonRef.current();
    };
    document.addEventListener('visibilitychange', onHide);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      abandonRef.current(); // closed or unmounted without signing in
    };
  }, [open]);
  const onFieldFocus = () => {
    if (startedRef.current || !open) return;
    startedRef.current = true;
    fire('form_start', { data: funnelRef.current });
  };

  if (!open) return null;

  async function handleSubmit() {
    if (busy) return;
    setErr(null);
    setOk(null);

    if (mode === 'signin') {
      if (!email.trim() || !password) return setErr('Enter your email and password.');
      setBusy(true);
      const { error } = await signIn(email.trim(), password);
      setBusy(false);
      if (error) return setErr(error.message);
      doneRef.current = true; // signed in — not an abandon
      onClose?.('signed-in');
      return;
    }

    if (!firstName.trim()) return setErr('Please enter your first name.');
    if (!lastName.trim()) return setErr('Please enter your last name.');
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim()))
      return setErr('Please enter a valid email address.');
    const d = digitsOf(phone);
    if (d.length < 10 || d.length > 11)
      return setErr('Please enter a mobile phone number we can reach you on.');
    if (password.length < 8)
      return setErr('Please choose a password of at least 8 characters.');

    setBusy(true);
    const { error } = await signUp({
      email: email.trim(),
      password,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      userType,
      smsConsent,
      communitySlug,
      communityName,
      mlsId,
    });
    setBusy(false);
    if (!error) {
      doneRef.current = true; // registered — signUp fired form_submit
      trackConversion(ConversionLabel.IdxRegistration);
    }
    if (error) {
      // signUp steers a known email to sign-in rather than making a ghost account.
      if (error.code === 'exists') {
        setMode('signin');
        setErr(null);
        setExistingEmailHint(email.trim());
        return;
      }
      return setErr(error.message);
    }
    onClose?.('signed-in');
  }

  async function handleMagicLink() {
    if (!email.trim()) return setErr('Enter your email first.');
    setBusy(true);
    setErr(null);
    const { error } = await sendMagicLink(email.trim());
    setBusy(false);
    if (error) return setErr(error.message);
    doneRef.current = true; // magic link sent — not an abandon
    setOk('Check your email — we sent you a sign-in link.');
  }

  async function handleMagicFromHint() {
    if (!existingEmailHint) return;
    setBusy(true);
    setErr(null);
    const { error } = await sendMagicLink(existingEmailHint);
    setBusy(false);
    if (error) return setErr(error.message);
    doneRef.current = true; // magic link sent — not an abandon
    setOk(`Sent — check ${existingEmailHint} for a one-tap sign-in link.`);
    setExistingEmailHint(null);
  }

  const viewed = typeof window !== 'undefined' ? getViewedListings().length : 0;

  return (
    <div
      className="lmgate-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lmgate-title"
      onClick={blocking ? undefined : () => onClose?.('dismissed')}
    >
      <div className="lmgate-panel" onClick={(e) => e.stopPropagation()} onFocusCapture={onFieldFocus}>
        <p className="lmgate-eyebrow">LiveModern</p>
        <h2 id="lmgate-title" className="lmgate-title">
          {mode === 'signup' ? (
            <>
              Keep <em>exploring</em>.
            </>
          ) : (
            <>
              Welcome <em>back</em>.
            </>
          )}
        </h2>
        <p className="lmgate-lede">
          {message ??
            (mode === 'signup'
              ? `You\u2019ve viewed ${viewed} ${viewed === 1 ? 'residence' : 'residences'}. Create a free account to keep going — your saved homes and searches follow you across every Modern Living site.`
              : 'Sign in to pick up where you left off.')}
        </p>

        <div className="auth-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            className="auth-tab"
            aria-selected={mode === 'signup'}
            onClick={() => {
              setMode('signup');
              setErr(null);
            }}
          >
            Create account
          </button>
          <button
            type="button"
            role="tab"
            className="auth-tab"
            aria-selected={mode === 'signin'}
            onClick={() => {
              setMode('signin');
              setErr(null);
            }}
          >
            Sign in
          </button>
        </div>

        {/* Passwordless-first — Google + magic-link buttons render ABOVE
            the password form on Sign In. Password is the fallback below
            the "OR WITH PASSWORD" divider. Both SIGN-IN ONLY. Patrick
            2026-08-12 pattern parity with mlg-site. */}
        {mode === 'signin' && !existingEmailHint && (
          <>
            <button
              type="button"
              className="lmgate-google"
              onClick={() => void signInWithGoogle()}
              disabled={busy}
            >
              <GoogleGLogo />
              Continue with Google
            </button>
            <button
              type="button"
              className="lmgate-magic-btn"
              onClick={() => void handleMagicLink()}
              disabled={busy}
            >
              <span className="lmgate-envelope" aria-hidden>✉️</span>
              Email me a sign-in link
            </button>
            <div className="lmgate-or"><span>or with password</span></div>
          </>
        )}

        {existingEmailHint && mode === 'signin' && (
          <div
            role="status"
            style={{
              margin: '12px 0',
              padding: '12px 14px',
              borderRadius: 8,
              background: '#f0f9ff',
              border: '1px solid #bae6fd',
              color: '#0c4a6e',
              fontSize: 14,
              lineHeight: 1.45,
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 4 }}>
              You already have an account under {existingEmailHint}.
            </div>
            <div style={{ marginBottom: 10 }}>
              Fastest way in — we&rsquo;ll email you a one-tap sign-in link. No password needed.
            </div>
            <button
              type="button"
              onClick={() => void handleMagicFromHint()}
              disabled={busy}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: 'none',
                background: '#0c4a6e',
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Email me a sign-in link
            </button>
            <button
              type="button"
              onClick={() => setExistingEmailHint(null)}
              style={{
                display: 'block',
                marginTop: 6,
                background: 'transparent',
                border: 'none',
                color: '#0369a1',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Or type my password below
            </button>
          </div>
        )}

        {mode === 'signup' && (
          <div className="auth-row">
            <label className="auth-field">
              <span>First name</span>
              <input
                ref={firstFieldRef}
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
            ref={mode === 'signin' ? firstFieldRef : undefined}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </label>

        {mode === 'signup' && (
          <label className="auth-field">
            <span>Mobile phone</span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
              autoComplete="tel"
            />
          </label>
        )}

        {mode === 'signup' && (
          <label className="auth-field">
            <span>What best describes you?</span>
            <select
              value={userType}
              onChange={(e) => setUserType(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                fontSize: 16,
                background: '#fff',
                cursor: 'pointer',
                boxSizing: 'border-box',
              }}
            >
              <option value="Buyer">Buyer</option>
              <option value="Seller">Seller</option>
              <option value="Buyer & Seller">Buyer &amp; Seller</option>
              <option value="Investor">Investor</option>
              <option value="Renter">Renter</option>
              <option value="Landlord">Landlord</option>
            </select>
          </label>
        )}

        <label className="auth-field">
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void handleSubmit();
            }}
          />
        </label>

        {mode === 'signup' && (
          <div className="auth-consent">
            <input
              id="lmgate-sms"
              type="checkbox"
              checked={smsConsent}
              onChange={(e) => setSmsConsent(e.target.checked)}
            />
            <label htmlFor="lmgate-sms">{SMS_CONSENT_TEXT}</label>
          </div>
        )}

        {err && <p className="auth-err">{err}</p>}
        {ok && <p className="auth-ok">{ok}</p>}

        <button type="button" className="auth-btn" onClick={() => void handleSubmit()} disabled={busy}>
          {busy ? 'One moment\u2026' : mode === 'signup' ? 'Create account' : 'Sign in'}
        </button>


        {!blocking && (
          <p className="auth-alt">
            <button type="button" onClick={() => onClose?.('dismissed')}>
              Not now
            </button>
          </p>
        )}

        <p className="auth-fine">
          Free, no obligation. We never sell your information, and we don&rsquo;t hand you to a call
          centre — you&rsquo;ll hear from one of our agents, personally.
        </p>
      </div>
    </div>
  );
}

export default AuthModal;

// Colored G logo (matches mlg-site's Google button).
function GoogleGLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/>
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
    </svg>
  );
}
