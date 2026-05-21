"use server";

// Server actions astreinte support — wrappers RPCs take_oncall / release_oncall.
// DEC Patrick 2026-05-21.

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function takeOnCall(formData: FormData) {
  const note = String(formData.get("note") ?? "").trim() || null;
  const sb = await createClient();
  const { error } = await sb.rpc("take_oncall", { p_note: note });
  if (error) throw new Error(`Prise d'astreinte échec : ${error.message}`);
  revalidatePath("/support");
}

export async function releaseOnCall() {
  const sb = await createClient();
  const { error } = await sb.rpc("release_oncall");
  if (error) throw new Error(`Fin d'astreinte échec : ${error.message}`);
  revalidatePath("/support");
}
