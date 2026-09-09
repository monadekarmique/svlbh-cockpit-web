import type { Metadata } from "next";
import { requireSt4Plus } from "@/lib/owner-gate";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Ce qui reste" };
export const dynamic = "force-dynamic";

// DEC Patrick 09.09.2026 : « j'aurais aussi besoin d'une page qui me permet de
// savoir combien me reste par mois ».
//
// ⚠️ `encaisse` et `tva_due` viennent de la MÊME vue que /tva (v_tva_detail via
// v_mois). Ma première version les recalculait autrement : les deux écrans
// auraient pu s'écarter sans que rien ne le dise. Ne jamais recalculer un
// chiffre déjà produit ailleurs.

type Mois = {
  mois: string;
  encaisse: number; tva_due: number; prealable: number;
  charges: number; reverse_praticiennes: number;
  prive: number; a_qualifier: number; reste_activite: number;
};

const CHF = new Intl.NumberFormat("fr-CH", {
  style: "currency", currency: "CHF", minimumFractionDigits: 2,
});
function nom(mois: string): string {
  const [y, m] = mois.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("fr-CH", { month: "long", year: "numeric" });
}

export default async function MoisPage() {
  await requireSt4Plus();
  const supabase = await createClient();
  const { data, error } = await supabase.from("v_mois").select("*").order("mois", { ascending: false });

  if (error) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-6">
        <h1 className="text-2xl font-semibold">Ce qui reste</h1>
        <p className="mt-4 rounded-lg bg-rose-50 p-4 text-rose-900">{error.message}</p>
      </main>
    );
  }

  const mois = (data ?? []) as Mois[];
  const n = (v: unknown) => Number(v ?? 0);
  const somme = (f: (m: Mois) => number) => mois.reduce((s, m) => s + f(m), 0);
  const totalEnc = somme((m) => n(m.encaisse));
  const totalReste = somme((m) => n(m.reste_activite));
  const moyenne = mois.length ? totalReste / mois.length : 0;
  const aQualifier = somme((m) => n(m.a_qualifier));

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-6">
      <header>
        <h1 className="text-2xl font-semibold">Ce qui reste — mois par mois</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Encaissé, moins la TVA nette qui n’est pas à toi, moins les charges,
          moins ce que tu reverses aux praticiennes.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-neutral-200 p-4">
          <div className="text-xs uppercase tracking-wide text-neutral-500">Encaissé 2026</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">{CHF.format(totalEnc)}</div>
        </div>
        <div className="rounded-xl border border-neutral-200 p-4">
          <div className="text-xs uppercase tracking-wide text-neutral-500">Reste 2026</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">{CHF.format(totalReste)}</div>
        </div>
        <div className="rounded-xl border border-neutral-200 p-4">
          <div className="text-xs uppercase tracking-wide text-neutral-500">Moyenne / mois</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">{CHF.format(moyenne)}</div>
        </div>
      </section>

      {aQualifier > 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <strong>{CHF.format(aQualifier)}</strong> de sorties ne sont pas encore
          qualifiées et ne sont donc comptées nulle part ci-dessous. Le reste réel
          pourrait être plus bas —{" "}
          <a className="underline" href="/charges">les qualifier</a>.
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-neutral-200">
        <table className="w-full min-w-[48rem] text-sm">
          <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-3 py-2">Mois</th>
              <th className="px-3 py-2 text-right">Encaissé</th>
              <th className="px-3 py-2 text-right">TVA nette</th>
              <th className="px-3 py-2 text-right">Charges</th>
              <th className="px-3 py-2 text-right">Reversé</th>
              <th className="px-3 py-2 text-right">Reste</th>
              <th className="px-3 py-2 text-right">Privé</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {mois.map((m) => {
              const reste = n(m.reste_activite);
              const tvaNette = n(m.tva_due) - n(m.prealable);
              return (
                <tr key={m.mois}>
                  <td className="px-3 py-2 capitalize whitespace-nowrap">{nom(m.mois)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{CHF.format(n(m.encaisse))}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-neutral-500">
                    {CHF.format(tvaNette)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-neutral-500">
                    {CHF.format(n(m.charges))}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-neutral-500">
                    {n(m.reverse_praticiennes) ? CHF.format(n(m.reverse_praticiennes)) : "—"}
                  </td>
                  <td className={"px-3 py-2 text-right font-medium tabular-nums " +
                        (reste < 200 ? "text-rose-700" : "text-emerald-800")}>
                    {CHF.format(reste)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-neutral-400">
                    {n(m.prive) ? CHF.format(n(m.prive)) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
        <strong>Ce que « reste » veut dire ici.</strong> C’est ce qui te demeure de
        ton activité une fois la TVA nette écartée — elle n’est pas à toi — et les
        charges et reversements payés. Les <strong>sorties privées</strong> sont
        montrées à part : elles ne réduisent pas ce résultat, elles disent ce que
        tu as prélevé dessus. Un mois sous 200 francs est en rouge.
      </div>
    </main>
  );
}
