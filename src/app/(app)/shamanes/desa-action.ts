"use server";

// Server action — attribuer / retirer une capacité DESA (Dark Entities &
// Spirit Attachments) à une praticienne du Cercle. Owner ST6 uniquement.
// DEC Patrick 2026-05-29.

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function setDesaCapacity(
  svlbhId: string,
  capacityCode: string,
  granted: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!svlbhId) return { ok: false, error: "svlbh_id requis" };
  if (!capacityCode) return { ok: false, error: "capacity_code requis" };

  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "Non authentifié" };

  const { data: me } = await sb
    .from("praticienne_profile")
    .select("svlbh_id, stx, pro_status")
    .eq("supabase_user_id", user.id)
    .maybeSingle();
  if (me?.stx !== "ST6") return { ok: false, error: "Réservé à l'Owner ST6" };

  if (granted) {
    const { error } = await sb
      .from("praticienne_desa_capacity")
      .upsert(
        {
          svlbh_id: svlbhId,
          capacity_code: capacityCode,
          granted_by: me.svlbh_id,
          granted_at: new Date().toISOString(),
        },
        { onConflict: "svlbh_id,capacity_code" },
      );
    if (error) return { ok: false, error: `INSERT : ${error.message}` };
  } else {
    const { error } = await sb
      .from("praticienne_desa_capacity")
      .delete()
      .eq("svlbh_id", svlbhId)
      .eq("capacity_code", capacityCode);
    if (error) return { ok: false, error: `DELETE : ${error.message}` };
  }

  revalidatePath("/shamanes");
  return { ok: true };
}
