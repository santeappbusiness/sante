import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Browser client. Anon key only.
 *
 * The service-role key never appears here, in any NEXT_PUBLIC_ variable, or in
 * anything that reaches the browser bundle. Writes that must be trusted happen
 * in API routes with the service-role key instead.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(url && anonKey);

/* Only offer Google when someone has actually configured it. A sign-in button
   that throws in front of a judge is worse than no button at all. */
export const googleAuthEnabled =
  supabaseConfigured && process.env.NEXT_PUBLIC_GOOGLE_AUTH === "on";

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!supabaseConfigured) return null;
  if (!client) {
    client = createClient(url!, anonKey!, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
  }
  return client;
}

/**
 * Every demo visitor gets their own anonymous identity, so RLS keyed on
 * auth.uid() gives real isolation: two judges on the link at the same time can
 * never see each other's check-ins.
 *
 * Requires anonymous sign-ins to be enabled in the Supabase Auth settings.
 */
export async function ensureAnonymousSession(): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;

  const { data } = await sb.auth.getSession();
  if (data.session?.user?.id) return data.session.user.id;

  const { data: signed, error } = await sb.auth.signInAnonymously();
  if (error || !signed.user) return null;
  return signed.user.id;
}

/** Reset means a new identity rather than a delete, which is why the policies
 *  needing no DELETE is not a problem for us. */
export async function newAnonymousSession(): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;
  await sb.auth.signOut();
  return ensureAnonymousSession();
}
