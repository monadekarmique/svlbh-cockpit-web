"use client";

// La simulation du point de bascule — DEC Patrick 25.09.2026.
//   v0.9.4 : « au lieu de il faut je veux pouvoir jouer avec pour obtenir un total en bas »
//   puis : « cette version 0.9.4 c'est si je suis tout seul et le chiffre d'affaire est annuel »
//   puis : « revient à l'ancienne version elle m'allait beaucoup mieux […] - persistante »
//
// ⚠️ LA FORME EST CELLE DE v0.9.4, et elle ne doit pas regrossir : prix × quantité
// = chiffre d'affaires TTC de la ligne, un total en bas. Une colonne « paiements par
// personne » ajoutée entre-temps a été retirée à la demande de Patrick — elle
// répondait à une question qu'il ne posait pas. Le chiffre d'affaires est ANNUEL :
// il se compare à ce qu'il faut couvrir sur l'année (charges du mois × 12).
//
// PERSISTANTE : chaque changement s'enregistre seul, 700 ms après la dernière
// frappe, dans modele_simulation (une ligne par scénario, propriétaire ST6 seul).
// Un échec d'enregistrement se NOMME à l'écran — jamais un « enregistré » qui ment.
// La sélection du nombre au clic vient de NumberInputSelectAll, monté dans le
// layout (DEC Patrick 10.06) — pas d'onFocus ici.
import { useEffect, useRef, useState } from "react";
import { enregistrerSimulation, type EtatSimulation } from "./actions";

export type LigneSimulation = {
  id: string;
  label: string;
  /** Nul = « à fixer » dans le modèle : montré, jamais inventé. */
  prix: number | null;
  rythme: "mensuel" | "hebdo" | "unique";
  duree?: string | null;
  precision?: string | null;
  /** Quantité de départ, lue dans le modèle (0 si le modèle n'en dit rien). */
  quantite: number;
  /** Compte dans les apprenantes par défaut (les options et la découverte non). */
  apprenante: boolean;
};

const CHF = new Intl.NumberFormat("fr-CH", {
  style: "currency", currency: "CHF", minimumFractionDigits: 0, maximumFractionDigits: 0,
});
const CHF2 = new Intl.NumberFormat("fr-CH", {
  style: "currency", currency: "CHF", minimumFractionDigits: 2,
});
const entier = (v: string) => Math.max(0, Math.floor(Number(v) || 0));
// ⚠️ Fuseau FIXÉ : sans lui, le serveur (Render, UTC) et le navigateur (Zurich)
// écrivaient deux heures différentes — erreur d'hydratation React #418, mesurée le 25.09.
const heure = (iso: string) =>
  new Date(iso).toLocaleString("fr-CH", {
    day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Zurich",
  });

