"use server";

// Activation / mise à jour du NSB (Niveaux Shamaniques Bloqués) directement
// depuis les cartes /shamanes. Owner ST6 uniquement. 2 cibles :
//  - apprenantes (statiques APPRENANTES) → apprenante_tier.niveaux_bloques
//    indexé par `name` (l'apprenante peut ne pas avoir de svlbh_id réel).
//  - thérapeutes (DB praticienne_profile) → praticienne_daily_status.attention_steps
//    (override manuel ; remplace la somme calculée des relations bloquées).
// DEC Patrick 2026-05-29.

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { APPRENANTES } from "@/lib/cercle/shamanes";

async function assertOwner() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error("Non authentifié");
  const { data: me } = await sb
    .from("praticienne_profile")
    .select("svlbh_id, stx, cercle_lumiere_sr")
    .eq("supabase_user_id", user.id)
    .maybeSingle();
  // DEC Patrick 2026-05-29 : Cercle SR peut aussi éditer le NSB.
  if (me?.stx !== "ST6" && me?.cercle_lumiere_sr !== true) {
    throw new Error("Réservé à l'Owner ou aux membres du Cercle SR");
  }
  return { sb, me };
}

function parseNSB(raw: string | null): number | null {
  if (raw == null) return null;
  const s = raw.trim();
  if (s === "") return null;
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) throw new Error("NBB doit être ≥ 0");
  return Math.round(n);
}

/** Écrit des colonnes de la ligne apprenante_tier d'une apprenante, OCC sur updated_at (row absente → INSERT).
 *  ⚠️ Un CONFLIT ne se lève que si QUELQU'UN D'AUTRE a écrit depuis la lecture (28.10.2026). NBB, NBB famille et
 *  son libellé partagent la même ligne et le même updated_at, et la page met ~5 s à se rafraîchir après un
 *  enregistrement (mesuré le 28.10 : POST /shamanes 5,2–5,9 s) : corriger deux pastilles de la même carte coup sur
 *  coup partait avec le jeton d'avant ma propre écriture → « modifié par quelqu'un d'autre » alors que c'était moi. */
async function ecrireApprenante(
  sb: Awaited<ReturnType<typeof createClient>>,
  moi: string,
  name: string,
  champs: Record<string, unknown>,
  expected: string,
  libelle: string,
  quoi: string,
) {
  const ligne = { ...champs, updated_at: new Date().toISOString(), updated_by_svlbh_id: moi };
  let q = sb.from("apprenante_tier").update(ligne).eq("name", name);
  if (expected) q = q.eq("updated_at", expected);
  const { data: upd, error: updErr } = await q.select("name");
  if (updErr) throw new Error(`${libelle} : ${updErr.message}`);
  if (upd && upd.length > 0) return;
  // Disambig : la row existe ? CONFLIT si quelqu'un d'autre l'a écrite, INSERT si elle n'existe pas.
  const { data: exists } = await sb
    .from("apprenante_tier")
    .select("name, updated_by_svlbh_id")
    .eq("name", name)
    .maybeSingle();
  if (exists && expected) {
    if (exists.updated_by_svlbh_id !== moi) {
      revalidatePath("/shamanes");
      throw new Error(`CONFLIT : ${quoi} modifié par quelqu'un d'autre. Rafraîchi, ré-essaie.`);
    }
    // Le dernier écrivain, c'est moi : mon enregistrement précédent, pas un conflit.
    const { data: re, error: reErr } = await sb
      .from("apprenante_tier")
      .update(ligne)
      .eq("name", name)
      .select("name");
    if (reErr) throw new Error(`${libelle} : ${reErr.message}`);
    if (!re || re.length === 0) throw new Error(`${libelle} : écriture refusée par la base`);
    return;
  }
  const staticTier = APPRENANTES.find((a) => a.name === name)?.tier ?? "formation";
  const { error: insErr } = await sb
    .from("apprenante_tier")
    .insert({ name, tier: staticTier, ...ligne });
  if (insErr) throw new Error(`${libelle} : ${insErr.message}`);
}

export async function setApprenanteNSB(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("name requis");
  const value = parseNSB(String(formData.get("value") ?? ""));
  const expected = String(formData.get("expected_updated_at") ?? "").trim();

  const { sb, me } = await assertOwner();
  await ecrireApprenante(sb, me.svlbh_id, name, { niveaux_bloques: value }, expected, "NBB apprenante", "NBB");
  revalidatePath("/shamanes");
}

