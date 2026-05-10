"use client";

// Scores de Lumière — port SLMTab.swift (V2 cockpit, version praticienne).
// 4 scores : SLA · SLSA · SLPMO · SLM avec persistance localStorage.

import Link from "next/link";
import { useEffect, useState } from "react";

type ScoreId = "sla" | "slsa" | "slpmo" | "slm";

// Plans anatomiques SLPMO — DEC Patrick 2026-05-10.
// 5 plans de référence pour la lecture du Score de Lumière Personnel
// Multi-Octave (cf image Body Planes annotée juste au-dessus).
const SLPMO_PLANES: {
  id: string;
  name: string;
  desc: string;
  color: string;
  icon: string;
}[] = [
  {
    id: "frontal-coronal",
    name: "Frontal / Coronal",
    desc: "Plan vertical séparant l'avant et l'arrière du corps (face/dos).",
    color: "#2B5EA7",
    icon: "▤",
  },
  {
    id: "sagittal-median",
    name: "Sagittal médian",
    desc: "Plan vertical séparant le corps en moitiés gauche et droite égales.",
    color: "#6B3A8A",
    icon: "▥",
  },
  {
    id: "transversal-pelvien",
    name: "Transversal pelvien",
    desc: "Plan horizontal au niveau du bassin (séparation haut/bas).",
    color: "#C28D43",
    icon: "▬",
  },
  {
    id: "levre-labium",
    name: "Lèvre / Labium",
    desc: "Plan spécifique des lèvres / labium — repère vibratoire VLBH.",
    color: "#BD3482",
    icon: "◖",
  },
  {
    id: "thoracique",
    name: "Plan thoracique",
    desc: "Plan transversal au niveau du thorax (diaphragme — cœur — poumons).",
    color: "#4A7C28",
    icon: "▭",
  },
];

const SCORES: {
  id: ScoreId;
  label: string;
  fullName: string;
  seuil: number;
  color: string;
}[] = [
  {
    id: "sla",
    label: "SLA",
    fullName: "Score de Lumière de l'Âme",
    seuil: 78,
    color: "#C28D43",
  },
  {
    id: "slsa",
    label: "SLSA",
    fullName: "Score de Lumière du Soi Authentique",
    seuil: 32,
    color: "#2B5EA7",
  },
  {
    id: "slpmo",
    label: "SLPMO",
    fullName: "Score de Lumière Personnel Multi-Octave",
    seuil: 25,
    color: "#6B3A8A",
  },
  {
    id: "slm",
    label: "SLM",
    fullName: "Score de Lumière Monadique",
    seuil: 100,
    color: "#4A7C28",
  },
];

const KEY_PREFIX = "vlbh.cockpit.scores.";

function clamp(s: string): string {
  const cleaned = s.replace(/\D/g, "").slice(0, 5);
  if (cleaned === "") return "";
  return String(Math.min(50000, parseInt(cleaned)));
}

