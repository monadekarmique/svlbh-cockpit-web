"use client";

// Quatre canaux, les fils et DiGiSha, côte à côte ; chaque colonne défile. Un geste par élément : Indexer / Ignorer, un mot
// facultatif et, sous le mot, SA définition (elle entre au lexique telle qu'il l'écrit). Le pré-tri (index_flux.propose) teinte
// le bouton proposé ; le choix de Patrick, une fois posé, prime et s'affiche plein.
// Phrase énergétique (Patrick, 20.10.2026) : « + phrase » sur les médias, dans l'ordre → 1, 2, 3… ; un nom, un sens, « Enregistrer ».

import { useMemo, useState, useTransition } from "react";
import { decider, poserPhrase, type Element, type Phrase } from "./actions";

const COLONNES: { cle: string; titre: string }[] = [
  { cle: "z1", titre: "z1 · visiteuses" },
  { cle: "z2", titre: "z2 · formation" },
  { cle: "z3", titre: "z3 · certifiées" },
  { cle: "z4", titre: "z4 · pédago ST4" },
  { cle: "fils", titre: "Fils" },
  { cle: "digisha", titre: "DiGiSha" },
];

const GENRE: Record<string, string> = { image: "photo", video: "vidéo", audio: "vocal", sticker: "sticker", document: "document" };

function Media({ e }: { e: Element }) {
  if (!e.media_type) return null;
  if (!e.url) return <span className="text-xs italic text-gray-500">{GENRE[e.media_type] ?? e.media_type} — fichier sur le pont seulement</span>;
  if (e.media_type === "image" || e.media_type === "sticker")
    return <img src={e.url} alt="" className={e.media_type === "sticker" ? "h-24 w-24 object-contain" : "max-h-48 rounded"} loading="lazy" />;
  if (e.media_type === "video") return <video src={e.url} controls className="max-h-48 rounded" preload="none" />;
  if (e.media_type === "audio") return <audio src={e.url} controls className="w-full" preload="none" />;
  return <a href={e.url} target="_blank" rel="noreferrer" className="text-xs underline">document</a>;
}

