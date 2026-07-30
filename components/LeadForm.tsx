"use client";

import { useState } from "react";

type Props = {
  /** Passed through to the CRM as source_type (e.g. "contact-page", "hub-inquiry"). */
  source?: string;
  cta?: string;
  /** Show the bedroom-interest select instead of a free-text message. */
  withInterest?: boolean;
  /** Dark variant (on the navy LeadBand) vs light (on the contact page). */
  variant?: "dark" | "light";
  /**
   * Building / community context for the page this form sits on. Without it the
   * routing engine can't resolve the featured-agent pin or the geographic rules
   * and every lead falls to the house default — and the agent has no idea WHICH
   * building the person was looking at. Always pass both on a community page.
   */
  communitySlug?: string;
  communityName?: string;
};

/** Digits only — a US mobile is 10, or 11 with the leading 1. */
function phoneDigits(v: string): string {
  return v.replace(/\D/g, "");
}

export default function LeadForm({
  source = "contact-form",
  cta = "Request a call",
  withInterest = false,
  variant = "dark",
  communitySlug,
  communityName,
}: Props) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [invalid, setInvalid] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state === "sending") return;
    const form = e.currentTarget;
    const fd = new FormData(form);
    const payload: Record<string, string> = { source };
    fd.forEach((v, k) => (payload[k] = String(v)));

    // Client-side gate. The form is noValidate so the browser won't do this for
    // us — and a lead with no last name and no phone is close to unworkable for
    // the agent who picks it up.
    const firstName = (payload.firstName ?? "").trim();
    const lastName = (payload.lastName ?? "").trim();
    const email = (payload.email ?? "").trim();
    const digits = phoneDigits(payload.phone ?? "");
    if (!firstName) return setInvalid("Please enter your first name.");
    if (!lastName) return setInvalid("Please enter your last name.");
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))
      return setInvalid("Please enter a valid email address.");
    if (digits.length < 10 || digits.length > 11)
      return setInvalid("Please enter a phone number we can reach you on.");
    setInvalid(null);

    payload.name = `${firstName} ${lastName}`;
    if (communitySlug) payload.communitySlug = communitySlug;
    if (communityName) payload.communityName = communityName;
    if (typeof window !== "undefined") {
      payload.landingPage = window.location.href;
      payload.referrer = document.referrer || "";
    }
    setState("sending");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as { success?: boolean };
      if (res.ok && data.success) {
        setState("sent");
        form.reset();
      } else {
        setState("error");
      }
    } catch {
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <div className={`form-sent form-sent--${variant}`} role="status">
        <p className="serif">Thank you — your note is in.</p>
        <p>We reply the same day, personally. No drip campaigns, no auto-dialers.</p>
      </div>
    );
  }

  return (
    <form className="form" onSubmit={onSubmit} noValidate>
      <div className="two">
        <input name="firstName" placeholder="First name" aria-label="First name" autoComplete="given-name" required />
        <input name="lastName" placeholder="Last name" aria-label="Last name" autoComplete="family-name" required />
      </div>
      <div className="two">
        <input name="email" type="email" placeholder="Email" aria-label="Email" autoComplete="email" required />
        <input name="phone" placeholder="Phone" aria-label="Phone" inputMode="tel" autoComplete="tel" required />
      </div>
      {withInterest ? (
        <select name="interest" aria-label="Interest" defaultValue="">
          <option value="">Interest — select one</option>
          <option>1 bedroom</option>
          <option>2 bedroom</option>
          <option>3 bedroom</option>
          <option>Penthouse</option>
        </select>
      ) : (
        <textarea
          name="message"
          rows={3}
          placeholder="What are you looking for?"
          aria-label="Message"
        />
      )}
      <button className="btn btn-solid" type="submit" disabled={state === "sending"}>
        {state === "sending" ? "Sending…" : cta}
      </button>
      {invalid ? (
        <p className="fine" style={{ color: "#e0917f" }} role="alert">
          {invalid}
        </p>
      ) : state === "error" ? (
        <p className="fine" style={{ color: "#e0917f" }}>
          Something went wrong — call us at{" "}
          <a href="tel:5612288420" style={{ color: "inherit", textDecoration: "underline" }}>
            561 228 8420
          </a>{" "}
          and we&rsquo;ll sort it out.
        </p>
      ) : (
        <p className="fine">We reply the same day. No drip campaigns, no auto-dialers.</p>
      )}
    </form>
  );
}
