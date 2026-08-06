import { createBrowserClient } from "@supabase/ssr";

// DEC Patrick 2026-05-12 — SSO entre sous-domaines svlbh.com.
// NEXT_PUBLIC_COOKIE_DOMAIN=.svlbh.com en prod (Render) pour que les cookies
// auth soient partagés entre pwa.app.svlbh.com / priv.svlbh.com / cockpit.svlbh.com.
// Non-défini en dev (localhost) → comportement par défaut.
const COOKIE_DOMAIN = process.env.NEXT_PUBLIC_COOKIE_DOMAIN;

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // Passkeys (bêta Supabase 05.2026, DEC Patrick 06.08) — RP ID svlbh.com :
      // une clé enrôlée sur priv.svlbh.com vaut aussi ici.
      auth: { experimental: { passkey: true } },
      ...(COOKIE_DOMAIN
        ? { cookieOptions: { domain: COOKIE_DOMAIN, path: "/", sameSite: "lax" as const } }
        : {}),
    },
  );
}
