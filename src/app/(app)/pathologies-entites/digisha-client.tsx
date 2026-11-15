"use client";

// DiGiSha dans la fenêtre — Patrick, 21.10.2026 : « un DiGiSha qui me permette de dialoguer avec DiGiSha pour des
// définitions », puis, après l'essai : « ça n'est pas possible de travailler comme cela ». Mesuré : DiGiSha répondait en
// Markdown brut (**gras**), en mode accompagnement (salutation, renvois à son fil), et la pièce du banc portait la
// QUESTION. Donc : un champ « Définition de : <terme> » qui demande une définition isolée, prête pour WhatsApp, sans
// préambule ; les réponses rendues lisibles (gras) avec « Copier » ; et un dialogue libre dessous pour creuser.
// Le serveur (vlbh-energy-mcp) écrit chaque tour dans digisha_chat_log : la réponse devient une pièce de la colonne
// DiGiSha au rafraîchissement qui suit. En « voir comme » on regarde : le tour partirait sous le mauvais nom.

import { useEffect, useState, useTransition, type ReactNode } from "react";
import { dialoguerDigisha, lireCoutDigisha } from "./actions";
import { copier, markdownVersWhatsApp } from "./whatsapp";

type Tour = { role: "user" | "assistant"; content: string };

/** La ligne de coût écrite, ou null. Jamais d'erreur : une lecture qui échoue n'affiche rien. */
const lireLigneCout = (): Promise<string | null> => lireCoutDigisha().catch(() => null);

// La consigne qui fait d'une réponse d'accompagnement une définition publiable. Première ligne = le terme : c'est elle
// que la pièce du banc montre comme question (questionDe).
export function consigneDefinition(terme: string): string {
  return `Définition : ${terme.trim()}\n` +
    `Donne la définition SVLBH de « ${terme.trim()} », telle que je peux la coller dans un groupe WhatsApp : 4 à 8 lignes, ` +
    `sans salutation, sans question en retour, sans renvoi à un fil ou à un sticker, sans Markdown. ` +
    `Mets le terme en gras WhatsApp (*terme*) en tête, puis le sens, puis le geste ou la lecture qui va avec.`;
}

/** Rend le texte WhatsApp avec son gras (*…*) et son italique (_…_) visibles. */
export function TexteWhatsApp({ texte }: { texte: string }) {
  const morceaux: ReactNode[] = [];
  const re = /(\*[^*\n]+\*|_[^_\n]+_)/g;
  let i = 0, m: RegExpExecArray | null;
  while ((m = re.exec(texte)) !== null) {
    if (m.index > i) morceaux.push(texte.slice(i, m.index));
    const x = m[0];
    morceaux.push(x.startsWith("*") ? <b key={m.index}>{x.slice(1, -1)}</b> : <i key={m.index}>{x.slice(1, -1)}</i>);
    i = m.index + x.length;
  }
  if (i < texte.length) morceaux.push(texte.slice(i));
  return <span className="whitespace-pre-wrap">{morceaux}</span>;
}

