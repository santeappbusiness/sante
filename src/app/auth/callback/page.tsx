"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase/client";

/**
 * Where Google sends people back to.
 *
 * Supabase parses the session out of the URL on load, so the work here is to
 * wait for that, make sure the account has a profile and a starting plan, and
 * move on. Nothing about this screen should be memorable.
 */
export default function AuthCallback() {
  const [message, setMessage] = useState("Signing you in…");

  useEffect(() => {
    (async () => {
      const sb = getSupabase();
      if (!sb) {
        window.location.replace("/today");
        return;
      }

      const { data, error } = await sb.auth.getSession();
      if (error || !data.session) {
        setMessage("That sign-in did not complete. Taking you to the demo instead.");
        setTimeout(() => window.location.replace("/today"), 1800);
        return;
      }

      /* Give a brand new account a profile and a plan to adapt from, otherwise
         they land on an app with nothing in it. */
      try {
        await fetch("/api/bootstrap", {
          method: "POST",
          headers: { Authorization: `Bearer ${data.session.access_token}` },
        });
      } catch {}

      window.location.replace("/today");
    })();
  }, []);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6">
      <img src="/brand/sante-logo.png" alt="Santé" className="w-36" />
      <p className="mt-4 text-ink-soft">{message}</p>
    </main>
  );
}
