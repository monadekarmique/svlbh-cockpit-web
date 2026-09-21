"use server";

// Revue de la granularité par app (DEC Patrick 21.09.2026) — section ajoutée AVANT
// « Sessions documentées » sur /historique. Écrit dans autorisation_app via les RPC
// acces_app_accorder / acces_app_retirer, qui vérifient elles-mêmes is_owner_st6() :
// cette double garde (page + RPC) veut dire qu'un appel direct à l'API sans passer
// par l'écran est refusé de la même façon.
//
// ⚠️ JAMAIS UN DROIT AUTOMATIQUE : ce fichier n'écrit RIEN tout seul. Chaque ligne
// de autorisation_app vient d'un clic de Patrick sur cette page, jamais d'un script
// qui « rattraperait » l'état actuel des canaux.

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { PraticienneARevoir } from "./types";

export async function chargerPraticiennesARevoir(): Promise<PraticienneARevoir[]> {
  const sb = await createClient();
  const { data, error } = await sb.rpc("praticiennes_a_reviser_acces_app");
  if (error) {
    // Réservé à l'entité (is_owner_st6() côté fonction) : un non-owner reçoit
    // une liste vide plutôt qu'une erreur — la fonction elle-même filtre déjà,
    // mais un appel hors session peut échouer avant ce filtre.
    return [];
  }
  return (data ?? []) as PraticienneARevoir[];
}

export async function accorderAcces(svlbhId: string, appId: string) {
  const sb = await createClient();
  const { data, error } = await sb.rpc("acces_app_accorder", {
    p_svlbh_id: svlbhId,
    p_app_id: appId,
    p_motif: "revue cockpit.svlbh.com/historique",
  });
  if (error) throw new Error(error.message);
  revalidatePath("/historique");
  return data as { ok: boolean; error?: string };
}

export async function retirerAcces(svlbhId: string, appId: string) {
  const sb = await createClient();
  const { data, error } = await sb.rpc("acces_app_retirer", {
    p_svlbh_id: svlbhId,
    p_app_id: appId,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/historique");
  return data as { ok: boolean; retirees?: number; error?: string };
}
