"use server";

// Relevé du lundi — les groupes découverts sur les ponts (carte 142fc42c, fable).
// Gate = les fonctions elles-mêmes (inscrire_groupe / ecarter_groupe : is_owner_st6 à l'intérieur) ; la page ajoute requireSt6.

import { createClient } from "@/lib/supabase/server";

export type Groupe = {
  groupe_jid: string;
  nom: string | null;
  bridges: string[] | null;
  participants: string[] | null;
  messages_30j: number | null;
  patrick_ecrit: boolean | null;
  dernier_message: string | null;
};

export type Inscription = { ok: boolean; erreur?: string; deja_inscrit?: boolean; membres_ajoutees?: number; reconnues_z2_z5?: number };

export async function inscrire(jid: string, categorie: "abo" | "cercle"): Promise<Inscription> {
  const sb = await createClient();
  const { data, error } = await sb.rpc("inscrire_groupe", { p_jid: jid, p_categorie: categorie });
  if (error) return { ok: false, erreur: error.message };
  const d = (data ?? {}) as { deja_inscrit?: boolean; membres_ajoutees?: number; reconnues_z2_z5?: number };
  return { ok: true, deja_inscrit: d.deja_inscrit, membres_ajoutees: d.membres_ajoutees, reconnues_z2_z5: d.reconnues_z2_z5 };
}

export async function ecarter(jid: string): Promise<{ ok: boolean; erreur?: string }> {
  const sb = await createClient();
  const { data, error } = await sb.rpc("ecarter_groupe", { p_jid: jid });
  if (error) return { ok: false, erreur: error.message };
  return data === true ? { ok: true } : { ok: false, erreur: "déjà inscrit ou introuvable" };
}
