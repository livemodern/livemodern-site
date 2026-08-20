import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'

// On-demand ISR revalidation for livemodern.com.
//
// Callers:
//   - TCP Trestle sync (bmb-delta) — sends `mlsIds` for the listings that
//     actually changed in that run so the corresponding /listing/{id} PDPs
//     refresh instantly instead of waiting out the page's ISR window.
//   - TCP reconcile-active — sends `mlsIds` for listings that were flipped
//     to Withdrawn / repaired-Closed / status-corrected. A status flip is
//     a material change; without this ping the page still says "Active"
//     until the 7-day safety net expires.
//   - Future: mlg-admin CMS saves for livemodern-owned pages can send
//     `paths` or `tags` here directly.
//
// URL shape: livemodern uses bare mls_id in the URL (`/listing/{id}`) — no
// slug lookup is needed on this side (unlike mlg-site's SEO slugs).
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

  // Listing PDPs use the bare mls_id in the URL — no slug resolution.
  let listings = 0
  const uniqueIds = Array.from(new Set(mlsIds))
  for (const id of uniqueIds) {
    try {
      revalidatePath(`/listing/${id}`)
      listings++
    } catch { /* non-fatal — one bad id must not abort the batch */ }
  }

  return NextResponse.json({
    ok: true,
    revalidated: {
      paths: paths.length,
      tags: tags.length,
      mlsIds: uniqueIds.length,
      listings,
    },
  })
}
