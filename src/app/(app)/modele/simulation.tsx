"use client";

// La simulation du point de bascule — DEC Patrick 25.09.2026 (modèle v0.9.4) :
// « au lieu de il faut je veux pouvoir jouer avec pour obtenir un total en bas ».
//
// Chaque ligne porte une quantité que Patrick change à la main ; la page calcule
// le chiffre d'affaires TTC de la ligne et le total, puis le compare à ce qu'il
// faut couvrir. Les prix et les quantités de départ viennent de la base (versions
// du modèle, barème, catalogue) : ce composant ne connaît aucun chiffre.
//
// ⚠️ Rien n'est enregistré : recharger la page revient aux quantités du modèle.
// La sélection du nombre au clic vient de NumberInputSelectAll, monté dans le
// layout (DEC Patrick 10.06) — pas d'onFocus ici.
import { useState } from "react";

export type LigneSimulation = {
  id: string;
  label: string;
  /** Nul = « à fixer » dans le modèle : montré, jamais inventé. */
  prix: number | null;
  rythme: "mensuel" | "hebdo";
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

export function Simulation({ lignes, aCouvrir, parApprenante, formatrice }: {
  lignes: LigneSimulation[];
  aCouvrir: number;
  parApprenante: number;
  formatrice: number | null;
}) {
  const [quantites, setQuantites] = useState<Record<string, number>>(
    () => Object.fromEntries(lignes.map((l) => [l.id, l.quantite])),
  );
  const [formatrices, setFormatrices] = useState(0);
  // Nul = le nombre d'apprenantes suit les lignes cochées « apprenante » ;
  // Patrick peut le forcer à la main.
  const [apprenantesForcees, setApprenantesForcees] = useState<number | null>(null);

  const q = (id: string) => quantites[id] ?? 0;
  const ca = lignes.reduce((s, l) => s + (l.prix ?? 0) * q(l.id), 0);
  const apprenantesAuto = lignes.filter((l) => l.apprenante).reduce((s, l) => s + q(l.id), 0);
  const apprenantes = apprenantesForcees ?? apprenantesAuto;
  const coutApprenantes = apprenantes * parApprenante;
  const coutFormatrices = formatrice != null ? formatrices * formatrice : 0;
  const ecart = ca - aCouvrir - coutApprenantes - coutFormatrices;

  const champ = "w-20 rounded border border-neutral-300 px-2 py-1 text-right tabular-nums";

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border border-neutral-200">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-3 py-2">Ce qu’elle verse</th>
              <th className="px-3 py-2">Rythme</th>
              <th className="px-3 py-2 text-right">Prix</th>
              <th className="px-3 py-2 text-right">Quantité</th>
              <th className="px-3 py-2 text-right">CA TTC / mois</th>
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
                    : <span className="rounded bg-sky-100 px-1.5 py-0.5 text-sky-900">par semaine et par animateur</span>}
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
                    <span className="block text-xs text-neutral-400">animations / mois</span>
                  )}
                </td>
                <td className="px-3 py-2 text-right font-medium tabular-nums">
                  {l.prix == null ? <span className="text-neutral-400">—</span> : CHF.format(l.prix * q(l.id))}
                </td>
              </tr>
            ))}
            <tr className="bg-neutral-50 font-semibold">
              <td className="px-3 py-2" colSpan={4}>Chiffre d’affaires TTC / mois</td>
              <td className="px-3 py-2 text-right tabular-nums">{CHF.format(ca)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="overflow-x-auto rounded-lg border border-neutral-200">
        <table className="w-full text-sm">
          <tbody className="divide-y divide-neutral-100">
            <tr>
              <td className="px-3 py-2">Chiffre d’affaires TTC</td>
              <td className="px-3 py-2" />
              <td className="px-3 py-2 text-right tabular-nums">{CHF2.format(ca)}</td>
            </tr>
            <tr>
              <td className="px-3 py-2">À couvrir chaque mois</td>
              <td className="px-3 py-2 text-xs text-neutral-500">tableau ci-dessus</td>
              <td className="px-3 py-2 text-right tabular-nums">− {CHF2.format(aCouvrir)}</td>
            </tr>
            <tr>
              <td className="px-3 py-2">
                Apprenantes
                <span className="block text-xs text-neutral-500">
                  {CHF2.format(parApprenante)} par mois chacune
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
            {formatrice != null && (
              <tr>
                <td className="px-3 py-2">
                  Formatrices
                  <span className="block text-xs text-neutral-500">
                    {CHF2.format(formatrice)} HT par mois chacune, supervision non facturable
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
              <td className="px-3 py-2 text-xs font-normal">TTC, avant la TVA due</td>
              <td className="px-3 py-2 text-right tabular-nums">{CHF2.format(ecart)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
