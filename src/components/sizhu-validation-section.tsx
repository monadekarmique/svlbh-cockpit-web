// Section "Concept explicatif Si Zhu + dates de libération efficaces"
// — affichée en tête de /demandes, au-dessus du module billing.
// Doctrine validée Patrick 2026-05-09.

"use client";

import { useMemo, useState } from "react";
import {
  SIZHU_PERFECT,
  SIZHU_IMPOSSIBLE,
  AXIS_TONE,
  TENSION_TONE,
  upcomingReleaseDates,
  type SiZhuPoint,
} from "@/lib/cercle/sizhu-validation";

function formatDateFr(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("fr-CH", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function SiZhuValidationSection() {
  const [openPoint, setOpenPoint] = useState<string | null>(null);

  const upcoming = useMemo(() => upcomingReleaseDates(new Date(), 12), []);

  return (
    <section className="space-y-6 rounded-2xl border-2 border-violet-300 bg-gradient-to-br from-violet-50 via-fuchsia-50 to-rose-50 p-5 shadow-sm">
      {/* En-tête concept */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-700">
          Doctrine chrono-acupuncture · Validation Si Zhu 四柱
        </p>
        <h2 className="text-xl font-bold tracking-tight text-violet-950">
          Points de validation radiesthésique · Pathologies chromathiques monadiques
        </h2>
        <p className="text-sm leading-relaxed text-neutral-800">
          Les <strong>4 piliers</strong> (Année 年 · Mois 月 · Jour 日 · Heure 時) du
          calendrier sexagésimal chinois s&apos;alignent rarement sur la même{" "}
          <strong>branche terrestre</strong> 地支. Quand cela arrive — et que les
          4 <strong>tiges célestes</strong> 天干 sont elles aussi identiques — on
          obtient un <strong>cas parfait</strong> qui produit une tension
          Sheng/Ke spécifique entre Ciel et Terre. <strong>Ce sont les
          fenêtres temporelles où la validation pendulaire des pathologies
          chromathiques monadiques atteint sa précision maximale.</strong>
        </p>
        <p className="text-xs leading-relaxed text-neutral-700">
          10 cas parfaits sur 12 branches couvrent l&apos;intégralité du cycle{" "}
          <strong>Zi Wu Liu Zhu 子午流注</strong>. Chacun ouvre un méridien
          spécifique sur sa tranche horaire (vrai temps solaire local) — point
          d&apos;ancrage Linggui Bafa des libérations chromothérapeutiques
          monadiques.
        </p>
      </div>

      {/* Prochaines dates — mise en évidence */}
      <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-800">
          ⏳ Prochaines fenêtres efficaces (vrai temps solaire local)
        </p>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {upcoming.map(({ point, date, daysUntil }) => {
            const tone = AXIS_TONE[point.axis];
            const tens = TENSION_TONE[point.tension];
            const yrs = Math.floor(daysUntil / 365);
            return (
              <button
                key={`${point.ganZhi}-${date}`}
                type="button"
                onClick={() =>
                  setOpenPoint(openPoint === point.ganZhi ? null : point.ganZhi)
                }
                className={`group rounded-lg border-2 ${tone.border} ${tone.bg} p-3 text-left transition hover:shadow-md`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className={`font-bold ${tone.text}`}>
                    {point.ganZhi}
                  </span>
                  <span className="text-[10px] font-semibold text-neutral-600">
                    {tone.label}
                  </span>
                </div>
                <p className={`mt-1 font-mono text-sm font-bold ${tone.text}`}>
                  {formatDateFr(date)}
                </p>
                <p className="mt-0.5 text-[11px] font-medium text-neutral-700">
                  {point.hourSlot} · {point.meridianCode} {point.meridian}
                </p>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className={`text-[10px] font-semibold ${tens.color}`}>
                    {tens.symbol} {tens.label.split(" ")[0]}
                  </span>
                  <span className="text-[10px] font-semibold text-neutral-600">
                    dans {yrs > 0 ? `${yrs} an${yrs > 1 ? "s" : ""}` : `${daysUntil} j`}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Liste complète des 10 cas parfaits — collapsible */}
      <details className="group rounded-xl border border-violet-200 bg-white/70 p-4">
        <summary className="cursor-pointer text-sm font-bold text-violet-900 group-open:mb-3">
          📜 Cartographie complète · 10 cas parfaits par axe élémentaire
        </summary>
        <div className="space-y-2">
          {SIZHU_PERFECT.map((p) => (
            <SiZhuPointRow key={p.ganZhi} point={p} />
          ))}
        </div>
      </details>

      {/* Branches sans cas parfait */}
      <details className="group rounded-xl border border-neutral-200 bg-white/70 p-4">
        <summary className="cursor-pointer text-sm font-bold text-neutral-700 group-open:mb-3">
          ⊘ Branches sans point d&apos;ancrage fixe (2/12)
        </summary>
        <div className="space-y-2 text-xs text-neutral-700">
          {SIZHU_IMPOSSIBLE.map((b) => (
            <div
              key={b.branch}
              className="rounded-md border border-neutral-200 bg-neutral-50 p-3"
            >
              <p className="font-bold">
                {b.branch} {b.branchLabel} · {b.meridianCode} {b.meridian} ·{" "}
                {b.hourSlot}
              </p>
              <p className="mt-1 leading-relaxed">{b.reason}</p>
            </div>
          ))}
        </div>
      </details>

      {/* Légende tensions */}
      <div className="rounded-xl border border-violet-200 bg-white/50 p-3">
        <p className="text-[10px] font-bold uppercase tracking-wide text-violet-800">
          Légende · Tensions Ciel ↔ Terre
        </p>
        <div className="mt-2 grid grid-cols-2 gap-1 text-[11px] sm:grid-cols-5">
          {Object.entries(TENSION_TONE).map(([k, t]) => (
            <div key={k} className="flex items-center gap-1.5">
              <span className={`font-bold ${t.color}`}>{t.symbol}</span>
              <span className="text-neutral-700">{t.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SiZhuPointRow({ point: p }: { point: SiZhuPoint }) {
  const tone = AXIS_TONE[p.axis];
  const tens = TENSION_TONE[p.tension];
  const allDates = [...p.pastDates, ...p.futureDates];
  return (
    <details className={`group rounded-lg border ${tone.border} ${tone.bg} p-3`}>
      <summary className="cursor-pointer text-sm">
        <span className={`font-bold ${tone.text}`}>{p.ganZhi}</span>
        <span className="ml-1 text-[11px] text-neutral-600">
          {p.pinyin}
        </span>
        <span className="ml-2 text-[11px] font-semibold text-neutral-700">
          · {p.meridianCode} {p.meridian} · {p.hourSlot}
        </span>
        <span className={`ml-2 text-[10px] ${tens.color}`}>
          {tens.symbol}
        </span>
        <span className="ml-2 text-[11px] font-semibold text-neutral-600">
          {tone.label}
        </span>
      </summary>
      <div className="mt-2 space-y-2 text-xs leading-relaxed">
        <p className="font-semibold text-neutral-800">{p.tensionDescription}</p>
        <p className="text-neutral-700">{p.clinicalReading}</p>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-600">
            Dates documentées
          </p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {allDates.length === 0 ? (
              <span className="text-neutral-500 italic">aucune dans la fenêtre 1900–2100</span>
            ) : (
              allDates.map((d) => {
                const isPast = p.pastDates.includes(d);
                return (
                  <span
                    key={d}
                    className={`rounded px-2 py-0.5 font-mono text-[11px] ${
                      isPast
                        ? "bg-neutral-200 text-neutral-600"
                        : "bg-amber-200 font-bold text-amber-900"
                    }`}
                  >
                    {isPast ? "↩" : "→"} {formatDateFr(d)}
                  </span>
                );
              })
            )}
          </div>
        </div>
      </div>
    </details>
  );
}
