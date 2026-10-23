"use server";

// « Ce que tu as manqué » — la relecture des résumés du jour par groupe Abo (cartes d5a25199 / 150be02d, fable).
// Les brouillons sont écrits par ~/svlbh-exports/resume_abo_jour.py --poser (statut « brouillon ») ; Patrick seul les lit.
// Patrick, 23.10.2026 : « mais le plus important est je ne le veux pas dans priv-1 mais dans le canal ». Le résumé part donc
// dans le GROUPE WhatsApp : la page dépose une demande d'envoi (pont_demander, comme les planches de /pathologies-entites),
// l'agent du Mac (bin/pont-envois.py) la porte au pont du groupe après 5 secondes, pendant lesquelles « Annuler » la retire.
// Une fois déposé, le résumé est marqué « relu » (abo_relire_resume) avec le texte envoyé : la base garde ce qui est parti.
// Toutes ces fonctions sont gardées à l'intérieur (is_owner_st6) ; la page ajoute requireSt6.

import { createClient } from "@/lib/supabase/server";

export type Resume = {
  groupe_id: string;
  jour: string;
  texte: string;
  statut: "brouillon" | "relu";
  ecrit_le: string | null;
  relu_le: string | null;
  source_ids: string[] | null;
  abo_groupe: { nom: string | null; groupe_jid: string | null; bridge: string | null } | null;
};

export type Envoi = { etat: "attente" | "en_cours" | "parti" | "refuse" | "annule"; resultat: string | null };

export async function envoyerDansLeGroupe(r: {
  groupe_id: string; jour: string; texte: string; pont: string; groupe_jid: string; nom: string;
}): Promise<{ ok: boolean; id?: string; erreur?: string }> {
  const sb = await createClient();
  const { data, error } = await sb.rpc("pont_demander", {
    p_genre: "message", p_pont: r.pont, p_cible_jid: r.groupe_jid, p_cible_nom: r.nom,
    p_texte: r.texte, p_membres: null, p_montage: null, p_pieces: null,
  });
  if (error) return { ok: false, erreur: error.message };
  // la trace de ce qui est parti : le texte envoyé devient le résumé « relu » du jour
  const { error: e2 } = await sb.rpc("abo_relire_resume", { p_groupe: r.groupe_id, p_jour: r.jour, p_texte: r.texte });
  return { ok: true, id: data as string, erreur: e2 ? `envoi déposé, mais trace non posée : ${e2.message}` : undefined };
}

export async function annulerEnvoi(id: string): Promise<{ ok: boolean; erreur?: string }> {
  const sb = await createClient();
  const { data, error } = await sb.rpc("pont_annuler", { p_demande: id });
  if (error) return { ok: false, erreur: error.message };
  return data === true ? { ok: true } : { ok: false, erreur: "trop tard — le résumé est déjà parti" };
}

/** L'état d'une demande déposée aujourd'hui (pont_demandes, la même lecture que /pathologies-entites). */
export async function suivreEnvoi(id: string, jour: string): Promise<Envoi | null> {
  const sb = await createClient();
  const { data } = await sb.rpc("pont_demandes", { p_jour: jour });
  const d = ((data ?? []) as { demande_id: string; etat: Envoi["etat"]; resultat: string | null }[]).find((x) => x.demande_id === id);
  return d ? { etat: d.etat, resultat: d.resultat } : null;
}
