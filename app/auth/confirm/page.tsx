"use client";

import { useEffect, useState } from "react";
import { getSupabase, AUTH_CONFIGURED, takeReturnTo } from "@/lib/auth";

// Magic-link / OTP confirmation via the token_hash flow. Supabase's email
// template must point here:
//   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=magiclink
// The older #access_token fragment flow is handled by /auth/callback instead.
export default function AuthConfirm() {
  const [msg, setMsg] = useState("Confirming…");

  useEffect(() => {
    if (!AUTH_CONFIGURED) {
      setMsg("Accounts aren't configured on this deployment yet.");
      return;
    }
    const q = new URLSearchParams(window.location.search);
    const token_hash = q.get("token_hash");
    const type = (q.get("type") ?? "magiclink") as "magiclink" | "email" | "recovery" | "invite";
    if (!token_hash) {
      setMsg("This link is missing its token. Please request a new one.");
      return;
    }
    void (async () => {
      const sb = await getSupabase();
      const { error } = await sb.auth.verifyOtp({ token_hash, type });
      if (error) setMsg("That link has expired or was already used. Please request a new one.");
      // Resume whatever the visitor was looking at. This branch used to
      // hardcode /account, so the token_hash magic-link flow threw the stashed
      // destination away even when one existed — /auth/callback got this right
      // and this page didn't. takeReturnTo() clears it so a later sign-in
      // doesn't bounce somewhere stale.
      else window.location.replace(takeReturnTo() ?? "/account");
    })();
  }, []);

  return (
    <main style={{ minHeight: "60vh", display: "grid", placeItems: "center", padding: 40 }}>
      <p style={{ fontSize: 14, color: "#667" }}>{msg}</p>
    </main>
  );
}
