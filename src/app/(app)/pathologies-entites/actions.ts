"use server";

// Page « Indexer » — les choix de Patrick (migration 2026-10-20k, fable).
// Gate = la fonction elle-même (index_decider : is_owner_st6 à l'intérieur) ; la page ajoute requireSt6.
// Ce qui est choisi ici entre au savoir de DiGiSha au passage suivant (savoir_toutes_les_2h.sh, toutes les deux heures).

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Le voir-comme (Patrick, 21.10.2026 : « j'ai une fonction voir comme qui existe »). La session vit dans la base
// (coach_view_session ; start_coach_view / end_coach_view ; portée par le COMPTE, 60 min glissantes) et la base ne
// l'applique qu'aux requêtes qui portent l'en-tête x-svlbh-surface d'une surface connue — « cockpit-web » depuis la
// migration 2026-10-21h. Lecture = ce que voit la cible ; écriture refusée par la base (index_montage_poser).
// (pas d'export : un fichier "use server" n'exporte que des fonctions async)
const SURFACE = "cockpit-web";

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
  // Patrick, 21.10 : « attacher un commentaire à chaque photo » — le mien (celui de la cible en voir-comme), migration 2026-10-21i
  commentaire?: string | null;
};

export type Zone = "lexique" | "phrase" | "savoir" | "soin";
export type Phrase = { phrase_id: string; nom: string; sens: string | null; zone: Zone; elements: string[]; consomme: boolean };

// Le direct (Patrick, 21.10.2026 : « il faut donc bâtir la possibilité d'interagir avec un canal en
// direct »). Mesuré le 21.10 : un message du groupe est écrit dans z3_message en UNE seconde — le pont
// écrit déjà en temps réel. Ce qui manquait n'était pas le captage, c'était que la page ne relisait
// jamais. chargerFlux est la MÊME lecture que celle du rendu : la page et le direct ne peuvent pas
// diverger. Les URLs signées valent une heure ; une relecture les renouvelle au passage.
export type Flux = { elements: Element[]; phrases: Phrase[]; erreurs: string[]; erreur: string | null };

