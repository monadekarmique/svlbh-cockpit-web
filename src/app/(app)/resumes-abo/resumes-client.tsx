"use client";

// Relire un brouillon « Ce que tu as manqué » : le publier tel quel, ou le corriger puis le publier (carte d5a25199).

import { useState, useTransition } from "react";
import { publier, type Resume } from "./actions";

const date = (s: string) =>
  new Intl.DateTimeFormat("fr-CH", { timeZone: "Europe/Zurich", weekday: "long", day: "2-digit", month: "2-digit" }).format(
    new Date(`${s.slice(0, 10)}T12:00:00Z`),
  );
const heure = (s: string | null) =>
  s ? new Intl.DateTimeFormat("fr-CH", { timeZone: "Europe/Zurich", dateStyle: "short", timeStyle: "short" }).format(new Date(s)) : "—";

function Brouillon({ r }: { r: Resume }) {
  const [texte, setTexte] = useState(r.texte);
  const [publie, setPublie] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, demarrer] = useTransition();
  const corrige = texte.trim() !== r.texte.trim();

  const surPublier = () =>
    demarrer(async () => {
      setErreur(null);
      const res = await publier(r.groupe_id, r.jour.slice(0, 10), corrige ? texte : undefined);
      if (!res.ok) return setErreur(res.erreur ?? "refusé");
      setPublie(res.relu_le ?? new Date().toISOString());
    });

  return (
    <li className={`rounded border p-4 ${publie ? "border-green-300 bg-green-50" : ""}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="font-medium">{r.abo_groupe?.nom || r.groupe_id}</div>
        <div className="text-sm text-gray-600">
          {date(r.jour)} · {(r.source_ids ?? []).length} message(s) résumé(s) · écrit le {heure(r.ecrit_le)}
        </div>
      </div>
      <textarea
        className="mt-3 w-full rounded border p-2 font-mono text-sm leading-relaxed"
        rows={Math.min(18, Math.max(5, texte.split("\n").length + 1))}
        value={texte}
        onChange={(e) => setTexte(e.target.value)}
        disabled={enCours || !!publie}
      />
      {erreur ? <div className="mt-1 text-sm text-red-700">{erreur}</div> : null}
      <div className="mt-2 flex items-center gap-3">
        {publie ? (
          <span className="text-sm text-green-700">Publié le {heure(publie)} : les membres le lisent dans Priv-1.</span>
        ) : (
          <>
            <button className="rounded bg-green-700 px-3 py-1 text-sm text-white disabled:opacity-50" onClick={surPublier} disabled={enCours}>
              {corrige ? "Publier la version corrigée" : "Publier"}
            </button>
            {corrige ? (
              <button className="rounded border px-3 py-1 text-sm disabled:opacity-50" onClick={() => setTexte(r.texte)} disabled={enCours}>
                Revenir au brouillon
              </button>
            ) : null}
          </>
        )}
      </div>
    </li>
  );
}

export function ResumesClient({ brouillons, relus }: { brouillons: Resume[]; relus: Resume[] }) {
  return (
    <>
      <h2 className="mt-6 text-lg font-semibold">À relire ({brouillons.length})</h2>
      {brouillons.length ? (
        <ul className="mt-2 space-y-4">
          {brouillons.map((r) => (
            <Brouillon key={`${r.groupe_id}-${r.jour}`} r={r} />
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-gray-600">Aucun brouillon en attente.</p>
      )}
      {relus.length ? (
        <details className="mt-8">
          <summary className="cursor-pointer text-sm text-gray-700">Déjà publiés ({relus.length})</summary>
          <ul className="mt-2 space-y-3">
            {relus.map((r) => (
              <li key={`${r.groupe_id}-${r.jour}`} className="rounded border p-3 text-sm">
                <div className="font-medium">
                  {r.abo_groupe?.nom || r.groupe_id} · {date(r.jour)} · publié le {heure(r.relu_le)}
                </div>
                <pre className="mt-2 whitespace-pre-wrap font-sans text-gray-800">{r.texte}</pre>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </>
  );
}
