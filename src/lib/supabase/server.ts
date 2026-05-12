import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// DEC Patrick 2026-05-12 — SSO entre sous-domaines svlbh.com (cf. client.ts).
const COOKIE_DOMAIN = process.env.NEXT_PUBLIC_COOKIE_DOMAIN;

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, {
                ...options,
                ...(COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : {}),
              }),
            );
          } catch {
            // Server Component context — ignore, middleware refreshes session.
          }
        },
      },
    },
  );
}
