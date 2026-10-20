"use client";

// Banc de montage (Patrick, 20.10.2026 14h4x : « un banc de montage qui me permette de clicker sur les pièces dans un certain ordre
// et qui me permette avec valider d'envoyer dans une zone cette définition »).
// Les pièces — textes, photos, vidéos, vocaux, stickers, échanges DiGiSha — défilent par colonne (z1…z4, fils, DiGiSha). Un clic sur
// une pièce la pose sur le banc (elle prend son numéro), un second clic l'en retire. Le banc montre la définition assemblée dans
// l'ordre ; on déplace une pièce (← →), on nomme, on choisit la zone, « Valider ». Le passage des deux heures l'envoie dans sa zone.

import { useMemo, useState, useTransition } from "react";
import { poserMontage, type Element, type Phrase, type Zone } from "./actions";

const COLONNES: { cle: string; titre: string }[] = [
  { cle: "z1", titre: "z1 · visiteuses" },
  { cle: "z2", titre: "z2 · formation" },
  { cle: "z3", titre: "z3 · certifiées" },
  { cle: "z4", titre: "z4 · pédago ST4" },
  { cle: "fils", titre: "Fils" },
  { cle: "digisha", titre: "DiGiSha" },
];
const ZONES: { cle: Zone; titre: string; aide: string }[] = [
  { cle: "lexique", titre: "Lexique de DiGiSha", aide: "la définition d'un terme : DiGiSha l'explique ensuite telle quelle" },
  { cle: "phrase", titre: "Phrase énergétique", aide: "la séquence numérotée des médias, son nom et ce qu'elle dit" },
  { cle: "savoir", titre: "Savoir", aide: "une fiche que DiGiSha retrouve quand le sujet revient" },
];
const GENRE: Record<string, string> = { image: "photo", video: "vidéo", audio: "vocal", sticker: "sticker", document: "document" };

function Media({ e, petit = false }: { e: Element; petit?: boolean }) {
  if (!e.media_type) return null;
  if (!e.url) return <span className="text-xs italic text-gray-500">{GENRE[e.media_type] ?? e.media_type} — fichier resté sur le pont</span>;
  if (e.media_type === "image" || e.media_type === "sticker")
    return <img src={e.url} alt="" loading="lazy"
      className={petit ? "h-16 w-16 rounded object-contain" : e.media_type === "sticker" ? "h-24 w-24 object-contain" : "max-h-48 rounded"} />;
  if (petit) return <span className="block h-16 w-16 text-[10px] text-gray-500">{GENRE[e.media_type]}</span>;
  if (e.media_type === "video") return <video src={e.url} controls className="max-h-48 rounded" preload="none" onClick={(x) => x.stopPropagation()} />;
  if (e.media_type === "audio") return <audio src={e.url} controls className="w-full" preload="none" onClick={(x) => x.stopPropagation()} />;
  return <a href={e.url} target="_blank" rel="noreferrer" className="text-xs underline" onClick={(x) => x.stopPropagation()}>document</a>;
}

function texteDe(e: Element): string {
  return e.wa_message_id.startsWith("dg:") ? (e.texte ?? "").split("\n— DiGiSha : ")[0] : (e.texte ?? "");
}

function Piece({ e, rang, basculer }: { e: Element; rang: number | null; basculer: (id: string) => void }) {
  return (
    <button type="button" onClick={() => basculer(e.wa_message_id)}
      className={"relative mb-2 block w-full rounded-lg border p-2 text-left transition " +
        (rang ? "border-fuchsia-500 bg-fuchsia-50 ring-2 ring-fuchsia-400" : e.de_patrick ? "border-amber-300 bg-amber-50/40 hover:border-fuchsia-300" : "border-gray-200 bg-white hover:border-fuchsia-300")}>
      {rang && <span className="absolute -left-1.5 -top-1.5 rounded-full bg-fuchsia-700 px-2 text-xs font-bold text-white">{rang}</span>}
      <span className="flex justify-between gap-2 text-[11px] text-gray-500">
        <span className="truncate">{e.heure} · <b className={e.de_patrick ? "text-amber-800" : ""}>{e.qui}</b></span>
        <span className="max-w-[50%] truncate" title={e.chat}>{e.chat}</span>
      </span>
      <span className="mt-1 block"><Media e={e} /></span>
      {e.texte && <span className="mt-1 block max-h-60 overflow-y-auto whitespace-pre-wrap text-sm leading-snug">{e.texte}</span>}
    </button>
  );
}

