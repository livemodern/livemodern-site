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
};

export default function LeadForm({
  source = "contact-form",
  cta = "Request a call",
  withInterest = false,
  variant = "dark",
}: Props) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state === "sending") return;
    const form = e.currentTarget;
    const fd = new FormData(form);
    const payload: Record<string, string> = { source };
    fd.forEach((v, k) => (payload[k] = String(v)));
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
        <input name="name" placeholder="Name" aria-label="Name" required />
        <input name="phone" placeholder="Phone" aria-label="Phone" inputMode="tel" />
      </div>
      <input name="email" type="email" placeholder="Email" aria-label="Email" required />
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
      {state === "error" ? (
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
