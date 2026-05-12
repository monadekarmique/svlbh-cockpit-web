// Cockpit Dashboard — Hub des modules Cercle de Lumière.
// Source de vérité ordre/contenu : src/lib/cockpit-nav.ts

import Link from "next/link";
import { COCKPIT_NAV } from "@/lib/cockpit-nav";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
          Cockpit MyShamanFamily
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-blue-950 sm:text-4xl">
          Routines ◉ de Lumière
        </h1>
        <p className="mt-2 text-neutral-700">
          Pilotage quotidien des routines + suivi des shamanes du cercle.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {COCKPIT_NAV.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="group rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:shadow-md active:scale-[0.99]"
          >
            <div className="text-3xl">{t.icon}</div>
            <h2
              className="mt-3 text-lg font-semibold"
              style={{ color: t.color }}
            >
              {t.label}
            </h2>
            <p className="mt-1 text-sm text-neutral-600">{t.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
