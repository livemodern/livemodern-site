// Styles for /search — the county-wide search in LiveModern's design language:
// hairline controls, serif prices, navy/teal, generous white space. Injected by
// the server shell so it's present on first paint.
export const SEARCH_CSS = `
.srch-top{padding:clamp(28px,5vw,52px) var(--pad) 20px}
.srch-h1{font-family:var(--font-display),Georgia,serif;font-size:clamp(30px,5vw,52px);line-height:1.02;margin-top:14px;letter-spacing:-.01em}
.srch-lede{margin-top:14px;max-width:56ch;color:var(--muted);font-size:15px;line-height:1.6}

/* filter bar */
.srch-bar{position:sticky;top:0;z-index:40;background:#fff;border-top:1px solid var(--line);border-bottom:1px solid var(--line);padding:12px 0}
.srch-bar-in{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.srch-toggle{display:inline-flex;border:1px solid var(--line);border-radius:2px;overflow:hidden;flex-shrink:0}
.srch-toggle button{border:none;background:#fff;font:inherit;font-size:13px;padding:9px 16px;cursor:pointer;color:var(--muted)}
.srch-toggle button.on{background:var(--navy);color:#fff}
.srch-loc{position:relative;flex:1 1 280px;min-width:220px}
.srch-loc input{width:100%;border:1px solid var(--line);border-radius:2px;padding:10px 14px;font:inherit;font-size:14px;background:#fff}
.srch-loc input:focus{outline:none;border-color:var(--accent)}
.srch-chip{display:flex;align-items:center;gap:10px;border:1px solid var(--navy);border-radius:2px;padding:9px 12px;font-size:14px;background:#fbfbfa}
.srch-chip button{border:none;background:none;font-size:18px;line-height:1;color:var(--muted);cursor:pointer;padding:0}
.srch-chip button:hover{color:#b0554a}
.srch-sug{position:absolute;top:calc(100% + 4px);left:0;right:0;background:#fff;border:1px solid var(--line);border-radius:2px;box-shadow:0 12px 40px rgba(13,23,59,.1);z-index:50;max-height:340px;overflow:auto}
.srch-sug button{display:flex;align-items:baseline;justify-content:space-between;gap:12px;width:100%;border:none;background:none;text-align:left;padding:11px 14px;font:inherit;cursor:pointer;border-bottom:1px solid #f2f2f0}
.srch-sug button:last-child{border-bottom:none}
.srch-sug button:hover{background:#f7f9fb}
.srch-sug-name{font-size:14px;color:#111}
.srch-sug-meta{font-size:11px;color:var(--muted);text-transform:capitalize;white-space:nowrap}
.srch-sel{border:1px solid var(--line);border-radius:2px;padding:9px 10px;font:inherit;font-size:13px;background:#fff;cursor:pointer;flex-shrink:0}
.srch-sel:focus{outline:none;border-color:var(--accent)}
.srch-more{border:1px solid var(--line);border-radius:2px;padding:9px 16px;font:inherit;font-size:13px;background:#fff;cursor:pointer;flex-shrink:0}
.srch-more:hover{border-color:#c9ccd1}
.srch-more-panel{display:flex;flex-wrap:wrap;gap:20px;padding-top:14px;margin-top:12px;border-top:1px solid var(--line)}
.srch-more-panel label{display:grid;gap:5px}
.srch-more-panel label>span{font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
.srch-more-panel input,.srch-more-panel select{border:1px solid var(--line);border-radius:2px;padding:8px 10px;font:inherit;font-size:14px;min-width:120px}
.srch-more-panel .srch-kw{flex:1 1 260px}
.srch-more-panel .srch-kw input{width:100%}

/* results header */
.srch-head{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;padding-top:24px;padding-bottom:18px}
.srch-count{font-size:15px;color:#333}
.srch-count strong{font-weight:500;color:var(--navy)}
.srch-head-right{display:flex;align-items:center;gap:14px}
.srch-save{border:1px solid var(--line);border-radius:999px;background:#fff;font:inherit;font-size:12.5px;padding:8px 16px;cursor:pointer;color:#333;white-space:nowrap}
.srch-save:hover{border-color:#c9ccd1}
.srch-save.is-saved{color:var(--accent);border-color:#a7dfe8}
.srch-sort{border:1px solid var(--line);border-radius:2px;padding:8px 10px;font:inherit;font-size:13px;background:#fff;cursor:pointer}

/* grid */
.srch-grid{display:grid;grid-template-columns:1fr;gap:22px}
@media(min-width:560px){.srch-grid{grid-template-columns:1fr 1fr}}
@media(min-width:960px){.srch-grid{grid-template-columns:1fr 1fr 1fr}}
.srch-card{display:block;background:#fff}
.srch-card-im{aspect-ratio:3/2;background:#eef0f2;overflow:hidden;border-radius:2px}
.srch-card-im img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .5s ease}
.srch-card:hover .srch-card-im img{transform:scale(1.04)}
.srch-card-noim{width:100%;height:100%;background:#eef0f2}
.srch-card-bd{padding:12px 2px 4px}
.srch-card-p{font-family:var(--font-display),Georgia,serif;font-size:22px;color:var(--navy);line-height:1.1}
.srch-mo{font-family:var(--font-body,inherit);font-size:12px;color:var(--muted);margin-left:4px}
.srch-card-a{font-size:14px;color:#222;margin-top:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.srch-card-sub{font-size:12.5px;color:var(--muted);margin-top:1px}
.srch-card-s{display:flex;gap:14px;font-size:12px;color:#8a8f98;margin-top:9px;letter-spacing:.02em}
.srch-empty{color:var(--muted);font-size:15px;padding:40px 0}
.srch-more-wrap{display:flex;justify-content:center;margin:44px 0 0}
.srch-loadmore{border:1px solid var(--navy);background:#fff;color:var(--navy);border-radius:2px;padding:13px 34px;font:inherit;font-size:13px;letter-spacing:.04em;text-transform:uppercase;cursor:pointer}
.srch-loadmore:hover{background:var(--navy);color:#fff}
.srch-loadmore:disabled{opacity:.5;cursor:default}
`;