export function Simulation({ lignes, aCouvrirMois, coutApprenanteAn, formatriceMois, scenario, cle, sauvegarde, sauvegardeLe }: {
  lignes: LigneSimulation[];
  aCouvrirMois: number;
  coutApprenanteAn: number;
  formatriceMois: number | null;
  scenario: string | null;
  /** Le scénario sous lequel la simulation s'enregistre. */
  cle: string;
  /** Ce qui a été enregistré pour ce scénario, ou nul si jamais. */
  sauvegarde: EtatSimulation | null;
  sauvegardeLe: string | null;
}) {
  // Les valeurs du modèle, puis ce que Patrick a enregistré par-dessus. Une ligne
  // apparue depuis (nouveau tarif) garde la valeur du modèle.
  const modeleQ = () => Object.fromEntries(lignes.map((l) => [l.id, l.quantite]));
  const [quantites, setQuantites] = useState<Record<string, number>>(
    () => ({ ...modeleQ(), ...(sauvegarde?.quantites ?? {}) }),
  );
  const [formatrices, setFormatrices] = useState(sauvegarde?.formatrices ?? 0);
  // Nul = le nombre d'apprenantes suit les lignes « apprenante » ; forçable à la main.
  const [apprenantesForcees, setApprenantesForcees] = useState<number | null>(sauvegarde?.apprenantesForcees ?? null);

  type Statut = { etat: "jamais" } | { etat: "enregistre"; le: string } | { etat: "en_cours" } | { etat: "erreur"; message: string };
  const [statut, setStatut] = useState<Statut>(sauvegardeLe ? { etat: "enregistre", le: sauvegardeLe } : { etat: "jamais" });
  const premier = useRef(true);
  useEffect(() => {
    // Le premier rendu montre ce qui est déjà en base : rien à réécrire.
    if (premier.current) { premier.current = false; return; }
    setStatut({ etat: "en_cours" });
    const t = setTimeout(() => {
      enregistrerSimulation(cle, { quantites, paiements: {}, formatrices, apprenantesForcees })
        .then((le) => setStatut({ etat: "enregistre", le }))
        .catch((e: unknown) => setStatut({ etat: "erreur", message: e instanceof Error ? e.message : String(e) }));
    }, 700);
    return () => clearTimeout(t);
  }, [cle, quantites, formatrices, apprenantesForcees]);

  const revenirAuModele = () => {
    setQuantites(modeleQ());
    setFormatrices(0);
    setApprenantesForcees(null);
  };

  const q = (id: string) => quantites[id] ?? 0;
  const ca = lignes.reduce((s, l) => s + (l.prix ?? 0) * q(l.id), 0);
  const aCouvrirAn = aCouvrirMois * 12;
  const apprenantesAuto = lignes.filter((l) => l.apprenante).reduce((s, l) => s + q(l.id), 0);
  const apprenantes = apprenantesForcees ?? apprenantesAuto;
  const coutApprenantes = apprenantes * coutApprenanteAn;
  const coutFormatrices = formatriceMois != null ? formatrices * formatriceMois * 12 : 0;
  const ecart = ca - aCouvrirAn - coutApprenantes - coutFormatrices;

  const champ = "w-20 rounded border border-neutral-300 px-2 py-1 text-right tabular-nums";

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">
        Scénario : {formatrices === 0
          ? (scenario ?? "Patrick seul")
          : `avec ${formatrices} formatrice${formatrices > 1 ? "s" : ""}`}
        <span className="font-normal text-neutral-500"> — chiffre d’affaires sur l’année</span>
      </p>
      <p className="flex flex-wrap items-center gap-3 text-xs">
        {statut.etat === "enregistre" && <span className="text-emerald-700">Enregistré le {heure(statut.le)}</span>}
        {statut.etat === "en_cours" && <span className="text-neutral-500">Enregistrement…</span>}
        {statut.etat === "jamais" && <span className="text-neutral-500">Valeurs du modèle — rien d’enregistré pour ce scénario</span>}
        {statut.etat === "erreur" && <span className="text-rose-700">Non enregistré — {statut.message}</span>}
        <button type="button" className="text-neutral-500 underline" onClick={revenirAuModele}>
          revenir aux valeurs du modèle
        </button>
      </p>
      <div className="overflow-x-auto rounded-lg border border-neutral-200">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-3 py-2">Ce qu’elle verse</th>
              <th className="px-3 py-2">Rythme</th>
              <th className="px-3 py-2 text-right">Prix</th>
              <th className="px-3 py-2 text-right">Quantité</th>
              <th className="px-3 py-2 text-right">CA TTC / an</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {lignes.map((l) => (
              <tr key={l.id}>
                <td className="px-3 py-2">
                  {l.label}
                  {l.precision && <span className="block text-xs text-neutral-500">{l.precision}</span>}
                </td>
                <td className="px-3 py-2 text-xs">
                  {l.rythme === "mensuel"
                    ? <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-emerald-900">
                        mensuel{l.duree ? ` · ${l.duree}` : ""}
                      </span>
                    : l.rythme === "hebdo"
                      ? <span className="rounded bg-sky-100 px-1.5 py-0.5 text-sky-900">par semaine et par animateur</span>
                      : <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-neutral-700">{l.duree ?? "à l’unité"}</span>}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {l.prix == null ? <span className="text-amber-700">à fixer</span> : CHF.format(l.prix)}
                </td>
                <td className="px-3 py-2 text-right">
                  <input
                    type="number" min={0} step={1} className={champ}
                    value={q(l.id)}
                    onChange={(e) => setQuantites((p) => ({ ...p, [l.id]: entier(e.target.value) }))}
                    aria-label={`Quantité — ${l.label}`}
                  />
                  {l.rythme === "hebdo" && (
                    <span className="block text-xs text-neutral-400">animations</span>
                  )}
                </td>
                <td className="px-3 py-2 text-right font-medium tabular-nums">
                  {l.prix == null ? <span className="text-neutral-400">—</span> : CHF.format(l.prix * q(l.id))}
                </td>
              </tr>
            ))}
            <tr className="bg-neutral-50 font-semibold">
              <td className="px-3 py-2" colSpan={4}>Chiffre d’affaires TTC / an</td>
              <td className="px-3 py-2 text-right tabular-nums">{CHF.format(ca)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="overflow-x-auto rounded-lg border border-neutral-200">
        <table className="w-full text-sm">
          <tbody className="divide-y divide-neutral-100">
            <tr>
              <td className="px-3 py-2">Chiffre d’affaires TTC sur l’année</td>
              <td className="px-3 py-2" />
              <td className="px-3 py-2 text-right tabular-nums">{CHF2.format(ca)}</td>
            </tr>
            <tr>
              <td className="px-3 py-2">À couvrir sur l’année</td>
              <td className="px-3 py-2 text-xs text-neutral-500">{CHF2.format(aCouvrirMois)} × 12</td>
              <td className="px-3 py-2 text-right tabular-nums">− {CHF2.format(aCouvrirAn)}</td>
            </tr>
            <tr>
              <td className="px-3 py-2">
                Apprenantes
                <span className="block text-xs text-neutral-500">
                  {CHF2.format(coutApprenanteAn)} par an chacune
                  {apprenantesForcees == null ? " — les parcours, sans les options ni la découverte" : ""}
                </span>
              </td>
              <td className="px-3 py-2 text-right">
                <input
                  type="number" min={0} step={1} className={champ}
                  value={apprenantes}
                  onChange={(e) => setApprenantesForcees(entier(e.target.value))}
                  aria-label="Nombre d’apprenantes"
                />
                {apprenantesForcees != null && (
                  <button type="button" className="ml-2 text-xs text-neutral-500 underline"
                    onClick={() => setApprenantesForcees(null)}>
                    suivre les lignes
                  </button>
                )}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">− {CHF2.format(coutApprenantes)}</td>
            </tr>
            {formatriceMois != null && (
              <tr>
                <td className="px-3 py-2">
                  Formatrices
                  <span className="block text-xs text-neutral-500">
                    {CHF2.format(formatriceMois)} HT par mois chacune × 12, supervision non facturable
                  </span>
                </td>
                <td className="px-3 py-2 text-right">
                  <input
                    type="number" min={0} step={1} className={champ}
                    value={formatrices}
                    onChange={(e) => setFormatrices(entier(e.target.value))}
                    aria-label="Nombre de formatrices"
                  />
                </td>
                <td className="px-3 py-2 text-right tabular-nums">− {CHF2.format(coutFormatrices)}</td>
              </tr>
            )}
            <tr className={"font-semibold " + (ecart >= 0 ? "bg-emerald-50 text-emerald-900" : "bg-rose-50 text-rose-900")}>
              <td className="px-3 py-2">{ecart >= 0 ? "Au-dessus du point de bascule" : "Sous le point de bascule"}</td>
              <td className="px-3 py-2 text-xs font-normal">sur l’année, TTC, avant la TVA due</td>
              <td className="px-3 py-2 text-right tabular-nums">{CHF2.format(ecart)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
