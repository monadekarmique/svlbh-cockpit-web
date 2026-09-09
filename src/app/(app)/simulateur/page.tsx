import type { Metadata } from "next";
import { requireSt4Plus } from "@/lib/owner-gate";

export const metadata: Metadata = { title: "Simulateur" };
export const dynamic = "force-dynamic";

// L'ENTONNOIR ET LE CYCLE DE VIE, tels que Patrick les a donnés le 09.09.2026 :
//
//   60 visiteuses/semaine (TikTok, Snap) → 40 découvertes payées à 29
//   (15 tout de suite, 25 dans les 3 semaines) → 15 entrent en z2 à 59
//   (14 premiers jours offerts), 8 prennent l'accélération à 179, 15 arrêtent.
//   ⚠️ 15+8+15 = 38, pas 40 : 2 restent INDÉTERMINÉES, non réparties.
//
//   Rétention z2 : 25 % lâchent sur 3 mois, puis 25 % des restantes sur 3 de
//   plus → 56 % survivent à 6 mois.
//   Passage en z3 : 20 % à 6 mois, 80 % à 15 mois — toutes finissent en z3.
//   Passage en z4 : 50 % tentent l'aventure après 4 ans.
//   Accélération : « au minimum 6 mois ».
//
// ⚠️⚠️ CE QUE LE MODÈLE SUPPOSE ET QUE PATRICK N'A PAS DIT — ce sont ces trois
// hypothèses qui font l'essentiel du résultat, pas ses chiffres :
//   1. AUCUN départ après 6 mois en z2, ni jamais en z3 ni en z4.
//   2. L'accélération s'arrête à exactement 6 mois (il a dit « au minimum »).
//   3. Le chiffre d'affaires d'une z4, sur lequel s'applique le 3 % : inconnu,
//      posé en paramètre visible (?caz4=), défaut 2 000.
// Plus l'horizon est long, plus ces trois-là dominent. À 5 ans le résultat est
// une CONSÉQUENCE DE MES HYPOTHÈSES, pas une projection de son entonnoir.

const CHF = new Intl.NumberFormat("fr-CH", {
  style: "currency", currency: "CHF", minimumFractionDigits: 0, maximumFractionDigits: 0,
});

function survieZ2(m: number): number {
  if (m <= 3) return 1 - 0.25 * (m / 3);
  if (m <= 6) return 0.75 * (1 - 0.25 * ((m - 3) / 3));
  return 0.5625;
}
/** Où en est une cohorte, `a` mois après son entrée payante en z2. */
function etat(a: number): { z2: number; z3: number; z4: number } {
  if (a < 0) return { z2: 0, z3: 0, z4: 0 };
  const s = survieZ2(a);
  if (a < 6) return { z2: s, z3: 0, z4: 0 };
  if (a >= 48) return { z2: 0, z3: s * 0.5, z4: s * 0.5 };
  if (a >= 15) return { z2: 0, z3: s, z4: 0 };
  return { z2: s * 0.8, z3: s * 0.2, z4: 0 };
}

