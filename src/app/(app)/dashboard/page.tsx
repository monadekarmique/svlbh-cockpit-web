// Cockpit Dashboard — Hub des modules Cercle de Lumière (V2).

import Link from "next/link";

export const dynamic = "force-dynamic";

const TILES = [
  {
    href: "/shamanes",
    icon: "👥",
    label: "Shamanes du Cercle",
    desc: "8 codes praticien·nes + badges sessions pending",
    color: "#000099",
  },
  {
    href: "/routines",
    icon: "🔄",
    label: "Routine matin",
    desc: "Quotas billing certifiées + checks énergie M/F",
    color: "#7C3AED",
  },
  {
    href: "/tores",
    icon: "🌀",
    label: "Tores énergétiques",
    desc: "4 dimensions : Champ · Glycémie · Sclérose · Sclérose tissulaire",
    color: "#0E7490",
  },
  {
    href: "/chakras",
    icon: "◈",
    label: "Chakras / Dimensions",
    desc: "10 dimensions hDOM (D22, D9-D1, D0)",
    color: "#BE185D",
  },
  {
    href: "/scores",
    icon: "💡",
    label: "Scores de Lumière",
    desc: "SLA · SLSA · SLPMO · SLM avec seuils",
    color: "#C28D43",
  },
  {
    href: "/demandes",
    icon: "📥",
    label: "Demandes",
    desc: "Factures + sessions via vlbh-energy-mcp",
    color: "#1D9E75",
  },
  {
    href: "/historique",
    icon: "📜",
    label: "Historique sessions",
    desc: "Timeline · diff log · provocations",
    color: "#6B3A8A",
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
          Cockpit MyShamanFamily
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-blue-950 sm:text-4xl">
          🎯 Routines Cercle de Lumière
        </h1>
        <p className="mt-2 text-neutral-700">
          Pilotage quotidien des routines + suivi des shamanes du cercle.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TILES.map((t) => (
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