// L'atelier d'une praticienne (Patrick, 21.10 : « Anne […] a accès aux groupes dans lesquels elle est
// active »). Même lecture que chargerFlux, mais par index_flux_praticienne (migration 2026-10-21e) : SES
// groupes, SES tours DiGiSha, et rien d'autre. Les médias sont signés avec SA session — la politique du
// seau l'admet (authenticated, chemin sous un UUID). Ses bancs validés viennent par index_phrases (21g).
// Avec l'en-tête de surface : en voir-comme, « ses » = ceux de la cible (effective_svlbh_id, migration 21h).
export async function chargerFluxPraticienne(jour: string): Promise<Flux> {
  const sb = await createClient({ surface: SURFACE });
  const { data, error } = await sb.rpc("index_flux_praticienne", { p_jour: jour });
  if (error) return { elements: [], phrases: [], erreurs: [], erreur: error.message };
  const elements = (data ?? []) as Element[];
  // ses bancs validés (zone « soin ») — index_phrases ne rend que les siens à une praticienne (migration 2026-10-21g)
  const { data: ph } = await sb.rpc("index_phrases", { p_jour: jour });
  const phrases = (ph ?? []) as Phrase[];
  await poserPacks(sb, elements);
  await poserCommentaires(sb, elements);
  const urls = new Map<string, string>();
  const erreurs: string[] = [];
  for (const seau of SEAUX) {
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

// les seaux où vivent les fichiers des pièces : fils, Abo, et les packs de stickers attachés au banc (21j)
const SEAUX = ["fil-medias", "abo-medias", "index-packs"];

// les packs de stickers attachés au banc (index_packs : tous pour Patrick, ceux de ses groupes pour une praticienne,
// identité effective) — une pièce « pk:<pack>:<rang> » par sticker, colonne « pack »
async function poserPacks(sb: Awaited<ReturnType<typeof createClient>>, elements: Element[]): Promise<void> {
  const { data } = await sb.rpc("index_packs");
  for (const p of (data ?? []) as Element[]) elements.push(p);
}

// mes commentaires sur ces pièces (index_commentaires : l'identité effective — la cible en voir-comme)
async function poserCommentaires(sb: Awaited<ReturnType<typeof createClient>>, elements: Element[]): Promise<void> {
  if (!elements.length) return;
  const ids = elements.map((e) => e.wa_message_id);
  const coms = new Map<string, string>();
  for (let i = 0; i < ids.length; i += 500) {
    const { data } = await sb.rpc("index_commentaires", { p_ids: ids.slice(i, i + 500) });
    for (const c of (data ?? []) as { wa_message_id: string; texte: string }[]) coms.set(c.wa_message_id, c.texte);
  }
  for (const e of elements) e.commentaire = coms.get(e.wa_message_id) ?? null;
}

export async function chargerFlux(jour: string): Promise<Flux> {
  const sb = await createClient();
  const { data, error } = await sb.rpc("index_flux", { p_jour: jour });
  if (error) return { elements: [], phrases: [], erreurs: [], erreur: error.message };
  const elements = (data ?? []) as Element[];
  const { data: ph } = await sb.rpc("index_phrases", { p_jour: jour });
  const phrases = (ph ?? []) as Phrase[];
  await poserPacks(sb, elements);
  await poserCommentaires(sb, elements);

  const urls = new Map<string, string>();
  const erreurs: string[] = [];
  for (const seau of SEAUX) {
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
  demande_id: string; genre: "message" | "membre" | "pack"; pont: string;
  cible_nom: string | null; cible_jid: string; texte: string | null; membres: string[] | null;
  pieces?: string[] | null; envoyes?: { piece: string; rang?: number; ok: boolean; id: string }[] | null;
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

// Patrick, 21.10 : « je veux publier de vraies planches ». La demande porte les PIÈCES du banc (les
// wa_message_id, dans l'ordre) : l'agent du Mac descend chaque média du seau et le porte au pont avec son
// fichier. Le texte libre, s'il y en a un, part en premier (migration 2026-10-21c).
export async function demanderEnvoi(
  pont: string, cibleJid: string, cibleNom: string, texte: string, montageId: string | null, pieces: string[],
): Promise<{ ok: boolean; id?: string; erreur?: string }> {
  const sb = await createClient();
  const { data, error } = await sb.rpc("pont_demander", {
    p_genre: "message", p_pont: pont, p_cible_jid: cibleJid, p_cible_nom: cibleNom,
    p_texte: texte || null, p_membres: null, p_montage: montageId, p_pieces: pieces.length ? pieces : null,
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

// Patrick, 21.10 : « attacher un pack de stickers ». Un pack est un message (sticker_pack) vu par un pont ; la demande
// part dans la même file que les envois (5 s d'annulation) ; l'agent du Mac exporte le ZIP du pont, dépose les stickers
// dans le seau index-packs et pose le pack (migration 2026-10-21j). Rien ne part sur WhatsApp : c'est un geste d'atelier.
export async function demanderPack(
  pont: string, chatJid: string, chatNom: string, waMessageId: string,
): Promise<{ ok: boolean; id?: string; erreur?: string }> {
  const sb = await createClient();
  const { data, error } = await sb.rpc("pont_demander", {
    p_genre: "pack", p_pont: pont, p_cible_jid: chatJid, p_cible_nom: chatNom,
    p_texte: waMessageId, p_membres: null, p_montage: null, p_pieces: null,
  });
  return error ? { ok: false, erreur: error.message } : { ok: true, id: data as string };
}

// Patrick, 21.10 : « mettre anne par exemple et me voir proposer toutes les annes qui sont contact avec moi sur mes
// z1 à z4 ». pont_contacts_chercher (migration 2026-10-21k) lit pont_contact — les noms que l'agent du Mac lit dans les
// ponts chaque heure — et rend le destinataire tel que /api/send le prend (numéro, ou <lid>@lid faute de numéro).
export type Contact = { cle: string; nom: string; pont: string; telephone: string | null; destinataire: string };

export async function chercherContacts(q: string): Promise<Contact[]> {
  if (q.trim().length < 2) return [];
  const sb = await createClient();
  const { data } = await sb.rpc("pont_contacts_chercher", { p_q: q.trim() });
  return (data ?? []) as Contact[];
}

// Patrick, 21.10 : « demander un groupe WhatsApp qui n'existe pas dans le menu déroulant en écrivant les premières lettres ».
// pont_groupes_chercher (migration 2026-10-21p) : groupe_decouvert ∪ z3_message (180 j), z1 à z4 seulement, Patrick seul.
export async function chercherGroupes(q: string): Promise<Groupe[]> {
  if (q.trim().length < 2) return [];
  const sb = await createClient();
  const { data } = await sb.rpc("pont_groupes_chercher", { p_q: q.trim() });
  return (data ?? []) as Groupe[];
}

// Patrick, 21.10 : « ajouter des packs d'outils interponts ». Les fichiers sont déjà montés au seau index-packs depuis le
// navigateur (sous sa session, dossier = packId) ; ici on pose le pack : sans groupe ni pont, visible de toute praticienne,
// publiable par n'importe quel pont (migration 2026-10-21q).
export async function creerPack(
  packId: string, nom: string, editeur: string, stickers: { rang: number; chemin: string }[],
): Promise<{ ok: boolean; erreur?: string }> {
  const sb = await createClient();
  const { error } = await sb.rpc("index_pack_creer", { p_pack_id: packId, p_nom: nom, p_editeur: editeur || null, p_stickers: stickers });
  return error ? { ok: false, erreur: error.message } : { ok: true };
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
  nom: string, zone: Zone, texte: string | null, pieces: string[], jour: string, atelier = false,
): Promise<{ ok: boolean; id?: string; erreur?: string }> {
  // atelier : avec l'en-tête de surface, pour que la base VOIE une session voir-comme et refuse d'écrire au nom de la cible
  const sb = await createClient(atelier ? { surface: SURFACE } : {});
  const { data, error } = await sb.rpc("index_montage_poser", { p_nom: nom, p_zone: zone, p_texte: texte, p_elements: pieces, p_jour: jour });
  return error ? { ok: false, erreur: error.message } : { ok: true, id: data as string };
}

// ── voir comme ───────────────────────────────────────────────────────────────
export type VoirComme = { svlbhId: string; prenom: string; nom: string };

/** La session voir-comme ouverte sur ce compte, telle que la base la voit depuis le cockpit — ou null. */
export async function voirComme(): Promise<VoirComme | null> {
  const sb = await createClient({ surface: SURFACE });
  const { data } = await sb.rpc("coach_view_target");
  if (!data) return null;
  // la fiche de la cible est lisible pendant la session (policy coach_view_read : svlbh_id = coach_view_target())
  const { data: p } = await sb.from("praticienne_profile").select("first_name, last_name").eq("svlbh_id", data as string).maybeSingle();
  return { svlbhId: data as string, prenom: p?.first_name ?? "", nom: p?.last_name ?? "" };
}

export type Cible = { svlbh_id: string; first_name: string; last_name: string | null };

/** Les praticiennes ST5 actives — les cibles que start_coach_view admet (canal z2 à z4, jamais la propriétaire). */
export async function ciblesVoirComme(): Promise<Cible[]> {
  const sb = await createClient();   // sans en-tête : l'identité réelle, propriétaire — la policy st6_owner_all rend toutes les fiches
  const { data } = await sb.from("praticienne_profile").select("svlbh_id, first_name, last_name")
    .eq("stx", "ST5").eq("pro_status", "ACTIVE").order("first_name");
  return (data ?? []) as Cible[];
}

export async function demarrerVoirComme(fd: FormData): Promise<void> {
  const cible = String(fd.get("cible") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(cible)) return;
  const sb = await createClient();
  const { error } = await sb.rpc("start_coach_view", { p_target: cible });
  if (error) redirect(`/mes-planches?erreur=${encodeURIComponent(error.message)}`);
  revalidatePath("/mes-planches");
}

export async function quitterVoirComme(): Promise<void> {
  const sb = await createClient();
  await sb.rpc("end_coach_view");
  revalidatePath("/mes-planches");
}

// ── un commentaire par pièce ─────────────────────────────────────────────────
// Patrick, 21.10.2026 : « j'aimerais pouvoir attacher un commentaire à chaque photo ». Le commentaire est à qui
// l'écrit, suit la pièce (banc, planche, Préparer, publication, montage validé). Texte vide = effacer.
// atelier : avec l'en-tête de surface, pour que la base refuse d'écrire pendant un voir-comme.
export async function commenter(id: string, texte: string, atelier = false): Promise<{ ok: boolean; erreur?: string }> {
  const sb = await createClient(atelier ? { surface: SURFACE } : {});
  const { error } = await sb.rpc("index_commenter", { p_wa_message_id: id, p_texte: texte });
  return error ? { ok: false, erreur: error.message } : { ok: true };
}

// ── DiGiSha dans la fenêtre ──────────────────────────────────────────────────
// Patrick, 21.10.2026 : « dialoguer avec DiGiSha pour des définitions ». Même contrat que la route
// /api/digisha-chat de priv.svlbh.com (mesuré le 21.10) : le serveur vlbh-energy-mcp, sur Render, prend la
// session Supabase de l'appelante en Bearer, répond { reply } et écrit le tour dans digisha_chat_log sous
// SON identité (source render-accompagnement) — d'où une pièce « dg:… » dans la colonne DiGiSha au prochain
// rafraîchissement. Aucun jeton ici : le titre d'accès est la session.
const DIGISHA_BASE = process.env.DIGISHA_BASE_URL || "https://vlbh-energy-mcp.onrender.com";

export async function dialoguerDigisha(
  messages: { role: "user" | "assistant"; content: string }[],
): Promise<{ ok: boolean; reply?: string; erreur?: string }> {
  if (!messages.length) return { ok: false, erreur: "rien à demander" };
  const sb = await createClient();
  const { data: { session } } = await sb.auth.getSession();
  if (!session?.access_token) return { ok: false, erreur: "pas de session" };
  try {
    const res = await fetch(`${DIGISHA_BASE}/digisha/accompagnement`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ messages, no_log: false }),
      signal: AbortSignal.timeout(120_000),
    });
    const data = (await res.json().catch(() => ({}))) as { reply?: string; detail?: string };
    if (!res.ok) return { ok: false, erreur: data?.detail ?? `DiGiSha : ${res.status}` };
    return { ok: true, reply: data.reply ?? "" };
  } catch {
    return { ok: false, erreur: "DiGiSha injoignable" };
  }
}
