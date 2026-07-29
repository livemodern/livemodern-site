<!-- CANONICAL MEMORY POINTER — keep at the top of this file -->
# ⚠️ Read the shared memory first

Platform knowledge is **not** kept in this repo. It lives once, in
**`livemodern/mlg-admin` → `docs/memory/`**, so every repo and every session
shares the same notes.

| Need | Read |
|---|---|
| **Session start** | `mlg-admin` `docs/memory/INDEX.md` (~4KB, routing table) |
| **Before ANY db write, sync, backfill or migration** | `docs/memory/TRAPS.md` — every entry already shipped here, and most report success while corrupting data |
| A verified command | `docs/memory/RUNBOOK.md` |
| A settled decision | `docs/memory/DECISIONS.md` |
| Open TODOs / known bugs | `docs/memory/ROADMAP.md` |
| Designing something new | `docs/memory/REBUILD.md` |
| Architecture / infra / state | `docs/MLG_PLATFORM_MASTER.md` §1–§9 |

**Write new notes there, not here.** Repo-specific build instructions below.

---

## This repo

See `README.md` for app structure. Commit identity is always
`Patrick Lafferty <patrick@modernlivingre.com>` — Vercel blocks mismatches.
Verify every push reaches Vercel `READY` before calling it done.
