"use client";

import { useEffect, useState } from "react";
import { getSupabase, AUTH_CONFIGURED } from "@/lib/auth";

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

    let unsub: (() => void) | null = null;
    void (async () => {
      const sb = await getSupabase();
      const {
        data: { session },
      } = await sb.auth.getSession();
      if (session) go("/account");
      const { data: sub } = sb.auth.onAuthStateChange((_e, s2) => {
        if (s2) go("/account");
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