export default function ScoresPage() {
  const [values, setValues] = useState<Record<ScoreId, string>>({
    sla: "",
    slsa: "",
    slpmo: "",
    slm: "",
  });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const next: Record<ScoreId, string> = {
      sla: "",
      slsa: "",
      slpmo: "",
      slm: "",
    };
    for (const s of SCORES) next[s.id] = localStorage.getItem(KEY_PREFIX + s.id) ?? "";
    setValues(next);
    setHydrated(true);
  }, []);

  const setScore = (id: ScoreId, raw: string) => {
    const v = clamp(raw);
    setValues((p) => ({ ...p, [id]: v }));
    if (hydrated) localStorage.setItem(KEY_PREFIX + id, v);
  };

  const reset = () => {
    setValues({ sla: "", slsa: "", slpmo: "", slm: "" });
    for (const s of SCORES) localStorage.removeItem(KEY_PREFIX + s.id);
  };

  const total = SCORES.reduce((s, x) => s + (parseInt(values[x.id]) || 0), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="text-sm text-neutral-500 hover:text-neutral-900"
        >
          ← Cockpit
        </Link>
        <button
          type="button"
          onClick={reset}
          className="text-xs font-semibold text-rose-600 hover:text-rose-800"
        >
          ↺ Reset
        </button>
      </div>

      <header>
        <h1 className="text-2xl font-bold tracking-tight text-blue-950">
          ◈ Scores de Lumière
        </h1>
        <p className="mt-1 text-sm text-neutral-700">
          SLA · SLSA · SLPMO · SLM. Persistance locale (cockpit).
        </p>
      </header>

      {/* Layout DEC Patrick 2026-05-10 v4 :
          ┌──────────┬──────────┬──────────┐
          │          │  SLPMO   │  TOTAL   │   ← niveau 1
          │  Image   ├──────────┴──────────┤
          │  Body    │ SLA  │ SLSA │ SLM   │   ← niveau 2
          │  Planes  │      │      │       │
          └──────────┴──────┴──────┴───────┘
          → image gauche sur 2 niveaux, droite divisée en 2 rangées. */}
      <div className="flex flex-col gap-3 lg:flex-row">
        {/* Image à gauche sur 2 niveaux (lg:w-1/2 sur grand écran) */}
        <figure className="overflow-hidden rounded-xl border border-neutral-200 bg-white lg:w-1/2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/scores/body-planes-slpmo.jpg"
            alt="Body Planes annotés — Sagittal, Coronal, Transverse (référence SLPMO)"
            className="mx-auto h-full max-h-[500px] w-auto object-contain p-2"
          />
        </figure>

        {/* Côté droit : 2 niveaux empilés */}
        <div className="flex flex-1 flex-col gap-3">
          {/* Niveau 1 : SLPMO + TOTAL */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {SCORES.filter((s) => s.id === "slpmo").map((s) => (
              <SlxCard key={s.id} score={s} value={values[s.id]} setScore={setScore} />
            ))}
            <section className="flex flex-col items-center justify-center rounded-xl border-2 border-blue-300 bg-blue-50 p-4 text-center">
              <p className="text-xs font-bold uppercase tracking-wide text-neutral-700">
                Total
              </p>
              <p className="mt-1 font-mono text-4xl font-extrabold tabular-nums text-blue-900">
                {total}
                <span className="ml-1 text-2xl font-bold text-blue-700">%</span>
              </p>
            </section>
          </div>

          {/* Niveau 2 : SLA + SLSA + SLM */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {SCORES.filter((s) => s.id !== "slpmo").map((s) => (
              <SlxCard key={s.id} score={s} value={values[s.id]} setScore={setScore} />
            ))}
          </div>
        </div>
      </div>

      {/* Plans anatomiques SLPMO — DEC Patrick 2026-05-10.
          5 plans de référence pour la lecture du SLPMO. */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold tracking-tight text-blue-950">
          Plans anatomiques SLPMO
        </h2>
        <p className="text-xs text-neutral-600">
          5 plans de référence pour la lecture vibratoire — voir image Body
          Planes en haut de la page.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {SLPMO_PLANES.map((p) => (
            <article
              key={p.id}
              className="rounded-xl border bg-white p-3 shadow-sm"
              style={{
                borderColor: "#E5E5E5",
                borderLeftWidth: 4,
                borderLeftColor: p.color,
              }}
            >
              <div className="flex items-baseline gap-2">
                <span
                  className="font-mono text-xl"
                  style={{ color: p.color }}
                  aria-hidden
                >
                  {p.icon}
                </span>
                <p
                  className="font-mono text-sm font-extrabold"
                  style={{ color: p.color }}
                >
                  {p.name}
                </p>
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-neutral-600">
                {p.desc}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

// MARK: - SlxCard (extrait pour réutiliser SLPMO topright + 3 autres bottom)

function SlxCard({
  score,
  value,
  setScore,
}: {
  score: (typeof SCORES)[number];
  value: string;
  setScore: (id: ScoreId, raw: string) => void;
}) {
  const v = parseInt(value) || 0;
  const reached = value !== "" && v >= score.seuil;
  return (
    <article
      className="rounded-xl border bg-white p-4 shadow-sm"
      style={{
        borderColor: reached ? score.color : "#E5E5E5",
        borderLeftWidth: 4,
        borderLeftColor: score.color,
      }}
    >
      {/* Top : label + nom */}
      <div>
        <p
          className="font-mono text-base font-extrabold"
          style={{ color: score.color }}
        >
          {score.label}
        </p>
        <p className="text-[11px] text-neutral-500">{score.fullName}</p>
      </div>

      {/* Ligne en dessous à droite : Seuil X% (DEC Patrick 2026-05-10) */}
      <div className="mt-1 text-right">
        <span className="font-mono text-[10px] text-neutral-400">
          Seuil {score.seuil}%
        </span>
      </div>

      {/* Bottom : input + % */}
      <div className="mt-2 flex items-center gap-2">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={value}
          onChange={(e) => setScore(score.id, e.target.value)}
          placeholder="0"
          className="w-24 rounded-lg border-2 px-2 py-1.5 text-center font-mono text-lg font-bold outline-none"
          style={{
            borderColor: reached ? score.color : "#E5E5E5",
            color: score.color,
          }}
        />
        <span className="text-sm font-semibold text-neutral-700">%</span>
      </div>

      {/* Badge "Seuil atteint" sur une ligne dédiée sous l'input,
          aligné à droite (DEC Patrick 2026-05-10) */}
      {reached ? (
        <div className="mt-2 text-right">
          <span
            className="inline-block rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
            style={{ backgroundColor: score.color }}
          >
            ✓ Seuil atteint
          </span>
        </div>
      ) : null}
    </article>
  );
}
