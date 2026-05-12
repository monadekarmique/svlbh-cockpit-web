"use server";

// Server actions Kanban programmes ST1 — DEC Patrick 2026-05-12.

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function setProgramPhase(formData: FormData) {
  const code = String(formData.get("code") ?? "");
  const phase = String(formData.get("phase") ?? "");
  if (!code || !["BACKLOG", "PRE_SPRINT", "SPRINT"].includes(phase)) {
    throw new Error("code ou phase invalide");
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("st1_program")
    .update({ phase, updated_at: new Date().toISOString() })
    .eq("code", code);
  if (error) throw new Error(`Phase update échoué : ${error.message}`);
  revalidatePath("/admin/st1-referents");
}

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
