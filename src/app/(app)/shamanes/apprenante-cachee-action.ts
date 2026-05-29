"use server";

// Apprenantes cachées sur les cartes thérapeutes — sub-cards éditables
// par l'Owner ou un membre du Cercle SR. Chaque incrément crée une
// nouvelle row (avec svlbh_id synthétique pour DESA/BDEC capacities).
// DEC Patrick 2026-05-29.

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function assertCanWrite() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error("Non authentifié");
  const { data: me } = await sb
    .from("praticienne_profile")
    .select("svlbh_id, stx, cercle_lumiere_sr")
    .eq("supabase_user_id", user.id)
    .maybeSingle();
  if (!me) throw new Error("Profil introuvable");
  if (me.stx !== "ST6" && !me.cercle_lumiere_sr) {
    throw new Error("Réservé à l'Owner ou aux membres du Cercle SR");
  }
  return { sb, me };
}

export async function addApprenanteCachee(formData: FormData) {
  const hostSvlbhId = String(formData.get("host_svlbh_id") ?? "").trim();
  if (!hostSvlbhId) throw new Error("host_svlbh_id requis");
  const { sb, me } = await assertCanWrite();

  // display_order = max + 1 parmi les cachées de cet hôte.
  const { data: existing } = await sb
    .from("apprenante_cachee")
    .select("display_order")
    .eq("host_svlbh_id", hostSvlbhId)
    .order("display_order", { ascending: false })
    .limit(1);
  const nextOrder = (existing && existing[0]?.display_order != null)
    ? (existing[0].display_order as number) + 1
    : 0;

  const { error } = await sb
    .from("apprenante_cachee")
    .insert({
      host_svlbh_id: hostSvlbhId,
      display_order: nextOrder,
      created_by_svlbh_id: me.svlbh_id,
    });
  if (error) throw new Error(`Apprenante cachée : ${error.message}`);
  revalidatePath("/shamanes");
}

export async function removeApprenanteCachee(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) throw new Error("id requis");
  const { sb } = await assertCanWrite();
  // Récupère le svlbh_id synthétique pour nettoyer les DESA/BDEC liées.
  const { data: row } = await sb
    .from("apprenante_cachee")
    .select("svlbh_id")
    .eq("id", id)
    .maybeSingle();
  if (row?.svlbh_id) {
    await sb
      .from("praticienne_desa_capacity")
      .delete()
      .eq("svlbh_id", row.svlbh_id);
  }
  const { error } = await sb
    .from("apprenante_cachee")
    .delete()
    .eq("id", id);
  if (error) throw new Error(`Apprenante cachée : ${error.message}`);
  revalidatePath("/shamanes");
}

/** Fixe le nombre de cachées d'un hôte à une valeur cible (clone GL).
 *  - target > current → INSERT (target - current) nouvelles rows.
 *  - target < current → DELETE les rows aux display_order les plus élevés
 *    + nettoie leurs DESA/BDEC capacities.
 *  - target = 0 → tout supprimer.
 *  DEC Patrick 2026-05-29. */
export async function setApprenanteCacheeCount(formData: FormData) {
  const hostSvlbhId = String(formData.get("host_svlbh_id") ?? "").trim();
  if (!hostSvlbhId) throw new Error("host_svlbh_id requis");
  const rawTarget = String(formData.get("count") ?? "").trim();
  const target = Number(rawTarget);
  if (!Number.isFinite(target) || target < 0) throw new Error("count doit être ≥ 0");
  const targetInt = Math.round(target);

  const { sb, me } = await assertCanWrite();

  const { data: existing } = await sb
    .from("apprenante_cachee")
    .select("id, svlbh_id, display_order")
    .eq("host_svlbh_id", hostSvlbhId)
    .order("display_order", { ascending: true });
  const current = (existing ?? []) as Array<{ id: string; svlbh_id: string; display_order: number }>;
  const currentCount = current.length;

  if (targetInt > currentCount) {
    // INSERT diff
    const toInsert = Array.from({ length: targetInt - currentCount }, (_, i) => ({
      host_svlbh_id: hostSvlbhId,
      display_order: (current[currentCount - 1]?.display_order ?? -1) + 1 + i,
      created_by_svlbh_id: me.svlbh_id,
    }));
    const { error } = await sb.from("apprenante_cachee").insert(toInsert);
    if (error) throw new Error(`Cachées (insert) : ${error.message}`);
  } else if (targetInt < currentCount) {
    // DELETE les (currentCount - targetInt) dernières (display_order top).
    const toDelete = current.slice(targetInt); // garde les targetInt premières
    const ids = toDelete.map((r) => r.id);
    const svlbhIds = toDelete.map((r) => r.svlbh_id);
    if (svlbhIds.length > 0) {
      await sb.from("praticienne_desa_capacity").delete().in("svlbh_id", svlbhIds);
    }
    const { error } = await sb.from("apprenante_cachee").delete().in("id", ids);
    if (error) throw new Error(`Cachées (delete) : ${error.message}`);
  }
  revalidatePath("/shamanes");
}

export async function setApprenanteCacheeRole(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) throw new Error("id requis");
  const role = String(formData.get("role") ?? "").trim() || null;
  const { sb } = await assertCanWrite();
  const { error } = await sb
    .from("apprenante_cachee")
    .update({ role, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(`Apprenante cachée : ${error.message}`);
  revalidatePath("/shamanes");
}
