import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { slugifyListing } from '@/lib/listing-slug'

// On-demand ISR revalidation for livemodern.com.
//
// Callers:
//   - TCP Trestle sync (bmb-delta) — sends `mlsIds` for the listings that
//     actually changed in that run so the corresponding /listing/{slug}
//     PDPs refresh instantly instead of waiting out the page's ISR window.
//   - TCP reconcile-active — sends `mlsIds` for listings that were flipped
//     to Withdrawn / repaired-Closed / status-corrected. A status flip is
//     a material change; without this ping the page still says "Active"
//     until the page ISR window expires.
//   - Future: mlg-admin CMS saves for livemodern-owned pages can send
//     `paths` or `tags` here directly.
//
// URL resolution (Patrick 2026-08-21 — subtle bug fix):
// Every /listing/{bare_mls_id} URL 308-redirects to /listing/{seo_slug}
// via permanentRedirect() in app/listing/[mls]/page.tsx. That means those
// are TWO SEPARATE cache entries — the bare URL caches the 308 response,
// the slug URL caches the actual HTML. The previous version of this
// route only revalidated the bare URL, so a status change pushed here
// invalidated the redirect but not the page visitors actually see. With
// the listing PDP now `revalidate: false` (livemodern-site commit
// 8eeb2c9), a stale slug URL would persist indefinitely until the next
// material change re-triggered this path.
//
// Fix: resolve each mls_id to its slug via a Supabase lookup of the
// address fields (mirrors mlg-site's /api/revalidate) and call
// revalidatePath on BOTH the bare URL and the slug URL. Chunked at 250
// per query to keep PostgREST URL lengths sane.
//
// Auth: bearer against shared cross-project secrets already present on
// this Vercel project (MLG_SERVICE_TOKEN is confirmed set — used by
// /api/mila, /api/register/verify, lib/spam-check-client.ts, and
// lib/route-lead-client.ts).

export const dynamic = 'force-dynamic'
export const maxDuration = 20

// Cap 500 per request — a delta run medians ~200 changed listings and the
// TCP helper de-dupes + chunks. This is a hard ceiling, not the expected
// batch size. Larger runs (nightly full sync, bulk imports) rely on the
// 7-day safety net rather than trying to push thousands at once.
const MAX_MLS_IDS = 500
const MAX_PATHS = 500
const MAX_TAGS = 20
const LOOKUP_CHUNK = 250

const SB_URL = process.env.SUPABASE_URL ?? 'https://ezcikavnfchqaenweygw.supabase.co'
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

// mls_id → slug. Only ids the properties table actually holds land here;
// unresolved ids are reported as `missing` in the response so a caller
// can spot a partial failure (usually a race with the TCP upsert).
async function resolveSlugs(mlsIds: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>()
  if (!SB_KEY || mlsIds.length === 0) return out
  const COLS = 'mls_id,street_address,unit_number,city,state,zip'
  for (let i = 0; i < mlsIds.length; i += LOOKUP_CHUNK) {
    const chunk = mlsIds.slice(i, i + LOOKUP_CHUNK).map(encodeURIComponent).join(',')
    try {
      const res = await fetch(
        `${SB_URL}/rest/v1/properties?mls_id=in.(${chunk})&select=${COLS}`,
        {
          headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
          cache: 'no-store',
          signal: AbortSignal.timeout(8_000),
        }
      )
      if (!res.ok) continue
      const rows = await res.json() as any[]
      for (const row of rows) {
        const slug = slugifyListing(row)
        if (slug) out.set(String(row.mls_id), slug)
      }
    } catch (e: any) {
      console.warn(`[revalidate] slug lookup chunk ${i} failed: ${e?.message || e}`)
    }
  }
  return out
}

export async function POST(req: NextRequest) {
  const bearer = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
  const accepted = [
    process.env.MLG_SERVICE_TOKEN,
    process.env.SYNC_SECRET,
    process.env.CRON_SECRET,
  ].filter(Boolean) as string[]
  if (!bearer || !accepted.includes(bearer)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  let body: any = {}
  try { body = await req.json() } catch { /* empty body ok */ }

  // Path safety filter mirrors mlg-site's revalidate route: must start
  // with `/`, no `..` traversal. Prevents a compromised caller from
  // asking us to purge arbitrary URLs.
  const paths: string[] = (Array.isArray(body?.paths) ? body.paths : [])
    .filter((p: any) => typeof p === 'string' && p.startsWith('/') && !p.includes('..'))
    .slice(0, MAX_PATHS)
  const tags: string[] = (Array.isArray(body?.tags) ? body.tags : [])
    .filter((t: any) => typeof t === 'string' && /^sb(:[A-Za-z0-9_]+)?$/.test(t))
    .slice(0, MAX_TAGS)
  const mlsIds: string[] = (Array.isArray(body?.mlsIds) ? body.mlsIds : [])
    .filter((v: any) => typeof v === 'string' || typeof v === 'number')
    .map((v: any) => String(v).trim())
    .filter((v: string) => /^[A-Za-z0-9_-]{1,64}$/.test(v))
    .slice(0, MAX_MLS_IDS)

  for (const t of tags) {
    try { revalidateTag(t) } catch { /* non-fatal */ }
  }
  for (const p of paths) {
    try { revalidatePath(p) } catch { /* non-fatal */ }
  }

  // Listing PDPs 308-redirect from bare mls_id → slug. Two cache entries
  // per listing; both must be invalidated so visitors see fresh content
  // no matter which URL they arrive on.
  let listings = 0
  let missing  = 0
  const uniqueIds = Array.from(new Set(mlsIds))
  const slugMap = uniqueIds.length ? await resolveSlugs(uniqueIds) : new Map<string, string>()

  for (const id of uniqueIds) {
    const slug = slugMap.get(id)
    let touched = false
    try {
      revalidatePath(`/listing/${id}`) // bare URL (mostly the 308 response)
      touched = true
    } catch { /* non-fatal */ }
    if (slug && slug !== id) {
      try {
        revalidatePath(`/listing/${slug}`) // slug URL — what visitors see
        touched = true
      } catch { /* non-fatal */ }
    } else if (!slug) {
      // Slug lookup didn't return this row. Either the id truly isn't
      // in the properties table yet (race with TCP upsert) or the
      // service-key query failed. Either way, only the bare URL got
      // revalidation this cycle.
      missing++
    }
    if (touched) listings++
  }

  return NextResponse.json({
    ok: true,
    revalidated: {
      paths: paths.length,
      tags: tags.length,
      mlsIds: uniqueIds.length,
      listings,
      missing,
    },
  })
}
