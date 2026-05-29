"use server";

// Compteurs Backlog Cercle SR — incrément/décrément + saisie absolue OCC.
// Réservé Owner OU Cercle SR. DEC Patrick 2026-05-29.

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
  if (me?.stx !== "ST6" && me?.cercle_lumiere_sr !== true) {
    throw new Error("Réservé Owner ou Cercle SR");
  }
  return { sb, me };
}

export async function bumpBacklogCounter(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const delta = parseInt(String(formData.get("delta") ?? "0"), 10);
  if (!id) throw new Error("id requis");
  if (delta !== 1 && delta !== -1) throw new Error("delta invalide (±1)");

  const { sb, me } = await assertCanWrite();

  const { data: row } = await sb
    .from("cercle_backlog_counter")
    .select("count")
    .eq("id", id)
    .maybeSingle();
  if (!row) throw new Error("Compteur introuvable");
  const next = Math.max(0, (row.count as number) + delta);
  if (next === row.count) return;

  const { error } = await sb
    .from("cercle_backlog_counter")
    .update({
      count: next,
      updated_at: new Date().toISOString(),
      updated_by_svlbh_id: me.svlbh_id,
    })
    .eq("id", id);
  if (error) throw new Error(`Compteur : ${error.message}`);
  revalidatePath("/shamanes");
}

/** Saisie absolue OCC. formData.expected_updated_at (ISO) — si la row
 *  a changé entretemps, throw "CONFLIT". */
export async function setBacklogCounterAbsolute(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const raw = String(formData.get("value") ?? "");
  const expected = String(formData.get("expected_updated_at") ?? "");
  const value = parseInt(raw, 10);
  if (!id) throw new Error("id requis");
  if (!Number.isFinite(value) || value < 0) throw new Error("Valeur invalide (≥0)");

  const { sb, me } = await assertCanWrite();

  let q = sb
    .from("cercle_backlog_counter")
    .update({
      count: value,
      updated_at: new Date().toISOString(),
      updated_by_svlbh_id: me.svlbh_id,
    })
    .eq("id", id);
  if (expected) q = q.eq("updated_at", expected);
  const { data: updated, error } = await q.select("id");
  if (error) throw new Error(`Compteur set : ${error.message}`);
  if (!updated || updated.length === 0) {
    revalidatePath("/shamanes");
    throw new Error("CONFLIT : compteur modifié par quelqu'un d'autre. Rafraîchi, ré-essaie.");
  }
  revalidatePath("/shamanes");
}
