"use server";

// Server action — Guides de Lumière (GL).
// Modifiable par TOUT membre du Cercle (ST2+ ∩ cercle_lumiere_sr=true ∩ ¬veto ∩ ACTIVE).
// DEC Patrick 2026-05-28 : compteur collaboratif, +/- par incréments unitaires, ≥ 0.

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/** Résultat unifié des Server Actions OCC. `conflict=true` indique qu'une
 *  autre instance a écrit avant nous ; le client doit refresh + ré-essayer.
 *  DEC Patrick 2026-05-29. */
export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; conflict?: boolean };

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
    .update({
      guides_lumiere: next,
      guides_lumiere_updated_at: new Date().toISOString(),
    })
    .eq("svlbh_id", targetSvlbhId);
  if (error) throw new Error(`GL : ${error.message}`);

  revalidatePath("/shamanes");
}

/** Set absolu GL — Owner ST6, avec OCC sur guides_lumiere_updated_at.
 *  formData attend `expected_updated_at` (ISO). Si la valeur a changé
 *  côté DB entre lecture client et submit, throw "CONFLIT" — le caller
 *  refresh et l'user re-saisit. DEC Patrick 2026-05-29. */
export async function setGuidesLumiereAbsolute(formData: FormData) {
  const targetSvlbhId = String(formData.get("svlbh_id") ?? "");
  const rawValue = String(formData.get("value") ?? "");
  const expected = String(formData.get("expected_updated_at") ?? "");
  const value = parseInt(rawValue, 10);
  if (!targetSvlbhId) throw new Error("svlbh_id requis");
  if (!Number.isFinite(value) || value < 0) {
    throw new Error("valeur invalide (entier ≥ 0)");
  }

  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) throw new Error("Auth requise");

  const { data: me } = await sb
    .from("praticienne_profile")
    .select("stx, pro_status")
    .eq("supabase_user_id", user.id)
    .maybeSingle();
  if (me?.stx !== "ST6" || me?.pro_status !== "ACTIVE") {
    throw new Error("Réservé à l'Owner ST6");
  }

  // OCC : UPDATE conditionnel sur expected timestamp. Si 0 rows touchées,
  // soit la row a disparu, soit elle a été modifiée entretemps.
  let q = sb
    .from("praticienne_profile")
    .update({ guides_lumiere: value, guides_lumiere_updated_at: new Date().toISOString() })
    .eq("svlbh_id", targetSvlbhId);
  if (expected) q = q.eq("guides_lumiere_updated_at", expected);
  const { data: updated, error } = await q.select("svlbh_id");
  if (error) throw new Error(`GL set : ${error.message}`);
  if (!updated || updated.length === 0) {
    revalidatePath("/shamanes");
    throw new Error("CONFLIT : GL modifié par quelqu'un d'autre. Page rafraîchie, ré-essaie.");
  }

  revalidatePath("/shamanes");
}
