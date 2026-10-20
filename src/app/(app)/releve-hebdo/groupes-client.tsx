"use client";

// Inscrire ou écarter, groupe par groupe (carte 142fc42c). D'abord ceux où Patrick écrit, par nombre de messages sur 30 jours.

import { useState, useTransition } from "react";
import { ecarter, inscrire, type Groupe } from "./actions";

const jour = (s: string | null) =>
  s ? new Intl.DateTimeFormat("fr-CH", { timeZone: "Europe/Zurich", dateStyle: "short" }).format(new Date(s)) : "—";

function Ligne({ g }: { g: Groupe }) {
  const [categorie, setCategorie] = useState<"abo" | "cercle">("abo");
  const [issue, setIssue] = useState<{ fait: "inscrit" | "ecarte"; texte: string } | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, demarrer] = useTransition();

  const surInscrire = () =>
    demarrer(async () => {
      setErreur(null);
      const r = await inscrire(g.groupe_jid, categorie);
      if (!r.ok) return setErreur(r.erreur ?? "refusé");
      setIssue({
        fait: "inscrit",
        texte: r.deja_inscrit ? "déjà inscrit" : `inscrit · ${r.membres_ajoutees ?? 0} membre(s) ajoutée(s)`,
      });
    });
  const surEcarter = () =>
    demarrer(async () => {
      setErreur(null);
      const r = await ecarter(g.groupe_jid);
      if (!r.ok) return setErreur(r.erreur ?? "refusé");
      setIssue({ fait: "ecarte", texte: "écarté" });
    });

  return (
    <li className={`flex flex-wrap items-center gap-3 border-b py-2 ${issue ? "opacity-60" : ""}`}>
      <div className="min-w-0 flex-1">
        <div className="font-medium">{g.nom || g.groupe_jid}</div>
        <div className="text-xs text-gray-600">
          {(g.bridges ?? []).join(", ") || "—"} · {(g.participants ?? []).length} participante(s) · {g.messages_30j ?? 0} message(s) sur 30 j ·
          dernier le {jour(g.dernier_message)}
          {g.patrick_ecrit ? <span className="ml-2 rounded bg-fuchsia-100 px-1.5 text-fuchsia-900">tu y écris</span> : null}
        </div>
        {erreur ? <div className="text-xs text-red-700">{erreur}</div> : null}
      </div>
      {issue ? (
        <span className={`text-sm ${issue.fait === "inscrit" ? "text-green-700" : "text-gray-600"}`}>{issue.texte}</span>
      ) : (
        <>
          <select
            className="rounded border px-2 py-1 text-sm"
            value={categorie}
            onChange={(e) => setCategorie(e.target.value as "abo" | "cercle")}
            disabled={enCours}
          >
            <option value="abo">Abo</option>
            <option value="cercle">Cercle</option>
          </select>
          <button className="rounded bg-green-700 px-3 py-1 text-sm text-white disabled:opacity-50" onClick={surInscrire} disabled={enCours}>
            Inscrire
          </button>
          <button className="rounded border px-3 py-1 text-sm disabled:opacity-50" onClick={surEcarter} disabled={enCours}>
            Écarter
          </button>
        </>
      )}
    </li>
  );
}

export function GroupesClient({ siens, cornelia }: { siens: Groupe[]; cornelia: Groupe[] }) {
  return (
    <>
      <h2 className="mt-6 text-lg font-semibold">Tes groupes non inscrits · {siens.length}</h2>
      <ul className="mt-2">{siens.map((g) => <Ligne key={g.groupe_jid} g={g} />)}</ul>
      <details className="mt-6">
        <summary className="cursor-pointer text-sm text-gray-700">
          Vus seulement par z5, le téléphone de Cornelia · {cornelia.length} — hors ramassage, rien à trancher
        </summary>
        <ul className="mt-2">{cornelia.map((g) => <Ligne key={g.groupe_jid} g={g} />)}</ul>
      </details>
    </>
  );
}
