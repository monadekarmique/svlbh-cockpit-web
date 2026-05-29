// Historique sessions — port SessionHistoryView.swift.
// V2.1 : sessions documentées (handovers) en accordéon + placeholder V3.

import Link from "next/link";
import {
  SESSION_META as LMASC_META,
  TypesDeLmascSession,
} from "./sessions/types-de-lmasc-psychosomatique";

export const dynamic = "force-dynamic";

const SESSIONS = [
  {
    meta: LMASC_META,
    Component: TypesDeLmascSession,
  },
] as const;

export default function HistoriquePage() {
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
          📜 Historique sessions
        </h1>
        <p className="mt-1 text-sm text-neutral-700">
          Chronologie des sessions du Cercle — handovers documentés, diff log,
          provocations.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-blue-900">
          📚 Sessions documentées ({SESSIONS.length})
        </h2>
        {SESSIONS.map(({ meta, Component }) => (
          <details
            key={meta.id}
            className="group rounded-xl border border-blue-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <summary className="cursor-pointer list-none">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-[11px] text-neutral-500">
                    <span className="font-mono">{meta.date}</span>
                    <span className="rounded bg-emerald-100 px-1.5 py-0.5 font-semibold text-emerald-900">
                      {meta.statut}
                    </span>
                    <span className="font-mono text-neutral-400">{meta.id}</span>
                  </div>
                  <h3 className="mt-1 text-base font-bold text-blue-950">
                    {meta.titre}
                  </h3>
                  <p className="mt-0.5 text-xs text-neutral-600">
                    {meta.sousTitre}
                  </p>
                  <p className="mt-1 text-[11px] italic text-neutral-500">
                    {meta.auteur}
                  </p>
                </div>
                <span
                  aria-hidden
                  className="shrink-0 text-xs text-blue-700 group-open:hidden"
                >
                  ▸ déplier
                </span>
                <span
                  aria-hidden
                  className="hidden shrink-0 text-xs text-blue-700 group-open:inline"
                >
                  ▾ replier
                </span>
              </div>
            </summary>

            <div className="mt-4 border-t border-neutral-200 pt-4">
              <Component />
            </div>
          </details>
        ))}
      </section>

      <section className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
        <p className="font-bold">⏳ V3 — à venir</p>
        <p className="mt-1 text-xs">
          Source iOS native : SessionHistoryView.swift + DiffLogView.swift +
          SessionTimelinePanel.swift. V3 portera la timeline avec sessions
          datées en série, diff entre versions, log des provocations,
          breadcrumb de navigation entre sessions.
        </p>
      </section>
    </div>
  );
}
