"use client";

// Porter vers un groupe WhatsApp — Patrick, 21.10.2026 : « j'ai au banc de montage une version que je
// souhaite publier sur z1 - Abo 279 », « je veux ajouter Chloé sur Dossier entités z4 ».
//
// Rien ne part de cette page : elle DÉPOSE une demande (le cockpit est sur Render, les ponts sur le Mac).
// L'agent du Mac la ramasse après 5 secondes. Pendant ces 5 secondes, « Annuler » la retire — c'est la
// sécurité que Patrick a demandée. Un envoi, lui, est irréversible : il touche de vraies personnes.

import { useEffect, useState, useTransition } from "react";
import { annulerDemande, chercherContacts, chercherGroupes, demanderAjout, demanderEnvoi, type Contact, type Demande, type Groupe } from "./actions";

// ce que la recherche propose : un groupe connu des ponts (même absent du flux du jour), ou une personne
type Suggestion = { genre: "groupe"; g: Groupe } | { genre: "personne"; c: Contact };

// Le z2 de Patrick — s'envoyer à soi-même, pour un premier essai qui ne coûte rien
// (Patrick, 21.10 : « le premier essais peut être fait sur mon propre z2 »).
const ESSAI = { jid: "41792168200", nom: "Essai — mon z2", pont: "z2" };

const ETATS: Record<Demande["etat"], { texte: string; classe: string }> = {
  attente: { texte: "en attente", classe: "bg-amber-100 text-amber-900" },
  en_cours: { texte: "en cours", classe: "bg-blue-100 text-blue-900" },
  parti: { texte: "parti", classe: "bg-emerald-100 text-emerald-900" },
  refuse: { texte: "refusé", classe: "bg-red-100 text-red-900" },
  annule: { texte: "annulé", classe: "bg-gray-200 text-gray-700" },
};

