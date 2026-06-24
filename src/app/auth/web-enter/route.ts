// GET /auth/web-enter?h=<code>&next=<path> — termine le pont SSO natif → WebView (cockpit).
//
// La WebView Pro 1 charge cette URL (handoff minté par /api/self-view). On réclame +
// supprime le code (single-use + non expiré), on pose la session via setSession() sur le
// client SSR cookie-writing → le SDK écrit le vrai cookie sb-* DANS la WebView, puis
// redirige vers `next`. Aucun PKCE, aucun magic-link : déterministe.

import { NextResponse, type NextRequest } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ORIGIN = "https://cockpit.svlbh.com";

function safeNext(raw: string | null): string {
  if (!raw) return "/dashboard";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/dashboard";
  if (raw.includes("://") || raw.includes("\\")) return "/dashboard";
  return raw;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("h");
  const next = safeNext(searchParams.get("next"));

  const fail = (why: string) =>
    NextResponse.redirect(`${ORIGIN}/login?error=web_enter_${why}`, { status: 303 });

  if (!code) return fail("nocode");

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SERVICE_ROLE) return fail("cfg");

  const admin = createServiceClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: claimed } = await admin
    .from("extension_pairing_code")
    .delete()
    .eq("code", code)
    .is("consumed_at", null)
    .gt("expires_at", new Date().toISOString())
    .select("access_token, refresh_token")
    .maybeSingle();

  if (!claimed?.access_token || !claimed?.refresh_token) return fail("invalid");

  const supabase = await createClient();
  const { error } = await supabase.auth.setSession({
    access_token: claimed.access_token,
    refresh_token: claimed.refresh_token,
  });
  if (error) return fail("session");

  return NextResponse.redirect(`${ORIGIN}${next}`, { status: 303 });
}
