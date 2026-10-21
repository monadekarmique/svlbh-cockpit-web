import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// DEC Patrick 2026-05-12 — SSO entre sous-domaines svlbh.com (cf. client.ts).
const COOKIE_DOMAIN = process.env.NEXT_PUBLIC_COOKIE_DOMAIN;

// surface : le nom que la base lit dans l'en-tête x-svlbh-surface (table coach_view_surface). Sans lui, une
// session « voir comme » ouverte par Patrick n'existe pas pour la base — coach_view_target() reste nul. Mesuré le
// 21.10.2026 : coach_view_surface_ok() exige cet en-tête (ou l'agent SVLBHPriv1), et le cockpit ne posait rien.
// Seules les lectures qui doivent SUIVRE le voir-comme le passent ; les gates (requireSt6, requireSt5Plus…)
// restent sur l'identité réelle — en session, Patrick reste Patrick pour entrer, et voit comme la cible une fois entré.
export async function createClient(opts: { surface?: string } = {}) {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      ...(opts.surface ? { global: { headers: { "x-svlbh-surface": opts.surface } } } : {}),
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
