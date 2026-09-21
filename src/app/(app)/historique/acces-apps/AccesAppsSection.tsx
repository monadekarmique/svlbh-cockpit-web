"use client";

// Grille de revue — une ligne par praticienne à z2 ou plus, une colonne par app du
// groupe z2. La case cochée = une ligne ACTIVE dans autorisation_app, jamais une
// déduction du canal. Le canal reste affiché à côté, en RÉFÉRENCE seulement : c'est
// ce qu'elle atteignait hier, sous l'ancien mécanisme — pas ce qu'elle a aujourd'hui.
//
// Tant que mon_acces_apps() n'est pas branché sur cette table (geste séparé, sur le
// signal de Patrick une fois la revue finie), rien de ce qui se coche ici ne change
// ce que les apps affichent en ce moment.

import { useState, useTransition } from "react";
import { accorderAcces, retirerAcces } from "./actions";
import { APPS_GROUPE_Z2, type PraticienneARevoir } from "./types";

export function AccesAppsSection({ initial }: { initial: PraticienneARevoir[] }) {
  const [lignes, setLignes] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [enCours, setEnCours] = useState<string | null>(null);

  function basculer(p: PraticienneARevoir, appId: string, coche: boolean) {
    const cle = `${p.svlbh_id}:${appId}`;
    setEnCours(cle);
    startTransition(async () => {
      try {
        if (coche) await accorderAcces(p.svlbh_id, appId);
        else await retirerAcces(p.svlbh_id, appId);
        setLignes((prev) =>
          prev.map((l) =>
            l.svlbh_id !== p.svlbh_id
              ? l
              : {
                  ...l,
                  apps_autorisees: coche
                    ? [...l.apps_autorisees, appId]
                    : l.apps_autorisees.filter((a) => a !== appId),
                },
          ),
        );
      } finally {
        setEnCours(null);
      }
    });
  }

  if (lignes.length === 0) {
    return (
      <p className="text-sm text-neutral-500">
        Aucune praticienne à z2 ou plus à revoir (ou section réservée à l’entité).
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-blue-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-blue-100 bg-blue-50/60 text-left text-xs uppercase tracking-wider text-blue-900">
            <th className="px-3 py-2 font-semibold">Praticienne</th>
            <th className="px-3 py-2 font-semibold">Canal (référence)</th>
            {APPS_GROUPE_Z2.map((a) => (
              <th key={a.app_id} className="px-3 py-2 text-center font-semibold">
                {a.nom}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {lignes.map((p) => (
            <tr key={p.svlbh_id} className="border-b border-neutral-100 last:border-0">
              <td className="whitespace-nowrap px-3 py-2 font-medium text-blue-950">
                {p.prenom} {p.nom}
              </td>
              <td className="px-3 py-2 font-mono text-xs text-neutral-500">
                {p.canal ?? "—"}
              </td>
              {APPS_GROUPE_Z2.map((a) => {
                const coche = p.apps_autorisees.includes(a.app_id);
                const cle = `${p.svlbh_id}:${a.app_id}`;
                return (
                  <td key={a.app_id} className="px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={coche}
                      disabled={pending && enCours === cle}
                      onChange={(e) => basculer(p, a.app_id, e.target.checked)}
                      className="h-4 w-4 accent-blue-700 disabled:opacity-40"
                      aria-label={`${a.nom} pour ${p.prenom} ${p.nom}`}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
