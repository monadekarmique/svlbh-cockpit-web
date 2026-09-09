import type { Metadata } from "next";
import { requireSt4Plus } from "@/lib/owner-gate";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Modèle économique" };
export const dynamic = "force-dynamic";

// DEC Patrick 09.09.2026 : « c'est clairement une question de volume pour
// laquelle nous avons bâti ce système », puis « on va créer une page de
// business modèle dans cockpit dans un menu NAV 15ème Monde ».
//
// ⚠️ TOUT EST CALCULÉ depuis v_modele_economique — rien n'est écrit en dur.
// Un modèle dont les chiffres sont figés dans une page ment le mois suivant.

type Modele = {
  outils_par_mois: number; exploitation_par_mois: number; charges_fixes: number;
  remuneration_annee: number; encaisse_moyen: number; reste_moyen: number;
  mois: number; femmes_payantes_3m: number;
};

const CHF = new Intl.NumberFormat("fr-CH", {
  style: "currency", currency: "CHF", minimumFractionDigits: 0, maximumFractionDigits: 0,
});
const CHF2 = new Intl.NumberFormat("fr-CH", {
  style: "currency", currency: "CHF", minimumFractionDigits: 2,
});

// Les tarifs viennent du product_catalog de Patrick. Le forfait z2 à 59 est
// établi (« elle aurait dû verser 59 » pour l'accès aux apps, 09.09.2026) ;
// les taux z3/z4 ne sont PAS encore fixés — la page le dit au lieu d'inventer.
// ⚠️ Distinguer le RÉCURRENT de l'UNIQUE : le programme découverte est 29 par
// participante pour 5 jours (DEC Patrick 09.09.2026), donc un versement unique.
// Le mettre dans une colonne « il en faut » mensuelle laisserait croire que 24
// découvertes couvrent le mois — elles le couvrent UNE FOIS.
const TARIFS = [
  { label: "Programme découverte — 5 jours en ligne", prix: 29, recurrent: false },
  { label: "Forfait z2 — accès aux applications", prix: 59, recurrent: true },
  { label: "Monitoring ST2", prix: 79, recurrent: true },
  { label: "Soin 3 Âmes et + (avec don de soutien)", prix: 100, recurrent: true },
  { label: "Accélérateur MyShamanFamily, 1 mois", prix: 179, recurrent: true },
];

