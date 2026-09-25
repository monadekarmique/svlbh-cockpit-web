"use client";

// La simulation du point de bascule — DEC Patrick 25.09.2026.
//   v0.9.4 : « au lieu de il faut je veux pouvoir jouer avec pour obtenir un total en bas »
//   v0.9.5 : « cette version c'est si je suis tout seul et le chiffre d'affaire est annuel »
//
// Chaque ligne : prix × paiements par personne × quantité sur l'année = chiffre
// d'affaires TTC annuel. Le total se compare à ce qu'il faut couvrir sur l'année
// (charges du mois × 12), moins les apprenantes (coût annuel chacune) et les
// formatrices (coût mensuel HT × 12 chacune). Prix, durées et quantités de départ
// viennent de la base : ce composant ne connaît aucun chiffre.
//
// ⚠️ Rien n'est enregistré : recharger la page revient aux valeurs du modèle.
// La sélection du nombre au clic vient de NumberInputSelectAll, monté dans le
// layout (DEC Patrick 10.06) — pas d'onFocus ici.
import { useState } from "react";

export type LigneSimulation = {
  id: string;
  label: string;
  /** Nul = « à fixer » dans le modèle : montré, jamais inventé. */
  prix: number | null;
  /** Paiements par personne sur l'année (mois d'un parcours, 1 pour un paiement unique). */
  paiements: number;
  /** Ce que dit le modèle de la durée (« 5 mois », « 4 à 8 mois — borne basse »…). */
  paiementsNote: string;
  precision?: string | null;
  /** Quantité sur l'année, lue dans le modèle (0 si le modèle n'en dit rien). */
  quantite: number;
  /** Compte dans les apprenantes par défaut (les entrées de parcours, pas les options). */
  apprenante: boolean;
};

const CHF = new Intl.NumberFormat("fr-CH", {
  style: "currency", currency: "CHF", minimumFractionDigits: 0, maximumFractionDigits: 0,
});
const CHF2 = new Intl.NumberFormat("fr-CH", {
  style: "currency", currency: "CHF", minimumFractionDigits: 2,
});
const entier = (v: string) => Math.max(0, Math.floor(Number(v) || 0));

export function Simulation({ lignes, aCouvrirMois, coutApprenanteAn, formatriceMois, scenario }: {
  lignes: LigneSimulation[];
  aCouvrirMois: number;
  coutApprenanteAn: number;
  formatriceMois: number | null;
  scenario: string | null;
}) {
  const [quantites, setQuantites] = useState<Record<string, number>>(
    () => Object.fromEntries(lignes.map((l) => [l.id, l.quantite])),
  );
  const [paiements, setPaiements] = useState<Record<string, number>>(
    () => Object.fromEntries(lignes.map((l) => [l.id, l.paiements])),
  );
  const [formatrices, setFormatrices] = useState(0);
  // Nul = le nombre d'apprenantes suit les lignes « apprenante » ; forçable à la main.
  const [apprenantesForcees, setApprenantesForcees] = useState<number | null>(null);

  const q = (id: string) => quantites[id] ?? 0;
  const p = (id: string) => paiements[id] ?? 0;
  const caLigne = (l: LigneSimulation) => (l.prix ?? 0) * p(l.id) * q(l.id);
  const ca = lignes.reduce((s, l) => s + caLigne(l), 0);
  const aCouvrirAn = aCouvrirMois * 12;
  const apprenantesAuto = lignes.filter((l) => l.apprenante).reduce((s, l) => s + q(l.id), 0);
  const apprenantes = apprenantesForcees ?? apprenantesAuto;
  const coutApprenantes = apprenantes * coutApprenanteAn;
  const coutFormatrices = formatriceMois != null ? formatrices * formatriceMois * 12 : 0;
  const ecart = ca - aCouvrirAn - coutApprenantes - coutFormatrices;

  const champ = "w-16 rounded border border-neutral-300 px-2 py-1 text-right tabular-nums";

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">
        Scénario : {formatrices === 0
          ? (scenario ?? "Patrick seul")
          : `avec ${formatrices} formatrice${formatrices > 1 ? "s" : ""}`}
        <span className="font-normal text-neutral-500"> — chiffre d’affaires sur l’année</span>
      </p>
      <div className="overflow-x-auto rounded-lg border border-neutral-200">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-3 py-2">Ce qu’elle verse</th>
              <th className="px-3 py-2 text-right">Prix</th>
              <th className="px-3 py-2 text-right">Paiements</th>
              <th className="px-3 py-2 text-right">Quantité / an</th>
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
                <td className="px-3 py-2 text-right tabular-nums">
                  {l.prix == null ? <span className="text-amber-700">à fixer</span> : CHF.format(l.prix)}
                </td>
                <td className="px-3 py-2 text-right">
                  <input
                    type="number" min={0} step={1} className={champ}
                    value={p(l.id)}
                    onChange={(e) => setPaiements((x) => ({ ...x, [l.id]: entier(e.target.value) }))}
                    aria-label={`Paiements par personne — ${l.label}`}
                  />
                  <span className="block text-xs text-neutral-400">{l.paiementsNote}</span>
                </td>
                <td className="px-3 py-2 text-right">
                  <input
                    type="number" min={0} step={1} className={champ}
                    value={q(l.id)}
                    onChange={(e) => setQuantites((x) => ({ ...x, [l.id]: entier(e.target.value) }))}
                    aria-label={`Quantité sur l’année — ${l.label}`}
                  />
                </td>
                <td className="px-3 py-2 text-right font-medium tabular-nums">
                  {l.prix == null ? <span className="text-neutral-400">—</span> : CHF.format(caLigne(l))}
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
                  {apprenantesForcees == null ? " — les entrées de parcours, sans les options ni la découverte" : ""}
                </span>
              </td>
              <td className="px-3 py-2 text-right">
                <input
                  type="number" min={0} step={1} className={champ}
                  value={apprenantes}
                  onChange={(e) => setApprenantesForcees(entier(e.target.value))}
                  aria-label="Nombre d’apprenantes sur l’année"
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
