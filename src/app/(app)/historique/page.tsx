// Historique sessions — port SessionHistoryView.swift.
// V2 : placeholder structuré. V3 ajoutera fetch.

import Link from "next/link";

export const dynamic = "force-dynamic";

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
          Chronologie des sessions du Cercle — diff log, sync timeline,
          provocations, breadcrumb.
        </p>
      </header>

      <section className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
        <p className="font-bold">⏳ V2 — placeholder</p>
        <p className="mt-1 text-xs">
          Source iOS native : SessionHistoryView.swift + DiffLogView.swift +
          SessionTimelinePanel.swift. V3 portera la timeline avec sessions
          datées, diff entre versions, log des provocations, breadcrumb de
          navigation entre sessions.
        </p>
      </section>
    </div>
  );
}
