import type { Metadata } from "next";
import { requireSt4Plus } from "@/lib/owner-gate";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Décompte TVA" };

// Patrick déclare au TRIMESTRE (Q1..Q4), pas au semestre — établi le 09.09.2026
// par son décompte Q1/2026 déposé le 31.03 (CA 3 062.49, méthode effective).
export const dynamic = "force-dynamic";

// Cette page existe pour une raison précise, dite par Patrick le 09.09.2026 :
// « je n'ai pas de quoi vérifier ton travail, or cockpit a justement été prévu
// pour ça ». Elle ne calcule rien — elle expose ligne à ligne ce que le grand
// livre porte, avec la date d'encaissement et le moyen, pour que chaque ligne
// soit retrouvable sur un relevé bancaire.

type Ligne = {
  period: number;
  paid_at: string | null;
  qui: string;
  moyen: string | null;
  source_kind: string | null;
  ttc: number | null;
  tva: number | null;
  libelle: string | null;
  entry_id: string;
};

function fmtCHF(n: number | null): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("fr-CH", {
    style: "currency", currency: "CHF", minimumFractionDigits: 2,
  }).format(n);
}
function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-CH", {
    day: "2-digit", month: "short", year: "numeric",
  });
}
function moisLabel(period: number): string {
  const y = Math.floor(period / 100);
  const m = period % 100;
  return new Date(y, m - 1, 1).toLocaleDateString("fr-CH", { month: "long", year: "numeric" });
}

export default async function TvaPage() {
  await requireSt4Plus();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("v_tva_semestre")
    .select("*")
    .gte("period", 202607)
    .lte("period", 202609)
    .order("paid_at", { ascending: true, nullsFirst: false });

  if (error) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-6">
        <h1 className="text-2xl font-semibold">Décompte TVA</h1>
        <p className="mt-4 rounded-lg bg-rose-50 p-4 text-rose-900">
          Lecture impossible : {error.message}
        </p>
      </main>
    );
  }

  const lignes = (data ?? []) as Ligne[];
  const totalTTC = lignes.reduce((s, l) => s + (l.ttc ?? 0), 0);
  const totalTVA = lignes.reduce((s, l) => s + (l.tva ?? 0), 0);

  const parMois = new Map<number, Ligne[]>();
  for (const l of lignes) {
    const k = l.period;
    if (!parMois.has(k)) parMois.set(k, []);
    parMois.get(k)!.push(l);
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <header>
        <h1 className="text-2xl font-semibold">Décompte TVA — Q3 2026</h1>
        <p className="mt-1 text-sm text-neutral-600">
          01.07 – 30.09.2026 · méthode effective · 8.1 % · Patrick Bays (CHE-463.639.374)
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-neutral-200 p-4">
          <div className="text-xs uppercase tracking-wide text-neutral-500">Chiffre d’affaires TTC</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">{fmtCHF(totalTTC)}</div>
        </div>
        <div className="rounded-xl border border-neutral-200 p-4">
          <div className="text-xs uppercase tracking-wide text-neutral-500">Impôt dû</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">{fmtCHF(totalTVA)}</div>
        </div>
        <div className="rounded-xl border border-neutral-200 p-4">
          <div className="text-xs uppercase tracking-wide text-neutral-500">Encaissements</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">{lignes.length}</div>
        </div>
      </section>

      <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
        <strong>Période en cours.</strong> Le trimestre se clôt le 30 septembre,
        exigible dans les 60 jours (art. 86 al. 1 LTVA). Le régime est bien
        <em>contre-prestations reçues</em> : le Q1 déposé (3 062.49) égale les
        encaissements bancaires du trimestre à CHF 13 près. Une réserve subsiste —
        l’export PostFinance ne rendait que 50 lignes pour quatre ans demandés.
      </div>

      {[...parMois.entries()].sort((a, b) => a[0] - b[0]).map(([period, ls]) => {
        const ttc = ls.reduce((s, l) => s + (l.ttc ?? 0), 0);
        const tva = ls.reduce((s, l) => s + (l.tva ?? 0), 0);
        return (
          <section key={period} className="space-y-2">
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-medium capitalize">{moisLabel(period)}</h2>
              <div className="text-sm tabular-nums text-neutral-600">
                {fmtCHF(ttc)} · TVA {fmtCHF(tva)}
              </div>
            </div>
            <div className="overflow-x-auto rounded-lg border border-neutral-200">
              <table className="w-full min-w-[42rem] text-sm">
                <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th className="px-3 py-2">Encaissé le</th>
                    <th className="px-3 py-2">Qui</th>
                    <th className="px-3 py-2">Moyen</th>
                    <th className="px-3 py-2">Nature</th>
                    <th className="px-3 py-2 text-right">TTC</th>
                    <th className="px-3 py-2 text-right">TVA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {ls.map((l) => (
                    <tr key={l.entry_id} className="align-top">
                      <td className="px-3 py-2 whitespace-nowrap tabular-nums">{fmtDate(l.paid_at)}</td>
                      <td className="px-3 py-2">{l.qui}</td>
                      <td className="px-3 py-2">
                        <span className={
                          l.moyen === "CASH"
                            ? "rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-900"
                            : "rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-700"
                        }>
                          {l.moyen ?? "—"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-neutral-600">{l.libelle ?? l.source_kind ?? "—"}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{fmtCHF(l.ttc)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{fmtCHF(l.tva)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </main>
  );
}
