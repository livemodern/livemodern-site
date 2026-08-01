// Scoped styles for the account page. Injected alongside AUTH_CSS so the shell,
// eyebrow, serif h1, auth-lede, acct-card, acct-row, and auth-btn primitives are
// shared with /login; this file only adds the saved-homes / saved-searches /
// editable-details pieces.
export const ACCOUNT_CSS = `
.acct-wide{max-width:760px}
.acct-card-head{display:flex;align-items:baseline;justify-content:space-between;gap:16px;margin-bottom:6px}
.acct-card-head h2{margin:0}
.acct-count{font-style:normal;font-size:12px;font-weight:500;color:#8a8f98;margin-left:6px}
.acct-link{background:none;border:none;padding:0;font:inherit;font-size:12.5px;letter-spacing:.04em;color:var(--accent);cursor:pointer;text-transform:uppercase}
.acct-link:hover{opacity:.7}
.acct-danger{color:#b0554a}
.acct-saved{margin-top:12px;font-size:13px;color:#2a9c68}
.acct-empty{color:var(--muted);font-size:14px;line-height:1.6}
.acct-empty a{color:var(--accent)}

/* editable details */
.acct-edit{display:grid;gap:16px;margin-top:6px}
.acct-edit label{display:grid;gap:6px}
.acct-edit label>span{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
.acct-edit input,.acct-edit select{font:inherit;font-size:15px;padding:9px 0;border:none;border-bottom:1px solid var(--line);background:none;color:#111}
.acct-edit input:focus,.acct-edit select:focus{outline:none;border-bottom-color:var(--accent)}
.acct-check{grid-template-columns:auto 1fr;align-items:start;gap:10px!important}
.acct-check input{width:16px;height:16px;margin-top:2px}
.acct-check>span{font-size:12.5px;color:var(--muted);letter-spacing:0;text-transform:none;line-height:1.5}
.acct-actions{display:flex;align-items:center;gap:18px;margin-top:4px}
.acct-actions .auth-btn{width:auto;padding-left:34px;padding-right:34px;margin:0}

/* saved homes */
.acct-homes{display:grid;gap:14px;margin-top:4px}
@media(min-width:560px){.acct-homes{grid-template-columns:1fr 1fr}}
.acct-home{position:relative;display:grid;grid-template-columns:104px 1fr;gap:14px;align-items:stretch;border:1px solid var(--line);border-radius:2px;overflow:hidden;background:#fff}
.acct-home-img{display:block;background:#eef0f2}
.acct-home-img img{width:104px;height:100%;min-height:104px;object-fit:cover;display:block}
.acct-home-noimg{width:104px;height:100%;min-height:104px;background:#eef0f2}
.acct-home-body{padding:12px 34px 12px 0;min-width:0}
.acct-home-price{display:block;font-size:19px;color:var(--navy);line-height:1.1}
.acct-home-addr{font-size:13px;color:#222;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.acct-home-sub{font-size:12px;color:var(--muted);margin-top:1px}
.acct-home-specs{font-size:11.5px;color:#8a8f98;letter-spacing:.02em;margin-top:6px}
.acct-unsave{position:absolute;top:6px;right:6px;width:24px;height:24px;border:none;border-radius:50%;background:rgba(255,255,255,.9);color:#555;font-size:17px;line-height:1;cursor:pointer;display:grid;place-items:center}
.acct-unsave:hover{background:#fff;color:#b0554a}

/* saved searches */
.acct-searches{display:grid;gap:2px;margin-top:2px}
.acct-search{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:14px 0;border-bottom:1px solid var(--line)}
.acct-search:last-child{border-bottom:none}
.acct-search-name{font-size:15px;color:#111;font-weight:500}
.acct-search-sub{font-size:12.5px;color:var(--muted);margin-top:2px;text-transform:capitalize}
.acct-search-actions{display:flex;align-items:center;gap:16px;flex-shrink:0}

.acct-signout{margin-top:8px}

`;

