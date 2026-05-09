// Linggui Bafa — table des 12 créneaux du jour avec paires de points actives.

import Link from "next/link";
import { BAFA_POINTS, bafaForDate, bafaSlotsForDay } from "@/lib/cercle/linggui-bafa";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function LingguiBafaPage() {
  const now = new Date();
  const current = bafaForDate(now, now.getHours());
  const slots = bafaSlotsForDay(now);

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
          灵龟八法 Linggui Bafa
        </h1>
        <p className="mt-1 text-sm text-neutral-700">
          8 points de confluence des Merveilleux Vaisseaux MTC. Calcul Tian
          Gan / Di Zhi (天干地支) — la paire active change tous les 2 heures
          selon le jour.
        </p>
      </header>

      {/* Bandeau créneau actif */}
      <section className="rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-yellow-50 p-5 shadow-md">
        <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
          Maintenant · {current.hourLabel} · {current.diZhiName}
        </p>
        <p className="mt-1 text-xs text-amber-700">
          Jour Tian Gan : <span className="font-bold">{current.tianGanName}</span>{" "}
          ({current.tianGanIndex + 1}/10)
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <PointCard label="Point principal" point={current.upper} accent="#C28D43" />
          <PointCard label="Point couplé" point={current.lower} accent="#8B5A2B" />
        </div>
      </section>

      {/* Table 12 créneaux du jour */}
      <section className="space-y-2">
        <h2 className="text-base font-semibold text-blue-900">
          Aujourd'hui — 12 créneaux Di Zhi
        </h2>
        <ul className="space-y-1.5">
          {slots.map((s, i) => {
            const active = s.diZhiIndex === current.diZhiIndex;
            return (
              <li
                key={i}
                className={`grid grid-cols-[80px_1fr_1fr] items-baseline gap-3 rounded-lg border p-3 ${
                  active
                    ? "border-amber-400 bg-amber-50"
                    : "border-neutral-200 bg-white"
                }`}
              >
                <div>
                  <p className="font-mono text-sm font-bold text-blue-900">
                    {s.hourLabel}
                  </p>
                  <p className="text-[10px] text-neutral-500">{s.diZhiName}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-amber-900">
                    {s.upper.code}
                  </p>
                  <p className="text-[10px] text-neutral-600">
                    {s.upper.pinyin} · {s.upper.vessel}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-amber-900">
                    {s.lower.code}
                  </p>
                  <p className="text-[10px] text-neutral-600">
                    {s.lower.pinyin} · {s.lower.vessel}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Référence : 8 points */}
      <section className="space-y-2">
        <h2 className="text-base font-semibold text-blue-900">
          Référence · 8 points de confluence
        </h2>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {BAFA_POINTS.map((p) => (
            <li
              key={p.id}
              className="rounded-lg border border-neutral-200 bg-white p-3 shadow-sm"
            >
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-xs font-extrabold text-amber-700">
                  {p.id}
                </span>
                <span className="font-semibold text-neutral-900">{p.code}</span>
              </div>
              <p className="text-xs italic text-neutral-600">{p.pinyin}</p>
              <p className="text-[11px] font-semibold text-blue-700">{p.vessel}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function PointCard({
  label,
  point,
  accent,
}: {
  label: string;
  point: { code: string; pinyin: string; vessel: string };
  accent: string;
}) {
  return (
    <div
      className="rounded-xl border-2 bg-white p-3"
      style={{ borderColor: accent }}
    >
      <p
        className="text-[10px] font-bold uppercase tracking-wide"
        style={{ color: accent }}
      >
        {label}
      </p>
      <p
        className="mt-1 text-xl font-extrabold"
        style={{ color: accent }}
      >
        {point.code}
      </p>
      <p className="text-xs italic text-neutral-700">{point.pinyin}</p>
      <p className="text-[11px] font-semibold text-blue-900">{point.vessel}</p>
    </div>
  );
}
