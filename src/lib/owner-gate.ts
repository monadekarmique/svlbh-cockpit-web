// Helper Owner gate — DEC Patrick 2026-05-12 doctrine ST.
// Modules Admin / Compliance / Facturation : accès strict ST6 (Owner)
// + Cercle SR comme back-door admin (cohérence avec layout principal).
// À appeler en haut de chaque page sensible côté Cockpit.
//
// DEC Patrick 2026-05-20 — bypass Bearer reader si présent : le middleware
// a déjà validé scope+allowed_paths, pas besoin de re-checker isOwner.

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { resolveProfile } from "@/lib/resolve-profile";

export async function requireOwner(): Promise<void> {
  // Bearer reader bypass — multi-instances IA
  const reqHeaders = await headers();
  if (reqHeaders.get("x-svlbh-bearer-reader")) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await resolveProfile<{
    stx: string | null; pro_status: string | null; cercle_lumiere_sr: boolean | null;
  }>(supabase, user.id, "stx, pro_status, cercle_lumiere_sr");

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

  const profile = await resolveProfile<{
    stx: string | null; pro_status: string | null; cercle_lumiere_sr: boolean | null;
  }>(supabase, user.id, "stx, pro_status, cercle_lumiere_sr");

  return (
    !!profile &&
    profile.pro_status === "ACTIVE" &&
    (profile.stx === "ST6" || profile.cercle_lumiere_sr === true)
  );
}

// Gate /facturation — ST4+ peut saisir ses propres paiements manuels en
// attendant l'intégration PostFinanceCheckout. DEC Patrick 2026-06-04 :
// Owner = ST6 strict pour cette page (Cercle SR ne suffit PAS ici,
// contrairement au reste du cockpit), cohérent avec la policy RLS
// `invoice_st6_owner_all` basée sur is_owner_st6().
// Conséquence : Cornelia/Flavia/Anne (ST4-5 + Cercle SR) voient leurs
// propres factures uniquement.
export type St4PlusGate = {
  isOwner: boolean;
  svlbhId: string | null;
  stx: "ST4" | "ST5" | "ST6";
};

export async function requireSt4Plus(): Promise<St4PlusGate> {
  const reqHeaders = await headers();
  if (reqHeaders.get("x-svlbh-bearer-reader")) {
    return { isOwner: true, svlbhId: null, stx: "ST6" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await resolveProfile<{
    svlbh_id: string | null; stx: string | null; pro_status: string | null;
  }>(supabase, user.id, "svlbh_id, stx, pro_status");

  if (!profile || profile.pro_status !== "ACTIVE") {
    redirect("/dashboard");
  }

  const stx = profile.stx as string;
  const allowed = stx === "ST4" || stx === "ST5" || stx === "ST6";
  if (!allowed) {
    redirect("/dashboard");
  }

  const isOwner = stx === "ST6";

  return {
    isOwner,
    svlbhId: profile.svlbh_id as string,
    stx: stx as "ST4" | "ST5" | "ST6",
  };
}
