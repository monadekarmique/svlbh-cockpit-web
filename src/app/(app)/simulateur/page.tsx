import type { Metadata } from "next";
import { requireSt6 } from "@/lib/owner-gate";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Simulateur" };
export const dynamic = "force-dynamic";

// L'ENTONNOIR ET LE CYCLE DE VIE, tels que Patrick les a donnés le 09.09.2026 :
//
//   60 visiteuses/semaine (TikTok, Snap) → 40 découvertes payées à 29
//   (15 tout de suite, 25 dans les 3 semaines) → 15 entrent en z2 à 59
//   (14 premiers jours offerts), 8 prennent l'accélération à 179, 15 arrêtent.
//   ⚠️ 15+8+15 = 38, pas 40 : 2 restent INDÉTERMINÉES, non réparties (affiché).
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

// ⚠️ Revue de code du 09.09 (soir) — quatre erreurs de calcul REPRODUITES en Node
// et corrigées ici : (1) une cohorte fantôme « mois 0 » gonflait chaque ligne ;
// (2) `<= dureeAcc` facturait une mensualité d'accélération de trop (+16,7 %) ;
// (3) les accélérées disparaissaient du modèle après 6 mois et ne comptaient pas
// dans « femmes à porter », alors que la doctrine dit qu'elles n'achètent que de
// la vitesse ; (4) les 14 jours offerts et l'étalement 15/25 annoncés en tête
// n'étaient plus implémentés. Plus : aucune borne sur les paramètres — `?mois=
// Infinity` épuisait le tas du seul process Node de Render (502 pour tous).
function param(q: Record<string, string | string[] | undefined>, k: string,
               d: number, min: number, max: number): number {
  const raw = q[k];
  const v = Number(Array.isArray(raw) ? raw[0] : raw);
  if (raw === undefined || !Number.isFinite(v)) return d;
  return Math.min(max, Math.max(min, v));
}

