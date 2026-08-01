"use client";

import { useEffect, useState } from "react";
import { AUTH_CONFIGURED, getSupabase, rememberReturnTo, useUser } from "@/lib/auth";

// Toggle a saved_listings row for the current user. Same table mlg-site and the
// mini-sites write, keyed on (user_id, mls_id) — a user's saved homes follow
// them across every Modern Living surface, so we don't site-scope the read.
// Logged-out taps stash the current path and route to /login, which returns
// here after auth (see rememberReturnTo / takeReturnTo).
export default function SaveHeart({ mlsId }: { mlsId: string }) {
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
        .from("saved_listings")
        .select("id")
        .eq("user_id", user.id)
        .eq("mls_id", mlsId)
        .maybeSingle();
      if (alive) setSaved(Boolean(data));
    })();
    return () => {
      alive = false;
    };
  }, [user, mlsId]);

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
    setSaved(next); // optimistic
    try {
      const sb = await getSupabase();
      if (next) {
        await sb
          .from("saved_listings")
          .upsert(
            { user_id: user.id, mls_id: mlsId, site_slug: "livemodern" },
            { onConflict: "user_id,mls_id", ignoreDuplicates: true },
          );
      } else {
        await sb.from("saved_listings").delete().eq("user_id", user.id).eq("mls_id", mlsId);
      }
    } catch {
      setSaved(!next); // revert
    } finally {
      setBusy(false);
    }
  }

  const on = saved === true;
  return (
    <button
      type="button"
      className={`save-heart${on ? " is-saved" : ""}`}
      onClick={toggle}
      aria-pressed={on}
      aria-label={on ? "Saved — tap to remove" : "Save this home"}
      title={on ? "Saved" : "Save this home"}
    >
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path
          d="M12 20.5s-7.5-4.7-9.7-9.2C.9 8.2 2.3 5 5.4 5c1.9 0 3.2 1.1 4 2.3l.6.9.6-.9C11.4 6.1 12.7 5 14.6 5c3.1 0 4.5 3.2 3.1 6.3C19.5 15.8 12 20.5 12 20.5z"
          fill={on ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.6"
        />
      </svg>
      <span>{on ? "Saved" : "Save"}</span>
    </button>
  );
}
