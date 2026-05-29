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
