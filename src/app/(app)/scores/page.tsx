"use client";

// Scores de Lumière — port SLMTab.swift (V2 cockpit, version praticienne).
// 4 scores : SLA · SLSA · SLPMO · SLM avec persistance localStorage.

import Link from "next/link";
import { useEffect, useState } from "react";

type ScoreId = "sla" | "slsa" | "slpmo" | "slm";

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

      {/* Image Body Planes (SLPMO) — DEC Patrick 2026-05-10.
          Hauteur ≈ 2 cards SLx (≈ 280px), centrée, contenue. */}
      <figure className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/scores/body-planes-slpmo.jpg"
          alt="Body Planes annotés — Sagittal, Coronal, Transverse (référence SLPMO)"
          className="mx-auto h-[280px] w-auto object-contain"
        />
      </figure>

      {/* 4 SLx en ligne sur grand écran (xl), 2×2 sur tablette, 1 col mobile.
          DEC Patrick 2026-05-10 — passer de la liste verticale à grille
          horizontale. */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {SCORES.map((s) => {
          const v = parseInt(values[s.id]) || 0;
          const reached = values[s.id] !== "" && v >= s.seuil;
          return (
            <article
              key={s.id}
              className="rounded-xl border bg-white p-4 shadow-sm"
              style={{
                borderColor: reached ? s.color : "#E5E5E5",
                borderLeftWidth: 4,
                borderLeftColor: s.color,
              }}
            >
              <div className="flex items-baseline justify-between gap-2">
                <div>
                  <p
                    className="font-mono text-base font-extrabold"
                    style={{ color: s.color }}
                  >
                    {s.label}
                  </p>
                  <p className="text-[11px] text-neutral-500">{s.fullName}</p>
                </div>
                <span className="font-mono text-[10px] text-neutral-400">
                  Seuil {s.seuil}%
                </span>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={values[s.id]}
                  onChange={(e) => setScore(s.id, e.target.value)}
                  placeholder="0"
                  className="w-24 rounded-lg border-2 px-2 py-1.5 text-center font-mono text-lg font-bold outline-none"
                  style={{
                    borderColor: reached ? s.color : "#E5E5E5",
                    color: s.color,
                  }}
                />
                <span className="text-sm font-semibold text-neutral-700">%</span>
                {reached ? (
                  <span
                    className="ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                    style={{ backgroundColor: s.color }}
                  >
                    ✓ Seuil atteint
                  </span>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>

      <section className="rounded-xl border-2 border-blue-300 bg-blue-50 p-4 text-center">
        <p className="text-xs font-bold uppercase tracking-wide text-neutral-700">
          Total
        </p>
        <p className="mt-1 font-mono text-3xl font-extrabold tabular-nums text-blue-900">
          {total}
        </p>
      </section>
    </div>
  );
}
