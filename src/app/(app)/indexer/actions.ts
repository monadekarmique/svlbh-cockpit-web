"use server";

// Page « Indexer » — les choix de Patrick (migration 2026-10-20k, fable).
// Gate = la fonction elle-même (index_decider : is_owner_st6 à l'intérieur) ; la page ajoute requireSt6.
// Ce qui est choisi ici entre au savoir de DiGiSha au passage suivant (savoir_toutes_les_2h.sh, toutes les deux heures).

import { createClient } from "@/lib/supabase/server";

export type Element = {
  wa_message_id: string;
  colonne: string;
  bridge: string | null;
  chat_jid: string;
  chat: string;
  de_patrick: boolean;
  qui: string;
  heure: string;
  texte: string | null;
  media_type: string | null;
  chemin: string | null;
  seau: string | null;
  propose: "indexer" | "ignorer";
  raison: string | null;
  decision: "indexer" | "ignorer" | null;
  mot: string | null;
  definition: string | null;
  consomme: boolean;
  url?: string | null;
};

export type Zone = "lexique" | "phrase" | "savoir" | "soin";
export type Phrase = { phrase_id: string; nom: string; sens: string | null; zone: Zone; elements: string[]; consomme: boolean };

export async function decider(
  id: string, decision: "indexer" | "ignorer", mot: string | null, definition: string | null,
): Promise<{ ok: boolean; erreur?: string }> {
  const sb = await createClient();
  const { error } = await sb.rpc("index_decider", { p_wa_message_id: id, p_decision: decision, p_mot: mot, p_definition: definition });
  return error ? { ok: false, erreur: error.message } : { ok: true };
}

// Le banc de montage (Patrick, 20.10.2026 14h4x : « un banc de montage qui me permette de clicker sur les pièces dans un certain
// ordre et qui me permette avec valider d'envoyer dans une zone cette définition ») — index_montage_poser, migration 2026-10-20l.
export async function poserMontage(
  nom: string, zone: Zone, texte: string | null, pieces: string[], jour: string,
): Promise<{ ok: boolean; id?: string; erreur?: string }> {
  const sb = await createClient();
  const { data, error } = await sb.rpc("index_montage_poser", { p_nom: nom, p_zone: zone, p_texte: texte, p_elements: pieces, p_jour: jour });
  return error ? { ok: false, erreur: error.message } : { ok: true, id: data as string };
}
