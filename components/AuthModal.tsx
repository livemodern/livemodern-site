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
import {
  SMS_CONSENT_TEXT,
  signIn,
  signInWithGoogle,
  signUp,
  sendMagicLink,
} from '@/lib/auth';
import { getViewedListings } from '@/lib/view-tracker';

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
  const [smsConsent, setSmsConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
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
      smsConsent,
      communitySlug,
      communityName,
      mlsId,
    });
    setBusy(false);
    if (error) {
      // signUp steers a known email to sign-in rather than making a ghost account.
      if (error.code === 'exists') {
        setMode('signin');
        setErr('You already have an account — sign in and we\u2019ll pick up where you left off.');
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
    setOk('Check your email — we sent you a sign-in link.');
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
      <div className="lmgate-panel" onClick={(e) => e.stopPropagation()}>
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
              placeholder="(561) 228-8420"
            />
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

        <div className="lmgate-or">
          <span>or</span>
        </div>

        <button
          type="button"
          className="lmgate-google"
          onClick={() => void signInWithGoogle()}
          disabled={busy}
        >
          Continue with Google
        </button>

        {mode === 'signin' && (
          <p className="auth-alt">
            <button type="button" onClick={() => void handleMagicLink()}>
              Email me a sign-in link instead
            </button>
          </p>
        )}

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
