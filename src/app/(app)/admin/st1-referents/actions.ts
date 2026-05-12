"use server";

// Add/remove référents par thème ST1 — DEC Patrick 2026-05-12.
// RLS st1_theme_referent_write_owner exige stx=ST6 → gate au niveau Postgres.

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addReferent(formData: FormData) {
  const theme = String(formData.get("theme") ?? "");
  const svlbhId = String(formData.get("svlbh_id") ?? "");
  if (!theme || !svlbhId) throw new Error("theme ou svlbh_id manquant");

  const supabase = await createClient();
  const { error } = await supabase
    .from("st1_theme_referent")
    .insert({ theme, referent_svlbh_id: svlbhId });
  if (error && error.code !== "23505") {
    throw new Error(`Add référent échoué : ${error.message}`);
  }
  revalidatePath("/admin/st1-referents");
}

export async function removeReferent(formData: FormData) {
  const theme = String(formData.get("theme") ?? "");
  const svlbhId = String(formData.get("svlbh_id") ?? "");
  if (!theme || !svlbhId) throw new Error("theme ou svlbh_id manquant");

  const supabase = await createClient();
  const { error } = await supabase
    .from("st1_theme_referent")
    .delete()
    .eq("theme", theme)
    .eq("referent_svlbh_id", svlbhId);
  if (error) throw new Error(`Remove référent échoué : ${error.message}`);
  revalidatePath("/admin/st1-referents");
}
