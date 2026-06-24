// POST /api/self-view — magic link Supabase pour que la praticienne s'authentifie sur
// cockpit.svlbh.com DANS le WebView embarqué de Pro 1 (Shamanes…) SANS re-saisir
// Apple/Google : elle est déjà loguée en natif. Jumeau « moi-même » côté cockpit.
//
// Auth : Bearer <access_token de la praticienne> (JWT Supabase natif Pro 1).
// Body : { next?: string } — chemin relatif same-origin.
// Retour 200 : { url } — action_link single-use → /auth/callback (écrivain de cookie).
//
// Sécurité : token vérifié (getUser), email résolu CÔTÉ SERVEUR depuis praticienne_profile
// par user.id (jamais du body), next validé relatif, redirect_to = /auth/callback de cockpit.

import { NextResponse } from "next/server";
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
  const jwt = m[1];

  const admin = createAdminClient();

  const {
    data: { user },
    error: authErr,
  } = await admin.auth.getUser(jwt);
  if (authErr || !user) {
    return NextResponse.json({ error: "Token invalide" }, { status: 401 });
  }

  const { data: profile } = await admin
    .from("praticienne_profile")
    .select("email")
    .eq("supabase_user_id", user.id)
    .maybeSingle();
  const email = profile?.email ?? user.email;
  if (!email) {
    return NextResponse.json({ error: "Email praticienne introuvable" }, { status: 404 });
  }

  let body: { next?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    /* body optionnel */
  }
  const next = safeNext(body.next);

  const redirectTo = `${ORIGIN}/auth/callback?next=${encodeURIComponent(next)}`;
  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo },
  });
  if (linkErr || !linkData?.properties?.action_link) {
    return NextResponse.json(
      { error: linkErr?.message ?? "Génération du lien échouée" },
      { status: 500 },
    );
  }

  return NextResponse.json({ url: linkData.properties.action_link });
}
