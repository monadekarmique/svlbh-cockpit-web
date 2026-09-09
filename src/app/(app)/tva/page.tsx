import type { Metadata } from "next";
import { requireSt6 } from "@/lib/owner-gate";
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

// Le décompte est TRIMESTRIEL (Q1..Q4) — établi le 09.09.2026 par le décompte
// Q1/2026 déposé le 31.03. Même navigation que /charges : Patrick passe d'un
// trimestre à l'autre sans changer d'écran.
export default async function TvaPage({
  searchParams,
}: { searchParams: Promise<{ t?: string }> }) {
  await requireSt6();
  const { t } = await searchParams;
  const trimestre = t ?? "Q3 2026";
  const PERIODES: Record<string, [number, number]> = {
    "Q1 2026": [202601, 202603], "Q2 2026": [202604, 202606],
    "Q3 2026": [202607, 202609], "Q4 2026": [202610, 202612],
  };
  const [debut, fin] = PERIODES[trimestre] ?? PERIODES["Q3 2026"];
  // Ce qui a été DÉPOSÉ, pour pouvoir comparer le calcul à la déclaration.
  // ⚠️ Q1 vient du PDF de l'AFC (ch. 200/299 = 3 062.49, ch. 303 = 229.47,
  // ch. 400 = 69.12) — c'est la seule période dont on connaisse la réponse,
  // donc la seule qui puisse valider l'instrument.
  const DEPOSE: Record<string, { ca: number; tva: number; prealable: number }> = {
    "Q1 2026": { ca: 3062.49, tva: 229.47, prealable: 69.12 },
  };
  const depose = DEPOSE[trimestre];
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("v_tva_detail")
    .select("*")
    .gte("period", debut)
    .lte("period", fin)
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
        <h1 className="text-2xl font-semibold">Décompte TVA — {trimestre}</h1>
        <p className="mt-1 text-sm text-neutral-600">
          méthode effective · 8.1 % · Patrick Bays (CHE-463.639.374) · AFC-ID 052.0343.3077
        </p>
        <nav className="mt-3 flex flex-wrap gap-2">
          {Object.keys(PERIODES).map((q) => (
            <a key={q} href={`/tva?t=${encodeURIComponent(q)}`}
               className={"rounded-full px-3 py-1 text-sm " +
                 (q === trimestre
                   ? "bg-neutral-900 text-white"
                   : "border border-neutral-300 text-neutral-700 hover:bg-neutral-50")}>
              {q}
            </a>
          ))}
        </nav>
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

      {depose && (
        <div className="rounded-xl border border-neutral-300 bg-neutral-50 p-4 text-sm">
          <strong>Déposé à l’AFC</strong> — chiffre d’affaires{" "}
          <span className="tabular-nums">{fmtCHF(depose.ca)}</span> · impôt dû{" "}
          <span className="tabular-nums">{fmtCHF(depose.tva)}</span> · impôt préalable{" "}
          <span className="tabular-nums">{fmtCHF(depose.prealable)}</span> · à payer{" "}
          <span className="tabular-nums">{fmtCHF(depose.tva - depose.prealable)}</span>.
          <br />
          Écart avec le calcul ci-dessus :{" "}
          <span className="tabular-nums font-medium">
            {fmtCHF(totalTTC - depose.ca)}
          </span>{" "}
          de chiffre d’affaires. C’est le seul trimestre dont on connaisse la réponse —
          donc le seul qui puisse valider l’instrument.
        </div>
      )}

      <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
        {/* ⚠️ Ce bandeau a porté deux affirmations périmées jusqu'au 09.09.2026 :
            une réserve sur l'export PostFinance que Patrick avait levée, et un
            « à CHF 13 près » qui venait d'un filtre approximatif de ma part. Un
            écran qui garde une réserve morte est exactement le défaut qu'on
            traque : relire ce texte à chaque fois qu'un fait change. */}
        <strong>Contre-prestations reçues.</strong> Ce qui compte est la date
        d’encaissement, pas la période du service. Exigible 60 jours après la
        clôture du trimestre (art. 86 al. 1 LTVA), intérêt moratoire sans
        sommation ensuite (art. 87 al. 1).
        <br />
        Les lignes viennent des relevés bancaires importés tels quels, plus les
        espèces dictées par Patrick. <strong>Une écriture non confirmée par un
        encaissement n’apparaît pas ici</strong> — un dû n’est pas une
        contre-prestation reçue.
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
