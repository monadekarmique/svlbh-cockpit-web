// Tores énergétiques — port ToreModels.swift.
// V1 : présentation des 4 dimensions du Tore (Champ Toroïdal, Glycémie,
// Sclérose, Sclérose Tissulaire). V2 ajoutera fetch + push live.

import Link from "next/link";

export const dynamic = "force-static";

const PHASES = [
  { id: "REPOS", color: "#6B7280", label: "Repos" },
  { id: "CHARGE", color: "#C28D43", label: "Charge" },
  { id: "DECHARGE", color: "#2B5EA7", label: "Décharge" },
  { id: "EQUILIBRE", color: "#4A7C28", label: "Équilibre" },
];

const DIMENSIONS = [
  {
    title: "Champ toroïdal",
    color: "#000099",
    metrics: [
      { name: "Intensité", range: "0–100 000" },
      { name: "Cohérence", range: "0–100 %" },
      { name: "Fréquence", range: "0,01–1000 Hz" },
      { name: "Phase", range: "Repos / Charge / Décharge / Équilibre" },
    ],
  },
  {
    title: "Glycémie",
    color: "#7C3AED",
    metrics: [
      { name: "Index", range: "0–500" },
      { name: "Balance", range: "0–100 %" },
      { name: "Absorption", range: "0–100 %" },
      { name: "Score résistance", range: "0–1000" },
    ],
  },
  {
    title: "Sclérose",
    color: "#0E7490",
    metrics: [
      { name: "Score", range: "0–1000" },
      { name: "Densité", range: "0–100 %" },
      { name: "Élasticité", range: "0–100 %" },
      { name: "Perméabilité", range: "0–100 %" },
    ],
  },
  {
    title: "Sclérose tissulaire",
    color: "#BE185D",
    metrics: [
      { name: "Index fibrose", range: "0–1000" },
      { name: "Zones atteintes", range: "0–50" },
      { name: "Profondeur", range: "0–10" },
      { name: "Revascularisation", range: "0–100 %" },
      { name: "Décompaction", range: "0–100 %" },
    ],
  },
];

export default function ToresPage() {
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
          🌀 Tores énergétiques
        </h1>
        <p className="mt-1 text-sm text-neutral-700">
          Module Tore : Stockage Énergétique + Couplage Glycémie/Sclérose. 4
          dimensions de mesure, compatibles POST /tore/push & /tore/pull.
        </p>
      </header>

      <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wide text-neutral-700">
          Phases du tore
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {PHASES.map((p) => (
            <div
              key={p.id}
              className="rounded-lg border-2 p-3 text-center"
              style={{
                borderColor: `${p.color}80`,
                backgroundColor: `${p.color}10`,
              }}
            >
              <p className="text-sm font-bold" style={{ color: p.color }}>
                {p.label}
              </p>
              <p className="font-mono text-[10px] uppercase text-neutral-500">
                {p.id}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {DIMENSIONS.map((d) => (
          <article
            key={d.title}
            className="rounded-2xl border bg-white p-5 shadow-sm"
            style={{ borderTopColor: d.color, borderTopWidth: 4 }}
          >
            <h2 className="text-lg font-semibold" style={{ color: d.color }}>
              {d.title}
            </h2>
            <ul className="mt-3 space-y-1.5">
              {d.metrics.map((m) => (
                <li
                  key={m.name}
                  className="flex items-baseline justify-between gap-3 border-b border-neutral-100 pb-1 last:border-b-0"
                >
                  <span className="text-sm font-semibold text-neutral-900">
                    {m.name}
                  </span>
                  <span className="font-mono text-[11px] text-neutral-500">
                    {m.range}
                  </span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <p className="font-semibold">⏳ V1 — référence statique</p>
        <p className="mt-1 text-xs">
          V2 ajoutera : fetch live d'un Tore par session, push update via
          webhook /tore/push, vue détail des couplages glycémie ↔ sclérose
          tissulaire.
        </p>
      </section>
    </div>
  );
}
