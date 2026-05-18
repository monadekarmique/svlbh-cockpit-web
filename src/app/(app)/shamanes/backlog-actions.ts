"use server";

// Server actions du Backlog Cercle SR.
// Visibilité : SELECT ST4+, écriture Owner ST6 + ST5 (RLS appliquée DB).
// DEC Patrick 2026-05-18.

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function getMySvlbhId() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error("Non authentifié");
  const { data: me } = await sb
    .from("praticienne_profile")
    .select("svlbh_id")
    .eq("supabase_user_id", user.id)
    .maybeSingle();
  if (!me?.svlbh_id) throw new Error("Praticienne_profile introuvable");
  return { sb, svlbhId: me.svlbh_id as string };
}

const AUTONOMY = new Set(["patrick_anime", "patrick_suit", "st4_pilote", "st4_autonome"]);

export async function addBacklogFromRelation(formData: FormData) {
  const relationId = String(formData.get("relation_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;
  if (!relationId) throw new Error("relation_id requis");
  if (!title) throw new Error("Titre requis");

  const { sb, svlbhId } = await getMySvlbhId();
  const { error } = await sb.from("cockpit_backlog_item").insert({
    ref_relation_id: relationId,
    title,
    notes,
    created_by_svlbh_id: svlbhId,
  });
  if (error) throw new Error(`Backlog (relation) : ${error.message}`);
  revalidatePath("/shamanes");
}

export async function addBacklogWithEnergie(formData: FormData) {
  const source = String(formData.get("source_description") ?? "").trim();
  const targetPrat = String(formData.get("target_praticienne_svlbh_id") ?? "").trim() || null;
  const targetCons = String(formData.get("target_consultante_id") ?? "").trim() || null;
  const intensityRaw = String(formData.get("intensity") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const title = String(formData.get("title") ?? "").trim();
  if (!source) throw new Error("Source requise");
  if (!title) throw new Error("Titre requis");

  const intensity = intensityRaw === "" ? null : Math.max(0, Math.min(100, Math.round(Number(intensityRaw))));

  const { sb, svlbhId } = await getMySvlbhId();
  const { data: energie, error: e1 } = await sb
    .from("energie_offensive_tiers")
    .insert({
      source_description: source,
      target_praticienne_svlbh_id: targetPrat,
      target_consultante_id: targetCons,
      intensity,
      notes,
      created_by_svlbh_id: svlbhId,
    })
    .select("id")
    .single();
  if (e1) throw new Error(`Énergie offensive : ${e1.message}`);

  const { error: e2 } = await sb.from("cockpit_backlog_item").insert({
    ref_energie_id: energie!.id,
    title,
    notes,
    created_by_svlbh_id: svlbhId,
  });
  if (e2) throw new Error(`Backlog (énergie) : ${e2.message}`);
  revalidatePath("/shamanes");
}

export async function setBacklogAutonomy(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const level = String(formData.get("autonomy_level") ?? "");
  if (!id) throw new Error("id requis");
  if (!AUTONOMY.has(level)) throw new Error("autonomy_level invalide");

  const { sb } = await getMySvlbhId();
  const { error } = await sb.from("cockpit_backlog_item").update({ autonomy_level: level }).eq("id", id);
  if (error) throw new Error(`Update autonomy : ${error.message}`);
  revalidatePath("/shamanes");
}

export async function archiveBacklog(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("id requis");
  const { sb } = await getMySvlbhId();
  const { error } = await sb.from("cockpit_backlog_item").update({ archived_at: new Date().toISOString() }).eq("id", id);
  if (error) throw new Error(`Archive : ${error.message}`);
  revalidatePath("/shamanes");
}
