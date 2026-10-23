"use client";

// Un interrupteur par usage (carte d5a25199, migration 2026-10-23a). Le geste part tout de suite ; en cas de refus,
// l'interrupteur revient à sa position et l'erreur s'affiche sur la ligne.

import { useState, useTransition } from "react";
import { regler, type Canal, type Usage } from "./actions";

function Interrupteur({ canal, usage, valeur }: { canal: Canal; usage: Usage; valeur: boolean }) {
  const [etat, setEtat] = useState(valeur);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, demarrer] = useTransition();
  const basculer = () =>
    demarrer(async () => {
      setErreur(null);
      const voulu = !etat;
      setEtat(voulu);
      const r = await regler(canal.genre, canal.cle, usage, voulu);
      if (!r.ok) {
        setEtat(!voulu);
        setErreur(r.erreur ?? "refusé");
      }
    });
  return (
    <td className="px-2 py-1 text-center">
      <button
        role="switch"
        aria-checked={etat}
        onClick={basculer}
        disabled={enCours}
        className={`inline-flex h-5 w-9 items-center rounded-full transition disabled:opacity-50 ${etat ? "bg-green-600" : "bg-gray-300"}`}
      >
        <span className={`h-4 w-4 rounded-full bg-white shadow transition ${etat ? "translate-x-4" : "translate-x-0.5"}`} />
      </button>
      {erreur ? <div className="text-xs text-red-700">{erreur}</div> : null}
    </td>
  );
}

function Tableau({ titre, canaux, avecResume }: { titre: string; canaux: Canal[]; avecResume: boolean }) {
  return (
    <>
      <h2 className="mt-6 text-lg font-semibold">
        {titre} ({canaux.length})
      </h2>
      <table className="mt-2 w-full text-sm">
        <thead>
          <tr className="border-b text-left text-gray-600">
            <th className="py-1">Canal</th>
            <th className="px-2 py-1 text-center">Récolté</th>
            <th className="px-2 py-1 text-center">Transcrit</th>
            {avecResume ? <th className="px-2 py-1 text-center">Résumé du jour</th> : null}
          </tr>
        </thead>
        <tbody>
          {canaux.map((c) => (
            <tr key={`${c.genre}-${c.cle}`} className="border-b">
              <td className="py-1">
                <div className="font-medium">{c.nom || c.cle}</div>
                <div className="text-xs text-gray-600">
                  {(c.zones ?? []).filter(Boolean).join(", ") || "—"}
                  {c.categorie ? ` · ${c.categorie}` : ""}
                  {c.genre === "fil" && c.sources > 1 ? ` · ${c.sources} sources` : ""}
                </div>
              </td>
              <Interrupteur canal={c} usage="recolte" valeur={c.recolte} />
              <Interrupteur canal={c} usage="transcrit" valeur={c.transcrit} />
              {avecResume ? <Interrupteur canal={c} usage="resume_jour" valeur={!!c.resume_jour} /> : null}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

export function CanauxClient({ groupes, fils }: { groupes: Canal[]; fils: Canal[] }) {
  return (
    <>
      <Tableau titre="Groupes" canaux={groupes} avecResume />
      <Tableau titre="Fils" canaux={fils} avecResume={false} />
    </>
  );
}
