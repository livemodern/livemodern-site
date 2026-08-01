"use client";

import { useEffect, useState } from "react";
import { getSupabase, AUTH_CONFIGURED, takeReturnTo } from "@/lib/auth";

// OAuth + email-confirmation landing. Supabase's detectSessionInUrl handles the
// hash/code exchange, so all this page does is wait for the session to resolve
// and then move the visitor on. Runs client-side deliberately — the session
// lives in localStorage under the 'lm-auth' key, not in a cookie a server
// component could read.
export default function AuthCallback() {
  const [msg, setMsg] = useState("Signing you in…");

  useEffect(() => {
    if (!AUTH_CONFIGURED) {
      setMsg("Accounts aren't configured on this deployment yet.");
      return;
    }
    let done = false;
    const go = (to: string) => {
      if (done) return;
      done = true;
      window.location.replace(to);
    };

    // Prefer the ?next= that rode along on redirectTo; fall back to the path we
    // stashed before leaving for Google; finally the account home.
    const urlNext = new URLSearchParams(window.location.search).get("next");
    const dest = (urlNext && urlNext.startsWith("/") && !urlNext.startsWith("//")
      ? urlNext
      : null) ?? takeReturnTo() ?? "/account";

    let unsub: (() => void) | null = null;
    void (async () => {
      const sb = await getSupabase();
      const {
        data: { session },
      } = await sb.auth.getSession();
      if (session) go(dest);
      const { data: sub } = sb.auth.onAuthStateChange((_e, s2) => {
        if (s2) go(dest);
      });
      unsub = () => sub.subscription.unsubscribe();
    })();
    // If nothing resolves, don't leave them staring at a spinner.
    const t = setTimeout(() => {
      if (!done) setMsg("That sign-in link has expired or was already used. Please request a new one.");
    }, 6000);

    return () => {
      clearTimeout(t);
      unsub?.();
    };
  }, []);

  return (
    <main style={{ minHeight: "60vh", display: "grid", placeItems: "center", padding: 40 }}>
      <p style={{ fontSize: 14, color: "#667" }}>{msg}</p>
    </main>
  );
}