// appended: split map/results layout, markers, mobile toggle
export const SEARCH_MAP_CSS = `
.srch-split{display:flex;align-items:flex-start;gap:0;max-width:1640px;margin:0 auto}
.srch-results{flex:1 1 56%;min-width:0;padding:0 var(--pad) 48px}
.srch-split.no-map .srch-results{flex-basis:100%}
.srch-map{flex:0 0 44%;position:sticky;top:66px;height:calc(100vh - 66px);align-self:flex-start;background:#eef0f2}
.srch-map-canvas{width:100%;height:100%}
.srch-split.no-map .srch-map{display:none}
/* narrower results column → 2-up cards, 3-up only when very wide */
/* In split (map) mode, keep results to 2 columns so cards stay large and the
   third never gets cramped/cut under the map. 3-up only when the map is off. */
.srch-split .srch-grid{grid-template-columns:1fr 1fr}
@media(max-width:1100px){.srch-split .srch-grid{grid-template-columns:1fr}}
.srch-split.no-map .srch-grid{grid-template-columns:1fr 1fr 1fr}

.srch-card.is-active{outline:2px solid var(--accent);outline-offset:3px;border-radius:3px}

/* price-pill markers */
.srch-mk{background:var(--navy);color:#fff;font-family:system-ui,sans-serif;font-weight:600;font-size:12px;line-height:1;padding:5px 9px;border-radius:999px;border:1.5px solid #fff;box-shadow:0 2px 8px rgba(13,23,59,.35);cursor:pointer;white-space:nowrap}
.srch-mk:hover,.srch-mk-on{background:var(--accent);color:#08202a;z-index:6}
.mapboxgl-ctrl-group{border-radius:2px;box-shadow:0 1px 6px rgba(13,23,59,.18)}

/* mobile: stack + list/map toggle */
.srch-mobile-toggle{display:none}
@media(max-width:959px){
  .srch-split{display:block}
  .srch-results{flex-basis:auto;padding-bottom:96px}
  .srch-map{position:fixed;left:0;right:0;top:110px;bottom:0;height:auto;z-index:30;display:none}
  .srch-split.mv-map .srch-map{display:block}
  .srch-split.mv-map .srch-results{display:none}
  .srch-split .srch-grid{grid-template-columns:1fr}
  .srch-mobile-toggle{display:inline-flex;align-items:center;gap:8px;position:fixed;left:50%;transform:translateX(-50%);bottom:22px;z-index:60;background:var(--navy);color:#fff;border:none;border-radius:999px;padding:12px 26px;font:inherit;font-size:14px;letter-spacing:.04em;box-shadow:0 6px 22px rgba(13,23,59,.4);cursor:pointer}
}
@media(min-width:560px) and (max-width:959px){.srch-split .srch-grid{grid-template-columns:1fr 1fr}}
`;
