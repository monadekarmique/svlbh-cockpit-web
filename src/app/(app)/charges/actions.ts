"use server";

import { revalidatePath } from "next/cache";
import { requireSt6 } from "@/lib/owner-gate";
import { createClient } from "@/lib/supabase/server";

// Qualifier une ligne de relevé. ⚠️ N'écrit JAMAIS dans releve_ligne :
// l'original est immuable. Seule l'annotation (rapprochement) bouge.
export async function qualifier(formData: FormData) {
  await requireSt6();
  const ligneId = String(formData.get("ligne_id") ?? "");
  const nature = String(formData.get("nature") ?? "");
  if (!ligneId || !nature) throw new Error("ligne et nature obligatoires");

  const supabase = await createClient();
  const { error } = await supabase.rpc("qualifier_ligne", {
    p_ligne: ligneId,
    p_nature: nature,
    p_imposable: nature === "charge",
    p_libelle: null,
    p_consultante: null,
  });
  if (error) throw new Error(`qualification refusée : ${error.message}`);
  revalidatePath("/charges");
}
