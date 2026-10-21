"use client";

// Banc de montage (Patrick, 20.10.2026 14h4x : « un banc de montage qui me permette de clicker sur les pièces dans un certain ordre
// et qui me permette avec valider d'envoyer dans une zone cette définition »).
// Les pièces — textes, photos, vidéos, vocaux, stickers, échanges DiGiSha — défilent par colonne (z1…z4, fils, DiGiSha). Un clic sur
// une pièce la pose sur le banc (elle prend son numéro), un second clic l'en retire. Le banc montre la définition assemblée dans
// l'ordre ; on déplace une pièce (← →), on nomme, on choisit la zone, « Valider ». Le passage des deux heures l'envoie dans sa zone.

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { chargerFlux, chargerFluxPraticienne, poserMontage, type Demande, type Element, type Groupe, type Phrase, type Zone } from "./actions";
import { PorterClient } from "./porter-client";
import { PreparerClient } from "./preparer-client";

const SECONDES = 20; // le pont écrit en 1 s ; 20 s suffit pour suivre un enseignement sans marteler la base

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
  { cle: "soin", titre: "Soin", aide: "la suite des gestes, dans l'ordre où ils se donnent — deux pièces au moins" },
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

// La séquence du banc, mise à plat — c'est CE texte qui part dans un groupe quand on publie.
// (21.10 : « seul le mot test a été envoyé pas le reste » — le bouton Publier était branché à côté
//  du banc et ne voyait pas la séquence. Elle se calcule ici, une fois, et sert aux deux.)
function assembler(sequence: string[], parId: Map<string, Element>): string {
  return sequence.map((id, i) => {
    const e = parId.get(id);
    if (!e) return `${i + 1}. ?`;
    const t = texteDe(e).trim();
    return `${i + 1}. ` + (e.media_type ? `[${GENRE[e.media_type] ?? "média"}]${t ? " " + t : ""}` : t);
  }).join("\n");
}

function Piece({ e, rang, nouveau, basculer }: { e: Element; rang: number | null; nouveau?: boolean; basculer: (id: string) => void }) {
  return (
    <button type="button" onClick={() => basculer(e.wa_message_id)}
      className={"relative mb-2 block w-full rounded-lg border p-2 text-left transition " +
        (rang ? "border-fuchsia-500 bg-fuchsia-50 ring-2 ring-fuchsia-400"
          : nouveau ? "border-emerald-400 bg-emerald-50/60 ring-1 ring-emerald-300 hover:border-fuchsia-300"
          : e.de_patrick ? "border-amber-300 bg-amber-50/40 hover:border-fuchsia-300" : "border-gray-200 bg-white hover:border-fuchsia-300")}>
      {rang && <span className="absolute -left-1.5 -top-1.5 rounded-full bg-fuchsia-700 px-2 text-xs font-bold text-white">{rang}</span>}
      {!rang && nouveau && <span className="absolute -left-1.5 -top-1.5 rounded-full bg-emerald-600 px-2 text-[10px] font-bold text-white">nouveau</span>}
      <span className="flex justify-between gap-2 text-xs text-gray-500">
        <span className="truncate">{e.heure} · <b className={e.de_patrick ? "text-amber-800" : ""}>{e.qui}</b></span>
        <span className="max-w-[50%] truncate" title={e.chat}>{e.chat}</span>
      </span>
      <span className="mt-1 block"><Media e={e} /></span>
      {e.texte && <span className="mt-1 block max-h-72 overflow-y-auto whitespace-pre-wrap text-[15px] leading-relaxed">{e.texte}</span>}
    </button>
  );
}

