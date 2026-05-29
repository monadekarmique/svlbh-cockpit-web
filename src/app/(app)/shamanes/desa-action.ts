"use server";

// Server action — attribuer / retirer un état DESA à une praticienne. Deux
// axes indépendants : `granted` (capacité détenue) et `karmic_to_liberate`
// (travail karmique en cours). Owner ST6 uniquement.
// DEC Patrick 2026-05-29.

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type DesaField = "granted" | "karmic_to_liberate";

export async function setDesaCapacity(
  svlbhId: string,
  capacityCode: string,
  field: DesaField,
  value: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!svlbhId) return { ok: false, error: "svlbh_id requis" };
  if (!capacityCode) return { ok: false, error: "capacity_code requis" };
  if (field !== "granted" && field !== "karmic_to_liberate") {
    return { ok: false, error: `field invalide : ${field}` };
  }

  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "Non authentifié" };

  const { data: me } = await sb
    .from("praticienne_profile")
    .select("svlbh_id, stx, pro_status, cercle_lumiere_sr")
    .eq("supabase_user_id", user.id)
    .maybeSingle();
  // DEC Patrick 2026-05-29 : Owner ST6 OU membre du Cercle SR peuvent
  // attribuer/retirer les symboles DESA et BDEC sur n'importe quelle
  // carte (thérapeute, apprenante, ou apprenante cachée).
  if (me?.stx !== "ST6" && me?.cercle_lumiere_sr !== true) {
    return { ok: false, error: "Réservé à l'Owner ou aux membres du Cercle SR" };
  }

  // Lecture before pour calculer l'état combiné après modification.
  const { data: before } = await sb
    .from("praticienne_desa_capacity")
    .select("granted, karmic_to_liberate")
    .eq("svlbh_id", svlbhId)
    .eq("capacity_code", capacityCode)
    .maybeSingle();

  const currentGranted = before?.granted ?? false;
  const currentKarmic = before?.karmic_to_liberate ?? false;

  const nextGranted = field === "granted" ? value : currentGranted;
  const nextKarmic = field === "karmic_to_liberate" ? value : currentKarmic;

  // Si les 2 axes sont à false, on supprime la ligne (nettoyage).
  if (!nextGranted && !nextKarmic) {
    const { error } = await sb
      .from("praticienne_desa_capacity")
      .delete()
      .eq("svlbh_id", svlbhId)
      .eq("capacity_code", capacityCode);
    if (error) return { ok: false, error: `DELETE : ${error.message}` };
  } else {
    const { error } = await sb
      .from("praticienne_desa_capacity")
      .upsert(
        {
          svlbh_id: svlbhId,
          capacity_code: capacityCode,
          granted: nextGranted,
          karmic_to_liberate: nextKarmic,
          granted_by: me.svlbh_id,
          granted_at: new Date().toISOString(),
        },
        { onConflict: "svlbh_id,capacity_code" },
      );
    if (error) return { ok: false, error: `UPSERT : ${error.message}` };
  }

  revalidatePath("/shamanes");
  return { ok: true };
}
