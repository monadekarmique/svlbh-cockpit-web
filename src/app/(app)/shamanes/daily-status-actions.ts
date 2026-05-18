"use server";

// Server actions du statut quotidien des thérapeutes ST4+ + sticker
// d'attention posé par Patrick (ST6). DEC Patrick 2026-05-18.

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function getMe() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error("Non authentifié");
  const { data: me } = await sb
    .from("praticienne_profile")
    .select("svlbh_id, stx, pro_status")
    .eq("supabase_user_id", user.id)
    .maybeSingle();
  if (!me?.svlbh_id) throw new Error("Profil praticienne introuvable");
  return {
    sb,
    svlbhId: me.svlbh_id as string,
    stx: me.stx as string | null,
    isOwner: me.stx === "ST6",
  };
}

export async function setMyDailyStatus(formData: FormData) {
  const status = String(formData.get("status") ?? "");
  if (status !== "active" && status !== "hidden") throw new Error("status invalide");
  const { sb, svlbhId, stx } = await getMe();
  if (!["ST4", "ST5", "ST6"].includes(stx ?? "")) {
    throw new Error("Réservé aux thérapeutes ST4+");
  }
  const { error } = await sb
    .from("praticienne_daily_status")
    .upsert(
      { svlbh_id: svlbhId, status, updated_at: new Date().toISOString() },
      { onConflict: "svlbh_id" },
    );
  if (error) throw new Error(`Statut quotidien : ${error.message}`);
  revalidatePath("/shamanes");
}

// Patrick (ST6) seul peut poser ou retirer un sticker d'attention sur
// une thérapeute. nb_steps = nombre d'étapes nécessitant encore une
// libération (saisie manuelle pour l'instant).
export async function setAttentionSticker(formData: FormData) {
  const targetSvlbhId = String(formData.get("target_svlbh_id") ?? "");
  const rawColor = String(formData.get("attention_color") ?? "").trim();
  const rawSteps = String(formData.get("attention_steps") ?? "").trim();
  if (!targetSvlbhId) throw new Error("target_svlbh_id requis");
  const color = /^#[0-9A-Fa-f]{6}$/.test(rawColor) ? rawColor : null;
  const steps = rawSteps === "" ? null : Math.max(0, Math.min(9999, Number(rawSteps)));

  const { sb, svlbhId, isOwner } = await getMe();
  if (!isOwner) throw new Error("Réservé à Patrick (ST6)");

  // Upsert sur svlbh_id ; si la ligne n'existe pas, créer avec status=active par défaut
  const { error } = await sb
    .from("praticienne_daily_status")
    .upsert(
      {
        svlbh_id: targetSvlbhId,
        status: "active",
        attention_color: color,
        attention_steps: steps,
        attention_set_by_svlbh_id: color || steps != null ? svlbhId : null,
        attention_set_at: color || steps != null ? new Date().toISOString() : null,
      },
      { onConflict: "svlbh_id", ignoreDuplicates: false },
    );
  if (error) throw new Error(`Sticker attention : ${error.message}`);
  revalidatePath("/shamanes");
}

export async function clearAttentionSticker(formData: FormData) {
  const targetSvlbhId = String(formData.get("target_svlbh_id") ?? "");
  const { sb, isOwner } = await getMe();
  if (!isOwner) throw new Error("Réservé à Patrick (ST6)");
  const { error } = await sb
    .from("praticienne_daily_status")
    .update({
      attention_color: null,
      attention_steps: null,
      attention_set_by_svlbh_id: null,
      attention_set_at: null,
    })
    .eq("svlbh_id", targetSvlbhId);
  if (error) throw new Error(`Clear sticker : ${error.message}`);
  revalidatePath("/shamanes");
}
