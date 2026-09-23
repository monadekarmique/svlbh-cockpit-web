// Helper Owner gate — DEC Patrick 2026-05-12 doctrine ST.
// Modules Admin / Compliance : accès strict ST6 (Owner)
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

// Gate /soins-cabinet — Préparation Soins au Cabinet (DEC Patrick 2026-08-06 :
// « préparation Soins au Cabinet pour ST5+ gated ST6 »). Gate contenu strict
// sur stx (pattern requireSt5Plus) : ST6 seul, Cercle SR ne suffit pas —
// les préparations portent des ponts doctrinaux non encore mesurés.
export async function requireSt6(): Promise<void> {
  const reqHeaders = await headers();
  if (reqHeaders.get("x-svlbh-bearer-reader")) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await resolveProfile<{
    stx: string | null; pro_status: string | null;
  }>(supabase, user.id, "stx, pro_status");

  if (!profile || profile.pro_status !== "ACTIVE" || profile.stx !== "ST6") {
    redirect("/dashboard");
  }
}

// Gate /hdom — outil de décodage hDOM paramétrable (DEC Patrick 2026-08-01 :
// « la version paramétrable pour les ST5+ »). Plus strict que le cockpit
// (ST3+) : le panneau expose le vocabulaire gaté et se remplit au pendule.
export type St5PlusGate = {
  isOwner: boolean;
  svlbhId: string | null;
  stx: "ST5" | "ST6";
};

export async function requireSt5Plus(): Promise<St5PlusGate> {
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
  if (stx !== "ST5" && stx !== "ST6") {
    redirect("/dashboard");
  }

  return {
    isOwner: stx === "ST6",
    svlbhId: profile.svlbh_id as string,
    stx: stx as "ST5" | "ST6",
  };
}
