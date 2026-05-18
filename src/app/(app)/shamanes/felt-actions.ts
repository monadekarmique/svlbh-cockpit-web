"use server";

// Server actions pour les compteurs « ressentis » ST1/ST2 du Cercle,
// + likes. DEC Patrick 2026-05-18.

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function getMe() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error("Non authentifié");
  const { data: me } = await sb
    .from("praticienne_profile")
    .select("svlbh_id, stx, cercle_lumiere_sr")
    .eq("supabase_user_id", user.id)
    .maybeSingle();
  if (!me?.svlbh_id) throw new Error("Profil praticienne introuvable");
  return { sb, svlbhId: me.svlbh_id as string, stx: me.stx as string | null, isCercle: me.cercle_lumiere_sr === true };
}

export async function setFeltCount(formData: FormData) {
  const type = String(formData.get("type") ?? "");
  const value = Number(formData.get("value") ?? "0");
  if (type !== "ST1" && type !== "ST2") throw new Error("type invalide");
  if (!Number.isFinite(value) || value < 0 || value > 9999) throw new Error("value hors borne");
  const { sb, svlbhId } = await getMe();
  const { error } = await sb
    .from("cercle_felt_count")
    .update({ felt_value: value, updated_by_svlbh_id: svlbhId, updated_at: new Date().toISOString() })
    .eq("type", type);
  if (error) throw new Error(`Update ressenti : ${error.message}`);
  revalidatePath("/shamanes");
}

export async function toggleFeltLike(formData: FormData) {
  const type = String(formData.get("type") ?? "");
  if (type !== "ST1" && type !== "ST2") throw new Error("type invalide");
  const { sb, svlbhId } = await getMe();

  const { data: existing } = await sb
    .from("cercle_felt_count_like")
    .select("liker_svlbh_id")
    .eq("felt_count_type", type)
    .eq("liker_svlbh_id", svlbhId)
    .maybeSingle();

  if (existing) {
    const { error } = await sb
      .from("cercle_felt_count_like")
      .delete()
      .eq("felt_count_type", type)
      .eq("liker_svlbh_id", svlbhId);
    if (error) throw new Error(`Unlike : ${error.message}`);
  } else {
    const { error } = await sb
      .from("cercle_felt_count_like")
      .insert({ felt_count_type: type, liker_svlbh_id: svlbhId });
    if (error) throw new Error(`Like : ${error.message}`);
  }

  // Re-sync compteur cache
  const { count } = await sb
    .from("cercle_felt_count_like")
    .select("liker_svlbh_id", { count: "exact", head: true })
    .eq("felt_count_type", type);
  await sb
    .from("cercle_felt_count")
    .update({ likes_count: count ?? 0 })
    .eq("type", type);

  revalidatePath("/shamanes");
}
