"use server";

// Set la saturation (priorité) d'un soin commun. Upsert dans cercle_sr_saturation.
// DEC Patrick 2026-05-18.

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const REF_TYPES = new Set(["relation", "energie_offensive"]);
const LEVELS = new Set(["trois_plus", "deux", "un"]);

export async function setSoinSaturation(formData: FormData) {
  const refType = String(formData.get("ref_type") ?? "");
  const refId = String(formData.get("ref_id") ?? "");
  const level = String(formData.get("saturation_level") ?? "");
  if (!REF_TYPES.has(refType)) throw new Error("ref_type invalide");
  if (!refId) throw new Error("ref_id requis");
  if (!LEVELS.has(level)) throw new Error("saturation_level invalide");

  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error("Non authentifié");
  const { data: me } = await sb
    .from("praticienne_profile")
    .select("svlbh_id")
    .eq("supabase_user_id", user.id)
    .maybeSingle();
  if (!me?.svlbh_id) throw new Error("Praticienne_profile introuvable");

  const { error } = await sb
    .from("cercle_sr_saturation")
    .upsert(
      { ref_type: refType, ref_id: refId, saturation_level: level, updated_by_svlbh_id: me.svlbh_id, updated_at: new Date().toISOString() },
      { onConflict: "ref_type,ref_id" },
    );
  if (error) throw new Error(`Saturation : ${error.message}`);
  revalidatePath("/shamanes");
}
