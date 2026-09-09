import type { Metadata } from "next";
import { requireSt4Plus } from "@/lib/owner-gate";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Versions du modèle" };
export const dynamic = "force-dynamic";

// DEC Patrick 09.09.2026 : « c'est notre version v0.8.1 », puis les itérations.
// Les versions sont FIGÉES en base (modele_version, update/delete révoqués) :
// une version qu'on réécrit ne permet plus de savoir si un chiffre a changé
// parce que la réalité a bougé ou parce que quelqu'un l'a corrigé.
//
// ⚠️ CETTE PAGE MONTRE AUSSI « CE QUI RESTE OUVERT ». C'est la partie qui aura
// le plus de valeur dans six mois — les paramètres, eux, seront périmés.

type Version = {
  version: string; fige_le: string; fige_par: string;
  parametres: Record<string, Record<string, unknown>>;
  ouvert: string | null; note: string | null;
};

const CHF = new Intl.NumberFormat("fr-CH", {
  style: "currency", currency: "CHF", minimumFractionDigits: 0, maximumFractionDigits: 0,
});

export default async function VersionsPage() {
  await requireSt4Plus();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("modele_version").select("*").order("version", { ascending: false });

  if (error) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-6">
        <h1 className="text-2xl font-semibold">Versions du modèle</h1>
        <p className="mt-4 rounded-lg bg-rose-50 p-4 text-rose-900">{error.message}</p>
      </main>
    );
  }
  const versions = (data ?? []) as Version[];
  const acq = (v: Version) => (v.parametres?.acquisition ?? {}) as Record<string, unknown>;
  const val = (v: Version, k: string, d = "—") => String(acq(v)[k] ?? d);

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 py-6">
      <header>
        <h1 className="text-2xl font-semibold">Versions du modèle économique</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Chaque version est figée : on ne la réécrit pas, on en crée une nouvelle.
        </p>
      </header>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Ce qui change d’une version à l’autre</h2>
        <div className="overflow-x-auto rounded-lg border border-neutral-200">
          <table className="w-full min-w-[42rem] text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-3 py-2">Version</th>
                <th className="px-3 py-2 text-right">App démo</th>
                <th className="px-3 py-2 text-right">Découverte</th>
                <th className="px-3 py-2 text-right">déc. → z2</th>
                <th className="px-3 py-2 text-right">Entrées z2 / sem</th>
                <th className="px-3 py-2 text-right">Entrée / mois</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {versions.map((v) => (
                <tr key={v.version} className={v.version === versions[0]?.version ? "bg-emerald-50" : ""}>
                  <td className="px-3 py-2 font-medium">{v.version}</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {acq(v).app_demo_st1 ? CHF.format(Number(acq(v).app_demo_st1)) : "—"}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {CHF.format(Number(acq(v).prix_decouverte ?? 29))}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {acq(v).taux_decouverte_vers_z2 ? "72 %" : "37,5 %"}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {val(v, "entrees_z2_semaine", "15")}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {acq(v).encaissement_entree_mois
                      ? CHF.format(Number(acq(v).encaissement_entree_mois))
                      : CHF.format(5023)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-neutral-600">
          ⚠️ <strong>Ce n’est ni la démo ni la hausse de prix qui fait basculer v0.8.3, c’est
          la qualification.</strong> Payer 9 francs transforme un clic TikTok en engagement
          minimal. Sans cet effet sur le passage en z2, la version échangerait du
          récurrent contre du comptant : +24 % tout de suite, mais dix entrées par
          semaine au lieu de quinze — donc moins de z3 à quinze mois et moins de z4 à
          quatre ans.
        </p>
      </section>

      {versions.map((v) => (
        <section key={v.version} className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-medium">{v.version}</h2>
            <span className="text-xs text-neutral-500">
              figée le {new Date(v.fige_le).toLocaleDateString("fr-CH")} · {v.fige_par}
            </span>
          </div>
          {v.note && (
            <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-xs leading-relaxed text-neutral-700">
              {v.note}
            </pre>
          )}
          {v.ouvert && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
              <div className="mb-1 text-xs font-medium uppercase tracking-wide text-amber-800">
                Ce qui restait ouvert
              </div>
              <pre className="overflow-x-auto whitespace-pre-wrap text-xs leading-relaxed text-amber-900">
                {v.ouvert}
              </pre>
            </div>
          )}
        </section>
      ))}
    </main>
  );
}
