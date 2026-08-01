// Account page styles. Layout mirrors mlg-site (navy hero → two-column grid with
// a sticky sidebar) but rendered in LiveModern's design language: Playfair serif
// headings (var(--font-display)), hairline cards, 2px radius, generous white
// space, navy/teal. Injected alongside AUTH_CSS which supplies the base
// eyebrow/serif/auth-btn primitives.
export const ACCOUNT_CSS = `
/* ── hero ─────────────────────────────────────────────────────────── */
.acct-hero{background:var(--navy);color:#fff}
.acct-hero-in{display:flex;align-items:center;gap:26px;padding:clamp(34px,6vw,60px) var(--pad)}
.acct-avatar{width:74px;height:74px;border-radius:50%;flex-shrink:0;display:grid;place-items:center;
  background:var(--accent);color:var(--navy);font-family:var(--font-display),Georgia,serif;font-size:28px;font-weight:600;letter-spacing:.02em}
.acct-hero-eyebrow{font-size:10.5px;letter-spacing:.26em;text-transform:uppercase;color:rgba(255,255,255,.55);margin:0 0 8px}
.acct-hero-h1{font-family:var(--font-display),Georgia,serif;font-size:clamp(30px,4.6vw,48px);line-height:1.03;margin:0;letter-spacing:-.01em;color:#fff}
.acct-hero-h1 em{font-style:italic;color:var(--accent)}
.acct-hero-sub{margin:12px 0 0;font-size:13.5px;color:rgba(255,255,255,.62)}

/* ── grid ─────────────────────────────────────────────────────────── */
.acct-grid{display:grid;grid-template-columns:1fr;gap:40px;padding:clamp(34px,5vw,60px) 0 96px}
@media(min-width:920px){.acct-grid{grid-template-columns:1fr 330px;gap:56px;align-items:start}}
.acct-main{display:grid;gap:52px;min-width:0}
.acct-block{min-width:0}
.acct-sec-head{display:flex;align-items:baseline;gap:12px;margin-bottom:22px;border-bottom:1px solid var(--line);padding-bottom:14px}
.acct-sec-head h2{font-family:var(--font-display),Georgia,serif;font-size:clamp(22px,2.6vw,28px);margin:0;font-weight:500;letter-spacing:-.01em}
.acct-count{font-size:12px;color:var(--muted);font-weight:500}

/* empty states */
.acct-empty{color:var(--muted);font-size:14px}
.acct-empty-card{border:1px solid var(--line);border-radius:2px;padding:34px 28px;text-align:center;background:#fbfbfa}
.acct-empty-card .serif{font-family:var(--font-display),Georgia,serif;font-size:20px;color:var(--navy);margin:0 0 8px}
.acct-empty-card p:not(.serif){color:var(--muted);font-size:14px;line-height:1.65;max-width:38ch;margin:0 auto}
.acct-cta{display:inline-block;margin-top:16px;font-size:12.5px;letter-spacing:.04em;text-transform:uppercase;color:var(--accent)}
.acct-cta:hover{opacity:.7}

/* saved searches */
.acct-searches{display:grid;gap:2px}
.acct-search{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:18px 0;border-bottom:1px solid var(--line)}
.acct-search:last-child{border-bottom:none}
.acct-search-main{min-width:0}
.acct-search-name{font-size:16px;color:#111;font-weight:500}
.acct-search-sub{font-size:12.5px;color:var(--muted);margin-top:3px;text-transform:capitalize}
.acct-search-actions{display:flex;align-items:center;gap:14px;flex-shrink:0}
.acct-run{font-size:11.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--accent);white-space:nowrap}
.acct-run:hover{opacity:.7}

/* saved homes */
.acct-homes{display:grid;grid-template-columns:1fr;gap:16px}
@media(min-width:560px){.acct-homes{grid-template-columns:1fr 1fr}}
.acct-home{position:relative;display:flex;flex-direction:column;border:1px solid var(--line);border-radius:2px;overflow:hidden;background:#fff}
.acct-home-img{display:block;aspect-ratio:3/2;background:#eef0f2;overflow:hidden}
.acct-home-img img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .4s ease}
.acct-home:hover .acct-home-img img{transform:scale(1.03)}
.acct-home-noimg{width:100%;height:100%;background:#eef0f2}
.acct-home-body{padding:14px 16px 16px}
.acct-home-price{display:block;font-family:var(--font-display),Georgia,serif;font-size:21px;color:var(--navy);line-height:1.1}
.acct-home-addr{font-size:13px;color:#222;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.acct-home-sub{font-size:12px;color:var(--muted);margin-top:1px}
.acct-home-specs{font-size:11.5px;color:#8a8f98;letter-spacing:.02em;margin-top:9px}

/* remove control (shared) */
.acct-x{width:26px;height:26px;border:none;border-radius:50%;background:none;color:#9aa0a8;font-size:19px;line-height:1;cursor:pointer;display:grid;place-items:center;flex-shrink:0}
.acct-x:hover{color:#b0554a}
.acct-x-float{position:absolute;top:8px;right:8px;background:rgba(255,255,255,.92)}
.acct-x-float:hover{background:#fff}

/* ── sidebar ──────────────────────────────────────────────────────── */
.acct-side{display:grid;gap:20px}
@media(min-width:920px){.acct-side{position:sticky;top:96px}}
.acct-card{border:1px solid var(--line);border-radius:2px;padding:24px 22px;background:#fff}
.acct-card-head{display:flex;align-items:baseline;justify-content:space-between;gap:16px;margin-bottom:14px}
.acct-card-head h3{font-family:var(--font-display),Georgia,serif;font-size:19px;font-weight:500;margin:0}
.acct-link{background:none;border:none;padding:0;font:inherit;font-size:12px;letter-spacing:.06em;color:var(--accent);cursor:pointer;text-transform:uppercase}
.acct-link:hover{opacity:.7}
.acct-saved{margin-top:12px;font-size:13px;color:#2a9c68}

/* details rows */
.acct-row{display:flex;justify-content:space-between;gap:16px;padding:11px 0;border-bottom:1px solid #f0f0ee;font-size:14px}
.acct-row:last-of-type{border-bottom:none}
.acct-row>span:first-child{color:var(--muted);font-size:12.5px}
.acct-row>span:last-child{color:#111;text-align:right;min-width:0;word-break:break-word}

/* details edit */
.acct-edit{display:grid;gap:15px}
.acct-edit label{display:grid;gap:5px}
.acct-edit label>span{font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
.acct-edit input,.acct-edit select{font:inherit;font-size:14.5px;padding:8px 0;border:none;border-bottom:1px solid var(--line);background:none;color:#111}
.acct-edit input:focus,.acct-edit select:focus{outline:none;border-bottom-color:var(--accent)}
.acct-check{grid-template-columns:auto 1fr;align-items:start;gap:10px!important}
.acct-check input{width:16px;height:16px;margin-top:2px}
.acct-check>span{font-size:12px;color:var(--muted);letter-spacing:0;text-transform:none;line-height:1.5}
.acct-actions{display:flex;align-items:center;gap:16px;margin-top:4px}
.acct-actions .auth-btn{width:auto;margin:0;padding-left:26px;padding-right:26px}

/* team card */
.acct-team{background:#fbfbfa}
.acct-team-eyebrow{font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:var(--accent);margin:0 0 8px;font-weight:600}
.acct-team-name{font-family:var(--font-display),Georgia,serif;font-size:20px;color:var(--navy);margin:0}
.acct-team-copy{font-size:13px;color:var(--muted);line-height:1.65;margin:10px 0 0}
.acct-team-actions{display:flex;flex-direction:column;gap:12px;margin-top:16px}
.acct-team-call{width:100%;margin:0;text-align:center}

.acct-signout{background:none;border:1px solid var(--line);border-radius:2px;padding:12px;font:inherit;font-size:13px;letter-spacing:.04em;color:var(--muted);cursor:pointer;text-transform:uppercase}
.acct-signout:hover{border-color:#c9ccd1;color:#333}
`;

// appended: resolved-agent card head (photo + name + title)
export const AGENT_CSS = `
.acct-agent-head{display:flex;align-items:center;gap:14px;margin-bottom:14px}
.acct-agent-photo{width:56px;height:56px;border-radius:50%;object-fit:cover;object-position:top center;flex-shrink:0}
.acct-agent-ph{display:grid;place-items:center;background:var(--navy);color:#fff;font-family:var(--font-display),Georgia,serif;font-size:18px}
.acct-agent-title{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-top:3px}
`;
