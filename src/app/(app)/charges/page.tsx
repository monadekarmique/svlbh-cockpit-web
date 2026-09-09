import type { Metadata } from "next";
import { requireSt4Plus } from "@/lib/owner-gate";
import { createClient } from "@/lib/supabase/server";
import { NatureSelect } from "./nature-select";

export const metadata: Metadata = { title: "Charges" };
export const dynamic = "force-dynamic";

// DEC Patrick 09.09.2026 : « il nous suffit de prévoir une liste des dépenses
// récoltées avec menu déroulant ». Les lignes viennent des relevés importés
// tels quels ; le menu pose une ANNOTATION à côté, jamais dans l'original.

type Ligne = {
  ligne_id: string; compte: string; date_valeur: string; montant: number;
  texte: string; trimestre: string; nature: string | null; suggestion: string;
};

const CHF = new Intl.NumberFormat("fr-CH", {
  style: "currency", currency: "CHF", minimumFractionDigits: 2,
});
function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-CH",
    { day: "2-digit", month: "short", year: "2-digit" });
}

export default async function ChargesPage({
  searchParams,
}: { searchParams: Promise<{ t?: string }> }) {
  await requireSt4Plus();
  const { t } = await searchParams;
  const trimestre = t ?? "Q3 2026";

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_ligne_a_qualifier")
    .select("*")
    .lt("montant", 0)
    .eq("trimestre", trimestre)
    .order("date_valeur", { ascending: false });

  if (error) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-6">
        <h1 className="text-2xl font-semibold">Charges</h1>
        <p className="mt-4 rounded-lg bg-rose-50 p-4 text-rose-900">{error.message}</p>
      </main>
    );
  }

  const lignes = (data ?? []) as Ligne[];
  const total = lignes.reduce((s, l) => s + Number(l.montant), 0);
  const retenues = lignes.filter((l) => (l.nature ?? l.suggestion) === "charge");
  const baseCharges = retenues.reduce((s, l) => s + Number(l.montant), 0);
  // TVA suisse incluse à 8.1 % : depuis 2026 les prestations étrangères
  // consommées portent un numéro de TVA suisse (DEC Patrick 09.09), donc
  // l'impôt est PRÉALABLE et récupérable, pas de l'impôt sur les acquisitions.
  const prealable = Math.abs(baseCharges) - Math.abs(baseCharges) / 1.081;
  const aValider = lignes.filter((l) => l.nature === null).length;

  const TRIMESTRES = ["Q1 2026", "Q2 2026", "Q3 2026", "Q4 2026"];

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <header className="space-y-3">
        <h1 className="text-2xl font-semibold">Charges — {trimestre}</h1>
        <nav className="flex flex-wrap gap-2">
          {TRIMESTRES.map((q) => (
            <a key={q} href={`/charges?t=${encodeURIComponent(q)}`}
               className={"rounded-full px-3 py-1 text-sm " +
                 (q === trimestre
                   ? "bg-neutral-900 text-white"
                   : "border border-neutral-300 text-neutral-700 hover:bg-neutral-50")}>
              {q}
            </a>
          ))}
        </nav>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-neutral-200 p-4">
          <div className="text-xs uppercase tracking-wide text-neutral-500">Sorties</div>
          <div className="mt-1 text-xl font-semibold tabular-nums">{CHF.format(Math.abs(total))}</div>
        </div>
        <div className="rounded-xl border border-neutral-200 p-4">
          <div className="text-xs uppercase tracking-wide text-neutral-500">Retenu en charge</div>
          <div className="mt-1 text-xl font-semibold tabular-nums">{CHF.format(Math.abs(baseCharges))}</div>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="text-xs uppercase tracking-wide text-emerald-700">Impôt préalable</div>
          <div className="mt-1 text-xl font-semibold tabular-nums text-emerald-900">{CHF.format(prealable)}</div>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="text-xs uppercase tracking-wide text-amber-800">À valider</div>
          <div className="mt-1 text-xl font-semibold tabular-nums text-amber-900">{aValider}</div>
        </div>
      </section>

      <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
        Les lignes en <span className="italic text-neutral-500">gris italique</span> sont
        des <strong>suggestions</strong> de la règle, pas des décisions : elles comptent
        déjà dans le total, mais rien n’est écrit tant que tu n’as pas choisi. Une fois
        validées elles passent en vert. L’impôt préalable suppose 8.1 % de TVA suisse
        incluse dans le montant.
      </div>

      <div className="overflow-x-auto rounded-lg border border-neutral-200">
        <table className="w-full min-w-[46rem] text-sm">
          <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Compte</th>
              <th className="px-3 py-2">Libellé du relevé</th>
              <th className="px-3 py-2 text-right">Montant</th>
              <th className="px-3 py-2 w-56">Nature</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {lignes.map((l) => (
              <tr key={l.ligne_id} className="align-top">
                <td className="px-3 py-2 whitespace-nowrap tabular-nums">{fmtDate(l.date_valeur)}</td>
                <td className="px-3 py-2 text-xs text-neutral-500">{l.compte}</td>
                <td className="px-3 py-2 text-neutral-700">{l.texte}</td>
                <td className="px-3 py-2 text-right tabular-nums">{CHF.format(Math.abs(Number(l.montant)))}</td>
                <td className="px-3 py-2">
                  <NatureSelect ligneId={l.ligne_id} valeur={l.nature} suggestion={l.suggestion} />
                </td>
              </tr>
            ))}
            {lignes.length === 0 && (
              <tr><td colSpan={5} className="px-3 py-6 text-center text-neutral-500">
                Aucune sortie sur ce trimestre.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
