# LiveModern — Site

The new LiveModern platform (South Florida luxury real estate) on the shared
Modern Living Group stack: **Next.js (App Router) + Supabase + Cloudflare R2 + Vercel**.

This is the **v0 scaffold** — a sharp, minimalist landing for the staging domain.
Real design and content land next.

## Deploy on Vercel
1. Vercel → **Add New → Project** → import `livemodern/livemodern-site`.
2. Framework preset auto-detects **Next.js**. No env vars are needed to build the scaffold.
3. Deploy. Attach **sellmodernhome.com** under *Settings → Domains* once DNS is live.

## Local dev
```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

## Stack (shared platform)
- **DB / Auth / CRM:** shared Supabase (`ezcikavnfchqaenweygw`), scoped by `site_id = livemodern`
- **Images:** Cloudflare R2 bucket `livemodern-assets` (path-preserving `uploads/...`)
- **MLS:** Trestle / BeachesMLS (county gate widens to Miami-Dade + Broward)
- **Hosting:** Vercel (team `modern-living-group`)

Env vars are added at the design/build phase; the scaffold builds without them.
Staging is `noindex` until cutover to `livemodern.com`.
