"use server";

// Canaux récoltés — un interrupteur par usage, pour chaque groupe et chaque fil (migration 2026-10-23a, fable).
// Lecture : canaux_recoltes() ; geste : canal_regler(genre, clé, usage, valeur). Les deux sont gardées à l'intérieur
// (is_owner_st6) ; la page ajoute requireSt6.

import { createClient } from "@/lib/supabase/server";

export type Canal = {
  genre: "groupe" | "fil";
  cle: string;
  nom: string | null;
  categorie: string | null;
  zones: string[] | null;
  sources: number;
  recolte: boolean;
  transcrit: boolean;
  resume_jour: boolean | null;
};

export type Usage = "recolte" | "transcrit" | "resume_jour";

export async function regler(genre: Canal["genre"], cle: string, usage: Usage, valeur: boolean): Promise<{ ok: boolean; erreur?: string }> {
  const sb = await createClient();
  const { error } = await sb.rpc("canal_regler", { p_genre: genre, p_cle: cle, p_champ: usage, p_valeur: valeur });
  return error ? { ok: false, erreur: error.message } : { ok: true };
}