function Banc({ sequence, parId, jour, montages, retirer, deplacer, vider, pose }: {
  sequence: string[]; parId: Map<string, Element>; jour: string; montages: Phrase[];
  retirer: (id: string) => void; deplacer: (i: number, d: -1 | 1) => void; vider: () => void; pose: (p: Phrase) => void;
}) {
  const [nom, setNom] = useState("");
  const [texte, setTexte] = useState("");
  const [zone, setZone] = useState<Zone>("lexique");
  const [erreur, setErreur] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [enCours, demarrer] = useTransition();
  const assemble = sequence.map((id, i) => {
    const e = parId.get(id);
    if (!e) return `${i + 1}. ?`;
    const t = texteDe(e).trim();
    return `${i + 1}. ` + (e.media_type ? `[${GENRE[e.media_type] ?? "média"}]${t ? " " + t : ""}` : t);
  }).join("\n");
  const valider = () =>
    demarrer(async () => {
      setOk(null);
      if (!nom.trim()) { setErreur("donne un nom au montage (le terme, ou le nom de la phrase)"); return; }
      if (!sequence.length) { setErreur("clique d'abord sur des pièces"); return; }
      if (zone === "phrase" && sequence.length < 2) { setErreur("une phrase énergétique a deux pièces au moins"); return; }
      const r = await poserMontage(nom.trim(), zone, texte.trim() || null, sequence, jour);
      if (!r.ok) { setErreur(r.erreur ?? "refusé"); return; }
      pose({ phrase_id: r.id ?? "", nom: nom.trim(), sens: texte.trim() || null, zone, elements: sequence, consomme: false });
      setOk(`« ${nom.trim()} » envoyé vers ${ZONES.find((z) => z.cle === zone)?.titre} — il entre au prochain passage.`);
      setNom(""); setTexte(""); setErreur(null); vider();
    });
  return (
    <div className="sticky top-0 z-10 mb-3 rounded-xl border border-fuchsia-200 bg-fuchsia-50/95 p-3 shadow-sm backdrop-blur">
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-fuchsia-900">Banc de montage · {sequence.length} pièce(s)</h2>
        {sequence.length > 0 && <button type="button" onClick={vider} className="text-xs text-fuchsia-900 underline">tout retirer</button>}
      </div>
      {sequence.length === 0 ? (
        <p className="text-xs text-fuchsia-900/70">Clique sur les pièces ci-dessous, dans l&apos;ordre où elles construisent la définition.</p>
      ) : (
        <div className="mb-2 flex flex-wrap gap-2">
          {sequence.map((id, i) => {
            const e = parId.get(id);
            return (
              <div key={id} className="relative flex w-40 flex-col rounded border border-fuchsia-300 bg-white p-1">
                <span className="absolute -left-1.5 -top-1.5 rounded-full bg-fuchsia-700 px-1.5 text-[10px] font-bold text-white">{i + 1}</span>
                {e?.media_type && <Media e={e} petit />}
                <span className="line-clamp-3 text-[11px] leading-tight">{e ? texteDe(e) : "?"}</span>
                <span className="mt-1 flex justify-between text-[11px]">
                  <button type="button" disabled={i === 0} onClick={() => deplacer(i, -1)} className="px-1 disabled:opacity-30">←</button>
                  <button type="button" onClick={() => retirer(id)} className="px-1 text-red-700">✕</button>
                  <button type="button" disabled={i === sequence.length - 1} onClick={() => deplacer(i, 1)} className="px-1 disabled:opacity-30">→</button>
                </span>
              </div>
            );
          })}
        </div>
      )}
      {sequence.length > 0 && (
        <>
          <pre className="mb-2 max-h-32 overflow-y-auto whitespace-pre-wrap rounded bg-white/70 p-2 text-[11px] text-gray-700">{assemble}</pre>
          <div className="flex flex-wrap items-center gap-2">
            <input value={nom} onChange={(x) => setNom(x.target.value)} placeholder="nom : le terme, ou le nom de la phrase" maxLength={200}
              className="min-w-[14rem] flex-1 rounded-md border border-fuchsia-200 px-2 py-1 text-sm" />
            <select value={zone} onChange={(x) => setZone(x.target.value as Zone)} className="rounded-md border border-fuchsia-200 px-2 py-1 text-sm"
              title={ZONES.find((z) => z.cle === zone)?.aide}>
              {ZONES.map((z) => <option key={z.cle} value={z.cle}>{z.titre}</option>)}
            </select>
            <button type="button" disabled={enCours} onClick={valider} className="rounded-md bg-fuchsia-700 px-4 py-1 text-sm font-semibold text-white">Valider</button>
          </div>
          <textarea value={texte} onChange={(x) => setTexte(x.target.value)} rows={2} maxLength={4000}
            placeholder="tes mots, s'il en faut (ils viennent avant les pièces dans la définition)"
            className="mt-2 w-full rounded-md border border-fuchsia-200 px-2 py-1 text-xs" />
          <p className="text-[11px] text-fuchsia-900/70">{ZONES.find((z) => z.cle === zone)?.aide}</p>
        </>
      )}
      {erreur && <p className="mt-1 text-xs text-red-700">{erreur}</p>}
      {ok && <p className="mt-1 text-xs text-emerald-800">{ok}</p>}
      {montages.length > 0 && (
        <p className="mt-2 text-xs text-fuchsia-900">
          Montages de ce jour : {montages.map((p) => `« ${p.nom} » → ${ZONES.find((z) => z.cle === p.zone)?.titre ?? p.zone} (${p.elements.length}${p.consomme ? ", entré" : ""})`).join(" · ")}
        </p>
      )}
    </div>
  );
}

