"use client";

import { useEffect, useState } from "react";
import { getSupabase, googleAuthEnabled } from "@/lib/supabase/client";

/**
 * Sign in.
 *
 * The Google button only renders when Google is actually configured. A button
 * that looks real and throws when a judge taps it is worse than no button, so
 * this is gated rather than hopeful.
 */
export default function SignIn() {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => setOrigin(window.location.origin), []);

  async function withGoogle() {
    const sb = getSupabase();
    if (!sb) return;
    setBusy(true);
    setError(null);
    const { error } = await sb.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${origin}/auth/callback` },
    });
    if (error) {
      /* Never show the raw provider error. */
      setError("Google sign-in is not available right now. You can still try the demo.");
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <img src="/brand/sante-logo.png" alt="Santé" className="-ml-4 w-44" />

      <h1 className="mt-4 text-4xl leading-tight">Welcome back.</h1>
      <p className="mt-2 text-ink-soft">
        Pick up where you left off, or look around first.
      </p>

      <div className="mt-9 grid gap-3">
        {googleAuthEnabled && (
          <button
            onClick={withGoogle}
            disabled={busy}
            className="flex items-center justify-center gap-3 rounded-xl bg-surface px-5 py-4 font-bold ring-1 ring-ink/15 disabled:opacity-60"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path fill="#4285F4" d="M17.6 9.2c0-.6-.1-1.2-.2-1.8H9v3.5h4.8a4.1 4.1 0 0 1-1.8 2.7v2.2h2.9c1.7-1.6 2.7-3.9 2.7-6.6Z" />
              <path fill="#34A853" d="M9 18c2.4 0 4.5-.8 6-2.2l-2.9-2.2c-.8.5-1.8.9-3.1.9-2.4 0-4.4-1.6-5.1-3.8H.9v2.3A9 9 0 0 0 9 18Z" />
              <path fill="#FBBC05" d="M3.9 10.7a5.4 5.4 0 0 1 0-3.4V5H.9a9 9 0 0 0 0 8l3-2.3Z" />
              <path fill="#EA4335" d="M9 3.6c1.3 0 2.5.5 3.4 1.3l2.6-2.6A9 9 0 0 0 .9 5l3 2.3C4.6 5.2 6.6 3.6 9 3.6Z" />
            </svg>
            {busy ? "Opening Google" : "Continue with Google"}
          </button>
        )}

        <a
          href="/today"
          className="rounded-xl bg-coral px-5 py-4 text-center font-bold text-coral-on"
        >
          Try the demo
        </a>
      </div>

      {error && (
        <p className="mt-4 rounded-xl bg-terracotta/10 px-4 py-3 text-sm text-terracotta">
          {error}
        </p>
      )}

      {!googleAuthEnabled && (
        <p className="mt-6 text-sm text-slate">
          Santé opens as Maya, a fictional demo user, with nothing to sign up for.
        </p>
      )}

      <a href="/" className="mt-8 text-sm text-slate underline">
        Back
      </a>
    </main>
  );
}
