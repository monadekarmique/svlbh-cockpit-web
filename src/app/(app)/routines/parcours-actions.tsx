"use server";

// Server actions pour la section Parcours du jour.
// DEC Patrick 2026-05-10 — Sprint A : attach/detach manuel par Patrick.

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function toggleAttachment(formData: FormData) {
  const parcoursCleId = String(formData.get("parcoursCleId") ?? "");
  const certifieeId = String(formData.get("certifieeId") ?? "");
  if (!parcoursCleId || !certifieeId) return;

  const supabase = await createClient();

  // Vérifie si l'attachement existe
  const { data: existing } = await supabase
    .from("parcours_attachment")
    .select("id")
    .eq("parcours_cle_id", parcoursCleId)
    .eq("certifiee_svlbh_id", certifieeId)
    .maybeSingle();

  if (existing) {
    // Détache
    await supabase.from("parcours_attachment").delete().eq("id", existing.id);
  } else {
    // Attache
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("parcours_attachment").insert({
      parcours_cle_id: parcoursCleId,
      certifiee_svlbh_id: certifieeId,
      attached_by_uid: user?.id ?? null,
    });
  }

  revalidatePath("/routines");
}
