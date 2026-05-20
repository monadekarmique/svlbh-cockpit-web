// Section "Concept explicatif Si Zhu + dates de libération efficaces"
// — affichée en tête de /demandes, au-dessus du module billing.
// Doctrine validée Patrick 2026-05-09.

"use client";

import { useMemo } from "react";
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

// Hiérarchie N1/N2/N3 — Patrick 2026-05-20.
// Les dates absentes de HIERARCHY sont rattachées en N2 sous "2035-03-07".
// 6061-07-18 et 7125-09-07 viennent de la perception canal 300% — hors lib SI ZHU.
type SizhuUp = { point: SiZhuPoint; date: string; daysUntil: number };
type SizhuHierNode = {
  dateISO: string;
  level: 1 | 2 | 3;
  up?: SizhuUp;
  children: SizhuHierNode[];
};

const LEVEL_TONE: Record<1 | 2 | 3, { label: string; pill: string; ring: string }> = {
  1: { label: "N1", pill: "bg-amber-200 text-amber-900", ring: "ring-amber-400" },
  2: { label: "N2", pill: "bg-sky-100 text-sky-900", ring: "ring-sky-300" },
  3: { label: "N3", pill: "bg-violet-100 text-violet-900", ring: "ring-violet-300" },
};

function SiZhuTreeNodeView({ node }: { node: SizhuHierNode }) {
  const lvl = LEVEL_TONE[node.level];
  const { up } = node;
  const hasChildren = node.children.length > 0;

  if (up) {
    const tone = AXIS_TONE[up.point.axis];
    const tens = TENSION_TONE[up.point.tension];
    const yrs = Math.floor(up.daysUntil / 365);
    return (
      <li>
        <details
          open
          className={`group rounded-lg border-2 ${tone.border} ${tone.bg} ring-1 ${lvl.ring} transition`}
        >
          <summary className="flex cursor-pointer flex-wrap items-baseline gap-x-3 gap-y-1 p-3 hover:brightness-95">
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${lvl.pill}`}>
              {lvl.label}
            </span>
            <span className={`font-bold ${tone.text}`}>{up.point.ganZhi}</span>
            <span className="font-mono text-sm font-bold text-neutral-800">
              {formatDateFr(up.date)}
            </span>
            <span className="text-[11px] font-medium text-neutral-700">
              {up.point.hourSlot} · {up.point.meridianCode} {up.point.meridian}
            </span>
            <span className={`text-[10px] font-semibold ${tens.color}`}>
              {tens.symbol} {tens.label.split(" ")[0]}
            </span>
            <span className="ml-auto text-[10px] font-semibold text-neutral-600">
              {tone.label} · dans{" "}
              {yrs > 0 ? `${yrs} an${yrs > 1 ? "s" : ""}` : `${up.daysUntil} j`}
            </span>
          </summary>
          <div className="space-y-2 border-t border-amber-200 bg-white/40 px-3 py-3 text-xs leading-relaxed">
            <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-600">
              {up.point.pinyin} · tension {tens.label}
            </p>
            <p className="font-semibold text-neutral-800">{up.point.tensionDescription}</p>
            <p className="text-neutral-700">{up.point.clinicalReading}</p>
          </div>
          {hasChildren && (
            <ul className="space-y-2 border-t border-amber-200 bg-white/30 p-3">
              {node.children.map((c) => (
                <SiZhuTreeNodeView key={c.dateISO} node={c} />
              ))}
            </ul>
          )}
        </details>
      </li>
    );
  }

  // Entrée minimale "canal 300%" pour les dates hors lib SI ZHU
  return (
    <li>
      <details open className={`group rounded-lg border-2 border-violet-200 bg-violet-50 ring-1 ${lvl.ring}`}>
        <summary className="flex cursor-pointer flex-wrap items-baseline gap-x-3 gap-y-1 p-3 hover:brightness-95">
          <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${lvl.pill}`}>
            {lvl.label}
          </span>
          <span className="font-mono text-sm font-bold text-neutral-800">
            {formatDateFr(node.dateISO)}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-violet-700">
            ✦ canal 300% · hors lib Si Zhu
          </span>
        </summary>
        {hasChildren && (
          <ul className="space-y-2 border-t border-violet-200 bg-white/30 p-3">
            {node.children.map((c) => (
              <SiZhuTreeNodeView key={c.dateISO} node={c} />
            ))}
          </ul>
        )}
      </details>
    </li>
  );
}

