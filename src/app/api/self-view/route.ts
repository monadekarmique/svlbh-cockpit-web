// POST /api/self-view — pont SSO natif → WebView embarquée (cockpit.svlbh.com).
//
// Le natif POST son access_token (Bearer) + refresh_token + next ; on mint un code de
// handoff single-use (extension_pairing_code, TTL 2 min) ; on renvoie /auth/web-enter?h=…
// que la WebView charge → setSession() y pose le vrai cookie sb-* (zéro PKCE, déterministe).
// (Remplace l'ancien generateLink, cassé : un magic-link admin n'a pas de code_verifier PKCE.)

import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ORIGIN = "https://cockpit.svlbh.com";

function safeNext(raw: unknown): string {
  if (typeof raw !== "string") return "/dashboard";
  const n = raw.trim();
  if (!n.startsWith("/") || n.startsWith("//")) return "/dashboard";
  if (n.includes("://") || n.includes("\\")) return "/dashboard";
  return n;
}

export async function POST(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const accessToken = m[1];

  const admin = createAdminClient();

  const {
    data: { user },
    error: authErr,
  } = await admin.auth.getUser(accessToken);
  if (authErr || !user) {
    return NextResponse.json({ error: "Token invalide" }, { status: 401 });
  }

  let body: { next?: unknown; refresh_token?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    /* body optionnel */
  }
  const next = safeNext(body.next);
  const refreshToken = typeof body.refresh_token === "string" ? body.refresh_token.trim() : "";
  if (!refreshToken) {
    return NextResponse.json({ error: "refresh_token requis" }, { status: 400 });
  }

  const { data: profile } = await admin
    .from("praticienne_profile")
    .select("svlbh_id")
    .eq("supabase_user_id", user.id)
    .maybeSingle();

  const code = randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + 120_000).toISOString(); // 2 min
  const { error: insErr } = await admin.from("extension_pairing_code").insert({
    code,
    praticienne_svlbh_id: profile?.svlbh_id ?? null,
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_at: expiresAt,
  });
  if (insErr) {
    return NextResponse.json({ error: "Handoff non créé" }, { status: 500 });
  }

  const url = `${ORIGIN}/auth/web-enter?h=${code}&next=${encodeURIComponent(next)}`;
  return NextResponse.json({ url });
}
