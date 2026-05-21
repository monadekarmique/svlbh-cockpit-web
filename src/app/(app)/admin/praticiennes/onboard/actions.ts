"use server";

// Server action — onboarding PostFinance Checkout d'une praticienne.
// Orchestration :
//   1. Vérifier Owner ST6
//   2. Chiffrer pf_auth_key via RPC encrypt_praticienne_auth_key
//   3. Appeler PF API : créer webhook listener pour cette praticienne
//   4. Chiffrer pf_webhook_secret
//   5. UPDATE praticienne_profile avec les 7 colonnes pf_*
//   6. Audit log
//
// DEC Patrick 2026-05-21 (Brief dev v1).

import { revalidatePath } from "next/cache";
import { randomBytes } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import {
  createWebhookListener,
  type WebhookListener,
} from "@/lib/postfinance-checkout/webhook-listener";

// Option B (Patrick 2026-05-21) : URL webhook = endpoint cockpit direct,
// pas de hop Make.com. Token random per-praticienne dans l'URL pour auth.
const COCKPIT_BASE = process.env.NEXT_PUBLIC_COCKPIT_BASE_URL ?? "https://cockpit.svlbh.com";

function generateWebhookToken(): string {
  return randomBytes(32).toString("hex");
}

async function ensureOwner() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error("Non authentifié");
  const { data: me } = await sb
    .from("praticienne_profile")
    .select("stx")
    .eq("supabase_user_id", user.id)
    .maybeSingle();
  if (me?.stx !== "ST6") throw new Error("Accès refusé (Owner ST6 only)");
  return sb;
}

export async function onboardPraticienne(formData: FormData) {
  const svlbhId = String(formData.get("svlbh_id") ?? "").trim();
  const environment = String(formData.get("pf_environment") ?? "sandbox").trim();
  const spaceId = String(formData.get("pf_space_id") ?? "").trim();
  const appUserId = String(formData.get("pf_app_user_id") ?? "").trim();
  const authKey = String(formData.get("pf_auth_key") ?? "").trim();

  if (!svlbhId) throw new Error("svlbh_id requis");
  if (!["sandbox", "production"].includes(environment)) {
    throw new Error("pf_environment invalide");
  }
  if (!spaceId) throw new Error("pf_space_id requis");
  if (!appUserId) throw new Error("pf_app_user_id requis");
  if (!authKey || authKey.length < 20) {
    throw new Error("pf_auth_key requis (≥ 20 chars base64)");
  }

  const sb = await ensureOwner();

  // 1. Récupère le profil cible (pour audit + display)
  const { data: prat, error: pratErr } = await sb
    .from("praticienne_profile")
    .select("svlbh_id, first_name, last_name, email, code_praticien, pf_webhook_id, pf_space_id")
    .eq("svlbh_id", svlbhId)
    .maybeSingle();
  if (pratErr) throw new Error(`Read praticienne échec : ${pratErr.message}`);
  if (!prat) throw new Error("Praticienne introuvable");

  // 2. Génère un token unique pour l'URL webhook entrante côté cockpit
  const webhookUrlToken = generateWebhookToken();
  const webhookUrl = `${COCKPIT_BASE}/api/webhooks/postfinance/${webhookUrlToken}`;

  // 3. Crée le webhook listener côté PostFinance avec l'URL cockpit (pas Make)
  const praticienneSlug =
    `${prat.first_name ?? ""}-${prat.last_name ?? ""}`
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "praticienne";
  let webhook: WebhookListener;
  try {
    webhook = await createWebhookListener({
      credentials: { userId: appUserId, authKeyBase64: authKey },
      spaceId,
      name: `SVLBH-${praticienneSlug}-${environment}`,
      url: webhookUrl,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`Création webhook PF échec : ${msg}`);
  }

  const webhookId = String(webhook.id);
  const webhookSecret =
    webhook.identity?.publicKey ?? webhook.identity?.id?.toString() ?? "";

  // 3. Chiffre auth_key et webhook_secret
  const { data: encAuthKey, error: encAuthErr } = await sb.rpc(
    "encrypt_praticienne_auth_key",
    { p_plaintext: authKey },
  );
  if (encAuthErr) throw new Error(`Chiffrement auth_key échec : ${encAuthErr.message}`);

  let encWebhookSecret: string | null = null;
  if (webhookSecret) {
    const { data, error } = await sb.rpc("encrypt_praticienne_auth_key", {
      p_plaintext: webhookSecret,
    });
    if (error) throw new Error(`Chiffrement webhook_secret échec : ${error.message}`);
    encWebhookSecret = data as string;
  }

  // 4. UPDATE praticienne_profile
  const { error: updErr } = await sb
    .from("praticienne_profile")
    .update({
      pf_environment: environment,
      pf_space_id: spaceId,
      pf_app_user_id: appUserId,
      pf_auth_key_encrypted: encAuthKey as string,
      pf_webhook_id: webhookId,
      pf_webhook_secret_encrypted: encWebhookSecret,
      pf_webhook_url_token: webhookUrlToken,
      pf_onboarded_at: new Date().toISOString(),
    })
    .eq("svlbh_id", svlbhId);
  if (updErr) throw new Error(`UPDATE praticienne_profile échec : ${updErr.message}`);

  // 5. Audit log (le trigger V2 capte aussi automatiquement le UPDATE)
  await sb.rpc("log_audit_event", {
    p_action: "ONBOARD_PF",
    p_target_table: "praticienne_profile",
    p_target_row_id: svlbhId,
    p_payload: {
      event: "postfinance_checkout_onboarded",
      praticienne_name: `${prat.first_name ?? ""} ${prat.last_name ?? ""}`.trim(),
      praticienne_code: prat.code_praticien,
      pf_environment: environment,
      pf_space_id: spaceId,
      pf_app_user_id: appUserId,
      pf_webhook_id: webhookId,
      webhook_url: webhookUrl,
      webhook_target: "cockpit-direct",
    },
    p_via: "cockpit-admin-onboard",
  });

  revalidatePath("/admin/praticiennes/onboard");
  revalidatePath("/admin");
  revalidatePath("/facturation");
  revalidatePath("/statutspostfinance");
}