export function SiZhuValidationSection() {
  // limit=30 pour capturer les fenêtres lointaines hébraïques (2300, 2387).
  const upcoming = useMemo(() => upcomingReleaseDates(new Date(), 30), []);

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

      {/* Prochaines fenêtres efficaces — accordéon hiérarchique (DEC Patrick 2026-05-20).
          Hiérarchie N1 / N2 / N3 définie par HIERARCHY ci-dessous. Dates hors
          lib SI ZHU (perception canal 300% — 6061, 7125) affichées en entrée
          minimale. Default state : tout ouvert. */}
      {(() => {
        // Hiérarchie statique (Patrick 2026-05-20)
        // - 2300-07-18 = année hébraïque 6061 (Estomac 庚辰, 6·60 ans après 1940-05-01)
        // - 2387-09-15 = année hébraïque 6147 (Intestin Grêle 丁未, 5·60 ans après 2087-08-05)
        // - 7125 hébraïque abandonné (pas de cas parfait dans la lib).
        const HIERARCHY: Record<string, { level: 1 | 2 | 3; parent?: string }> = {
          "2038-07-04": { level: 1 },
          "2035-03-07": { level: 1 },
          "2049-05-18": { level: 2, parent: "2038-07-04" },
          "2300-07-18": { level: 2, parent: "2038-07-04" },
          "2054-10-24": { level: 3, parent: "2049-05-18" },
          "2387-09-15": { level: 3, parent: "2087-08-05" },
        };

        const byDate = new Map(upcoming.map((u) => [u.date, u]));
        const allDates = new Set<string>([...byDate.keys(), ...Object.keys(HIERARCHY)]);
        const nodes = new Map<string, SizhuHierNode>();
        for (const d of allDates) {
          const h = HIERARCHY[d];
          const level: 1 | 2 | 3 = h?.level ?? 2; // hors HIERARCHY → N2 sous 2035-03-07
          nodes.set(d, { dateISO: d, level, up: byDate.get(d), children: [] });
        }
        const roots: SizhuHierNode[] = [];
        for (const [d, n] of nodes) {
          // HIERARCHY déclarée → utilise parent explicite (ou root si pas de parent).
          // Sinon → rattaché en N2 sous "2035-03-07".
          const parentISO = HIERARCHY[d]?.parent ?? (HIERARCHY[d] ? undefined : "2035-03-07");
          if (parentISO && parentISO !== d && nodes.has(parentISO)) {
            nodes.get(parentISO)!.children.push(n);
          } else {
            roots.push(n);
          }
        }
        const cmp = (a: SizhuHierNode, b: SizhuHierNode) =>
          a.dateISO.localeCompare(b.dateISO);
        const sortRec = (n: SizhuHierNode) => {
          n.children.sort(cmp);
          n.children.forEach(sortRec);
        };
        roots.sort(cmp);
        roots.forEach(sortRec);

        return (
          <details open className="group rounded-xl border-2 border-amber-300 bg-amber-50 p-4">
            <summary className="cursor-pointer text-[10px] font-bold uppercase tracking-[0.18em] text-amber-800">
              ⏳ Prochaines fenêtres efficaces — vrai temps solaire local (hiérarchie 3 niveaux)
            </summary>
            <ul className="mt-3 space-y-2">
              {roots.map((n) => (
                <SiZhuTreeNodeView key={n.dateISO} node={n} />
              ))}
            </ul>
          </details>
        );
      })()}

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