// La planche — Patrick, 21.10.2026 : « construire et visualiser un soin ». Le banc sert à monter,
// la planche sert à VOIR : la suite entière, en grand, dans l'ordre où elle se donne. Un geste par
// ligne, son rang, son média à taille lisible, ses mots dessous. C'est la vue qu'on relit avant de
// donner le soin — pas une vignette de 160 px.
function Planche({ nom, texte, zone, sequence, parId, fermer }: {
  nom: string; texte: string; zone: Zone; sequence: string[]; parId: Map<string, Element>; fermer: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-white/97 backdrop-blur">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 flex items-start justify-between gap-4 border-b border-gray-200 pb-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-fuchsia-700">
              {ZONES.find((z) => z.cle === zone)?.titre ?? zone} · {sequence.length} geste(s)
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">{nom.trim() || "sans nom"}</h2>
            {texte.trim() && <p className="mt-2 max-w-prose whitespace-pre-wrap text-sm text-gray-700">{texte.trim()}</p>}
          </div>
          <button type="button" onClick={fermer} className="shrink-0 rounded-md border border-gray-300 px-3 py-1 text-sm">
            Fermer
          </button>
        </div>
        <ol className="space-y-6">
          {sequence.map((id, i) => {
            const e = parId.get(id);
            const t = e ? texteDe(e).trim() : "";
            return (
              <li key={id} className="flex gap-4">
                <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-fuchsia-700 text-sm font-bold text-white">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  {e?.media_type && (
                    <div className="mb-2">
                      {e.url && (e.media_type === "image" || e.media_type === "sticker") ? (
                        <img src={e.url} alt="" loading="lazy" className="max-h-[60vh] rounded-lg" />
                      ) : (
                        <Media e={e} />
                      )}
                    </div>
                  )}
                  {t ? (
                    <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-gray-900">{t}</p>
                  ) : (
                    !e?.media_type && <p className="text-sm italic text-gray-400">pièce introuvable</p>
                  )}
                  {e && (
                    <p className="mt-1 text-[11px] text-gray-400">
                      {e.heure} · {e.qui}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

function Banc({ sequence, parId, jour, montages, retirer, deplacer, vider, pose, atelier = false, lectureSeule = false }: {
  sequence: string[]; parId: Map<string, Element>; jour: string; montages: Phrase[];
  retirer: (id: string) => void; deplacer: (i: number, d: -1 | 1) => void; vider: () => void; pose: (p: Phrase) => void;
  // atelier : une praticienne monte sa planche mais ne la verse pas dans les zones de DiGiSha (réservées à Patrick)
  atelier?: boolean;
  // lectureSeule : en « voir comme » on regarde — la base refuse Valider (migration 2026-10-21h), l'écran le dit avant
  lectureSeule?: boolean;
}) {
  const [nom, setNom] = useState("");
  const [texte, setTexte] = useState("");
  const [zone, setZone] = useState<Zone>(atelier ? "soin" : "lexique");
  const [erreur, setErreur] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [planche, setPlanche] = useState(false);
  const [enCours, demarrer] = useTransition();
  const assemble = assembler(sequence, parId);
  const valider = () =>
    demarrer(async () => {
      setOk(null);
      if (!nom.trim()) { setErreur("donne un nom au montage (le terme, ou le nom de la phrase)"); return; }
      if (!sequence.length) { setErreur("clique d'abord sur des pièces"); return; }
      if (zone === "phrase" && sequence.length < 2) { setErreur("une phrase énergétique a deux pièces au moins"); return; }
      if (zone === "soin" && sequence.length < 2) { setErreur("un soin est une suite de gestes : deux pièces au moins"); return; }
      const r = await poserMontage(nom.trim(), zone, texte.trim() || null, sequence, jour, atelier);
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
            <input value={nom} onChange={(x) => setNom(x.target.value)} placeholder={atelier ? "nom de ta planche" : "nom : le terme, ou le nom de la phrase"} maxLength={200}
              className="min-w-[14rem] flex-1 rounded-md border border-fuchsia-200 px-2 py-1 text-sm" />
            {/* une praticienne valide en zone « soin » seulement : les trois autres zones nourrissent DiGiSha au nom
                de Patrick (index_vers_savoir.py, PATRICK_SVLBH en dur) — la base le refuse aussi (migration 2026-10-21g) */}
            <select value={zone} onChange={(x) => setZone(x.target.value as Zone)} className="rounded-md border border-fuchsia-200 px-2 py-1 text-sm"
              title={ZONES.find((z) => z.cle === zone)?.aide} disabled={atelier}>
              {ZONES.filter((z) => !atelier || z.cle === "soin").map((z) => <option key={z.cle} value={z.cle}>{z.titre}</option>)}
            </select>
            <button type="button" onClick={() => setPlanche(true)}
              className="rounded-md border border-fuchsia-300 px-3 py-1 text-sm text-fuchsia-900"
              title="voir la suite en grand, dans l'ordre où elle se donne">Voir la planche</button>
            <button type="button" disabled={enCours || lectureSeule} onClick={valider}
              className="rounded-md bg-fuchsia-700 px-4 py-1 text-sm font-semibold text-white disabled:opacity-40"
              title={lectureSeule ? "en « voir comme » on regarde — on ne valide pas au nom de quelqu'un d'autre" : undefined}>Valider</button>
          </div>
          <textarea value={texte} onChange={(x) => setTexte(x.target.value)} rows={2} maxLength={4000}
            placeholder="tes mots, s'il en faut (ils viennent avant les pièces dans la définition)"
            className="mt-2 w-full rounded-md border border-fuchsia-200 px-2 py-1 text-xs" />
          <p className="text-[11px] text-fuchsia-900/70">{ZONES.find((z) => z.cle === zone)?.aide}</p>
        </>
      )}
      {planche && sequence.length > 0 && (
        <Planche nom={nom} texte={texte} zone={zone} sequence={sequence} parId={parId} fermer={() => setPlanche(false)} />
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

export function IndexerClient({ initial, phrases, jour, groupes, demandes, atelier = false, lectureSeule = false }: {
  initial: Element[]; phrases: Phrase[]; jour: string; groupes: Groupe[]; demandes: Demande[];
  // atelier : /mes-planches — une praticienne monte, « Préparer pour WhatsApp » lui tend la planche, son téléphone publie
  atelier?: boolean;
  // lectureSeule : Patrick en « voir comme » une praticienne — il voit son atelier, il ne valide pas à sa place
  lectureSeule?: boolean;
}) {
  const [montages, setMontages] = useState(phrases);
  const [sequence, setSequence] = useState<string[]>([]);
  const [stickers, setStickers] = useState(true);   // montrés par défaut (DEC Patrick 21.10)
  const [patrickSeul, setPatrickSeul] = useState(false);
  const [parChat, setParChat] = useState(false);
  const [chatChoisi, setChatChoisi] = useState<string | null>(null);

  // ── le direct ────────────────────────────────────────────────────────────
  // Le pont écrit le message dans la base en une seconde ; c'est la page qui ne relisait jamais.
  // Toutes les 20 s on relit le MÊME flux que le rendu, et les pièces apparues depuis l'ouverture
  // portent un liseré « nouveau » jusqu'au prochain passage. Le banc n'est pas touché : une pièce
  // posée garde son rang. Le direct ne s'arme que sur le jour courant — relire la veille n'a pas de sens.
  const [elements, setElements] = useState(initial);
  const [direct, setDirect] = useState(false);
  const [nouveaux, setNouveaux] = useState<Set<string>>(new Set());
  const [derniere, setDerniere] = useState<string | null>(null);
  const connus = useRef(new Set(initial.map((e) => e.wa_message_id)));

  // (pas d'effet de resynchronisation : la page passe key={jour}, donc changer de jour remonte
  //  le composant et repart d'un état neuf — React le fait mieux qu'un setState dans un effet.)

  useEffect(() => {
    if (!direct) return;
    let vivant = true;
    const relire = async () => {
      // l'atelier relit SON flux — index_flux (celui de Patrick) refuse une praticienne, et le direct restait muet
      const f = await (atelier ? chargerFluxPraticienne : chargerFlux)(jour);
      if (!vivant || f.erreur) return;
      const frais = f.elements.filter((e) => !connus.current.has(e.wa_message_id)).map((e) => e.wa_message_id);
      for (const id of frais) connus.current.add(id);
      setElements(f.elements);
      setMontages(f.phrases);
      if (frais.length) setNouveaux((s) => new Set([...s, ...frais]));
      setDerniere(new Date().toLocaleTimeString("fr-CH", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    };
    const t = setInterval(relire, SECONDES * 1000);
    void relire();
    return () => { vivant = false; clearInterval(t); };
  }, [direct, jour, atelier]);

  const parId = useMemo(() => new Map(elements.map((e) => [e.wa_message_id, e])), [elements]);
  // ── par conversation plutôt que par pont ─────────────────────────────────
  // Patrick, 21.10 : un même groupe est vu par plusieurs de ses ponts ; index_flux garde le pont dont
  // le nom vient en premier, si bien qu'une séquence d'enseignement se retrouve éclatée sur z1…z4.
  // Mesuré le 21.10 sur MyShaman Family Pro : vu par z1, z2, z3, z4 ET z5 à la fois. « Par conversation »
  // rend la suite entière d'un coup, dans l'ordre où elle a été donnée.
  const conversations = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of elements) m.set(e.chat, (m.get(e.chat) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [elements]);

  const colonnes = useMemo(() => {
    if (parChat) {
      const retenues = chatChoisi ? conversations.filter(([c]) => c === chatChoisi) : conversations;
      return retenues.map(([c]) => ({ cle: c, titre: c }));
    }
    return COLONNES;
  }, [parChat, chatChoisi, conversations]);

  const parColonne = useMemo(() => {
    const m = new Map<string, Element[]>();
    for (const e of elements) {
      const surLeBanc = sequence.includes(e.wa_message_id);
      if (!surLeBanc && !stickers && e.media_type === "sticker") continue;
      if (!surLeBanc && patrickSeul && !e.de_patrick) continue;
      if (!surLeBanc && chatChoisi && e.chat !== chatChoisi) continue;
      const cle = parChat ? e.chat : e.colonne;
      const arr = m.get(cle) ?? [];
      arr.push(e);
      m.set(cle, arr);
    }
    // par conversation : du plus ancien au plus récent — la suite se lit dans l'ordre où elle a été donnée
    if (parChat) for (const arr of m.values()) arr.sort((a, b) => a.heure.localeCompare(b.heure));
    return m;
  }, [elements, stickers, patrickSeul, sequence, parChat, chatChoisi]);
  const basculer = (id: string) => setSequence((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const deplacer = (i: number, d: -1 | 1) =>
    setSequence((s) => { const t = [...s]; const j = i + d; if (j < 0 || j >= t.length) return s; [t[i], t[j]] = [t[j], t[i]]; return t; });
  return (
    <div>
      <Banc sequence={sequence} parId={parId} jour={jour} montages={montages} retirer={basculer} deplacer={deplacer}
        vider={() => setSequence([])} pose={(p) => setMontages((xs) => [...xs, p])} atelier={atelier} lectureSeule={lectureSeule} />
      {atelier ? (
        /* une praticienne : la planche lui est mise en main, c'est son téléphone qui publie */
        <PreparerClient sequence={sequence} parId={parId} />
      ) : (
        /* Patrick : « Porter » reçoit la séquence du banc, assemblée — c'est elle qui part par ses ponts */
        <PorterClient groupes={groupes} demandes={demandes} pieces={sequence} apercu={assembler(sequence, parId)} montageId={null} />
      )}
      <div className="mb-3 flex flex-wrap items-center gap-4 text-base">
        <label className="flex items-center gap-1 font-medium">
          <input type="checkbox" checked={parChat} onChange={(x) => { setParChat(x.target.checked); if (!x.target.checked) setChatChoisi(null); }} />
          Par conversation
        </label>
        <select value={chatChoisi ?? ""} onChange={(x) => { setChatChoisi(x.target.value || null); if (x.target.value) setParChat(true); }}
          className="max-w-[22rem] rounded-md border border-gray-300 px-2 py-1 text-base"
          title="ne garder qu'une conversation — le groupe que tu lis ou dans lequel tu enseignes">
          <option value="">toutes les conversations ({conversations.length})</option>
          {conversations.map(([c, n]) => <option key={c} value={c}>{c} ({n})</option>)}
        </select>
        <label className="flex items-center gap-1"><input type="checkbox" checked={stickers} onChange={(x) => setStickers(x.target.checked)} /> montrer les stickers</label>
        <label className="flex items-center gap-1"><input type="checkbox" checked={patrickSeul} onChange={(x) => setPatrickSeul(x.target.checked)} /> seulement mes messages</label>
        <label className="flex items-center gap-1 font-medium text-emerald-800">
          <input type="checkbox" checked={direct} onChange={(x) => { setDirect(x.target.checked); if (!x.target.checked) setNouveaux(new Set()); }} />
          <span className={direct ? "inline-flex items-center gap-1" : ""}>
            {direct && <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-600" />}
            En direct
          </span>
        </label>
        <span className="text-gray-500">
          {elements.length} pièce(s) ce jour
          {direct && <> · relu toutes les {SECONDES} s{derniere && ` · dernière lecture ${derniere}`}</>}
          {nouveaux.size > 0 && <span className="ml-1 rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-900">{nouveaux.size} nouvelle(s)</span>}
        </span>
      </div>
      <div className={"grid grid-cols-1 gap-3 " + (chatChoisi ? "" : parChat ? "md:grid-cols-2 2xl:grid-cols-3" : "md:grid-cols-3 2xl:grid-cols-6")}>
        {colonnes.map((c) => {
          const xs = parColonne.get(c.cle) ?? [];
          return (
            <section key={c.cle} className="flex max-h-[70vh] flex-col rounded-xl bg-gray-50 p-2">
              <h2 className="mb-2 flex justify-between gap-2 text-base font-semibold"><span className="truncate" title={c.titre}>{c.titre}</span><span className="shrink-0 text-gray-500">{xs.length}</span></h2>
              <div className="overflow-y-auto px-1.5 pt-1.5">
                {xs.length === 0 && <p className="text-xs text-gray-400">rien ce jour-là</p>}
                {xs.map((e) => { const i = sequence.indexOf(e.wa_message_id); return <Piece key={e.wa_message_id} e={e} rang={i >= 0 ? i + 1 : null} nouveau={nouveaux.has(e.wa_message_id)} basculer={basculer} />; })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
