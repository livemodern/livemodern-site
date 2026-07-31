// Styles for the listing gate modal. Injected via
// <style dangerouslySetInnerHTML> — NEVER <style>{CSS}</style>, which React
// SSR HTML-escapes inside a raw-text element, hydration-mismatches (#425/#418)
// and gets the whole tree client-rendered. This bit the fleet on 2026-07-29.
//
// The field styles are the SAME .auth-* rules /login uses, imported rather than
// copied so the gate and the full page can never drift apart visually — but
// they're page-scoped there, so the gate has to carry them onto the listing
// page itself.
import { AUTH_CSS } from '@/app/login/auth-css';

const GATE_ONLY = `
.lmgate-backdrop{position:fixed;inset:0;z-index:120;display:flex;align-items:center;
  justify-content:center;padding:20px;background:rgba(13,23,59,.72);
  backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);overflow-y:auto}
.lmgate-panel{background:#fff;max-width:520px;width:100%;padding:34px 32px 30px;
  border-radius:2px;box-shadow:0 24px 70px rgba(13,23,59,.34);margin:auto}
@media(max-width:520px){.lmgate-panel{padding:26px 20px 24px}}
.lmgate-eyebrow{margin:0;font-size:11px;letter-spacing:.22em;text-transform:uppercase;
  color:var(--accent)}
.lmgate-title{font-family:var(--font-display),Georgia,serif;font-weight:400;
  font-size:clamp(26px,4vw,36px);line-height:1.1;margin:10px 0 8px;color:var(--ink)}
.lmgate-title em{font-style:italic;color:var(--accent)}
.lmgate-lede{font-size:13.5px;line-height:1.7;color:var(--muted);margin:0 0 22px}
.lmgate-or{display:flex;align-items:center;gap:12px;margin:18px 0 14px;
  font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--muted)}
.lmgate-or::before,.lmgate-or::after{content:"";flex:1;height:1px;background:var(--line)}
.lmgate-google{width:100%;padding:13px 18px;border:1px solid var(--line);border-radius:2px;
  background:#fff;font:inherit;font-size:12px;letter-spacing:.14em;text-transform:uppercase;
  color:var(--ink);cursor:pointer;transition:border-color .18s}
.lmgate-google:hover{border-color:var(--ink)}
.lmgate-google:disabled{opacity:.5;cursor:default}
`;

export const GATE_CSS = AUTH_CSS + GATE_ONLY;
