"use server";

// Server action — Guides de Lumière (GL).
// Modifiable par TOUT membre du Cercle (ST2+ ∩ cercle_lumiere_sr=true ∩ ¬veto ∩ ACTIVE).
// DEC Patrick 2026-05-28 : compteur collaboratif, +/- par incréments unitaires, ≥ 0.

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const CERCLE_STX = ["ST2", "ST3", "ST4", "ST5", "ST6"] as const;

export async function updateGuidesLumiere(formData: FormData) {
  const targetSvlbhId = String(formData.get("svlbh_id") ?? "");
  const delta = parseInt(String(formData.get("delta") ?? "0"), 10);
  if (!targetSvlbhId) throw new Error("svlbh_id requis");
  if (delta !== 1 && delta !== -1) {
    throw new Error("delta invalide (attendu : ±1)");
  }

  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) throw new Error("Auth requise");

  // Le caller doit être membre actif du Cercle.
  const { data: me } = await sb
    .from("praticienne_profile")
    .select("stx, pro_status, cercle_lumiere_sr, cercle_veto")
    .eq("supabase_user_id", user.id)
    .maybeSingle();
  const isCercle =
    me?.pro_status === "ACTIVE" &&
    me?.cercle_lumiere_sr === true &&
    me?.cercle_veto === false &&
    (CERCLE_STX as readonly string[]).includes(me?.stx ?? "");
  if (!isCercle) {
    throw new Error("Réservé aux membres actif·ves du Cercle de Lumière");
  }

  // Lecture valeur courante (pour clamp ≥ 0) + UPDATE atomique.
  const { data: target } = await sb
    .from("praticienne_profile")
    .select("guides_lumiere")
    .eq("svlbh_id", targetSvlbhId)
    .maybeSingle();
  if (!target) throw new Error("Praticienne cible introuvable");

  const current = (target.guides_lumiere as number | null) ?? 0;
  const next = Math.max(0, current + delta);
  if (next === current) {
    // Pas de mutation nécessaire (déjà à 0 et delta -1).
    return;
  }

  const { error } = await sb
    .from("praticienne_profile")
    .update({ guides_lumiere: next })
    .eq("svlbh_id", targetSvlbhId);
  if (error) throw new Error(`GL : ${error.message}`);

  revalidatePath("/shamanes");
}