export default async function SimulateurPage({
  searchParams,
}: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  // Gate ST6 strict : la RLS des vues est is_owner_st6() — avec requireSt4Plus,
  // une z4 ouvrait la page et lisait un modèle complet sans une seule donnée.
  await requireSt6();
  const q = await searchParams;

  const parSemaine = param(q, "z2", 15, 0, 1000);
  const decSemaine = param(q, "dec", 40, 0, 5000);
  const accSemaine = param(q, "accel", 8, 0, 1000);
  const pDec = param(q, "pdec", 29, 0, 10000), pZ2 = param(q, "pz2", 59, 0, 10000);
  const pZ3 = param(q, "pz3", 79, 0, 10000), pAcc = param(q, "paccel", 179, 0, 10000);
  const caZ4 = param(q, "caz4", 2000, 0, 1e6), tauxZ4 = param(q, "tauxz4", 3, 0, 100) / 100;
  const dureeAcc = param(q, "dureeaccel", 6, 1, 60);
  const mois = param(q, "mois", 60, 1, 120);
  // défaut : les charges fixes MESURÉES (v_modele_economique), plus un 688 écrit en dur
  const chargesParam = q["charges"] !== undefined ? param(q, "charges", 0, 0, 1e6) : null;
  // ⚠️ 15 z2 + 8 accélérations sur 40 découvertes : si les paramètres dépassent
  // 100 % de conversion, on le DIT au lieu de rendre une table normale.
  const surConversion = decSemaine > 0 && parSemaine + accSemaine > decSemaine;
  const indetermine = decSemaine - parSemaine - accSemaine;

  const supabase = await createClient();
  const { data: reel } = await supabase
    .from("v_modele_economique").select("femmes_payantes_3m, charges_fixes").maybeSingle();
  const femmesAujourdhui = Number(reel?.femmes_payantes_3m ?? 0);
  const charges = chargesParam ?? Number(reel?.charges_fixes ?? 0);

  const S = 4.33;
  const entreesM = parSemaine * S, decM = decSemaine * S, accM = accSemaine * S;

  // Une cohorte entre chaque mois à partir du mois 1 (âges 0..m−1 au mois m).
  // Les accélérées entrent DANS le même cycle z2→z3→z4 : pendant `dureeAcc`
  // mois elles paient 179 au lieu de 59, puis elles rejoignent le forfait.
  // Les 14 jours offerts : le premier mois de z2 n'est facturé qu'à moitié.
  // Découvertes : 15 payées tout de suite, 25 dans les 3 semaines — le mois
  // d'arrivée n'en facture que 15/40, le reste tombe le mois suivant.
  const ligne = (m: number) => {
    let z2 = 0, z3 = 0, z4 = 0, acc = 0, rZ2 = 0, rAcc = 0;
    for (let c = 1; c <= m; c++) {
      const age = m - c;
      const e = etat(age);
      const enAccel = age < dureeAcc;
      const cohorteZ2 = entreesM + (enAccel ? 0 : accM);
      const cohorteAcc = enAccel ? accM : 0;
      z2 += cohorteZ2 * e.z2; z3 += cohorteZ2 * e.z3; z4 += cohorteZ2 * e.z4;
      acc += cohorteAcc;
      rZ2 += cohorteZ2 * e.z2 * pZ2 * (age === 0 ? 0.5 : 1);
      rAcc += cohorteAcc * pAcc;
    }
    const rDec = decM * (15 / 40) + (m > 1 ? decM * (25 / 40) : 0);
    const rZ3 = z3 * pZ3, rZ4 = z4 * caZ4 * tauxZ4;
    return {
      m, z2, z3, z4, acc,
      // À PORTER = celles qu'il faut accompagner. Les z4 supervisent, elles ne
      // se portent pas — elles sont comptées à part.
      femmes: z2 + z3 + acc,
      rDec, rZ2, rZ3, rZ4, rAcc, total: rDec + rZ2 + rZ3 + rZ4 + rAcc,
    };
  };
  const jalons = [1, 3, 6, 12, 15, 18, 24, 36, 48, 60].filter((j) => j <= mois);
  if (!jalons.includes(mois)) jalons.push(mois);
  const lignes = jalons.map(ligne);
  const fin = lignes[lignes.length - 1];
  const premier = ligne(1);
  const chargesCouvertesMois1 = premier.total >= charges;
  const fmtPct = (x: number) => x.toLocaleString("fr-CH", { maximumFractionDigits: 2 });
  const lien = (k: string, v: number) => {
    const u = new URLSearchParams();
    for (const [kk, vv] of Object.entries(q)) if (typeof vv === "string") u.set(kk, vv);
    u.set(k, String(v)); return `/simulateur?${u.toString()}`;
  };

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
        sur lequel s’applique le {fmtPct(tauxZ4 * 100)} %. Tu ne l’as pas donné.
        Essaie <a className="underline" href={lien("caz4", 1000)}>1 000</a> ·{" "}
        <a className="underline" href={lien("caz4", 4000)}>4 000</a>.</p>
        {surConversion && (
          <p>⛔ <strong>{parSemaine} + {accSemaine} conversions pour {decSemaine} découvertes</strong> :
          plus de 100 %. La table est calculée quand même — elle ne veut rien dire.</p>
        )}
        {!surConversion && indetermine > 0 && (
          <p>• <strong>{fmtPct(indetermine)} femmes sur {decSemaine}</strong> ne sont ni z2, ni
          accélération, ni arrêt : indéterminées, comptées pour zéro.</p>
        )}
        <p className="pt-1">Plus l’horizon est long, plus ces trois-là dominent. À cinq
        ans, le total est une conséquence de mes hypothèses, pas une projection de
        ton entonnoir.</p>
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Femmes à porter", Math.round(fin.femmes).toLocaleString("fr-CH"), `au mois ${fin.m}`],
          ["Récurrent / mois", CHF.format(fin.total), `dont ${CHF.format(fin.rDec)} de découvertes`],
          ["z4 actives", Math.round(fin.z4).toString(), "supervision possible"],
          ["Charges fixes", CHF.format(charges),
           chargesCouvertesMois1 ? "couvertes dès le 1er mois" : "PAS couvertes le 1er mois"],
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
            {lignes.map((l) => (
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
        {chargesCouvertesMois1 ? (
          <><strong>La contrainte n’est pas l’argent.</strong> Les charges fixes sont
          couvertes dès le premier mois — {CHF.format(premier.total)} encaissés contre{" "}
          {CHF.format(charges)}.</>
        ) : (
          <><strong>Les charges ne sont pas couvertes le premier mois</strong> —{" "}
          {CHF.format(premier.total)} encaissés contre {CHF.format(charges)}.</>
        )}{" "}
        Ce que la table met sous les yeux, c’est <strong>le nombre de femmes à porter</strong>
        (z2, z3 et accélérées — les z4 supervisent, elles ne se portent pas) :{" "}
        {Math.round(fin.femmes).toLocaleString("fr-CH")} au mois {fin.m}, contre{" "}
        {femmesAujourdhui} qui paient aujourd’hui (trois derniers mois, mesuré). Et la supervision demande d’être z4 au minimum : il y en a{" "}
        {Math.round(fin.z4)} dans ce modèle, aucune avant le 48<sup>e</sup> mois.
        <br />
        <strong>Le goulot est donc la première z4</strong>, pas la trésorerie.
      </div>
    </main>
  );
}
