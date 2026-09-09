import type { Metadata } from "next";
import { requireSt4Plus } from "@/lib/owner-gate";

export const metadata: Metadata = { title: "Simulateur" };
export const dynamic = "force-dynamic";

// DEC Patrick 09.09.2026 — l'entonnoir tel qu'il l'a décrit :
//   60 visiteuses/semaine depuis TikTok et Snap sur les landings
//   → 40 essaient le programme découverte à 29 (TWINT) : 15 tout de suite,
//     25 reviennent dans les 3 semaines qui suivent
//   → sur ces 40 : 15 deviennent z2 à 59/mois (14 premiers jours gratuits),
//     8 prennent l'accélération, 15 arrêtent après le programme.
//
// ⚠️ PATRICK A DÉCRIT L'ENTONNOIR EN STx, PAS EN zx (09.09.2026) : « j'ai
// utilisé STx et pas zx donc ils vont tous rentrer sur z2 ». Le programme
// découverte est z1, celles qui poursuivent entrent en z2 — et l'accélérateur
// à 179 EST l'accélération z2 du barème. Le STx ne donne plus aucun droit ; il
// mesure la capacité de soin du jour.
//
// ⚠️ 15 + 8 + 15 = 38, pas 40. Les deux restantes sont laissées EN
// INDÉTERMINÉ, pas réparties : inventer leur destin fausserait la courbe dans
// le sens optimiste.
//
// ⚠️ CE QUE PATRICK N'A PAS DONNÉ : la rétention au-delà du premier mois. Le
// simulateur la traite en PARAMÈTRE visible (?retention=), défaut 100 %, et le
// dit à l'écran. Une hypothèse de rétention cachée est ce qui rend tout plan
// financier faux.

type P = {
  visiteuses: number; decouvertes: number; immediat: number; etalement: number;
  versZ2: number; versAccel: number; arret: number;
  prixDecouverte: number; prixZ2: number; prixAccel: number;
  gratuitJours: number; retention: number; semaines: number; chargesFixes: number;
};

const CHF = new Intl.NumberFormat("fr-CH", {
  style: "currency", currency: "CHF", minimumFractionDigits: 0, maximumFractionDigits: 0,
});

function simuler(p: P) {
  const S = p.semaines;
  const decouvertesPayees = new Array(S).fill(0);
  const nouvellesZ2 = new Array(S).fill(0);
  const nouvellesAccel = new Array(S).fill(0);

  for (let s = 0; s < S; s++) {
    // Cohorte de la semaine s : 15 paient tout de suite, 25 s'étalent sur 3 semaines.
    decouvertesPayees[s] += p.immediat;
    const differe = p.decouvertes - p.immediat;
    for (let k = 1; k <= p.etalement; k++) {
      if (s + k < S) decouvertesPayees[s + k] += differe / p.etalement;
    }
  }
  // Les conversions suivent la découverte PAYÉE, pas la visite.
  for (let s = 0; s < S; s++) {
    const base = decouvertesPayees[s] / p.decouvertes;
    nouvellesZ2[s] = base * p.versZ2;
    nouvellesAccel[s] = base * p.versAccel;
  }

  const semainesGratuites = Math.round(p.gratuitJours / 7);
  const lignes = [];
  let z2Actives = 0, accelActives = 0, cumul = 0;

  for (let s = 0; s < S; s++) {
    // Une ST2 devient payante après les 14 jours offerts, et reste selon la rétention.
    const arriveePayante = s - semainesGratuites;
    if (arriveePayante >= 0) {
      z2Actives = z2Actives * Math.pow(p.retention, 1 / 4.33) + nouvellesZ2[arriveePayante];
      accelActives = accelActives * Math.pow(p.retention, 1 / 4.33) + nouvellesAccel[arriveePayante];
    }
    const recDecouverte = decouvertesPayees[s] * p.prixDecouverte;
    // Les forfaits sont mensuels : on encaisse 1/4.33 par semaine.
    const recZ2 = (z2Actives * p.prixZ2) / 4.33;
    const recAccel = (accelActives * p.prixAccel) / 4.33;
    const total = recDecouverte + recZ2 + recAccel;
    cumul += total;
    lignes.push({
      semaine: s + 1,
      decouvertes: decouvertesPayees[s],
      z2Actives, accelActives,
      recDecouverte, recZ2, recAccel, total,
      mensuelEquivalent: total * 4.33,
      cumul,
    });
  }
  return lignes;
}

