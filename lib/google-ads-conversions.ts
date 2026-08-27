// Google Ads conversion event firing for livemodern.com. Same pattern as
// mlg-site's src/lib/google-ads-conversions.ts (Patrick 2026-06-22); ported
// 2026-08-27 because the site rebuild orphaned every LM-* conversion action —
// per-action stats showed all LM form actions at 0 conversions since the
// 2026-07-29 sellmodernhomes cutover.
//
// Labels were pulled from the live Ads account (410-526-4170) via the
// conversion_action tag_snippets API — not hand-copied from the UI.
//
// The Ads base tag (AW-1027408161) is loaded unconditionally in
// components/Analytics.tsx, so trackConversion() works with no env vars set.

const AW_ID = "AW-1027408161";

export const ConversionLabel = {
  ListingInquiry: "6TYSCNaKhb8DEKGC9OkD", // LM - Listing Inquiry
  RequestAShowing: "mtOLCMeQhb8DEKGC9OkD", // LM - Request a Showing
  ContactForm: "3krOCOmwz74DEKGC9OkD", // LM - Contact Form
  ContactAgentButton: "WOaTCITAz74DEKGC9OkD", // LM - Contact Agent Button - Form Submission
  HomeEstimateSellerForm: "ittjCP2Ghb8DEKGC9OkD", // LM - About Page - Home Estimate Seller Form
  IdxRegistration: "UE8_CMv1574DEKGC9OkD", // LM - Sign-up - IDX Registration Form
  PartialRegistrationSocial: "C5-QCLz9m78DEKGC9OkD", // LM - Partial Registration w/Social
  IdxRegistrationAfterSocial: "6HI3CPPrnL8DEKGC9OkD", // LM - Sign-Up - IDX Registration (After Social)
} as const;

export type ConversionLabel = (typeof ConversionLabel)[keyof typeof ConversionLabel];

/**
 * Fire a Google Ads conversion event. No-op during SSR or if gtag failed to
 * load (ad blocker). gtag uses sendBeacon for conversions, so firing right
 * before a form-post navigation still delivers.
 */
export function trackConversion(
  label: ConversionLabel,
  opts?: { value?: number; currency?: string; transaction_id?: string },
) {
  if (typeof window === "undefined") return;
  const w = window as unknown as { gtag?: (...args: unknown[]) => void };
  if (typeof w.gtag !== "function") return;
  const payload: Record<string, unknown> = { send_to: `${AW_ID}/${label}` };
  if (opts?.value !== undefined) payload.value = opts.value;
  if (opts?.currency) payload.currency = opts.currency;
  if (opts?.transaction_id) payload.transaction_id = opts.transaction_id;
  try {
    w.gtag("event", "conversion", payload);
  } catch {
    /* never throw from analytics */
  }
}