// Patrick, 21.10 : « je veux publier de vraies planches ». Ce qui part, ce sont les PIÈCES du banc, dans
// l'ordre — chacune en un message WhatsApp, un média avec son fichier. Le texte libre est un mot d'intro
// facultatif qui part en premier. On n'aplatit plus les pièces en « [photo] ».
export function PorterClient({ groupes, demandes, pieces, apercu, montageId }: {
  groupes: Groupe[]; demandes: Demande[]; pieces: string[]; apercu: string; montageId: string | null;
}) {
  const [liste, setListe] = useState(demandes);
  const [ouvert, setOuvert] = useState<"message" | "membre" | null>(null);
  const [cible, setCible] = useState("");
  const [pont, setPont] = useState("");
  const [texte, setTexte] = useState("");
  const [numeros, setNumeros] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, demarrer] = useTransition();

  // Une PERSONNE plutôt qu'un groupe — Patrick, 21.10 : « mettre anne par exemple et me voir proposer toutes les annes
  // qui sont contact avec moi sur mes z1 à z4 ». On tape, les contacts des ponts arrivent (pont_contact, lus chaque
  // heure sur le Mac), on clique : la cible devient son numéro, le pont celui qui la connaît.
  const [personne, setPersonne] = useState<Contact | null>(null);
  const [recherche, setRecherche] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  // les groupes trouvés par la recherche s'ajoutent au menu (Patrick, 21.10 : « un groupe qui n'existe pas dans le menu déroulant »)
  const [extra, setExtra] = useState<Groupe[]>([]);
  const tousGroupes = [...groupes, ...extra.filter((e) => !groupes.some((g) => g.chat_jid === e.chat_jid))];
  useEffect(() => {
    if (recherche.trim().length < 2) return;   // la liste se vide dans le onChange, pas ici (pas de setState synchrone dans un effet)
    let vivant = true;
    const t = setTimeout(async () => {
      const [gs, cs] = await Promise.all([chercherGroupes(recherche), chercherContacts(recherche)]);
      if (vivant) setSuggestions([...gs.map((g) => ({ genre: "groupe" as const, g })), ...cs.map((c) => ({ genre: "personne" as const, c }))]);
    }, 250);
    return () => { vivant = false; clearTimeout(t); };
  }, [recherche]);
  const choisirGroupe = (g: Groupe) => {
    setPersonne(null);
    setExtra((xs) => (xs.some((x) => x.chat_jid === g.chat_jid) ? xs : [...xs, g]));
    setCible(g.chat_jid); setPont("");
    setRecherche(""); setSuggestions([]);
  };
  const choisirPersonne = (c: Contact) => {
    if (ouvert === "membre") {
      // en mode « Ajouter quelqu'un », la personne trouvée s'ajoute aux numéros
      if (c.telephone) setNumeros((n) => (n.trim() ? `${n.trim()} ${c.telephone}` : c.telephone!));
      else setErreur(`${c.nom} n'a pas de numéro connu des ponts (contact par identifiant masqué) — on ne peut pas l'ajouter à un groupe`);
    } else {
      setPersonne(c); setCible(c.destinataire); setPont(c.pont);
    }
    setRecherche(""); setSuggestions([]);
  };

  const essai = cible === ESSAI.jid;
  const versPersonne = personne !== null && cible === personne.destinataire;
  const groupe = versPersonne ? undefined : tousGroupes.find((g) => g.chat_jid === cible);
  const pontsPossibles = essai ? [ESSAI.pont] : versPersonne ? [personne.pont] : groupe?.ponts ?? [];
  const pontRetenu = pont && pontsPossibles.includes(pont) ? pont : pontsPossibles[0] ?? "";
  const nomCible = essai ? ESSAI.nom : versPersonne ? personne.nom : groupe?.chat ?? "";

  const poser = () =>
    demarrer(async () => {
      setErreur(null);
      if (!cible) { setErreur("choisis d'abord où ça va"); return; }
      if (!pontRetenu) { setErreur("aucun pont ne voit cette conversation"); return; }
      // on refuse ici, en français, plutôt que de laisser la base répondre « violates check
      // constraint pont_demande_charge » (21.10 : Patrick est tombé dessus).
      if (ouvert === "message" && !texte.trim() && pieces.length === 0) {
        setErreur("il n'y a rien à publier : pose des pièces sur le banc, ou écris un mot d'intro.");
        return;
      }
      if (ouvert === "membre" && !numeros.replace(/[^\d]/g, "")) {
        setErreur("il manque le numéro de la personne à ajouter.");
        return;
      }
      const r = ouvert === "message"
        ? await demanderEnvoi(pontRetenu, cible, nomCible, texte.trim(), montageId, pieces)
        : await demanderAjout(pontRetenu, cible, nomCible,
            numeros.split(/[\s,;]+/).map((x) => x.replace(/[^\d]/g, "")).filter((x) => x.length >= 8));
      if (!r.ok) { setErreur(r.erreur ?? "refusé"); return; }
      setListe((xs) => [{
        demande_id: r.id ?? "", genre: ouvert === "message" ? "message" : "membre", pont: pontRetenu,
        cible_nom: nomCible, cible_jid: cible, texte: ouvert === "message" ? texte.trim() || null : null,
        pieces: ouvert === "message" ? pieces : null,
        membres: ouvert === "membre" ? numeros.split(/[\s,;]+/).filter(Boolean) : null,
        etat: "attente", resultat: null, demande_le: new Date().toISOString(), traite_le: null,
      }, ...xs]);
      setOuvert(null); setNumeros(""); setTexte("");
    });

  const annuler = (id: string) =>
    demarrer(async () => {
      const r = await annulerDemande(id);
      setListe((xs) => xs.map((d) => (d.demande_id === id
        ? { ...d, etat: r.ok ? "annule" : d.etat, resultat: r.ok ? null : r.erreur ?? null } : d)));
    });

  return (
    <section className="mb-4 rounded-xl border border-sky-200 bg-sky-50/60 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-base font-semibold text-sky-900">Porter vers un groupe</h2>
        <button type="button" onClick={() => setOuvert(ouvert === "message" ? null : "message")}
          className="rounded-md border border-sky-300 bg-white px-3 py-1 text-sm font-medium text-sky-900">
          Publier le montage…
        </button>
        <button type="button" onClick={() => setOuvert(ouvert === "membre" ? null : "membre")}
          className="rounded-md border border-sky-300 bg-white px-3 py-1 text-sm font-medium text-sky-900">
          Ajouter quelqu&apos;un…
        </button>
        <span className="text-xs text-sky-900/70">rien ne part au clic : 5 secondes pour annuler</span>
      </div>

      {ouvert && (
        <div className="mt-3 space-y-2 rounded-lg bg-white p-3 ring-1 ring-sky-200">
          <div className="flex flex-wrap items-center gap-2">
            <select value={versPersonne ? "" : cible} onChange={(x) => { setPersonne(null); setCible(x.target.value); setPont(""); }}
              className="min-w-[20rem] flex-1 rounded-md border border-gray-300 px-2 py-1 text-base">
              <option value="">{versPersonne ? `→ ${personne.nom}` : "— où ça va —"}</option>
              <option value={ESSAI.jid}>{ESSAI.nom} (sans risque)</option>
              {tousGroupes.map((g) => (
                <option key={g.chat_jid} value={g.chat_jid}>{g.chat} [{g.ponts.join(", ")}]</option>
              ))}
            </select>
            <div className="relative min-w-[16rem] flex-1">
              <input value={recherche} onChange={(x) => { setRecherche(x.target.value); if (x.target.value.trim().length < 2) setSuggestions([]); }} maxLength={80}
                placeholder={ouvert === "membre" ? "ou cherche la personne : Anne, Chloé, 4179…" : "ou tape les premières lettres : un groupe (Abo 279…), une personne (Anne…)"}
                className="w-full rounded-md border border-gray-300 px-2 py-1 text-base" />
              {suggestions.length > 0 && (
                <ul className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
                  {suggestions.map((s) => s.genre === "groupe" ? (
                    <li key={`g-${s.g.chat_jid}`}>
                      <button type="button" onClick={() => choisirGroupe(s.g)}
                        className="flex w-full items-baseline justify-between gap-2 px-2 py-1 text-left text-sm hover:bg-sky-50">
                        <span className="truncate font-medium">👥 {s.g.chat}</span>
                        <span className="shrink-0 text-xs text-gray-500">groupe · {s.g.ponts.join(", ")}</span>
                      </button>
                    </li>
                  ) : (
                    <li key={`p-${s.c.pont}-${s.c.cle}`}>
                      <button type="button" onClick={() => choisirPersonne(s.c)}
                        className="flex w-full items-baseline justify-between gap-2 px-2 py-1 text-left text-sm hover:bg-sky-50">
                        <span className="truncate font-medium">{s.c.nom}</span>
                        <span className="shrink-0 text-xs text-gray-500">{s.c.pont} · {s.c.telephone ? `+${s.c.telephone}` : "sans numéro"}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {recherche.trim().length >= 2 && suggestions.length === 0 && (
                <p className="absolute z-20 mt-1 w-full rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-500 shadow">aucun groupe ni contact des ponts ne porte ce nom</p>
              )}
            </div>
            {pontsPossibles.length > 1 && (
              <select value={pontRetenu} onChange={(x) => setPont(x.target.value)}
                className="rounded-md border border-gray-300 px-2 py-1 text-base" title="par quel pont">
                {pontsPossibles.map((p) => <option key={p} value={p}>par {p}</option>)}
              </select>
            )}
          </div>

          {ouvert === "message" ? (
            <>
              <textarea value={texte} onChange={(x) => setTexte(x.target.value)} rows={2} maxLength={4000}
                placeholder="un mot d'intro, s'il en faut — il part en premier, tel quel"
                className="w-full rounded-md border border-gray-300 px-2 py-1 text-[15px] leading-relaxed" />
              {pieces.length > 0 ? (
                <div className="rounded-md bg-gray-50 p-2 ring-1 ring-gray-200">
                  <p className="mb-1 text-xs font-medium text-gray-600">
                    Puis les {pieces.length} pièce(s) du banc, dans l&apos;ordre — chacune en un message, les médias avec leur fichier :
                  </p>
                  <pre className="max-h-40 overflow-y-auto whitespace-pre-wrap text-[13px] leading-snug text-gray-800">{apercu}</pre>
                </div>
              ) : (
                <p className="text-xs text-amber-800">Le banc est vide : seul le mot d&apos;intro partirait. Pose des pièces pour publier une planche.</p>
              )}
            </>
          ) : (
            <>
              <input value={numeros} onChange={(x) => setNumeros(x.target.value)}
                placeholder="numéro(s), ex. 41792492825 — séparés par un espace ou une virgule"
                className="w-full rounded-md border border-gray-300 px-2 py-1 text-base" />
              <p className="text-xs text-gray-500">
                Chloé Gattlen : <code className="rounded bg-gray-100 px-1">41792492825</code> (fil_source, z2 et z3)
              </p>
            </>
          )}

          {cible && (
            <p className="rounded-md bg-amber-50 p-2 text-sm text-amber-900 ring-1 ring-amber-200">
              {ouvert === "message"
                ? <>Ce texte partira {versPersonne ? "à" : "dans"} <b>{nomCible}</b> par <b>{pontRetenu || "—"}</b>{essai ? "" : versPersonne ? " — une vraie personne le lira." : " — de vraies personnes le liront."}</>
                : <>Ces personnes seront ajoutées à <b>{nomCible}</b> par <b>{pontRetenu || "—"}</b>.</>}
            </p>
          )}
          <div className="flex items-center gap-2">
            <button type="button" disabled={enCours} onClick={poser}
              className="rounded-md bg-sky-800 px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-50">
              {ouvert === "message" ? "Publier" : "Ajouter"}
            </button>
            <button type="button" onClick={() => setOuvert(null)} className="text-sm underline">annuler</button>
            {erreur && <span className="text-sm text-red-700">{erreur}</span>}
          </div>
        </div>
      )}

      {liste.length > 0 && (
        <ul className="mt-3 space-y-1">
          {liste.map((d) => (
            <li key={d.demande_id} className="flex flex-wrap items-center gap-2 rounded bg-white/80 px-2 py-1 text-sm">
              <span className={"rounded-full px-2 py-0.5 text-xs font-medium " + ETATS[d.etat].classe}>{ETATS[d.etat].texte}</span>
              <span className="text-gray-500">{new Date(d.demande_le).toLocaleTimeString("fr-CH", { hour: "2-digit", minute: "2-digit" })}</span>
              <span className="font-medium">{d.cible_nom ?? d.cible_jid}</span>
              <span className="text-gray-500">· {d.pont} ·</span>
              <span className="min-w-0 flex-1 truncate text-gray-700">
                {d.genre === "message" ? (d.texte ?? "").slice(0, 80) : d.genre === "pack" ? "pack de stickers → banc" : `ajout de ${(d.membres ?? []).join(", ")}`}
              </span>
              {d.etat === "attente" && (
                <button type="button" onClick={() => annuler(d.demande_id)} className="text-xs font-medium text-red-700 underline">
                  annuler
                </button>
              )}
              {d.resultat && d.etat === "refuse" && <span className="text-xs text-red-700">{d.resultat.slice(0, 90)}</span>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
