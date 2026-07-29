// Styles for /login and /account. Injected via
// <style dangerouslySetInnerHTML> — never <style>{CSS}</style>, which SSR
// HTML-escapes and hydration-mismatches the whole tree.
export const AUTH_CSS = `
.auth-shell{max-width:520px;margin:0 auto;padding:56px 0 96px}
.auth-shell h1{font-family:var(--font-display),Georgia,serif;font-weight:400;
  font-size:clamp(30px,4.4vw,44px);line-height:1.08;margin:14px 0 10px}
.auth-shell h1 em{font-style:italic;color:var(--accent)}
.auth-lede{font-size:14px;line-height:1.75;color:var(--muted);margin:0 0 26px}
.auth-tabs{display:flex;gap:0;border-bottom:1px solid var(--line);margin-bottom:26px}
.auth-tab{flex:1;background:none;border:none;padding:12px 6px;font:inherit;font-size:12px;
  letter-spacing:.16em;text-transform:uppercase;color:var(--muted);cursor:pointer;
  border-bottom:2px solid transparent;transition:color .18s,border-color .18s}
.auth-tab[aria-selected="true"]{color:var(--ink);border-bottom-color:var(--accent)}
.auth-row{display:grid;gap:14px;grid-template-columns:1fr 1fr}
@media(max-width:520px){.auth-row{grid-template-columns:1fr}}
.auth-field{display:block;margin-bottom:14px}
.auth-field span{display:block;font-size:11px;letter-spacing:.14em;text-transform:uppercase;
  color:var(--muted);margin-bottom:6px}
.auth-field input,.auth-field select{width:100%;box-sizing:border-box;padding:12px 13px;
  border:1px solid var(--line);border-radius:2px;background:#fff;color:var(--ink);
  /* 16px minimum or iOS zooms the viewport on focus */
  font:inherit;font-size:16px}
.auth-field input:focus,.auth-field select:focus{outline:none;border-color:var(--accent)}
.auth-consent{display:flex;gap:10px;align-items:flex-start;margin:18px 0 6px}
.auth-consent input{margin-top:3px;width:16px;height:16px;flex:0 0 auto;accent-color:var(--accent)}
.auth-consent label{font-size:11.5px;line-height:1.6;color:var(--muted)}
.auth-consent a{color:var(--accent)}
.auth-btn{width:100%;margin-top:18px;padding:14px 18px;border:none;border-radius:2px;
  background:var(--navy,#0D173B);color:#fff;font:inherit;font-size:12px;letter-spacing:.18em;
  text-transform:uppercase;cursor:pointer;transition:opacity .18s}
.auth-btn:hover{opacity:.88}
.auth-btn:disabled{opacity:.5;cursor:default}
.auth-alt{margin-top:16px;text-align:center;font-size:12.5px;color:var(--muted)}
.auth-alt button{background:none;border:none;padding:0;font:inherit;font-size:12.5px;
  color:var(--accent);cursor:pointer;text-decoration:underline;text-underline-offset:3px}
.auth-err{margin:16px 0 0;padding:11px 13px;border-left:2px solid #c0392b;background:#fdf3f2;
  font-size:12.5px;line-height:1.6;color:#7d2519}
.auth-ok{margin:16px 0 0;padding:11px 13px;border-left:2px solid var(--accent);background:#f1fbfd;
  font-size:12.5px;line-height:1.6;color:#0b5563}
.auth-fine{margin-top:22px;font-size:11px;line-height:1.7;color:var(--muted)}
.acct-card{border:1px solid var(--line);padding:22px;margin-bottom:16px}
.acct-card h2{font-family:var(--font-display),Georgia,serif;font-weight:400;font-size:20px;margin:0 0 12px}
.acct-row{display:flex;justify-content:space-between;gap:16px;padding:8px 0;
  border-bottom:1px solid var(--line);font-size:13.5px}
.acct-row:last-child{border-bottom:none}
.acct-row span:first-child{color:var(--muted)}
`;