export function DigishaClient({ lectureSeule = false, apresReponse }: { lectureSeule?: boolean; apresReponse: () => Promise<void> }) {
  const [ouvert, setOuvert] = useState(true);
  const [terme, setTerme] = useState("");
  const [definitions, setDefinitions] = useState<{ terme: string; texte: string }[]>([]);
  const [tours, setTours] = useState<Tour[]>([]);
  const [texte, setTexte] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  // La phrase du serveur quand la dernière réponse n'a pas été gardée dans ses pages (carte ac79ce6b, 15.11.2026).
  const [nonGarde, setNonGarde] = useState<string | null>(null);
  const [copie, setCopie] = useState<string | null>(null);
  const [enCours, demarrer] = useTransition();

  // La ligne de coût (Patrick, 11.11.2026 : « sur tous les DigiSha nous allons brancher cela », carte 91c366cd) : lue
  // quand l'écran se monte, relue après chaque réponse (définition ou dialogue). null = rien à l'écran — sous ST3, sans
  // session, ou si la lecture échoue : ni ligne, ni message d'erreur. En « voir comme », c'est le coût de la personne
  // observée (l'encadré est alors en lecture seule : la ligne se lit au montage et ne bouge plus).
  const [cout, setCout] = useState<string | null>(null);
  // Hors transition, comme le direct d'à côté (indexer-client) : tant qu'une action asynchrone est en cours, React
  // retient TOUTES les autres transitions de la page (un clic sur « ← veille » attendrait cette lecture). Une ligne
  // discrète ne retient personne.
  useEffect(() => {
    let vivant = true;
    void lireLigneCout().then((ligne) => { if (vivant) setCout(ligne); });
    return () => { vivant = false; };
  }, []);

  const copierCa = async (t: string, cle: string) => {
    setCopie((await copier(t)) ? cle : "refus");
    setTimeout(() => setCopie(null), 2000);
  };

  // une définition = un tour isolé (pas d'historique : DiGiSha ne renvoie à rien d'autre)
  const definir = () =>
    demarrer(async () => {
      const t = terme.trim();
      if (!t) return;
      setErreur(null); setNonGarde(null);
      const r = await dialoguerDigisha([{ role: "user", content: consigneDefinition(t) }]);
      if (!r.ok) { setErreur(r.erreur ?? "refusé"); return; }
      setNonGarde(r.nonGarde ?? null);
      setDefinitions((xs) => [{ terme: t, texte: markdownVersWhatsApp(r.reply ?? "") }, ...xs]);
      setTerme("");
      void lireLigneCout().then(setCout);
      await apresReponse();
    });

  const envoyer = () =>
    demarrer(async () => {
      const q = texte.trim();
      if (!q) return;
      const suite: Tour[] = [...tours, { role: "user", content: q }];
      setTours(suite); setTexte(""); setErreur(null); setNonGarde(null);
      const r = await dialoguerDigisha(suite);
      if (!r.ok) { setErreur(r.erreur ?? "refusé"); return; }
      setNonGarde(r.nonGarde ?? null);
      setTours([...suite, { role: "assistant", content: markdownVersWhatsApp(r.reply ?? "") }]);
      void lireLigneCout().then(setCout);
      await apresReponse();
    });

  return (
    <section className="mb-4 rounded-xl border border-indigo-200 bg-indigo-50/60 p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <button type="button" onClick={() => setOuvert((o) => !o)} className="text-base font-semibold text-indigo-900">
          {ouvert ? "▾" : "▸"} DiGiSha — définitions
        </button>
        <div className="text-xs text-indigo-900/70">
          chaque réponse devient une pièce de la colonne DiGiSha (clique-la pour la poser sur le banc) — et se copie telle quelle dans WhatsApp
          {cout && <p className="mt-0.5 tabular-nums text-gray-500">{cout}</p>}
        </div>
      </div>
      {ouvert && (
        <div className="mt-2 space-y-3">
          {/* une définition, propre, isolée */}
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-sm font-medium text-indigo-900">Définition de :</label>
            <input value={terme} onChange={(x) => setTerme(x.target.value)} maxLength={120} disabled={lectureSeule || enCours}
              onKeyDown={(x) => { if (x.key === "Enter") { x.preventDefault(); definir(); } }}
              placeholder={lectureSeule ? "en « voir comme » on regarde" : "un terme — ex. mudrā, enfant toxique, égrégore…"}
              className="min-w-[16rem] flex-1 rounded-md border border-indigo-200 px-2 py-1 text-[15px] disabled:opacity-60" />
            <button type="button" onClick={definir} disabled={lectureSeule || enCours || !terme.trim()}
              className="rounded-md bg-indigo-700 px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-40">
              {enCours ? "DiGiSha réfléchit…" : "Définir"}
            </button>
          </div>
          {definitions.length > 0 && (
            <ol className="space-y-2">
              {definitions.map((d, i) => (
                <li key={`${d.terme}-${i}`} className="rounded-lg bg-white p-3 ring-1 ring-indigo-200">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-xs uppercase tracking-wide text-indigo-700">{d.terme}</span>
                    <button type="button" onClick={() => copierCa(d.texte, `def-${i}`)}
                      className="rounded-md border border-emerald-400 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-900">
                      {copie === `def-${i}` ? "copié ✓" : "Copier pour WhatsApp"}
                    </button>
                  </div>
                  <p className="text-[15px] leading-relaxed text-gray-900"><TexteWhatsApp texte={d.texte} /></p>
                </li>
              ))}
            </ol>
          )}

          {/* le dialogue libre, pour creuser */}
          <details className="rounded-lg bg-white/70 p-2 ring-1 ring-indigo-100">
            <summary className="cursor-pointer text-sm text-indigo-900">Dialogue libre avec DiGiSha</summary>
            {tours.length > 0 && (
              <ol className="my-2 max-h-72 space-y-2 overflow-y-auto">
                {tours.map((t, i) => (
                  <li key={i} className="text-[14px] leading-relaxed">
                    <div className="flex items-start justify-between gap-2">
                      <span><b className="mr-1 text-xs uppercase tracking-wide text-indigo-700">{t.role === "user" ? "toi" : "DiGiSha"}</b>
                        <TexteWhatsApp texte={t.content} /></span>
                      {t.role === "assistant" && (
                        <button type="button" onClick={() => copierCa(t.content, `tour-${i}`)} className="shrink-0 text-xs text-emerald-800 underline">
                          {copie === `tour-${i}` ? "copié ✓" : "copier"}
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            )}
            <div className="mt-2 flex items-end gap-2">
              <textarea value={texte} onChange={(x) => setTexte(x.target.value)} rows={2} maxLength={4000} disabled={lectureSeule || enCours}
                onKeyDown={(x) => { if (x.key === "Enter" && !x.shiftKey) { x.preventDefault(); envoyer(); } }}
                placeholder="une question, une distinction… (Entrée pour envoyer, Maj+Entrée pour une ligne)"
                className="min-w-0 flex-1 rounded-md border border-indigo-200 px-2 py-1 text-[14px] disabled:opacity-60" />
              <button type="button" onClick={envoyer} disabled={lectureSeule || enCours || !texte.trim()}
                className="rounded-md border border-indigo-400 bg-white px-3 py-2 text-sm font-semibold text-indigo-900 disabled:opacity-40">Demander</button>
              {tours.length > 0 && (
                <button type="button" onClick={() => setTours([])} disabled={enCours} className="text-xs text-indigo-900 underline">nouveau fil</button>
              )}
            </div>
          </details>
          {erreur && <p className="text-xs text-red-700">{erreur}</p>}
          {nonGarde && <p role="status" className="text-xs text-amber-800">{nonGarde}</p>}
          {copie === "refus" && <p className="text-xs text-red-700">le presse-papiers a refusé — sélectionne le texte à la main</p>}
        </div>
      )}
    </section>
  );
}
