"use client";

// Porter vers un groupe WhatsApp — Patrick, 21.10.2026 : « j'ai au banc de montage une version que je
// souhaite publier sur z1 - Abo 279 », « je veux ajouter Chloé sur Dossier entités z4 ».
//
// Rien ne part de cette page : elle DÉPOSE une demande (le cockpit est sur Render, les ponts sur le Mac).
// L'agent du Mac la ramasse après 5 secondes. Pendant ces 5 secondes, « Annuler » la retire — c'est la
// sécurité que Patrick a demandée. Un envoi, lui, est irréversible : il touche de vraies personnes.

import { useState, useTransition } from "react";
import { annulerDemande, demanderAjout, demanderEnvoi, type Demande, type Groupe } from "./actions";

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

export function PorterClient({ groupes, demandes, texteDuBanc, montageId }: {
  groupes: Groupe[]; demandes: Demande[]; texteDuBanc: string; montageId: string | null;
}) {
  const [liste, setListe] = useState(demandes);
  const [ouvert, setOuvert] = useState<"message" | "membre" | null>(null);
  const [cible, setCible] = useState("");
  const [pont, setPont] = useState("");
  // `touche` passe à vrai dès que Patrick modifie le texte à la main : à partir de là on ne l'écrase plus
  // avec le banc. Tant qu'il n'y a pas touché, le texte SUIT le banc — sinon il resterait figé à l'ouverture
  // du panneau et on publierait une version périmée (21.10 : « seul le mot test a été envoyé pas le reste »).
  const [touche, setTouche] = useState(false);
  const [saisi, setSaisi] = useState("");
  const texte = touche ? saisi : texteDuBanc;
  const setTexte = (v: string) => { setTouche(true); setSaisi(v); };
  const [numeros, setNumeros] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, demarrer] = useTransition();

  const essai = cible === ESSAI.jid;
  const groupe = groupes.find((g) => g.chat_jid === cible);
  const pontsPossibles = essai ? [ESSAI.pont] : groupe?.ponts ?? [];
  const pontRetenu = pont && pontsPossibles.includes(pont) ? pont : pontsPossibles[0] ?? "";
  const nomCible = essai ? ESSAI.nom : groupe?.chat ?? "";

  const poser = () =>
    demarrer(async () => {
      setErreur(null);
      if (!cible) { setErreur("choisis d'abord où ça va"); return; }
      if (!pontRetenu) { setErreur("aucun pont ne voit cette conversation"); return; }
      const r = ouvert === "message"
        ? await demanderEnvoi(pontRetenu, cible, nomCible, texte.trim(), montageId)
        : await demanderAjout(pontRetenu, cible, nomCible,
            numeros.split(/[\s,;]+/).map((x) => x.replace(/[^\d]/g, "")).filter((x) => x.length >= 8));
      if (!r.ok) { setErreur(r.erreur ?? "refusé"); return; }
      setListe((xs) => [{
        demande_id: r.id ?? "", genre: ouvert === "message" ? "message" : "membre", pont: pontRetenu,
        cible_nom: nomCible, cible_jid: cible, texte: ouvert === "message" ? texte.trim() : null,
        membres: ouvert === "membre" ? numeros.split(/[\s,;]+/).filter(Boolean) : null,
        etat: "attente", resultat: null, demande_le: new Date().toISOString(), traite_le: null,
      }, ...xs]);
      setOuvert(null); setNumeros("");
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
        <button type="button" onClick={() => { setOuvert(ouvert === "message" ? null : "message"); setTouche(false); }}
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
            <select value={cible} onChange={(x) => { setCible(x.target.value); setPont(""); }}
              className="min-w-[20rem] flex-1 rounded-md border border-gray-300 px-2 py-1 text-base">
              <option value="">— où ça va —</option>
              <option value={ESSAI.jid}>{ESSAI.nom} (sans risque)</option>
              {groupes.map((g) => (
                <option key={g.chat_jid} value={g.chat_jid}>{g.chat} [{g.ponts.join(", ")}]</option>
              ))}
            </select>
            {pontsPossibles.length > 1 && (
              <select value={pontRetenu} onChange={(x) => setPont(x.target.value)}
                className="rounded-md border border-gray-300 px-2 py-1 text-base" title="par quel pont">
                {pontsPossibles.map((p) => <option key={p} value={p}>par {p}</option>)}
              </select>
            )}
          </div>

          {ouvert === "message" ? (
            <>
              <textarea value={texte} onChange={(x) => setTexte(x.target.value)} rows={6} maxLength={4000}
                placeholder="le texte qui partira — relis-le, il part tel quel"
                className="w-full rounded-md border border-gray-300 px-2 py-1 text-[15px] leading-relaxed" />
              <p className="text-xs text-gray-500">{texte.trim().length} caractère(s) — ils partent tels quels.</p>
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
                ? <>Ce texte partira dans <b>{nomCible}</b> par <b>{pontRetenu || "—"}</b>{essai ? "" : " — de vraies personnes le liront."}</>
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
                {d.genre === "message" ? (d.texte ?? "").slice(0, 80) : `ajout de ${(d.membres ?? []).join(", ")}`}
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
