import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isBot, splitName } from "@/lib/lead-utils";
import { checkLeadSpam, reportLocalReject } from "@/lib/spam-check-client";
import { getBySlug } from "@/lib/communities";
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
    // Legacy alias: anything still posting the old name lands as the new one so
    // the CRM never sees two names for the same form.
    const sourceType = source === "hub-inquiry" ? "building-inquiry" : source;

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
    const communityCity = (body.communityCity ?? "").trim() || null;

    // The visitor's tracking session — persisted on the lead because it is the
    // ONLY bridge from anonymous pre-form browsing to a person (logged-out
    // events carry no user_id). The hourly backfill-site-events cron adopts
    // them off exactly this column. Cookie fallback means a form that doesn't
    // send it explicitly is still covered, including forms added later.
    let sessionId = (body.sessionId ?? "").trim();
    if (!sessionId) {
      // NOTE: this site is on Next 15, where cookies() is ASYNC. Calling
      // .get() on the returned Promise throws, and the catch below swallowed it
      // — the read silently produced nothing and leads.session_id stayed null.
      // The Next 14 sites (minis, MLPB) keep the synchronous form.
      try {
        const jar = await cookies();
        sessionId = jar.get("lm_sid")?.value?.trim() ?? "";
      } catch { /* no request scope */ }
    }
    const viewedMlsIds = String(body.viewedMlsIds ?? "")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean)
      .slice(0, 40);

    // A form on a building page is a sale-side buyer inquiry by definition —
    // these are for-sale new-construction towers, there is no rental funnel on
    // them. Stamping Buyer here is what puts "Buyer" in Client Type on the
    // contact instead of leaving the agent to guess. Deliberately scoped to
    // building inquiries: the generic contact page carries no such implication.
    // Pre-construction adaptation. On mlg-site the profile is built from the
    // listings the person browsed; on a building page there may be no browsing
    // at all — they landed, read, and asked. Fall back to the building's own
    // median active list price so the routing rules still have a price band and
    // the contact still gets a Price, instead of both coming through blank.
    async function communityMedianPrice(slug: string | null): Promise<number | null> {
      if (!slug || !SB_KEY) return null;
      try {
        const res = await fetch(
          `${SB_URL}/rest/v1/properties?community_slug=eq.${encodeURIComponent(slug)}` +
            `&status=eq.Active&sale_or_lease=is.null&select=list_price&limit=200`,
          { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }, cache: "no-store" },
        );
        if (!res.ok) return null;
        const rows = (await res.json()) as Array<{ list_price: number | null }>;
        const prices = rows
          .map((r) => r.list_price)
          .filter((n): n is number => typeof n === "number" && n > 0)
          .sort((a, b) => a - b);
        if (!prices.length) return null;
        const m = Math.floor(prices.length / 2);
        return prices.length % 2 ? prices[m] : Math.round((prices[m - 1] + prices[m]) / 2);
      } catch {
        return null;
      }
    }

    const isBuildingInquiry = !isRegistration && sourceType === "building-inquiry" && !!communityName;
    const effectiveUserType = userType || (isBuildingInquiry ? "Buyer" : "");
    // Order matters. Live MLS inventory is the truest signal, but a genuinely
    // pre-construction tower has NONE — Bennet has zero active listings because
    // it hasn't been filed yet — so the building's published "from" price is the
    // only number that exists. Without this the whole pre-construction funnel
    // routes with a null price and can't match a price-band rule at all.
    const communityPrice = isBuildingInquiry && !viewedMlsIds.length
      ? (await communityMedianPrice(communitySlug))
        ?? (communitySlug ? getBySlug(communitySlug)?.facts?.price_from ?? null : null)
      : null;
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
    // Bot check (local identity heuristics — free, no network). Reported to
    // the central classifier purely so the rejection lands in lead_spam_log:
    // a silent reject that leaves no trace is indistinguishable from a lead
    // that was never submitted, which is the first thing you need to rule out
    // when someone says nobody called them back.
    if (!isRegistration && isBot({ firstName, lastName, email, phone, message })) {
      await reportLocalReject({ firstName, lastName, email, phone, message, source: SITE });
      return NextResponse.json({ success: true }); // silent reject
    }

    // Central classifier (mlg-admin: keyword filter + Claude). The local filter
    // above only catches malformed junk; this is what stops coherent B2B
    // solicitation. Same gate mlg-site runs. Skipped for registrations — an
    // account signup with a password is intent by definition. Fail-open.
    if (!isRegistration) {
      const verdict = await checkLeadSpam({ firstName, lastName, email, phone, message });
      if (verdict.spam) {
        console.warn("[leads] spam rejected:", verdict.reason);
        return NextResponse.json({ success: true }); // silent reject
      }
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
      session_id: sessionId || null,
      building_interest: communityName,
      source_site: SITE,
      source_type: isRegistration ? "registration" : sourceType || "contact-form",
      landing_page: body.landingPage || null,
      referrer: body.referrer || null,
    });

    // Route + notify inline (Next 14 kills the instance after the response, so
    // un-awaited work dies silently — same lesson the minis learned).
    await (async () => {
      const routed = await recordLeadRouting({
        source: "livemodern",
        contact: {
          name: [firstName, lastName].filter(Boolean).join(" ") || null,
          email: email || null,
          phone: phone || null,
        },
        // Community/listing context is what lets the featured-agent pin and the
        // geographic rules fire; without it every lead lands on the house
        // default. The minis learned this the hard way.
        userType: effectiveUserType || null,
        viewedMlsIds: viewedMlsIds.length ? viewedMlsIds : undefined,
        listing: { community_slug: communitySlug, mls_id: mlsId, city: communityCity, price: communityPrice },
        tags: [
          isRegistration ? "registration" : sourceType || "contact-form",
          // The building itself, so an agent can filter "everyone who asked
          // about Bennet" and the tag reads as something a human recognises.
          isBuildingInquiry ? communityName : null,
          // user_type is a routing input (Buyer/Seller/Renter/Landlord). The
          // engine's rules require transaction guards alongside it — a bare
          // landlord tag once routed a $7.995M sale buyer to the rental team.
          effectiveUserType || null,
        ].filter(Boolean) as string[],
        meta: {
          action: isRegistration ? "registration" : sourceType || "contact-form",
          message: composedMessage || null,
          site_slug: SITE,
          user_type: effectiveUserType || null,
          sms_consent: smsConsent,
          community_name: communityName,
        },
      });
      // Back-stitch: everything this session browsed BEFORE they filled the
      // form is sitting in site_events with contact_id NULL. That pre-inquiry
      // browsing is the most useful part — it's what they were looking at when
      // they decided to raise their hand — so claim it now that we know who
      // they are. Explicit no-store: a read-then-write in a Next 14 route can
      // otherwise be served from the Data Cache and silently never land.
      if (sessionId && routed?.contact_id && SB_KEY) {
        try {
          const r = await fetch(
            `${SB_URL}/rest/v1/site_events?session_id=eq.${encodeURIComponent(sessionId)}&contact_id=is.null`,
            {
              method: "PATCH",
              headers: {
                apikey: SB_KEY,
                Authorization: `Bearer ${SB_KEY}`,
                "Content-Type": "application/json",
                Prefer: "return=minimal",
              },
              body: JSON.stringify({ contact_id: routed.contact_id }),
              cache: "no-store",
            },
          );
          if (!r.ok) console.warn("[leads] session back-stitch failed:", r.status);
        } catch (e) {
          console.warn("[leads] session back-stitch error (non-fatal):", e);
        }
      }
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
