"use server";

// « Ce que tu as manqué » — la relecture des résumés du jour par groupe Abo (cartes d5a25199 / 150be02d, fable).
// Les brouillons sont écrits la nuit par ~/svlbh-exports/resume_abo_jour.py --poser (statut « brouillon ») ; Patrick seul
// les lit. Publier = abo_relire_resume(groupe, jour[, texte]) : la fonction est gardée à l'intérieur (is_owner_st6 ou
// service) ; les membres du groupe lisent ensuite le résumé « relu » dans Priv-1 (soufflet en tête du jour).

import { createClient } from "@/lib/supabase/server";

export type Resume = {
  groupe_id: string;
  jour: string;
  texte: string;
  statut: "brouillon" | "relu";
  ecrit_le: string | null;
  relu_le: string | null;
  source_ids: string[] | null;
  abo_groupe: { nom: string | null } | null;
};

export async function publier(groupe: string, jour: string, texte?: string): Promise<{ ok: boolean; erreur?: string; relu_le?: string }> {
  const sb = await createClient();
  const { data, error } = await sb.rpc("abo_relire_resume", {
    p_groupe: groupe,
    p_jour: jour,
    ...(texte && texte.trim() ? { p_texte: texte } : {}),
  });
  if (error) return { ok: false, erreur: error.message };
  return { ok: true, relu_le: (data as { relu_le?: string } | null)?.relu_le };
}