function Carte({ e, rang, onChange, onPhrase }: {
  e: Element; rang: number | null; onChange: (e: Element) => void; onPhrase: (id: string) => void;
}) {
  const [mot, setMot] = useState(e.mot ?? "");
  const [definition, setDefinition] = useState(e.definition ?? "");
  const [ouvrir, setOuvrir] = useState(!!e.definition);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, demarrer] = useTransition();
  const choix = e.decision ?? null;
  const poser = (decision: "indexer" | "ignorer") =>
    demarrer(async () => {
      const m = mot.trim() || null, d = definition.trim() || null;
      if (d && !m) { setErreur("une définition a besoin de son mot"); return; }
      const r = await decider(e.wa_message_id, decision, m, d);
      if (!r.ok) { setErreur(r.erreur ?? "refusé"); return; }
      setErreur(null);
      onChange({ ...e, decision, mot: m, definition: d, consomme: false });
    });
  const style = (d: "indexer" | "ignorer") => {
    if (choix === d) return d === "indexer" ? "bg-emerald-700 text-white ring-emerald-700" : "bg-slate-600 text-white ring-slate-600";
    if (!choix && e.propose === d) return d === "indexer" ? "bg-emerald-50 text-emerald-900 ring-emerald-400" : "bg-slate-50 text-slate-800 ring-slate-400";
    return "bg-white text-gray-600 ring-gray-200";
  };
  const mediaOk = !!e.media_type && !e.wa_message_id.startsWith("dg:");
  return (
    <div className={"relative rounded-lg border p-2 mb-2 " + (e.de_patrick ? "border-amber-300 bg-amber-50/40" : "border-gray-200 bg-white")}>
      {rang && <span className="absolute -left-1 -top-1 rounded-full bg-fuchsia-700 px-2 text-xs font-bold text-white">{rang}</span>}
      <div className="flex justify-between gap-2 text-[11px] text-gray-500">
        <span className="truncate">{e.heure} · <b className={e.de_patrick ? "text-amber-800" : ""}>{e.qui}</b></span>
        <span className="max-w-[50%] truncate" title={e.chat}>{e.chat}</span>
      </div>
      <div className="mt-1"><Media e={e} /></div>
      {e.texte && <p className="mt-1 max-h-60 overflow-y-auto whitespace-pre-wrap text-sm leading-snug">{e.texte}</p>}
      {e.raison && !choix && <p className="mt-1 text-[11px] text-emerald-800">proposé : {e.raison}</p>}
      <div className="mt-2 flex flex-wrap items-center gap-1">
        <button type="button" disabled={enCours} onClick={() => poser("indexer")} className={"rounded-md px-2 py-1 text-xs font-semibold ring-1 " + style("indexer")}>Indexer</button>
        <button type="button" disabled={enCours} onClick={() => poser("ignorer")} className={"rounded-md px-2 py-1 text-xs font-semibold ring-1 " + style("ignorer")}>Ignorer</button>
        {mediaOk && (
          <button type="button" onClick={() => onPhrase(e.wa_message_id)}
            className={"rounded-md px-2 py-1 text-xs font-semibold ring-1 " + (rang ? "bg-fuchsia-700 text-white ring-fuchsia-700" : "bg-white text-fuchsia-800 ring-fuchsia-300")}>
            {rang ? `− phrase (${rang})` : "+ phrase"}
          </button>
        )}
        <input value={mot} onChange={(x) => setMot(x.target.value)} placeholder="mot (facultatif)" maxLength={200}
          className="min-w-0 flex-1 rounded-md border border-gray-200 px-2 py-1 text-xs" />
        <button type="button" onClick={() => setOuvrir(!ouvrir)} className="text-[11px] text-gray-600 underline">{ouvrir ? "sans définition" : "définition…"}</button>
      </div>
      {ouvrir && (
        <textarea value={definition} onChange={(x) => setDefinition(x.target.value)} rows={3} maxLength={4000}
          placeholder="ta définition, telle qu'elle doit entrer au lexique de DiGiSha"
          className="mt-1 w-full rounded-md border border-gray-200 px-2 py-1 text-xs" />
      )}
      {choix && (
        <p className="mt-1 text-[11px] text-gray-500">
          {choix === "indexer" ? "indexé" : "ignoré"}{e.mot ? ` · « ${e.mot} »` : ""}{e.definition ? " · avec ta définition" : ""} ·{" "}
          {e.consomme ? "entré" : "entre au prochain passage"}
        </p>
      )}
      {erreur && <p className="mt-1 text-[11px] text-red-700">{erreur}</p>}
    </div>
  );
}

