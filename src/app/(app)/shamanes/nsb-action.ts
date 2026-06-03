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
  if (!Number.isFinite(n) || n < 0) throw new Error("NSB doit être ≥ 0");
  return Math.round(n);
}

export async function setApprenanteNSB(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("name requis");
  const value = parseNSB(String(formData.get("value") ?? ""));
  const expected = String(formData.get("expected_updated_at") ?? "").trim();

  const { sb, me } = await assertOwner();
  const now = new Date().toISOString();

  // UPDATE conditionnel sur expected_updated_at (OCC). Si la row existe
  // mais updated_at ≠ expected → 0 rows touchées → CONFLIT. Si la row
  // n'existe pas (premier set NSB), INSERT direct (pas de conflit possible).
  let q = sb
    .from("apprenante_tier")
    .update({
      niveaux_bloques: value,
      updated_at: now,
      updated_by_svlbh_id: me.svlbh_id,
    })
    .eq("name", name);
  if (expected) q = q.eq("updated_at", expected);
  const { data: upd, error: updErr } = await q.select("name");
  if (updErr) throw new Error(`NSB apprenante : ${updErr.message}`);
  if (!upd || upd.length === 0) {
    // Disambig : la row existe ? CONFLIT si oui, INSERT sinon.
    const { data: exists } = await sb
      .from("apprenante_tier")
      .select("name")
      .eq("name", name)
      .maybeSingle();
    if (exists && expected) {
      revalidatePath("/shamanes");
      throw new Error("CONFLIT : NSB modifié par quelqu'un d'autre. Rafraîchi, ré-essaie.");
    }
    const staticTier = APPRENANTES.find((a) => a.name === name)?.tier ?? "formation";
    const { error: insErr } = await sb
      .from("apprenante_tier")
      .insert({
        name,
        tier: staticTier,
        niveaux_bloques: value,
        updated_at: now,
        updated_by_svlbh_id: me.svlbh_id,
      });
    if (insErr) throw new Error(`NSB apprenante : ${insErr.message}`);
  }
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
  const now = new Date().toISOString();

  // UPDATE conditionnel sur expected_updated_at (OCC). Row absente → INSERT.
  let q = sb
    .from("apprenante_tier")
    .update({
      nsb_familial_count: value,
      updated_at: now,
      updated_by_svlbh_id: me.svlbh_id,
    })
    .eq("name", name);
  if (expected) q = q.eq("updated_at", expected);
  const { data: upd, error: updErr } = await q.select("name");
  if (updErr) throw new Error(`NSB famille : ${updErr.message}`);
  if (!upd || upd.length === 0) {
    const { data: exists } = await sb
      .from("apprenante_tier")
      .select("name")
      .eq("name", name)
      .maybeSingle();
    if (exists && expected) {
      revalidatePath("/shamanes");
      throw new Error("CONFLIT : NSB famille modifié par quelqu'un d'autre. Rafraîchi, ré-essaie.");
    }
    const staticTier = APPRENANTES.find((a) => a.name === name)?.tier ?? "formation";
    const { error: insErr } = await sb
      .from("apprenante_tier")
      .insert({
        name,
        tier: staticTier,
        nsb_familial_count: value,
        updated_at: now,
        updated_by_svlbh_id: me.svlbh_id,
      });
    if (insErr) throw new Error(`NSB famille : ${insErr.message}`);
  }
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
  if (updErr) throw new Error(`NSB thérapeute : ${updErr.message}`);
  if (!upd || upd.length === 0) {
    // Disambig : la row existe ? CONFLIT si oui, INSERT sinon.
    const { data: exists } = await sb
      .from("praticienne_daily_status")
      .select("svlbh_id")
      .eq("svlbh_id", svlbhId)
      .maybeSingle();
    if (exists && expected) {
      revalidatePath("/shamanes");
      throw new Error("CONFLIT : NSB modifié par quelqu'un d'autre. Rafraîchi, ré-essaie.");
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
    if (insErr) throw new Error(`NSB thérapeute : ${insErr.message}`);
  }
  revalidatePath("/shamanes");
}
