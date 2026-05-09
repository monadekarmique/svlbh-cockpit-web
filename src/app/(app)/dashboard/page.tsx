// Cockpit Dashboard — V0 minimal.
// Hub des routines Cercle de Lumière pour praticiennes certifiées T4+.

import Link from "next/link";

export const dynamic = "force-dynamic";

const TILES = [
  {
    href: "/shamanes",
    icon: "👥",
    label: "Shamanes du Cercle",
    desc: "Les apprenantes T2/T3 dans ton parcours",
    color: "#000099",
  },
  {
    href: "/routines",
    icon: "🔄",
    label: "Routines quotidiennes",
    desc: "Soin matinal · check-in · libérations",
    color: "#7C3AED",
  },
  {
    href: "/tores",
    icon: "🌀",
    label: "Tores énergétiques",
    desc: "Visualisations & protocoles dôme/anti-dôme",
    color: "#0E7490",
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

      <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <p className="font-semibold">⚙️ Bootstrap V0</p>
        <p className="mt-1 text-xs">
          PWA déployée sur cockpit.svlbh.com — auth Supabase + tier-gate
          T4+ actifs. Les modules Shamanes / Routines / Tores seront portés
          progressivement depuis svlbh-cercle-de-lumiere (iOS).
        </p>
      </section>
    </div>
  );
}
