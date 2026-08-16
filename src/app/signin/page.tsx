"use client";

import Link from "next/link";
import { useState } from "react";
import { getSupabase } from "@/lib/supabase/client";
import { Blob, Flower } from "@/components/BrandShapes";

/**
 * Sign in and sign up, one screen.
 *
 * Email and password, because that is what people have. No provider buttons,
 * no third-party consent screen, nothing to configure before someone can use
 * the product.
 *
 * Supabase errors are translated: "Invalid login credentials" tells a person
 * nothing they can act on.
 */

type Mode = "in" | "up";

function friendlyError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login")) return "That email and password do not match. Try again?";
  if (m.includes("already registered")) return "There is already an account with that email. Sign in instead?";
  if (m.includes("password")) return "Passwords need at least six characters.";
  if (m.includes("email")) return "That does not look like an email address.";
  return "Something went wrong on our side. Try once more.";
}

export default function SignIn() {
  const [mode, setMode] = useState<Mode>("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const sb = getSupabase();
    if (!sb) return;

    setBusy(true);
    setError(null);
    setNotice(null);

    if (mode === "up") {
      const { data, error } = await sb.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
          /* Where the confirmation link comes back to. Without this it lands on
             the marketing page as an anonymous visitor and the person has to
             work out that they still need to sign in. */
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setError(friendlyError(error.message));
        setBusy(false);
        return;
      }
      /* Some projects require email confirmation, some do not. Handle both
         rather than assuming and stranding people on a blank screen. */
      if (!data.session) {
        setNotice(
          "Check your email. The link in it opens Santé with you already signed in."
        );
        setMode("in");
        setBusy(false);
        return;
      }
      await fetch("/api/bootstrap", {
        method: "POST",
        headers: { Authorization: `Bearer ${data.session.access_token}` },
      }).catch(() => {});
      window.location.replace("/onboarding");
      return;
    }

    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) {
      setError(friendlyError(error.message));
      setBusy(false);
      return;
    }
    await fetch("/api/bootstrap", {
      method: "POST",
      headers: { Authorization: `Bearer ${data.session?.access_token}` },
    }).catch(() => {});
    window.location.replace("/home");
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 text-moss/25">
        <Blob size={420} />
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute -left-16 bottom-0 hidden text-lavender/40 sm:block">
        <Blob size={280} />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
        <img src="/brand/sante-mark.png" alt="Santé" className="-ml-4 w-44" />

        <h1 className="mt-5 font-display text-4xl leading-tight">
          {mode === "in" ? "Welcome back." : "Make a start."}
        </h1>
        <p className="mt-2 text-ink-soft">
          {mode === "in"
            ? "Pick up where you left off."
            : "Santé is a wellness app for women. A plan that can flex takes about a minute to set up."}
        </p>

        <form onSubmit={submit} className="mt-8 grid gap-3">
          {mode === "up" && (
            <div className="field">
              <label htmlFor="name" className="text-xs font-bold uppercase tracking-[0.13em] text-slate">
                What should we call you?
              </label>
              <input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="given-name"
                required
                className="mt-1 w-full rounded-2xl bg-surface px-5 py-3.5 ring-1 ring-ink/15"
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="text-xs font-bold uppercase tracking-[0.13em] text-slate">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              className="mt-1 w-full rounded-2xl bg-surface px-5 py-3.5 ring-1 ring-ink/15"
            />
          </div>

          <div>
            <label htmlFor="password" className="text-xs font-bold uppercase tracking-[0.13em] text-slate">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "in" ? "current-password" : "new-password"}
              minLength={6}
              required
              className="mt-1 w-full rounded-2xl bg-surface px-5 py-3.5 ring-1 ring-ink/15"
            />
            {mode === "up" && (
              <p className="mt-1 text-xs text-slate">At least six characters.</p>
            )}
          </div>

          {error && (
            <p role="alert" className="rounded-2xl bg-terracotta/10 px-4 py-3 text-sm text-terracotta">
              {error}
            </p>
          )}
          {notice && (
            <p role="status" className="rounded-2xl bg-moss/25 px-4 py-3 text-sm">
              {notice}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="mt-1 rounded-2xl bg-coral px-6 py-4 text-lg font-bold text-coral-on disabled:opacity-60"
          >
            {busy ? "One moment" : mode === "in" ? "Sign in" : "Create account"}
          </button>
        </form>

        <button
          onClick={() => {
            setMode(mode === "in" ? "up" : "in");
            setError(null);
          }}
          className="mt-4 text-sm text-ink-soft underline underline-offset-4"
        >
          {mode === "in" ? "No account yet? Create one" : "Already have an account? Sign in"}
        </button>

        <div className="mt-10 border-t border-ink/10 pt-6">
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="text-lavender">
              <Flower size={34} />
            </span>
            <div>
              <p className="font-bold">Just looking?</p>
              <p className="text-sm text-ink-soft">
                Open Santé as Maya, a fictional woman with a week already in it.
              </p>
            </div>
          </div>
          <Link
            href="/home"
            className="mt-4 block rounded-2xl bg-surface px-6 py-3.5 text-center font-bold ring-1 ring-ink/15"
          >
            Try the demo
          </Link>
        </div>

        <Link href="/" className="mt-8 text-sm text-slate underline">
          Back
        </Link>
      </div>
    </main>
  );
}