/** NSB famille — compteur de la branche transgénérationnelle propre de
 *  l'apprenante (pastille verte « NSB famille · N »). Même technique que GL /
 *  niveaux_bloques : valeur persistée en DB (apprenante_tier.nsb_familial_count),
 *  éditable inline, OCC sur updated_at. Vide = retire l'override (retombe sur le
 *  fallback statique APPRENANTES). DEC Patrick 2026-06-03. */
export async function setApprenanteNSBFamilial(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("name requis");
  const value = parseNSB(String(formData.get("value") ?? ""));
  const expected = String(formData.get("expected_updated_at") ?? "").trim();

  const { sb, me } = await assertOwner();
  await ecrireApprenante(sb, me.svlbh_id, name, { nsb_familial_count: value }, expected, "NBB famille", "NBB famille");
  revalidatePath("/shamanes");
}

/** NSB famille — libellé (description) de la pastille verte. Override DB
 *  apprenante_tier.nsb_familial_description, OCC sur updated_at, vide = retire
 *  l'override (retombe sur le static). DEC Patrick 2026-06-03. */
export async function setApprenanteNSBFamilialDescription(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("name requis");
  const raw = String(formData.get("value") ?? "").trim();
  const value = raw === "" ? null : raw;
  const expected = String(formData.get("expected_updated_at") ?? "").trim();

  const { sb, me } = await assertOwner();
  await ecrireApprenante(
    sb, me.svlbh_id, name, { nsb_familial_description: value }, expected, "NBB famille (libellé)", "NBB famille",
  );
  revalidatePath("/shamanes");
}

export async function setTherapeuteNSB(formData: FormData) {
  const svlbhId = String(formData.get("svlbh_id") ?? "").trim();
  if (!svlbhId) throw new Error("svlbh_id requis");
  const value = parseNSB(String(formData.get("value") ?? ""));
  const expected = String(formData.get("expected_updated_at") ?? "").trim();

  const { sb, me } = await assertOwner();
  const now = new Date().toISOString();

  // UPDATE conditionnel sur expected_updated_at (OCC). status reste
  // intact (UPDATE ne touche que les colonnes données).
  let q = sb
    .from("praticienne_daily_status")
    .update({
      attention_steps: value,
      attention_set_by_svlbh_id: me.svlbh_id,
      attention_set_at: now,
      updated_at: now,
    })
    .eq("svlbh_id", svlbhId);
  if (expected) q = q.eq("updated_at", expected);
  const { data: upd, error: updErr } = await q.select("svlbh_id");
  if (updErr) throw new Error(`NBB thérapeute : ${updErr.message}`);
  if (!upd || upd.length === 0) {
    // Disambig : la row existe ? CONFLIT si oui, INSERT sinon.
    const { data: exists } = await sb
      .from("praticienne_daily_status")
      .select("svlbh_id, attention_set_by_svlbh_id, attention_set_at")
      .eq("svlbh_id", svlbhId)
      .maybeSingle();
    if (exists && expected) {
      // ⚠️ CONFLIT seulement si QUELQU'UN D'AUTRE a posé un NBB depuis ma lecture (28.10.2026). updated_at bouge
      // aussi quand le statut change, et la carte pouvait garder un jeton périmé : le NBB était refusé alors que
      // personne n'y avait touché.
      const autre =
        exists.attention_set_by_svlbh_id !== me.svlbh_id &&
        exists.attention_set_at != null &&
        new Date(exists.attention_set_at) > new Date(expected);
      if (autre) {
        revalidatePath("/shamanes");
        throw new Error("CONFLIT : NBB modifié par quelqu'un d'autre. Rafraîchi, ré-essaie.");
      }
      const { data: re, error: reErr } = await sb
        .from("praticienne_daily_status")
        .update({
          attention_steps: value,
          attention_set_by_svlbh_id: me.svlbh_id,
          attention_set_at: now,
          updated_at: now,
        })
        .eq("svlbh_id", svlbhId)
        .select("svlbh_id");
      if (reErr) throw new Error(`NBB thérapeute : ${reErr.message}`);
      if (!re || re.length === 0) throw new Error("NBB thérapeute : écriture refusée par la base");
      revalidatePath("/shamanes");
      return;
    }
    const { error: insErr } = await sb
      .from("praticienne_daily_status")
      .insert({
        svlbh_id: svlbhId,
        status: "active",
        attention_steps: value,
        attention_set_by_svlbh_id: me.svlbh_id,
        attention_set_at: now,
      });
    if (insErr) throw new Error(`NBB thérapeute : ${insErr.message}`);
  }
  revalidatePath("/shamanes");
}
