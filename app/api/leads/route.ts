import { NextRequest, NextResponse } from "next/server";
import { isBot, splitName } from "@/lib/lead-utils";
import { recordLeadRouting } from "@/lib/route-lead-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SB_URL = process.env.SUPABASE_URL ?? "https://ezcikavnfchqaenweygw.supabase.co";
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const SITE = "livemodern"; // sites.slug FK (leads.source_site references sites.slug)

// Notification recipients for a fresh LiveModern inquiry. Best-effort via Resend;
// skipped silently if RESEND_API_KEY isn't set on the project.
const NOTIFY_TO = (process.env.LEAD_NOTIFY_TO ?? "team@mlrecloud.com")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const RESEND_FROM = process.env.RESEND_FROM ?? "LiveModern <team@mlrecloud.com>";

async function insertLead(row: Record<string, unknown>): Promise<string | null> {
  if (!SB_KEY) return null;
  try {
    const res = await fetch(`${SB_URL}/rest/v1/leads`, {
      method: "POST",
      headers: {
        apikey: SB_KEY,
        Authorization: `Bearer ${SB_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(row),
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("[leads] supabase insert failed:", res.status, await res.text());
      return null;
    }
    const data = (await res.json()) as Array<{ id: string }>;
    return data?.[0]?.id ?? null;
  } catch (e) {
    console.error("[leads] supabase insert error:", e);
    return null;
  }
}

async function notify(fields: {
  name: string; email: string; phone: string; message: string; interest: string; source: string;
}): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key || NOTIFY_TO.length === 0) return;
  const rows: [string, string][] = [
    ["Name", fields.name || "—"],
    ["Email", fields.email || "—"],
    ["Phone", fields.phone || "—"],
    ["Interest", fields.interest || "—"],
    ["Message", fields.message || "—"],
    ["Source", fields.source || "—"],
  ];
  const html =
    `<h2 style="font-family:Georgia,serif;color:#0D173B;margin:0 0 12px">New LiveModern inquiry</h2>` +
    `<table style="font-family:Arial,sans-serif;font-size:14px;border-collapse:collapse">` +
    rows
      .map(
        ([k, v]) =>
          `<tr><td style="padding:4px 16px 4px 0;color:#667;white-space:nowrap">${k}</td>` +
          `<td style="padding:4px 0;color:#111"><strong>${String(v).replace(/</g, "&lt;")}</strong></td></tr>`,
      )
      .join("") +
    `</table>`;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: RESEND_FROM,
        to: NOTIFY_TO,
        reply_to: fields.email || undefined,
        subject: `New inquiry — ${fields.name || fields.email || "LiveModern"}`,
        html,
      }),
      cache: "no-store",
    });
  } catch (e) {
    console.warn("[leads] resend notify failed (non-fatal):", e);
  }
}

export async function POST(req: NextRequest) {
  try {
    // Accept JSON (the client form) or form-encoded (progressive-enhancement fallback).
    let body: Record<string, string> = {};
    const ct = req.headers.get("content-type") ?? "";
    if (ct.includes("application/json")) {
      body = (await req.json()) as Record<string, string>;
    } else {
      const fd = await req.formData();
      fd.forEach((v, k) => (body[k] = String(v)));
    }

    const { first, last } = splitName(body.name);
    const firstName = (body.firstName ?? first ?? "").trim();
    const lastName = (body.lastName ?? last ?? "").trim();
    const email = (body.email ?? "").trim();
    const phone = (body.phone ?? "").trim();
    const message = (body.message ?? "").trim();
    const interest = (body.interest ?? "").trim();
    const source = (body.source ?? "contact-form").trim();

    if (!email && !phone) {
      return NextResponse.json({ error: "Email or phone required" }, { status: 400 });
    }
    // A real inquiry has a name. Direct bot POSTs skip the browser's required attr.
    if (!firstName) return NextResponse.json({ success: true });
    if (isBot({ firstName, lastName, email, phone, message })) {
      return NextResponse.json({ success: true }); // silent reject
    }

    const composedMessage = interest && message
      ? `[Interest: ${interest}] ${message}`
      : interest
        ? `Interest: ${interest}`
        : message;

    const leadId = await insertLead({
      first_name: firstName || null,
      last_name: lastName || null,
      email: email || null,
      phone: phone || null,
      message: composedMessage || null,
      source_site: SITE,
      source_type: source || "contact-form",
      landing_page: body.landingPage || null,
      referrer: body.referrer || null,
    });

    // Route + notify inline (Next 14 kills the instance after the response, so
    // un-awaited work dies silently — same lesson the minis learned).
    await (async () => {
      await recordLeadRouting({
        source: "livemodern",
        contact: {
          name: [firstName, lastName].filter(Boolean).join(" ") || null,
          email: email || null,
          phone: phone || null,
        },
        listing: { community_slug: null, city: null, price: null },
        tags: [source || "contact-form"].filter(Boolean),
        meta: { action: source || "contact-form", message: composedMessage || null, site_slug: SITE },
      });
      await notify({
        name: [firstName, lastName].filter(Boolean).join(" "),
        email, phone, message, interest, source,
      });
    })();

    return NextResponse.json({ success: true, leadId });
  } catch (err) {
    console.error("[leads] capture error:", err);
    return NextResponse.json({ error: "Failed to submit" }, { status: 500 });
  }
}