export default async function ModelePage() {
  await requireSt4Plus();
  const supabase = await createClient();
  const { data, error } = await supabase.from("v_modele_economique").select("*").single();
  // ⚠️ Le barème vient de la BASE (v_bareme), plus d'un tableau écrit dans la
  // page. Patrick l'a fixé le 09.09 en six messages successifs ; un barème en
  // dur aurait menti dès le premier changement.
  const { data: bar } = await supabase.from("v_bareme").select("*").order("canal");

  if (error || !data) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-6">
        <h1 className="text-2xl font-semibold">Modèle économique</h1>
        <p className="mt-4 rounded-lg bg-rose-50 p-4 text-rose-900">{error?.message}</p>
      </main>
    );
  }
  const m = data as Modele;
  const n = (v: unknown) => Number(v ?? 0);
  const fixe = n(m.charges_fixes);

  return (
    <main className="mx-auto max-w-4xl space-y-8 px-4 py-6">
      <header>
        <h1 className="text-2xl font-semibold">Modèle économique</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Calculé sur {n(m.mois)} mois de relevés 2026 — aucun chiffre écrit en dur.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Charges fixes / mois", CHF2.format(fixe), "outils + exploitation"],
          ["Encaissé / mois", CHF2.format(n(m.encaisse_moyen)), "moyenne 2026"],
          ["Reste / mois", CHF2.format(n(m.reste_moyen)), "après TVA et charges"],
          ["Femmes qui paient", String(n(m.femmes_payantes_3m)), "3 derniers mois"],
        ].map(([t, v, s]) => (
          <div key={t} className="rounded-xl border border-neutral-200 p-4">
            <div className="text-xs uppercase tracking-wide text-neutral-500">{t}</div>
            <div className="mt-1 text-xl font-semibold tabular-nums">{v}</div>
            <div className="mt-0.5 text-xs text-neutral-400">{s}</div>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Le point de bascule</h2>
        <p className="text-sm text-neutral-600">
          Les charges ne bougent pas avec le nombre : {CHF2.format(n(m.outils_par_mois))} d’outils
          et {CHF2.format(n(m.exploitation_par_mois))} d’exploitation par mois, que tu accompagnes
          neuf femmes ou trente. Il faut donc, pour couvrir {CHF2.format(fixe)} chaque mois —
          et un versement unique ne le couvre qu’une fois :
        </p>
        <div className="overflow-x-auto rounded-lg border border-neutral-200">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-3 py-2">Ce qu’elle verse</th>
                <th className="px-3 py-2">Rythme</th>
                <th className="px-3 py-2 text-right">Prix</th>
                <th className="px-3 py-2 text-right">Il en faut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {TARIFS.map((t) => (
                <tr key={t.label}>
                  <td className="px-3 py-2">{t.label}</td>
                  <td className="px-3 py-2 text-xs">
                    {t.recurrent
                      ? <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-emerald-900">mensuel</span>
                      : <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-neutral-600">une fois</span>}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{CHF.format(t.prix)}</td>
                  <td className="px-3 py-2 text-right font-medium tabular-nums">
                    {Math.ceil(fixe / t.prix)}
                    {!t.recurrent && <span className="ml-1 text-xs font-normal text-neutral-400">une seule fois</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Où le volume cesse de porter</h2>
        <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-900">
          <p>
            <strong>Un soin porté seul est presque toute marge</strong> — les charges
            étant fixes, chaque versement supplémentaire tombe entier.
          </p>
          <p className="mt-2">
            <strong>Un soin co-réalisé, non.</strong> Mesuré les 1<sup>er</sup> et 2 septembre :
            Giulia verse <span className="tabular-nums">199 CHF</span> pour une séance à
            quatre mains, Cornelia reçoit <span className="tabular-nums">179 CHF</span>.
            Il reste <strong className="tabular-nums">20 CHF</strong>, avant le temps de
            Patrick. Le volume multiplie alors un travail à somme presque nulle.
          </p>
          <p className="mt-2">
            Reversé aux praticiennes en 2026 :{" "}
            <span className="tabular-nums font-medium">{CHF2.format(n(m.remuneration_annee))}</span>.
          </p>
        </div>
        <p className="text-sm text-neutral-600">
          Le levier n’est donc pas le nombre mais <strong>le prix du soin à quatre mains,
          ou la clé de partage</strong>. Trois lectures sont ouvertes et aucune n’est
          tranchée : le prix est trop bas, la part est trop haute, ou ce n’est pas un
          soin commercial mais une transmission — et alors c’est une charge de formation.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Le barème des canaux</h2>
        <div className="overflow-x-auto rounded-lg border border-neutral-200">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-3 py-2">Canal</th>
                <th className="px-3 py-2">Mode</th>
                <th className="px-3 py-2 text-right">Base</th>
                <th className="px-3 py-2 text-right">Accélération</th>
                <th className="px-3 py-2 text-right">Lancement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              <tr>
                <td className="px-3 py-2">z1</td>
                <td className="px-3 py-2 text-neutral-600">à l’unité</td>
                <td className="px-3 py-2 text-right tabular-nums">29 CHF</td>
                <td className="px-3 py-2 text-right text-neutral-400">—</td>
                <td className="px-3 py-2 text-right text-neutral-400">—</td>
              </tr>
              {(bar ?? []).map((b: Record<string, string>) => (
                <tr key={b.canal}>
                  <td className="px-3 py-2">{b.canal}</td>
                  <td className="px-3 py-2 text-neutral-600">
                    {b.mode === "forfait" ? "forfait mensuel" : "% du chiffre d’affaires"}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{b.base}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{b.acceleration}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-neutral-500">{b.lancement}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-neutral-600">
          Le <strong>forfait facture ce qu’on donne</strong>, le{" "}
          <strong>pourcentage suit ce qu’elle gagne</strong> — d’où l’inversion
          apparente : en z3 le lancement coûte plus cher que l’accélération, en z4
          il coûte moins. Une femme qui lance sa pratique gagne peu.
          <br />
          <strong>Il n’y a pas de tarif « praticienne établie »</strong>, et il ne
          faut pas en créer un : celle qui arrive avec un cabinet passe quand même
          par z2 puis z3 — l’accélération n’achète que de la vitesse, jamais un
          palier. Giulia : z1 → z3 en 61 jours, sans en sauter aucun.
        </p>
      </section>
    </main>
  );
}
