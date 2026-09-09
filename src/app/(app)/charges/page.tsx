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
function moisLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-CH", { month: "long", year: "numeric" });
}
function moisCle(iso: string): string {
  return iso.slice(0, 7);
}
function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-CH",
    { day: "2-digit", month: "short", year: "2-digit" });
}

export default async function ChargesPage({
  searchParams,
}: { searchParams: Promise<{ t?: string; masque?: string }> }) {
  await requireSt4Plus();
  const { t, masque } = await searchParams;
  const trimestre = t ?? "Q3 2026";
  // DEC Patrick 09.09.2026 : « ça me permettrait de masquer ou pas moi-même ces
  // catégories ». C'est LUI qui décide de ce qu'il regarde — on ne cache rien
  // par défaut. Chaque catégorie se replie d'un clic, et le libellé dit toujours
  // combien de lignes et combien de francs sont hors du champ de vision.
  const masquees = new Set((masque ?? "").split(",").filter(Boolean));

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

  const toutes = (data ?? []) as Ligne[];
  const natureDe = (l: Ligne) => l.nature ?? l.suggestion;
  const lignes = toutes.filter((l) => !masquees.has(natureDe(l)));

  const parNature = new Map<string, { n: number; chf: number }>();
  for (const l of toutes) {
    const k = natureDe(l);
    const e = parNature.get(k) ?? { n: 0, chf: 0 };
    e.n += 1; e.chf += Math.abs(Number(l.montant));
    parNature.set(k, e);
  }
  const lienMasque = (k: string) => {
    const s = new Set(masquees);
    if (s.has(k)) s.delete(k); else s.add(k);
    const q = new URLSearchParams({ t: trimestre });
    if (s.size) q.set("masque", [...s].join(","));
    return `/charges?${q.toString()}`;
  };
  const ETIQUETTE: Record<string, string> = {
    charge: "Charges (TVA récup.)", charge_sans_tva: "Charges (TVA non récup.)",
    hors_activite: "Hors activité", interne: "Mouvements internes",
    frais_bancaires: "Frais bancaires",
    prestation: "Prestations", don: "Dons", abonnement: "Abonnements",
    a_qualifier: "À qualifier",
  };
  const cachees = toutes.length - lignes.length;

  // Sous-total par mois, comme sur /tva. Le préalable est recalculé mois par
  // mois sur les seules charges récupérables — il ne se déduit pas du total.
  const parMois = new Map<string, Ligne[]>();
  for (const l of lignes) {
    const k = moisCle(l.date_valeur);
    if (!parMois.has(k)) parMois.set(k, []);
    parMois.get(k)!.push(l);
  }
  const totalMois = (ls: Ligne[]) => {
    const tout = ls.reduce((s, x) => s + Math.abs(Number(x.montant)), 0);
    const rec = ls.filter((x) => nat(x) === "charge")
                  .reduce((s, x) => s + Math.abs(Number(x.montant)), 0);
    return { tout, rec, prealable: rec - rec / 1.081 };
  };
  const total = lignes.reduce((s, l) => s + Number(l.montant), 0);
  const nat = (l: Ligne) => l.nature ?? l.suggestion;
  const recuperables = lignes.filter((l) => nat(l) === "charge");
  const toutesCharges = lignes.filter(
    (l) => nat(l) === "charge" || nat(l) === "charge_sans_tva");
  const baseCharges = toutesCharges.reduce((s, l) => s + Number(l.montant), 0);
  // ⚠️ Le préalable ne vient QUE des charges à TVA récupérable. Une charge
  // professionnelle sans TVA suisse facturée reste une dépense, mais ne donne
  // rien à déduire — les confondre gonflerait la déclaration.
  const baseRecup = recuperables.reduce((s, l) => s + Number(l.montant), 0);
  // TVA suisse incluse à 8.1 % : depuis 2026 les prestations étrangères
  // consommées portent un numéro de TVA suisse (DEC Patrick 09.09), donc
  // l'impôt est PRÉALABLE et récupérable, pas de l'impôt sur les acquisitions.
  const prealable = Math.abs(baseRecup) - Math.abs(baseRecup) / 1.081;
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

        <div className="flex flex-wrap gap-2">
          {[...parNature.entries()]
            .sort((a, b) => b[1].chf - a[1].chf)
            .map(([k, v]) => {
              const off = masquees.has(k);
              return (
                <a key={k} href={lienMasque(k)}
                   className={"rounded-lg border px-3 py-1.5 text-sm transition " +
                     (off
                       ? "border-neutral-200 bg-neutral-100 text-neutral-400 line-through"
                       : "border-neutral-300 bg-white text-neutral-800 hover:border-neutral-400")}>
                  {ETIQUETTE[k] ?? k}{" "}
                  <span className="tabular-nums text-neutral-500">
                    {v.n} · {CHF.format(v.chf)}
                  </span>
                </a>
              );
            })}
        </div>
        {cachees > 0 && (
          <p className="text-sm text-neutral-500">
            {cachees} ligne{cachees > 1 ? "s" : ""} hors du champ de vision ·{" "}
            <a className="underline" href={`/charges?t=${encodeURIComponent(trimestre)}`}>
              tout remontrer
            </a>
          </p>
        )}
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-neutral-200 p-4">
          <div className="text-xs uppercase tracking-wide text-neutral-500">Sorties</div>
          <div className="mt-1 text-xl font-semibold tabular-nums">{CHF.format(Math.abs(total))}</div>
        </div>
        <div className="rounded-xl border border-neutral-200 p-4">
          <div className="text-xs uppercase tracking-wide text-neutral-500">Charges (les deux)</div>
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
        validées elles passent en vert. L’impôt préalable ne compte QUE les charges
        à <strong>TVA récupérable</strong>, à 8.1 % incluse : un fournisseur étranger
        sans numéro de TVA suisse donne une charge bien réelle mais rien à déduire —
        ça se lit sur sa facture, pas sur un relevé de carte.
      </div>

      {[...parMois.entries()].sort((a, b) => b[0].localeCompare(a[0])).map(([mois, ls]) => {
        const t = totalMois(ls);
        return (
          <section key={mois} className="space-y-2">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-medium capitalize">{moisLabel(ls[0].date_valeur)}</h2>
              <div className="text-sm tabular-nums text-neutral-600">
                {CHF.format(t.tout)} · dont récupérable {CHF.format(t.rec)} ·{" "}
                <span className="font-medium text-emerald-800">
                  préalable {CHF.format(t.prealable)}
                </span>
              </div>
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
                  {ls.map((l) => (
                    <tr key={l.ligne_id} className="align-top">
                      <td className="px-3 py-2 whitespace-nowrap tabular-nums">{fmtDate(l.date_valeur)}</td>
                      <td className="px-3 py-2 text-xs text-neutral-500">{l.compte}</td>
                      <td className="px-3 py-2 text-neutral-700">{l.texte}</td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {CHF.format(Math.abs(Number(l.montant)))}
                      </td>
                      <td className="px-3 py-2">
                        <NatureSelect ligneId={l.ligne_id} valeur={l.nature} suggestion={l.suggestion} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}

      {lignes.length === 0 && (
        <p className="rounded-lg border border-neutral-200 px-3 py-6 text-center text-neutral-500">
          Aucune sortie visible sur ce trimestre.
        </p>
      )}
    </main>
  );
}
