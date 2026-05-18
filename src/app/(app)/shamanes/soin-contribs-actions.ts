"use server";

// Server action : ajouter une ou plusieurs ST4+ comme contributors
// d'un soin (relation) via consultante_attribution.
// Idempotent grâce à uniq_attribution_resource_praticienne.
// DEC Patrick 2026-05-18.

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addContributorsToSoin(formData: FormData) {
  const relationId = String(formData.get("relation_id") ?? "");
  const contribs = formData
    .getAll("contributor_svlbh_id")
    .map((v) => String(v).trim())
    .filter((v) => v.length > 0);
  if (!relationId) throw new Error("relation_id requis");
  if (contribs.length === 0) throw new Error("Au moins 1 ST4+ requise");

  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error("Non authentifié");
  const { data: me } = await sb
    .from("praticienne_profile")
    .select("svlbh_id")
    .eq("supabase_user_id", user.id)
    .maybeSingle();
  if (!me?.svlbh_id) throw new Error("Praticienne_profile introuvable");

  const rows = contribs.map((praticienne_svlbh_id) => ({
    resource_type: "relation",
    resource_id: relationId,
    praticienne_svlbh_id,
    attributed_by_svlbh_id: me.svlbh_id,
  }));
  const { error } = await sb
    .from("consultante_attribution")
    .upsert(rows, { onConflict: "resource_type,resource_id,praticienne_svlbh_id", ignoreDuplicates: true });
  if (error) throw new Error(`Ajout contributors : ${error.message}`);
  revalidatePath("/shamanes");
}
