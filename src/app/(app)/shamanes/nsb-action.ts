"use server";

// Activation / mise à jour du NSB (Niveaux Shamaniques Bloqués) directement
// depuis les cartes /shamanes. Owner ST6 uniquement. 2 cibles :
//  - apprenantes (statiques APPRENANTES) → apprenante_tier.niveaux_bloques
//    indexé par `name` (l'apprenante peut ne pas avoir de svlbh_id réel).
//  - thérapeutes (DB praticienne_profile) → praticienne_daily_status.attention_steps
//    (override manuel ; remplace la somme calculée des relations bloquées).
// DEC Patrick 2026-05-29.

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { APPRENANTES } from "@/lib/cercle/shamanes";

async function assertOwner() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error("Non authentifié");
  const { data: me } = await sb
    .from("praticienne_profile")
    .select("svlbh_id, stx")
    .eq("supabase_user_id", user.id)
    .maybeSingle();
  if (me?.stx !== "ST6") throw new Error("Réservé à l'Owner ST6");
  return { sb, me };
}

function parseNSB(raw: string | null): number | null {
  if (raw == null) return null;
  const s = raw.trim();
  if (s === "") return null;
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) throw new Error("NSB doit être ≥ 0");
  return Math.round(n);
}

export async function setApprenanteNSB(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("name requis");
  const value = parseNSB(String(formData.get("value") ?? ""));

  const { sb, me } = await assertOwner();
  const now = new Date().toISOString();

  // apprenante_tier.tier est NOT NULL. UPDATE en premier pour ne pas
  // toucher tier ; INSERT si la row n'existe pas avec le tier statique
  // de APPRENANTES en fallback.
  const { data: upd, error: updErr } = await sb
    .from("apprenante_tier")
    .update({
      niveaux_bloques: value,
      updated_at: now,
      updated_by_svlbh_id: me.svlbh_id,
    })
    .eq("name", name)
    .select("name");
  if (updErr) throw new Error(`NSB apprenante : ${updErr.message}`);
  if (!upd || upd.length === 0) {
    const staticTier = APPRENANTES.find((a) => a.name === name)?.tier ?? "formation";
    const { error: insErr } = await sb
      .from("apprenante_tier")
      .insert({
        name,
        tier: staticTier,
        niveaux_bloques: value,
        updated_at: now,
        updated_by_svlbh_id: me.svlbh_id,
      });
    if (insErr) throw new Error(`NSB apprenante : ${insErr.message}`);
  }
  revalidatePath("/shamanes");
}

export async function setTherapeuteNSB(formData: FormData) {
  const svlbhId = String(formData.get("svlbh_id") ?? "").trim();
  if (!svlbhId) throw new Error("svlbh_id requis");
  const value = parseNSB(String(formData.get("value") ?? ""));

  const { sb, me } = await assertOwner();
  const now = new Date().toISOString();

  // praticienne_daily_status.status est NOT NULL. UPDATE en premier pour
  // ne pas écraser le status existant ; INSERT seulement si la row
  // n'existe pas (status='active' par défaut, écrasé ensuite par le
  // workflow Me cacher / Me réactiver).
  const { data: upd, error: updErr } = await sb
    .from("praticienne_daily_status")
    .update({
      attention_steps: value,
      attention_set_by_svlbh_id: me.svlbh_id,
      attention_set_at: now,
      updated_at: now,
    })
    .eq("svlbh_id", svlbhId)
    .select("svlbh_id");
  if (updErr) throw new Error(`NSB thérapeute : ${updErr.message}`);
  if (!upd || upd.length === 0) {
    const { error: insErr } = await sb
      .from("praticienne_daily_status")
      .insert({
        svlbh_id: svlbhId,
        status: "active",
        attention_steps: value,
        attention_set_by_svlbh_id: me.svlbh_id,
        attention_set_at: now,
      });
    if (insErr) throw new Error(`NSB thérapeute : ${insErr.message}`);
  }
  revalidatePath("/shamanes");
}