export default async function SimulateurPage({
  searchParams,
}: { searchParams: Promise<Record<string, string>> }) {
  await requireSt4Plus();
  const q = await searchParams;
  const num = (k: string, d: number) => (q[k] !== undefined ? Number(q[k]) : d);

  const p: P = {
    visiteuses: num("visiteuses", 60),
    decouvertes: num("decouvertes", 40),
    immediat: num("immediat", 15),
    etalement: num("etalement", 3),
    versZ2: num("z2", 15),
    versAccel: num("accel", 8),
    arret: num("arret", 15),
    prixDecouverte: num("pdec", 29),
    prixZ2: num("pz2", 59),
    prixAccel: num("paccel", 179),
    gratuitJours: num("gratuit", 14),
    retention: num("retention", 100) / 100,
    semaines: num("semaines", 26),
    chargesFixes: num("charges", 688),
  };

  const lignes = simuler(p);
  const indetermine = p.decouvertes - p.versZ2 - p.versAccel - p.arret;
  const bascule = lignes.find((l) => l.mensuelEquivalent >= p.chargesFixes);
  const fin = lignes[lignes.length - 1];

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <header>
        <h1 className="text-2xl font-semibold">Simulateur d’acquisition</h1>
        <p className="mt-1 text-sm text-neutral-600">
          {p.visiteuses} visiteuses par semaine depuis TikTok et Snap →{" "}
          {p.decouvertes} découvertes à {p.prixDecouverte} CHF →{" "}
          {p.versZ2} entrées en z2 à {p.prixZ2} CHF et {p.versAccel} accélératrices à{" "}
          {p.prixAccel} CHF.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Bascule", bascule ? `semaine ${bascule.semaine}` : "hors horizon",
           `couvre ${CHF.format(p.chargesFixes)} de charges`],
          ["Récurrent en fin", CHF.format(fin.mensuelEquivalent), `semaine ${fin.semaine}`],
          ["z2 actives", Math.round(fin.z2Actives).toString(), "en fin d’horizon"],
          ["Encaissé cumulé", CHF.format(fin.cumul), `${p.semaines} semaines`],
        ].map(([t, v, s]) => (
          <div key={t} className="rounded-xl border border-neutral-200 p-4">
            <div className="text-xs uppercase tracking-wide text-neutral-500">{t}</div>
            <div className="mt-1 text-xl font-semibold tabular-nums">{v}</div>
            <div className="mt-0.5 text-xs text-neutral-400">{s}</div>
          </div>
        ))}
      </section>

      <div className="space-y-2 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
        <p>
          <strong>Deux hypothèses que Patrick n’a pas données, et que je ne devine pas :</strong>
        </p>
        <p>
          • <strong>La rétention</strong> est à {Math.round(p.retention * 100)} % par mois
          ({p.retention === 1 ? "aucune ne part — hypothèse volontairement irréaliste, à corriger" : "paramétrée"}).
          C’est le chiffre qui décide de tout : à 80 %, le récurrent plafonne au lieu de croître.
          Essaie <a className="underline" href="?retention=80">80 %</a> ·{" "}
          <a className="underline" href="?retention=70">70 %</a> ·{" "}
          <a className="underline" href="?retention=90">90 %</a>.
        </p>
        {indetermine !== 0 && (
          <p>
            • <strong>{indetermine} femmes sur {p.decouvertes} sont indéterminées</strong> :
            {p.versZ2} + {p.versAccel} + {p.arret} = {p.versZ2 + p.versAccel + p.arret}.
            Elles ne rapportent rien dans ce calcul — leur destin n’est pas inventé.
          </p>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-neutral-200">
        <table className="w-full min-w-[46rem] text-sm">
          <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-3 py-2">Sem.</th>
              <th className="px-3 py-2 text-right">Découvertes</th>
              <th className="px-3 py-2 text-right">z2</th>
              <th className="px-3 py-2 text-right">Accél.</th>
              <th className="px-3 py-2 text-right">Encaissé</th>
              <th className="px-3 py-2 text-right">Équiv. mensuel</th>
              <th className="px-3 py-2 text-right">Cumulé</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {lignes.map((l) => (
              <tr key={l.semaine} className={l.semaine === bascule?.semaine ? "bg-emerald-50" : ""}>
                <td className="px-3 py-2 tabular-nums">{l.semaine}</td>
                <td className="px-3 py-2 text-right tabular-nums">{l.decouvertes.toFixed(1)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{l.z2Actives.toFixed(1)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{l.accelActives.toFixed(1)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{CHF.format(l.total)}</td>
                <td className={"px-3 py-2 text-right tabular-nums " +
                      (l.mensuelEquivalent >= p.chargesFixes ? "font-medium text-emerald-800" : "text-neutral-500")}>
                  {CHF.format(l.mensuelEquivalent)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-neutral-500">{CHF.format(l.cumul)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
        <strong>Ce que la table ne dit pas.</strong> Elle compte de l’argent, pas des
        heures. {p.versZ2} nouvelles z2 par semaine font{" "}
        {Math.round(p.versZ2 * 4.33)} femmes de plus par mois à accompagner — la
        contrainte qui mordra en premier est probablement là, pas dans les charges.
        Les <strong>14 premiers jours offerts</strong> décalent l’encaissement de deux
        semaines, sans changer le rythme.
      </div>
    </main>
  );
}
