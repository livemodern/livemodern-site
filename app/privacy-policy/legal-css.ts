// Styles for /privacy-policy and /terms. Exported as a plain string and
// injected with <style dangerouslySetInnerHTML> — NEVER as <style>{CSS}</style>.
// React SSR HTML-escapes the text child of a raw-text element, so apostrophes
// come back as &#x27; in textContent and every page in the tree hydration-
// mismatches (#425/#418/#423). Cost us a fleet-wide client re-render once.
export const LEGAL_CSS = `
.legal-intro{padding:56px 0 8px;max-width:820px}
.legal-intro h1{font-family:var(--font-display),Georgia,serif;font-weight:400;
  font-size:clamp(34px,5vw,54px);line-height:1.06;margin:14px 0 0}
.legal-intro h1 em{font-style:italic;color:var(--accent)}
.legal-eff{font-size:12px;color:var(--muted);margin-top:14px;letter-spacing:.04em}
.legal-prose{max-width:820px;padding:26px 0 92px}
.legal-prose h2{font-family:var(--font-display),Georgia,serif;font-weight:400;
  font-size:clamp(19px,2.3vw,25px);margin:44px 0 12px;padding-bottom:10px;
  border-bottom:1px solid var(--line)}
.legal-prose p{font-size:14.5px;line-height:1.85;margin:0 0 15px;color:var(--ink)}
.legal-prose ul{margin:0 0 18px;padding-left:20px}
.legal-prose li{font-size:14.5px;line-height:1.8;margin-bottom:9px;color:var(--ink)}
.legal-prose a{color:var(--accent);text-decoration:underline;text-underline-offset:3px}
.legal-prose strong{font-weight:600}
.legal-addr{font-size:14px;line-height:1.9}
.legal-note{margin-top:34px;padding-top:18px;border-top:1px solid var(--line);
  font-size:12px;line-height:1.75;color:var(--muted)}
@media(max-width:640px){
  .legal-intro{padding:36px 0 4px}
  .legal-prose{padding:18px 0 64px}
}
`;
