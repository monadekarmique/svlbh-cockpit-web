"use client";

// Relire un résumé « Ce que tu as manqué », le corriger, puis l'envoyer dans le groupe WhatsApp (carte d5a25199).
// Patrick, 23.10.2026 : « je ne le veux pas dans priv-1 mais dans le canal ». Rien ne part au clic : la demande attend
// 5 secondes chez l'agent du Mac, « Annuler » la retire ; ensuite l'état (parti / refusé) se lit dans pont_demandes.

import { useEffect, useState, useTransition } from "react";
import { annulerEnvoi, envoyerDansLeGroupe, suivreEnvoi, type Envoi, type Resume } from "./actions";

const date = (s: string) =>
  new Intl.DateTimeFormat("fr-CH", { timeZone: "Europe/Zurich", weekday: "long", day: "2-digit", month: "2-digit" }).format(
    new Date(`${s.slice(0, 10)}T12:00:00Z`),
  );
const heure = (s: string | null) =>
  s ? new Intl.DateTimeFormat("fr-CH", { timeZone: "Europe/Zurich", dateStyle: "short", timeStyle: "short" }).format(new Date(s)) : "—";
const aujourdhui = () => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Zurich" }).format(new Date());

// La première ligne que voient les membres du groupe : le titre et le jour (Patrick peut la changer avant d'envoyer).
const avecTitre = (r: Resume) =>
  r.texte.startsWith("📝") ? r.texte : `📝 Ce que tu as manqué — ${date(r.jour)}\n\n${r.texte}`;

const ETATS: Record<Envoi["etat"], string> = {
  attente: "part dans quelques secondes…",
  en_cours: "en cours d’envoi…",
  parti: "parti dans le groupe",
  refuse: "refusé par le pont",
  annule: "annulé — rien n’est parti",
};

function CarteResume({ r }: { r: Resume }) {
  const [texte, setTexte] = useState(avecTitre(r));
  const [demande, setDemande] = useState<{ id: string; envoi: Envoi } | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, demarrer] = useTransition();
  const g = r.abo_groupe;
  const envoyable = !!(g?.groupe_jid && g?.bridge);

  // suivre la demande jusqu'à un état final
  useEffect(() => {
    if (!demande || ["parti", "refuse", "annule"].includes(demande.envoi.etat)) return;
    const t = setTimeout(async () => {
      const e = await suivreEnvoi(demande.id, aujourdhui());
      if (e) setDemande({ id: demande.id, envoi: e });
      else setDemande({ ...demande }); // relance le suivi
    }, 2500);
    return () => clearTimeout(t);
  }, [demande]);

  const surEnvoyer = () =>
    demarrer(async () => {
      setErreur(null);
      if (!g?.groupe_jid || !g?.bridge) return setErreur("groupe sans pont ni identifiant WhatsApp");
      const res = await envoyerDansLeGroupe({
        groupe_id: r.groupe_id, jour: r.jour.slice(0, 10), texte, pont: g.bridge, groupe_jid: g.groupe_jid, nom: g.nom ?? "",
      });
      if (!res.ok || !res.id) return setErreur(res.erreur ?? "refusé");
      if (res.erreur) setErreur(res.erreur);
      setDemande({ id: res.id, envoi: { etat: "attente", resultat: null } });
    });
  const surAnnuler = () =>
    demarrer(async () => {
      if (!demande) return;
      const res = await annulerEnvoi(demande.id);
      if (res.ok) setDemande({ id: demande.id, envoi: { etat: "annule", resultat: null } });
      else setErreur(res.erreur ?? "refusé");
    });

  const fini = demande && ["parti", "refuse", "annule"].includes(demande.envoi.etat);
  const verrouille = enCours || (!!demande && demande.envoi.etat !== "annule");

  return (
    <li className={`rounded border p-4 ${demande?.envoi.etat === "parti" ? "border-green-300 bg-green-50" : ""}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="font-medium">
          {g?.nom || r.groupe_id} {g?.bridge ? <span className="text-xs text-gray-500">· {g.bridge}</span> : null}
        </div>
        <div className="text-sm text-gray-600">
          {date(r.jour)} · {(r.source_ids ?? []).length} message(s) résumé(s)
          {r.statut === "relu" ? ` · déjà envoyé ou publié le ${heure(r.relu_le)}` : ` · écrit le ${heure(r.ecrit_le)}`}
        </div>
      </div>
      <textarea
        className="mt-3 w-full rounded border p-2 font-mono text-sm leading-relaxed"
        rows={Math.min(20, Math.max(6, texte.split("\n").length + 1))}
        value={texte}
        onChange={(e) => setTexte(e.target.value)}
        disabled={verrouille}
      />
      {erreur ? <div className="mt-1 text-sm text-red-700">{erreur}</div> : null}
      <div className="mt-2 flex flex-wrap items-center gap-3">
        {!demande || demande.envoi.etat === "annule" ? (
          <button
            className="rounded bg-green-700 px-3 py-1 text-sm text-white disabled:opacity-50"
            onClick={surEnvoyer}
            disabled={enCours || !envoyable || !texte.trim()}
          >
            Envoyer dans le groupe
          </button>
        ) : null}
        {demande ? (
          <span className={`text-sm ${demande.envoi.etat === "parti" ? "text-green-700" : demande.envoi.etat === "refuse" ? "text-red-700" : "text-gray-700"}`}>
            {ETATS[demande.envoi.etat]}
            {demande.envoi.resultat ? ` — ${demande.envoi.resultat}` : ""}
          </span>
        ) : null}
        {demande && demande.envoi.etat === "attente" && !fini ? (
          <button className="rounded border px-3 py-1 text-sm disabled:opacity-50" onClick={surAnnuler} disabled={enCours}>
            Annuler
          </button>
        ) : null}
        {!envoyable ? <span className="text-xs text-red-700">ce groupe n’a pas de pont : envoi impossible</span> : null}
      </div>
    </li>
  );
}

export function ResumesClient({ brouillons, relus }: { brouillons: Resume[]; relus: Resume[] }) {
  return (
    <>
      <h2 className="mt-6 text-lg font-semibold">À relire et envoyer ({brouillons.length})</h2>
      {brouillons.length ? (
        <ul className="mt-2 space-y-4">
          {brouillons.map((r) => (
            <CarteResume key={`${r.groupe_id}-${r.jour}`} r={r} />
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-gray-600">Aucun brouillon en attente.</p>
      )}
      {relus.length ? (
        <details className="mt-8">
          <summary className="cursor-pointer text-sm text-gray-700">Déjà envoyés ou publiés ({relus.length}) — on peut les renvoyer</summary>
          <ul className="mt-2 space-y-4">
            {relus.map((r) => (
              <CarteResume key={`${r.groupe_id}-${r.jour}`} r={r} />
            ))}
          </ul>
        </details>
      ) : null}
    </>
  );
}
