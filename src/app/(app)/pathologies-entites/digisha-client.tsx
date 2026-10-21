"use client";

// DiGiSha dans la fenêtre — Patrick, 21.10.2026 : « j'aimerais pouvoir disposer dans cette fenêtre d'un DiGiSha qui me
// permette de dialoguer avec DiGiSha pour des définitions ».
// Le serveur de DiGiSha (vlbh-energy-mcp, sur Render) répond sous la session de l'appelante et écrit chaque tour
// dans digisha_chat_log : le tour devient une pièce de la colonne DiGiSha au rafraîchissement qui suit, à poser
// sur le banc comme n'importe quelle autre. En « voir comme » on regarde : le tour partirait sous le mauvais nom.

import { useState, useTransition } from "react";
import { dialoguerDigisha } from "./actions";

type Tour = { role: "user" | "assistant"; content: string };

export function DigishaClient({ lectureSeule = false, apresReponse }: { lectureSeule?: boolean; apresReponse: () => Promise<void> }) {
  const [ouvert, setOuvert] = useState(false);
  const [tours, setTours] = useState<Tour[]>([]);
  const [texte, setTexte] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, demarrer] = useTransition();

  const envoyer = () =>
    demarrer(async () => {
      const q = texte.trim();
      if (!q) return;
      const suite: Tour[] = [...tours, { role: "user", content: q }];
      setTours(suite); setTexte(""); setErreur(null);
      const r = await dialoguerDigisha(suite);
      if (!r.ok) { setErreur(r.erreur ?? "refusé"); return; }
      setTours([...suite, { role: "assistant", content: r.reply ?? "" }]);
      await apresReponse();
    });

  return (
    <section className="mb-4 rounded-xl border border-indigo-200 bg-indigo-50/60 p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <button type="button" onClick={() => setOuvert((o) => !o)} className="text-base font-semibold text-indigo-900">
          {ouvert ? "▾" : "▸"} DiGiSha — définitions
        </button>
        <span className="text-xs text-indigo-900/70">
          chaque réponse devient une pièce de la colonne DiGiSha — clique-la pour la poser sur le banc
        </span>
      </div>
      {ouvert && (
        <div className="mt-2">
          {tours.length > 0 && (
            <ol className="mb-2 max-h-72 space-y-2 overflow-y-auto rounded-lg bg-white p-3 ring-1 ring-indigo-200">
              {tours.map((t, i) => (
                <li key={i} className={t.role === "user" ? "text-[14px] text-gray-900" : "whitespace-pre-wrap text-[14px] leading-relaxed text-indigo-950"}>
                  <b className="mr-1 text-xs uppercase tracking-wide text-indigo-700">{t.role === "user" ? "toi" : "DiGiSha"}</b>
                  {t.content}
                </li>
              ))}
              {enCours && <li className="text-xs italic text-indigo-700">DiGiSha réfléchit…</li>}
            </ol>
          )}
          <div className="flex items-end gap-2">
            <textarea value={texte} onChange={(x) => setTexte(x.target.value)} rows={2} maxLength={4000} disabled={lectureSeule || enCours}
              onKeyDown={(x) => { if (x.key === "Enter" && !x.shiftKey) { x.preventDefault(); envoyer(); } }}
              placeholder={lectureSeule ? "en « voir comme » on regarde — pas de tour au nom de quelqu'un d'autre" : "demande une définition, un sens, une distinction… (Entrée pour envoyer, Maj+Entrée pour une ligne)"}
              className="min-w-0 flex-1 rounded-md border border-indigo-200 px-2 py-1 text-[14px] disabled:opacity-60" />
            <button type="button" onClick={envoyer} disabled={lectureSeule || enCours || !texte.trim()}
              className="rounded-md bg-indigo-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">Demander</button>
            {tours.length > 0 && (
              <button type="button" onClick={() => { setTours([]); setErreur(null); }} disabled={enCours}
                className="rounded-md border border-indigo-300 px-3 py-2 text-sm text-indigo-900" title="repartir d'un fil neuf (les tours restent en base)">Nouveau fil</button>
            )}
          </div>
          {erreur && <p className="mt-1 text-xs text-red-700">{erreur}</p>}
        </div>
      )}
    </section>
  );
}
