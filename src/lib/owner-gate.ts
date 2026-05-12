// Helper Owner gate — DEC Patrick 2026-05-12 doctrine ST.
// Modules Admin / Compliance / Facturation : accès strict ST6 (Owner)
// + Cercle SR comme back-door admin (cohérence avec layout principal).
// À appeler en haut de chaque page sensible côté Cockpit.

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireOwner(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("praticienne_profile")
    .select("stx, pro_status, cercle_lumiere_sr")
    .eq("supabase_user_id", user.id)
    .maybeSingle();

  const isOwner =
    !!profile &&
    profile.pro_status === "ACTIVE" &&
    (profile.stx === "ST6" || profile.cercle_lumiere_sr === true);

  if (!isOwner) {
    redirect("/dashboard");
  }
}

export async function isOwner(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase
    .from("praticienne_profile")
    .select("stx, pro_status, cercle_lumiere_sr")
    .eq("supabase_user_id", user.id)
    .maybeSingle();

  return (
    !!profile &&
    profile.pro_status === "ACTIVE" &&
    (profile.stx === "ST6" || profile.cercle_lumiere_sr === true)
  );
}
