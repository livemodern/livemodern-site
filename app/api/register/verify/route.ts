import { NextRequest, NextResponse } from "next/server";

// Thin proxy to mlg-admin's central registration verifier (Telnyx Number
// Lookup, email MX + disposable checks, model verdict on obvious fakes). The
// signup form runs client-side and must never hold MLG_SERVICE_TOKEN, so the
// token stays server-side here.
//
// FAIL-OPEN: any proxy or upstream failure returns ok:true. Blocking a real
// buyer because a verifier hiccuped is far more expensive than letting one
// junk registration through.

export const runtime = "nodejs";
export const maxDuration = 25;

const ADMIN_BASE = process.env.MLG_ADMIN_BASE_URL ?? "https://team.mlrecloud.com";
const TOKEN = process.env.MLG_SERVICE_TOKEN ?? "";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  if (!TOKEN) return NextResponse.json({ ok: true, fieldErrors: {}, skipped: "no-token" });
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 18_000);
    const res = await fetch(`${ADMIN_BASE}/api/register/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-MLG-Service-Token": TOKEN },
      body: JSON.stringify({
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone,
        siteSlug: "livemodern",
      }),
      cache: "no-store",
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!res.ok) return NextResponse.json({ ok: true, fieldErrors: {}, skipped: `http-${res.status}` });
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ ok: true, fieldErrors: {}, skipped: "error" });
  }
}
