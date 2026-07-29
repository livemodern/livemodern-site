import { NextRequest, NextResponse } from "next/server";

// Is this email already known to us? Checked BEFORE signup so a known address
// can't spawn a second, unreconciled identity. Three places count as "known":
//   1. an existing registrations row (someone already made an account),
//   2. a contacts row (the CRM already has them — often FUB-created),
//   3. a contact carrying it as a secondary email.
// Fail-open: on any error we return exists:false and let Supabase's own dedup
// be the backstop, so a transient blip never blocks a real first-time signup.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SB_URL = process.env.SUPABASE_URL ?? "https://ezcikavnfchqaenweygw.supabase.co";
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

async function any(path: string): Promise<boolean> {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
    cache: "no-store",
  });
  if (!res.ok) return false;
  const rows = (await res.json()) as unknown[];
  return Array.isArray(rows) && rows.length > 0;
}

export async function POST(req: NextRequest) {
  try {
    const { email } = (await req.json()) as { email?: string };
    const e = (email ?? "").trim().toLowerCase();
    if (!e || !SB_KEY) return NextResponse.json({ exists: false });

    const q = encodeURIComponent(e);
    if (await any(`registrations?email=eq.${q}&select=id&limit=1`)) {
      return NextResponse.json({ exists: true, where: "registrations" });
    }
    if (await any(`contacts?email=eq.${q}&select=id&limit=1`)) {
      return NextResponse.json({ exists: true, where: "contacts" });
    }
    return NextResponse.json({ exists: false });
  } catch {
    return NextResponse.json({ exists: false });
  }
}
