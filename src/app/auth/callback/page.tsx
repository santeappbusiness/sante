"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase/client";
import { Blob, Flower } from "@/components/BrandShapes";

/**
 * Where the confirmation email lands.
 *
 * Before this existed, clicking the link in the email dropped people on the
 * marketing page as an anonymous visitor, so someone who had just committed to
 * an account had to work out for themselves that they now needed to go and sign
 * in. That is a dead end at the exact moment a person decided to trust us.
 *
 * This exchanges the token for a real session, gives the account its profile
 * and baseline plan, and sends them into onboarding already signed in.
 *
 * A client component rather than a route handler because Supabase can return
 * the token either as a `code` query parameter or in the URL fragment, and a
 * fragment never reaches the server. Handling both here means one landing page
 * works whichever way the project is configured.
 */

type State = "working" | "expired" | "failed";

const MESSAGES: Record<Exclude<State, "working">, { title: string; body: string }> = {
  expired: {
    title: "That link has expired",
    body: "Confirmation links are only good for a short while, and each one can be used once. Sign in and we will send a fresh one.",
  },
  failed: {
    title: "That link did not work",
    body: "It may have already been used, or been opened in a different browser to the one you signed up in. Signing in directly will sort it out.",
  },
};

export default function AuthCallback() {
  const [state, setState] = useState<State>("working");

  useEffect(() => {
    (async () => {
      const sb = getSupabase();
      if (!sb) {
        setState("failed");
        return;
      }

      const url = new URL(window.location.href);
      /* Supabase reports its own failures in the query string or the fragment
         depending on the flow, and an expired link deserves different words to
         a broken one. */
      const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
      const errorCode = url.searchParams.get("error_code") ?? hash.get("error_code");
      const errorDesc = url.searchParams.get("error_description") ?? hash.get("error_description");
      if (errorCode || errorDesc) {
        setState(/expired/i.test(`${errorCode} ${errorDesc}`) ? "expired" : "failed");
        return;
      }

      try {
        const code = url.searchParams.get("code");
        const tokenHash = url.searchParams.get("token_hash");
        const type = url.searchParams.get("type");

        if (code) {
          const { error } = await sb.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else if (tokenHash && type) {
          const { error } = await sb.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as "signup" | "email_change" | "recovery" | "magiclink",
          });
          if (error) throw error;
        }

        /* The implicit flow puts the session in the fragment and the client
           picks it up on its own, so by this point there should be one either
           way. No session here means the link carried nothing usable. */
        const { data } = await sb.auth.getSession();
        if (!data.session) {
          setState("failed");
          return;
        }

        /* Same call the sign-up path makes, so a confirmed account arrives with
           a profile and a plan rather than an empty app. */
        await fetch("/api/bootstrap", {
          method: "POST",
          headers: { Authorization: `Bearer ${data.session.access_token}` },
        }).catch(() => {});

        window.location.replace("/onboarding");
      } catch (e) {
        const message = e instanceof Error ? e.message : "";
        setState(/expire/i.test(message) ? "expired" : "failed");
      }
    })();
  }, []);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 text-moss/25">
        <Blob size={400} />
      </div>

      <div className="relative w-full max-w-md text-center">
        {state === "working" ? (
          <>
            <span aria-hidden="true" className="inline-block text-lavender sante-breathe">
              <Flower size={64} id="callback" />
            </span>
            <p role="status" className="mt-5 font-display text-2xl">
              Confirming your email
            </p>
            <p className="mt-2 text-ink-soft">One moment, then you are in.</p>
          </>
        ) : (
          <>
            <img src="/brand/sante-mark.png" alt="Santé" className="mx-auto w-40" />
            <h1 className="mt-5 font-display text-3xl leading-tight">{MESSAGES[state].title}</h1>
            <p className="mt-3 text-ink-soft">{MESSAGES[state].body}</p>
            <Link
              href="/signin"
              className="mt-7 inline-block rounded-2xl bg-coral px-7 py-4 font-bold text-coral-on"
            >
              Go to sign in
            </Link>
            <p className="mt-4 text-sm text-slate">
              Or{" "}
              <Link href="/home" className="underline underline-offset-4">
                try the demo
              </Link>{" "}
              while you decide.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
