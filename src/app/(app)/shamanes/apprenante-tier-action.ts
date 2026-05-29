"use server";

// Server action pour bouger une apprenante entre les 3 sous-catégories
// (formation / parcours-passif / cercle-akashique). Owner ST6 uniquement.
// DEC Patrick 2026-05-18.

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const VALID_TIERS = new Set(["st3-active", "st1-active", "formation", "parcours-passif", "cercle-akashique"]);

export async function setApprenanteTier(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const tier = String(formData.get("tier") ?? "").trim();
  if (!name) throw new Error("name requis");
  if (!VALID_TIERS.has(tier)) throw new Error("tier invalide");

  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error("Non authentifié");
  const { data: me } = await sb
    .from("praticienne_profile")
    .select("svlbh_id, stx")
    .eq("supabase_user_id", user.id)
    .maybeSingle();
  if (me?.stx !== "ST6") throw new Error("Réservé à l'Owner ST6");

  const { error } = await sb
    .from("apprenante_tier")
    .upsert(
      { name, tier, updated_at: new Date().toISOString(), updated_by_svlbh_id: me.svlbh_id },
      { onConflict: "name" },
    );
  if (error) throw new Error(`Tier apprenante : ${error.message}`);
  revalidatePath("/shamanes");
}
