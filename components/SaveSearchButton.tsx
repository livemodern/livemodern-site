"use client";

import { useEffect, useState } from "react";
import { AUTH_CONFIGURED, getSupabase, rememberReturnTo, useUser } from "@/lib/auth";

// "Save this search" for a collection / spoke page. A saved_searches row keyed
// on the page slug (location) is enough to re-run the search later — the account
// page links straight back to /{location}. Same table mlg-site + mlg-search
// write, read cross-site by user_id. Logged-out taps route to /login and return.
export default function SaveSearchButton({
  slug,
  name,
  transaction,
}: {
  slug: string;
  name: string;
  transaction?: string | null;
}) {
  const { user, loading } = useUser();
  const [saved, setSaved] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user || !AUTH_CONFIGURED) {
      setSaved(false);
      return;
    }
    let alive = true;
    void (async () => {
      const sb = await getSupabase();
      const { data } = await sb
        .from("saved_searches")
        .select("id")
        .eq("user_id", user.id)
        .eq("location", slug)
        .maybeSingle();
      if (alive) setSaved(Boolean(data));
    })();
    return () => {
      alive = false;
    };
  }, [user, slug]);

  async function toggle() {
    if (loading || busy) return;
    if (!user) {
      rememberReturnTo();
      window.location.assign(
        `/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`,
      );
      return;
    }
    setBusy(true);
    const next = !saved;
    setSaved(next);
    try {
      const sb = await getSupabase();
      if (next) {
        await sb.from("saved_searches").insert({
          user_id: user.id,
          site_slug: "livemodern",
          location: slug,
          name,
          transaction: transaction ?? null,
          filters: { collection: slug },
          alert_frequency: "none",
        });
      } else {
        await sb.from("saved_searches").delete().eq("user_id", user.id).eq("location", slug);
      }
    } catch {
      setSaved(!next);
    } finally {
      setBusy(false);
    }
  }

  const on = saved === true;
  return (
    <button
      type="button"
      className={`save-search${on ? " is-saved" : ""}`}
      onClick={toggle}
      aria-pressed={on}
    >
      <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
        <path
          d="M6 3h12a1 1 0 0 1 1 1v16l-7-4-7 4V4a1 1 0 0 1 1-1z"
          fill={on ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
      <span>{on ? "Search saved" : "Save this search"}</span>
    </button>
  );
}
