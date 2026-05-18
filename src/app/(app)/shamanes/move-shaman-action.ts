"use server";

// Action unifiée pour déplacer une « shamane » (ST4+ ou apprenante) entre
// n'importe quelle des 5 zones : active / hidden / formation / parcours-passif
// / cercle-akashique. DEC Patrick 2026-05-18 (formation continue ST4/ST5).
//
// Règles :
// - ST4+ vers active|hidden : upsert praticienne_daily_status, supprime
//   tout override apprenante_tier
// - ST4+ vers formation|passive|akashique : upsert apprenante_tier
//   (override temporaire, garde svlbh_id pour réactivation rapide)
// - Apprenante (sans svlbh_id) ne peut aller que vers formation|passive|akashique

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Zone = "active" | "hidden" | "formation" | "parcours-passif" | "cercle-akashique";

export async function moveShamanToZone(formData: FormData) {
  const svlbhId = String(formData.get("svlbh_id") ?? "").trim() || null;
  const name = String(formData.get("name") ?? "").trim() || null;
  const zone = String(formData.get("zone") ?? "").trim() as Zone;

  if (!svlbhId && !name) throw new Error("svlbh_id ou name requis");
  if (!["active", "hidden", "formation", "parcours-passif", "cercle-akashique"].includes(zone)) {
    throw new Error("zone invalide");
  }

  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error("Non authentifié");
  const { data: me } = await sb
    .from("praticienne_profile")
    .select("svlbh_id, stx")
    .eq("supabase_user_id", user.id)
    .maybeSingle();
  if (!me?.svlbh_id) throw new Error("Profil praticienne introuvable");
  const isOwner = me.stx === "ST6";
  const isSelf = svlbhId === me.svlbh_id;

  // Permissions :
  // - active/hidden : self OR owner
  // - formation/passive/akashique : owner only (déclassement = décision pédagogique)
  if (zone === "active" || zone === "hidden") {
    if (!isSelf && !isOwner) throw new Error("Réservé Owner pour déplacer une autre");
  } else {
    if (!isOwner) throw new Error("Réservé Owner pour déclassement formation/passive/akashique");
  }

  if (zone === "active" || zone === "hidden") {
    // Mouvement vers zones Thérapeutes : upsert daily_status + supprime override
    if (!svlbhId) throw new Error("svlbh_id requis pour zones thérapeutes");
    const { error: e1 } = await sb
      .from("praticienne_daily_status")
      .upsert(
        { svlbh_id: svlbhId, status: zone, updated_at: new Date().toISOString() },
        { onConflict: "svlbh_id" },
      );
    if (e1) throw new Error(`daily_status: ${e1.message}`);
    // Supprime tout override apprenante_tier pour cette praticienne
    const { error: e2 } = await sb
      .from("apprenante_tier")
      .delete()
      .eq("svlbh_id", svlbhId);
    if (e2) console.error("[move-shaman] delete override:", e2.message);
  } else {
    // Zones Apprenantes : upsert apprenante_tier
    let row: { name: string; svlbh_id?: string | null; tier: Zone };
    if (svlbhId) {
      // ST4+ déclassée temporairement : on récupère son nom pour name PK
      const { data: pp } = await sb
        .from("praticienne_profile")
        .select("first_name, last_name")
        .eq("svlbh_id", svlbhId)
        .maybeSingle();
      const fullName = pp ? `${pp.first_name ?? ""} ${pp.last_name ?? ""}`.trim() : svlbhId;
      row = { name: fullName, svlbh_id: svlbhId, tier: zone };
    } else if (name) {
      row = { name, tier: zone };
    } else {
      throw new Error("name ou svlbh_id requis");
    }
    const { error } = await sb
      .from("apprenante_tier")
      .upsert(
        { ...row, updated_at: new Date().toISOString(), updated_by_svlbh_id: me.svlbh_id },
        { onConflict: "name" },
      );
    if (error) throw new Error(`apprenante_tier: ${error.message}`);
  }

  revalidatePath("/shamanes");
}

export async function setNiveauxBloques(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const rawNiveaux = String(formData.get("niveaux_bloques") ?? "").trim();
  if (!name) throw new Error("name requis");
  const niveaux = rawNiveaux === ""
    ? null
    : Math.max(0, Math.min(999, Number(rawNiveaux)));

  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error("Non authentifié");
  const { data: me } = await sb
    .from("praticienne_profile")
    .select("stx")
    .eq("supabase_user_id", user.id)
    .maybeSingle();
  if (me?.stx !== "ST6") throw new Error("Réservé Owner ST6");

  const { error } = await sb
    .from("apprenante_tier")
    .update({ niveaux_bloques: niveaux, updated_at: new Date().toISOString() })
    .eq("name", name);
  if (error) throw new Error(`Niveaux bloqués: ${error.message}`);
  revalidatePath("/shamanes");
}
