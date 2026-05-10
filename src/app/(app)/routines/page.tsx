// Routines matin Certifiées — quotas billing avec checks Cercle de Lumière.
// + Section "Parcours priv du jour" (DEC Patrick 2026-05-10) — clés
// chromatiques soin matinal du jour par certifiée + ses thérapeutes,
// avec attach/detach (Sprint A).

import Link from "next/link";
import { fetchAllQuotas, computeChecks } from "@/lib/cercle/routines";
import { ParcoursDuJourSection } from "./parcours-du-jour";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function RoutinesPage() {
  const all = await fetchAllQuotas();
  const checks = computeChecks(all);

  return (
    <div className="space-y-5">
      <Link
        href="/dashboard"
        className="text-sm text-neutral-500 hover:text-neutral-900"
      >
        ← Cockpit
      </Link>

      <header>
        <h1 className="text-2xl font-bold tracking-tight text-blue-950">
          🔄 Routine matin Certifiées
        </h1>
        <p className="mt-1 text-sm text-neutral-700">
          Quotas billing live des certifiées du Cercle + checks énergie
          masculine/féminine.
        </p>
      </header>

      {all.length === 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-center text-sm text-amber-900">
          ⚠️ Aucun quota chargé — webhook Make.com indisponible ou aucune
          certifiée trouvée.
        </div>
      ) : (
        <>
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <CheckCard
              label="Check 1 · Énergie masculine"
              hint="Patrick couvre les certifiées"
              pct={checks.couvertureCheck1Pct}
            />
            <CheckCard
              label="Check 2 · Énergie féminine"
              hint="Cornelia + Anne couvrent Flavia + Chloé + Irène"
              pct={checks.couvertureCheck2Pct}
            />
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-blue-900">
              Certifiées ({checks.certifiees.length})
            </h2>
            <ul className="space-y-2">
              {checks.certifiees.map((q) => (
                <li
                  key={q.id}
                  className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm"
                >
                  <span className="text-xl">{q.indicateur}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-neutral-900">{q.nom}</p>
                    <p className="font-mono text-[11px] text-neutral-500">
                      Code {q.id}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-base font-bold text-blue-900 tabular-nums">
                      {q.compteur} / {q.max}
                    </p>
                    <p className="text-[11px] text-neutral-500">
                      Quota libre :{" "}
                      <span
                        className={
                          q.quotaLibre >= 0
                            ? "font-bold text-emerald-700"
                            : "font-bold text-rose-700"
                        }
                      >
                        {q.quotaLibre}
                      </span>
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {checks.patrick ? (
            <section className="rounded-xl border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-violet-50 p-4 shadow-sm">
              <h2 className="text-sm font-bold text-purple-900">
                🛡 Superviseur — {checks.patrick.nom}
              </h2>
              <p className="mt-1 font-mono text-base font-bold text-purple-800 tabular-nums">
                {checks.patrick.compteur} / {checks.patrick.max}
              </p>
              <p className="text-xs text-purple-700">
                Quota libre : {checks.patrick.quotaLibre}
              </p>
            </section>
          ) : null}

          <section className="rounded-xl border border-neutral-200 bg-white p-4 text-center shadow-sm">
            <p className="text-xs font-bold uppercase text-neutral-500">
              Total Cercle
            </p>
            <p className="mt-1 font-mono text-2xl font-extrabold text-blue-900 tabular-nums">
              {checks.totalCompteurs} / {checks.totalMax}
            </p>
          </section>
        </>
      )}

      <p className="text-center text-[10px] text-neutral-400">
        Source : webhook Make.com svlbh-sync-praticien · billing_praticien
        datastore
      </p>

      {/* Section Parcours priv du jour — Sprint A DEC Patrick 2026-05-10 */}
      <ParcoursDuJourSection />
    </div>
  );
}

function CheckCard({
  label,
  hint,
  pct,
}: {
  label: string;
  hint: string;
  pct: number;
}) {
  const ok = pct >= 100;
  return (
    <article
      className="rounded-xl border-2 p-4 shadow-sm"
      style={{
        borderColor: ok ? "#4A7C28" : "#C28D43",
        backgroundColor: ok ? "#4A7C2810" : "#C28D4310",
      }}
    >
      <p className="text-xs font-bold uppercase tracking-wide text-neutral-700">
        {label}
      </p>
      <p
        className="mt-1 font-mono text-3xl font-extrabold tabular-nums"
        style={{ color: ok ? "#4A7C28" : "#C28D43" }}
      >
        {Math.round(pct)}%
      </p>
      <p className="text-[11px] text-neutral-600">{hint}</p>
    </article>
  );
}