export default async function SimulateurPage({
  searchParams,
}: { searchParams: Promise<Record<string, string>> }) {
  await requireSt4Plus();
  const q = await searchParams;
  const num = (k: string, d: number) => (q[k] !== undefined ? Number(q[k]) : d);

  const parSemaine = num("z2", 15);
  const decSemaine = num("dec", 40);
  const accSemaine = num("accel", 8);
  const pDec = num("pdec", 29), pZ2 = num("pz2", 59), pZ3 = num("pz3", 79), pAcc = num("paccel", 179);
  const caZ4 = num("caz4", 2000), tauxZ4 = num("tauxz4", 3) / 100;
  const dureeAcc = num("dureeaccel", 6);
  const mois = num("mois", 60);
  const charges = num("charges", 688);

  const S = 4.33;
  const entreesM = parSemaine * S, decM = decSemaine * S, accM = accSemaine * S;

  const lignes = [];
  for (let m = 1; m <= mois; m++) {
    let z2 = 0, z3 = 0, z4 = 0;
    for (let c = 0; c <= m; c++) {
      const e = etat(m - c);
      z2 += entreesM * e.z2; z3 += entreesM * e.z3; z4 += entreesM * e.z4;
    }
    let acc = 0;
    for (let c = 0; c <= m; c++) if (m - c <= dureeAcc) acc += accM;
    const rDec = decM * pDec, rZ2 = z2 * pZ2, rZ3 = z3 * pZ3;
    const rZ4 = z4 * caZ4 * tauxZ4, rAcc = acc * pAcc;
    lignes.push({
      m, z2, z3, z4, acc, femmes: z2 + z3 + z4,
      rDec, rZ2, rZ3, rZ4, rAcc, total: rDec + rZ2 + rZ3 + rZ4 + rAcc,
    });
  }
  const jalons = [1, 3, 6, 12, 15, 18, 24, 36, 48, 60].filter((j) => j <= mois);
  const fin = lignes[lignes.length - 1];

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <header>
        <h1 className="text-2xl font-semibold">Simulateur d’acquisition</h1>
        <p className="mt-1 text-sm text-neutral-600">
          {decSemaine} découvertes payées par semaine → {parSemaine} entrées en z2 →
          z3 à 6 ou 15 mois → z4 pour la moitié après 4 ans.
        </p>
      </header>

      <div className="space-y-2 rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-900">
        <p><strong>À lire avant les chiffres.</strong> Trois hypothèses ne viennent pas
        de toi, et ce sont elles qui font l’essentiel du résultat :</p>
        <p>1. <strong>Personne ne part après six mois</strong> — ni en z2, ni en z3, ni
        en z4. Tu as donné les pertes des six premiers mois, rien après.</p>
        <p>2. <strong>L’accélération s’arrête à {dureeAcc} mois pile</strong>. Tu as dit
        « au minimum six mois », ce qui est un plancher, pas une durée.</p>
        <p>3. <strong>Le chiffre d’affaires d’une z4 est posé à {CHF.format(caZ4)}</strong>,
        sur lequel s’applique le {Math.round(tauxZ4 * 100)} %. Tu ne l’as pas donné.
        Essaie <a className="underline" href="?caz4=1000">1 000</a> ·{" "}
        <a className="underline" href="?caz4=4000">4 000</a>.</p>
        <p className="pt-1">Plus l’horizon est long, plus ces trois-là dominent. À cinq
        ans, le total est une conséquence de mes hypothèses, pas une projection de
        ton entonnoir.</p>
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Femmes à porter", Math.round(fin.femmes).toLocaleString("fr-CH"), `au mois ${fin.m}`],
          ["Récurrent / mois", CHF.format(fin.total), `dont ${CHF.format(fin.rDec)} de découvertes`],
          ["z4 actives", Math.round(fin.z4).toString(), "supervision possible"],
          ["Charges fixes", CHF.format(charges), "couvertes dès le 1er mois"],
        ].map(([t, v, s]) => (
          <div key={t} className="rounded-xl border border-neutral-200 p-4">
            <div className="text-xs uppercase tracking-wide text-neutral-500">{t}</div>
            <div className="mt-1 text-xl font-semibold tabular-nums">{v}</div>
            <div className="mt-0.5 text-xs text-neutral-400">{s}</div>
          </div>
        ))}
      </section>

      <div className="overflow-x-auto rounded-lg border border-neutral-200">
        <table className="w-full min-w-[52rem] text-sm">
          <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-3 py-2">Mois</th>
              <th className="px-3 py-2 text-right">z2</th>
              <th className="px-3 py-2 text-right">z3</th>
              <th className="px-3 py-2 text-right">z4</th>
              <th className="px-3 py-2 text-right">Accél.</th>
              <th className="px-3 py-2 text-right">Femmes</th>
              <th className="px-3 py-2 text-right">Encaissé / mois</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {lignes.filter((l) => jalons.includes(l.m)).map((l) => (
              <tr key={l.m}>
                <td className="px-3 py-2 tabular-nums">{l.m}</td>
                <td className="px-3 py-2 text-right tabular-nums">{Math.round(l.z2)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{Math.round(l.z3)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{Math.round(l.z4)}</td>
                <td className="px-3 py-2 text-right tabular-nums text-neutral-500">{Math.round(l.acc)}</td>
                <td className="px-3 py-2 text-right font-medium tabular-nums">
                  {Math.round(l.femmes).toLocaleString("fr-CH")}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{CHF.format(l.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
        <strong>La contrainte n’est pas l’argent.</strong> Les charges fixes sont
        couvertes dès le premier mois — les découvertes à {pDec} CHF y suffisent. Ce que
        la table met sous les yeux, c’est <strong>le nombre de femmes à porter</strong> :
        {" "}{Math.round(fin.femmes).toLocaleString("fr-CH")} au mois {fin.m}, contre dix
        aujourd’hui. Et la supervision demande d’être z4 au minimum : il y en a{" "}
        {Math.round(fin.z4)} dans ce modèle, aucune avant le 48<sup>e</sup> mois.
        <br />
        <strong>Le goulot est donc la première z4</strong>, pas la trésorerie.
      </div>
    </main>
  );
}
