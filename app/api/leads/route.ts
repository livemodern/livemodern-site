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
  building?: string | null;
}): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key || NOTIFY_TO.length === 0) return;
  const rows: [string, string][] = [
    ["Name", fields.name || "—"],
    ["Email", fields.email || "—"],
    ["Phone", fields.phone || "—"],
    ["Building", fields.building || "—"],
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
        subject: `${fields.source === "Registration" ? "New registration" : "New inquiry"} — ${fields.name || fields.email || "LiveModern"}`,
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

    // Account registration comes through this same pipeline so there is ONE
    // path into the CRM. It differs in three ways: intent is implicit (so the
    // bot heuristic is skipped — a signup with a password is not a scraper),
    // the user_type becomes a routing input, and the gate that opened signup
    // passes community/listing context so the router can resolve geography
    // instead of falling through to the house default.
    const isRegistration =
      String(body.isRegistration ?? "") === "true" || (body.isRegistration as unknown) === true;
    const userType = (body.userType ?? "").trim();
    const smsConsent =
      String(body.smsConsent ?? "") === "true" || (body.smsConsent as unknown) === true;
    const communitySlug = (body.communitySlug ?? "").trim() || null;
    const communityName = (body.communityName ?? "").trim() || null;
    const mlsId = (body.mlsId ?? "").trim() || null;

    if (!email && !phone) {
      return NextResponse.json({ error: "Email or phone required" }, { status: 400 });
    }
    // A real inquiry has a name. Direct bot POSTs skip the browser's required attr.
    if (!firstName) return NextResponse.json({ success: true });

    // Server-side floor for inquiries: first + last + a reachable phone. The
    // form validates client-side, so a 400 here only ever hits a direct POST or
    // a stale cached bundle — a real person never sees it. Registrations keep
    // their own gate (login page) and are exempt from the phone check only when
    // they genuinely have no phone on file.
    if (!isRegistration) {
      const digits = phone.replace(/\D/g, "");
      if (!lastName) {
        return NextResponse.json({ error: "Last name required" }, { status: 400 });
      }
      if (digits.length < 10 || digits.length > 11) {
        return NextResponse.json({ error: "A valid phone number is required" }, { status: 400 });
      }
    }
    if (!isRegistration && isBot({ firstName, lastName, email, phone, message })) {
      return NextResponse.json({ success: true }); // silent reject
    }

    // Lead the message with the building the form sits on. The CRM timeline
    // renders a dedicated `Building:` line from meta.community_name, but the
    // message is what shows in the notification email and on the lead row, so
    // an agent knows the context without opening anything.
    const interestLine = interest && message
      ? `[Interest: ${interest}] ${message}`
      : interest
        ? `Interest: ${interest}`
        : message;
    // The CRM timeline renders its own `Building:` line from meta.community_name
    // and the notification email carries a Building row, so the message itself
    // stays clean — repeating the building here just read as noise on the wall.
    const composedMessage = interestLine;

    const leadId = await insertLead({
      first_name: firstName || null,
      last_name: lastName || null,
      email: email || null,
      phone: phone || null,
      message: composedMessage || null,
      building_interest: communityName,
      source_site: SITE,
      source_type: isRegistration ? "registration" : source || "contact-form",
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
        // Community/listing context is what lets the featured-agent pin and the
        // geographic rules fire; without it every lead lands on the house
        // default. The minis learned this the hard way.
        listing: { community_slug: communitySlug, mls_id: mlsId, city: null, price: null },
        tags: [
          isRegistration ? "registration" : source || "contact-form",
          // user_type is a routing input (Buyer/Seller/Renter/Landlord). The
          // engine's rules require transaction guards alongside it — a bare
          // landlord tag once routed a $7.995M sale buyer to the rental team.
          userType || null,
        ].filter(Boolean) as string[],
        meta: {
          action: isRegistration ? "registration" : source || "contact-form",
          message: composedMessage || null,
          site_slug: SITE,
          user_type: userType || null,
          sms_consent: smsConsent,
          community_name: communityName,
        },
      });
      await notify({
        name: [firstName, lastName].filter(Boolean).join(" "),
        email, phone, message, interest, source,
        building: communityName,
      });
    })();

    return NextResponse.json({ success: true, leadId });
  } catch (err) {
    console.error("[leads] capture error:", err);
    return NextResponse.json({ error: "Failed to submit" }, { status: 500 });
  }
}
