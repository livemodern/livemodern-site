// Styles for /search — a locked, full-viewport search app in LiveModern's design
// language: hairline controls, serif prices, navy/teal. Header + filter bar are
// fixed rows at the top; the results list scrolls inside its own pane; the map is
// pinned. No page scroll. Injected by the server shell so it's present first paint.
export const SEARCH_CSS = `
.srch-app{height:100vh;height:100dvh;display:flex;flex-direction:column;overflow:hidden;background:#fff}
.srch-app .masthead{flex-shrink:0}

.srch-bar{flex-shrink:0;background:#fff;border-bottom:1px solid var(--line);padding:11px var(--pad)}
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
.srch-sug{position:absolute;top:calc(100% + 4px);left:0;right:0;background:#fff;border:1px solid var(--line);border-radius:2px;box-shadow:0 12px 40px rgba(13,23,59,.12);z-index:60;max-height:340px;overflow:auto}
.srch-sug button{display:flex;align-items:baseline;justify-content:space-between;gap:12px;width:100%;border:none;background:none;text-align:left;padding:11px 14px;font:inherit;cursor:pointer;border-bottom:1px solid #f2f2f0}
.srch-sug button:last-child{border-bottom:none}
.srch-sug button:hover{background:#f7f9fb}
.srch-sug-name{font-size:14px;color:#111}
.srch-sug-meta{font-size:11px;color:var(--muted);text-transform:capitalize;white-space:nowrap}
.srch-sel{border:1px solid var(--line);border-radius:2px;padding:9px 10px;font:inherit;font-size:13px;background:#fff;cursor:pointer;flex-shrink:0}
.srch-sel:focus{outline:none;border-color:var(--accent)}
.srch-more{border:1px solid var(--line);border-radius:2px;padding:9px 16px;font:inherit;font-size:13px;background:#fff;cursor:pointer;flex-shrink:0}
.srch-more:hover{border-color:#c9ccd1}
.srch-more-panel{display:flex;flex-wrap:wrap;gap:16px 20px;padding-top:14px;margin-top:11px;border-top:1px solid var(--line)}
.srch-more-panel label{display:grid;gap:5px}
.srch-more-panel label>span{font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
.srch-more-panel input,.srch-more-panel select{border:1px solid var(--line);border-radius:2px;padding:8px 10px;font:inherit;font-size:14px;min-width:118px}
.srch-more-panel .srch-kw{flex:1 1 240px}
.srch-more-panel .srch-kw input{width:100%}

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
.srch-more-wrap{display:flex;justify-content:center;margin:36px 0 8px}
.srch-loadmore{border:1px solid var(--navy);background:#fff;color:var(--navy);border-radius:2px;padding:12px 32px;font:inherit;font-size:13px;letter-spacing:.04em;text-transform:uppercase;cursor:pointer}
.srch-loadmore:hover{background:var(--navy);color:#fff}
.srch-loadmore:disabled{opacity:.5;cursor:default}
`;

export const SEARCH_MAP_CSS = `
.srch-body{flex:1;min-height:0;display:flex;overflow:hidden}

.srch-results{flex:1 1 56%;min-width:0;display:flex;flex-direction:column;min-height:0;border-right:1px solid var(--line)}
.srch-body.no-map .srch-results{flex-basis:100%;border-right:none}
.srch-results-head{flex-shrink:0;display:flex;align-items:center;justify-content:space-between;gap:14px;padding:11px var(--pad);border-bottom:1px solid var(--line)}
.srch-count{font-size:14px;color:#333;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.srch-count strong{font-weight:500;color:var(--navy)}
.srch-head-right{display:flex;align-items:center;gap:12px;flex-shrink:0}
.srch-save{border:1px solid var(--line);border-radius:999px;background:#fff;font:inherit;font-size:12.5px;padding:8px 15px;cursor:pointer;color:#333;white-space:nowrap}
.srch-save:hover{border-color:#c9ccd1}
.srch-save.is-saved{color:var(--accent);border-color:#a7dfe8}
.srch-sort{border:1px solid var(--line);border-radius:2px;padding:8px 10px;font:inherit;font-size:13px;background:#fff;cursor:pointer}

.srch-scroll{flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;padding:20px var(--pad) 44px}

.srch-grid{display:grid;grid-template-columns:1fr 1fr;gap:22px}
@media(max-width:1180px){.srch-grid{grid-template-columns:1fr}}
.srch-body.no-map .srch-grid{grid-template-columns:repeat(auto-fill,minmax(260px,1fr))}

.srch-card.is-active .srch-card-im{box-shadow:0 0 0 2px var(--accent)}

.srch-map{flex:1 1 44%;min-width:0;min-height:0;background:#eef0f2;position:relative}
.srch-map-canvas{position:absolute;inset:0;width:100%;height:100%}
.srch-body.no-map .srch-map{display:none}

.srch-mk{background:var(--navy);color:#fff;font-family:system-ui,sans-serif;font-weight:600;font-size:12px;line-height:1;padding:5px 9px;border-radius:999px;border:1.5px solid #fff;box-shadow:0 2px 8px rgba(13,23,59,.35);cursor:pointer;white-space:nowrap}
.srch-mk:hover,.srch-mk-on{background:var(--accent);color:#08202a;z-index:6}
.mapboxgl-ctrl-group{border-radius:2px;box-shadow:0 1px 6px rgba(13,23,59,.18)}

.srch-mobile-toggle{display:none}
@media(max-width:959px){
  .srch-body{position:relative}
  .srch-results{flex-basis:100%;border-right:none}
  .srch-map{position:absolute;inset:0;z-index:5;display:none}
  .srch-body.mv-map .srch-map{display:block}
  .srch-body.mv-map .srch-results{display:none}
  .srch-grid{grid-template-columns:1fr}
  .srch-mobile-toggle{display:inline-flex;align-items:center;gap:8px;position:fixed;left:50%;transform:translateX(-50%);bottom:22px;z-index:60;background:var(--navy);color:#fff;border:none;border-radius:999px;padding:12px 26px;font:inherit;font-size:14px;letter-spacing:.04em;box-shadow:0 6px 22px rgba(13,23,59,.4);cursor:pointer}
}
@media(min-width:620px) and (max-width:959px){.srch-grid{grid-template-columns:1fr 1fr}}
`;