function PanneauPhrase({ sequence, elements, jour, phrases, vider, retirer, ajoutee }: {
  sequence: string[]; elements: Map<string, Element>; jour: string; phrases: Phrase[];
  vider: () => void; retirer: (id: string) => void; ajoutee: (p: Phrase) => void;
}) {
  const [nom, setNom] = useState("");
  const [sens, setSens] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, demarrer] = useTransition();
  const enregistrer = () =>
    demarrer(async () => {
      if (!nom.trim()) { setErreur("nomme la phrase"); return; }
      if (sequence.length < 2) { setErreur("deux médias au moins"); return; }
      const r = await poserPhrase(nom.trim(), sens.trim() || null, sequence, jour);
      if (!r.ok) { setErreur(r.erreur ?? "refusé"); return; }
      ajoutee({ phrase_id: r.id ?? "", nom: nom.trim(), sens: sens.trim() || null, elements: sequence, consomme: false });
      setNom(""); setSens(""); setErreur(null); vider();
    });
  if (!sequence.length && !phrases.length) return null;
  return (
    <div className="sticky top-0 z-10 mb-3 rounded-xl border border-fuchsia-200 bg-fuchsia-50/95 p-3 backdrop-blur">
      {sequence.length > 0 && (
        <>
          <h2 className="mb-2 text-sm font-semibold text-fuchsia-900">Phrase énergétique en cours · {sequence.length} média(s)</h2>
          <div className="mb-2 flex flex-wrap gap-2">
            {sequence.map((id, i) => {
              const e = elements.get(id);
              return (
                <button key={id} type="button" onClick={() => retirer(id)} title="retirer" className="relative rounded border border-fuchsia-300 bg-white p-1">
                  <span className="absolute -left-1 -top-1 rounded-full bg-fuchsia-700 px-1.5 text-[10px] font-bold text-white">{i + 1}</span>
                  {e?.url && (e.media_type === "image" || e.media_type === "sticker")
                    ? <img src={e.url} alt="" className="h-14 w-14 object-contain" />
                    : <span className="block h-14 w-14 text-[10px] text-gray-500">{GENRE[e?.media_type ?? ""] ?? "média"} {e?.heure}</span>}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-2">
            <input value={nom} onChange={(x) => setNom(x.target.value)} placeholder="nom de la phrase" maxLength={200}
              className="min-w-[12rem] flex-1 rounded-md border border-fuchsia-200 px-2 py-1 text-sm" />
            <input value={sens} onChange={(x) => setSens(x.target.value)} placeholder="ce qu'elle dit (facultatif)" maxLength={4000}
              className="min-w-[16rem] flex-[2] rounded-md border border-fuchsia-200 px-2 py-1 text-sm" />
            <button type="button" disabled={enCours} onClick={enregistrer} className="rounded-md bg-fuchsia-700 px-3 py-1 text-sm font-semibold text-white">Enregistrer</button>
            <button type="button" onClick={vider} className="text-sm text-fuchsia-900 underline">vider</button>
          </div>
          {erreur && <p className="mt-1 text-xs text-red-700">{erreur}</p>}
        </>
      )}
      {phrases.length > 0 && (
        <p className="mt-2 text-xs text-fuchsia-900">
          Phrases de ce jour : {phrases.map((p) => `« ${p.nom} » (${p.elements.length}${p.consomme ? ", entrée" : ""})`).join(" · ")}
        </p>
      )}
    </div>
  );
}

export function IndexerClient({ initial, phrases: phrasesInit, jour }: { initial: Element[]; phrases: Phrase[]; jour: string }) {
  const [elements, setElements] = useState(initial);
  const [phrases, setPhrases] = useState(phrasesInit);
  const [sequence, setSequence] = useState<string[]>([]);
  const [seulementProposes, setSeulementProposes] = useState(false);
  const [sansStickers, setSansStickers] = useState(true);
  const parId = useMemo(() => new Map(elements.map((e) => [e.wa_message_id, e])), [elements]);
  const parColonne = useMemo(() => {
    const m = new Map<string, Element[]>();
    for (const e of elements) {
      const enPhrase = sequence.includes(e.wa_message_id);
      if (!enPhrase && sansStickers && e.media_type === "sticker") continue;
      if (!enPhrase && seulementProposes && !e.decision && e.propose !== "indexer") continue;
      const arr = m.get(e.colonne) ?? [];
      arr.push(e);
      m.set(e.colonne, arr);
    }
    return m;
  }, [elements, seulementProposes, sansStickers, sequence]);
  const remplacer = (n: Element) => setElements((xs) => xs.map((x) => (x.wa_message_id === n.wa_message_id ? n : x)));
  const basculer = (id: string) => setSequence((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const restants = elements.filter((e) => !e.decision).length;
  return (
    <div>
      <PanneauPhrase sequence={sequence} elements={parId} jour={jour} phrases={phrases} vider={() => setSequence([])}
        retirer={basculer} ajoutee={(p) => setPhrases((xs) => [...xs, p])} />
      <div className="mb-3 flex flex-wrap items-center gap-4 text-sm">
        <label className="flex items-center gap-1">
          <input type="checkbox" checked={seulementProposes} onChange={(x) => setSeulementProposes(x.target.checked)} />
          seulement ce que le pré-tri propose d&apos;indexer
        </label>
        <label className="flex items-center gap-1">
          <input type="checkbox" checked={!sansStickers} onChange={(x) => setSansStickers(!x.target.checked)} />
          montrer les stickers (pour une phrase)
        </label>
        <span className="text-gray-500">{elements.length} élément(s) · {restants} sans choix</span>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 2xl:grid-cols-6">
        {COLONNES.map((c) => {
          const xs = parColonne.get(c.cle) ?? [];
          return (
            <section key={c.cle} className="flex max-h-[78vh] flex-col rounded-xl bg-gray-50 p-2">
              <h2 className="mb-2 flex justify-between text-sm font-semibold"><span>{c.titre}</span><span className="text-gray-500">{xs.length}</span></h2>
              <div className="overflow-y-auto pl-1 pr-1 pt-1">
                {xs.length === 0 && <p className="text-xs text-gray-400">rien ce jour-là</p>}
                {xs.map((e) => {
                  const i = sequence.indexOf(e.wa_message_id);
                  return <Carte key={e.wa_message_id} e={e} rang={i >= 0 ? i + 1 : null} onChange={remplacer} onPhrase={basculer} />;
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
