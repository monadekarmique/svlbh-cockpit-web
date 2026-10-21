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

// Le direct (Patrick, 21.10.2026 : « il faut donc bâtir la possibilité d'interagir avec un canal en
// direct »). Mesuré le 21.10 : un message du groupe est écrit dans z3_message en UNE seconde — le pont
// écrit déjà en temps réel. Ce qui manquait n'était pas le captage, c'était que la page ne relisait
// jamais. chargerFlux est la MÊME lecture que celle du rendu : la page et le direct ne peuvent pas
// diverger. Les URLs signées valent une heure ; une relecture les renouvelle au passage.
export type Flux = { elements: Element[]; phrases: Phrase[]; erreurs: string[]; erreur: string | null };

export async function chargerFlux(jour: string): Promise<Flux> {
  const sb = await createClient();
  const { data, error } = await sb.rpc("index_flux", { p_jour: jour });
  if (error) return { elements: [], phrases: [], erreurs: [], erreur: error.message };
  const elements = (data ?? []) as Element[];
  const { data: ph } = await sb.rpc("index_phrases", { p_jour: jour });
  const phrases = (ph ?? []) as Phrase[];

  const urls = new Map<string, string>();
  const erreurs: string[] = [];
  for (const seau of ["fil-medias", "abo-medias"]) {
    const chemins = [...new Set(elements.filter((e) => e.seau === seau && e.chemin).map((e) => e.chemin as string))];
    for (let i = 0; i < chemins.length; i += 100) {
      const { data: s, error: es } = await sb.storage.from(seau).createSignedUrls(chemins.slice(i, i + 100), 3600);
      if (es) erreurs.push(`${seau} : ${es.message}`);
      for (const x of s ?? []) {
        if (x.path && x.signedUrl) urls.set(`${seau}/${x.path}`, x.signedUrl);
        else if (x.error) erreurs.push(`${seau} : ${x.error}`);
      }
    }
  }
  for (const e of elements) e.url = e.chemin && e.seau ? urls.get(`${e.seau}/${e.chemin}`) ?? null : null;
  return { elements, phrases, erreurs, erreur: null };
}

// ── porter vers un groupe WhatsApp ───────────────────────────────────────────
// Patrick, 21.10.2026 : « j'ai au banc de montage une version que je souhaite publier sur z1 - Abo 279 »,
// « je veux ajouter Chloé sur Dossier entités z4 », « je peux attendre qq secondes », « je veux cette sécurité ».
//
// Le cockpit tourne sur Render, les ponts sur le Mac de Patrick : Render ne peut pas les joindre. La page
// DÉPOSE une demande, l'agent du Mac (bin/pont-envois.py) la ramasse après 5 s et appelle le pont. Pendant
// ces 5 secondes, « Annuler » la retire et RIEN n'est parti. Un envoi, lui, est irréversible.
export type Demande = {
  demande_id: string; genre: "message" | "membre"; pont: string;
  cible_nom: string | null; cible_jid: string; texte: string | null; membres: string[] | null;
  etat: "attente" | "en_cours" | "parti" | "refuse" | "annule";
  resultat: string | null; demande_le: string; traite_le: string | null;
};
export type Groupe = { chat_jid: string; chat: string; ponts: string[] };

/** Les groupes vus par les ponts ce jour-là, avec les ponts qui les voient (un groupe peut être vu par plusieurs). */
export async function listerGroupes(jour: string): Promise<Groupe[]> {
  const { elements } = await chargerFlux(jour);
  const m = new Map<string, Groupe>();
  for (const e of elements) {
    if (!e.chat_jid?.endsWith("@g.us")) continue;
    const g = m.get(e.chat_jid) ?? { chat_jid: e.chat_jid, chat: e.chat, ponts: [] };
    if (e.bridge && !g.ponts.includes(e.bridge)) g.ponts.push(e.bridge);
    m.set(e.chat_jid, g);
  }
  return [...m.values()].map((g) => ({ ...g, ponts: g.ponts.sort() })).sort((a, b) => a.chat.localeCompare(b.chat));
}

export async function demanderEnvoi(
  pont: string, cibleJid: string, cibleNom: string, texte: string, montageId: string | null,
): Promise<{ ok: boolean; id?: string; erreur?: string }> {
  const sb = await createClient();
  const { data, error } = await sb.rpc("pont_demander", {
    p_genre: "message", p_pont: pont, p_cible_jid: cibleJid, p_cible_nom: cibleNom,
    p_texte: texte, p_membres: null, p_montage: montageId,
  });
  return error ? { ok: false, erreur: error.message } : { ok: true, id: data as string };
}

export async function demanderAjout(
  pont: string, cibleJid: string, cibleNom: string, membres: string[],
): Promise<{ ok: boolean; id?: string; erreur?: string }> {
  const sb = await createClient();
  const { data, error } = await sb.rpc("pont_demander", {
    p_genre: "membre", p_pont: pont, p_cible_jid: cibleJid, p_cible_nom: cibleNom,
    p_texte: null, p_membres: membres, p_montage: null,
  });
  return error ? { ok: false, erreur: error.message } : { ok: true, id: data as string };
}

export async function annulerDemande(id: string): Promise<{ ok: boolean; erreur?: string }> {
  const sb = await createClient();
  const { data, error } = await sb.rpc("pont_annuler", { p_demande: id });
  if (error) return { ok: false, erreur: error.message };
  return data === true ? { ok: true } : { ok: false, erreur: "trop tard — la demande est déjà partie" };
}

export async function listerDemandes(jour: string): Promise<Demande[]> {
  const sb = await createClient();
  const { data } = await sb.rpc("pont_demandes", { p_jour: jour });
  return (data ?? []) as Demande[];
}

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