export function IndexerClient({ initial, phrases, jour }: { initial: Element[]; phrases: Phrase[]; jour: string }) {
  const [montages, setMontages] = useState(phrases);
  const [sequence, setSequence] = useState<string[]>([]);
  const [stickers, setStickers] = useState(false);
  const [patrickSeul, setPatrickSeul] = useState(false);
  const parId = useMemo(() => new Map(initial.map((e) => [e.wa_message_id, e])), [initial]);
  const parColonne = useMemo(() => {
    const m = new Map<string, Element[]>();
    for (const e of initial) {
      const surLeBanc = sequence.includes(e.wa_message_id);
      if (!surLeBanc && !stickers && e.media_type === "sticker") continue;
      if (!surLeBanc && patrickSeul && !e.de_patrick) continue;
      const arr = m.get(e.colonne) ?? [];
      arr.push(e);
      m.set(e.colonne, arr);
    }
    return m;
  }, [initial, stickers, patrickSeul, sequence]);
  const basculer = (id: string) => setSequence((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const deplacer = (i: number, d: -1 | 1) =>
    setSequence((s) => { const t = [...s]; const j = i + d; if (j < 0 || j >= t.length) return s; [t[i], t[j]] = [t[j], t[i]]; return t; });
  return (
    <div>
      <Banc sequence={sequence} parId={parId} jour={jour} montages={montages} retirer={basculer} deplacer={deplacer}
        vider={() => setSequence([])} pose={(p) => setMontages((xs) => [...xs, p])} />
      <div className="mb-3 flex flex-wrap items-center gap-4 text-sm">
        <label className="flex items-center gap-1"><input type="checkbox" checked={stickers} onChange={(x) => setStickers(x.target.checked)} /> montrer les stickers</label>
        <label className="flex items-center gap-1"><input type="checkbox" checked={patrickSeul} onChange={(x) => setPatrickSeul(x.target.checked)} /> seulement mes messages</label>
        <span className="text-gray-500">{initial.length} pièce(s) ce jour</span>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 2xl:grid-cols-6">
        {COLONNES.map((c) => {
          const xs = parColonne.get(c.cle) ?? [];
          return (
            <section key={c.cle} className="flex max-h-[70vh] flex-col rounded-xl bg-gray-50 p-2">
              <h2 className="mb-2 flex justify-between text-sm font-semibold"><span>{c.titre}</span><span className="text-gray-500">{xs.length}</span></h2>
              <div className="overflow-y-auto px-1.5 pt-1.5">
                {xs.length === 0 && <p className="text-xs text-gray-400">rien ce jour-là</p>}
                {xs.map((e) => { const i = sequence.indexOf(e.wa_message_id); return <Piece key={e.wa_message_id} e={e} rang={i >= 0 ? i + 1 : null} basculer={basculer} />; })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
