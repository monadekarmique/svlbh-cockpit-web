// Chrono Fu — 6 Organes Fu MTC selon Zi Wu Liu Zhu (子午流注).
// Affiche horloge avec organe actif maintenant + cartes des 6 organes.

import Link from "next/link";
import { FU_ORGANS, activeOrganNow } from "@/lib/cercle/chrono-fu";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function formatNow(): string {
  return new Date().toLocaleTimeString("fr-CH", {
    timeZone: "Europe/Zurich",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ChronoFuPage() {
  // Note : le rendu Server Component utilise l'heure du serveur Render Frankfurt.
  // L'organe actif est calculé à la volée à chaque visite (revalidate=0).
  const now = new Date();
  const active = activeOrganNow(now);
  const nowLabel = formatNow();

  // Tri par startHour pour l'affichage chronologique
  const sorted = [...FU_ORGANS].sort((a, b) => {
    // GB démarre à 23h mais visuellement on le met en premier (cycle nuit→jour)
    const norm = (h: number) => (h === 23 ? -1 : h);
    return norm(a.startHour) - norm(b.startHour);
  });

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
          ⏰ Chrono Fu (子午流注)
        </h1>
        <p className="mt-1 text-sm text-neutral-700">
          6 Organes Fu en MTC — chrono-acupressure karmique selon les fenêtres
          horaires Zi Wu Liu Zhu.
        </p>
      </header>

      {/* Bandeau organe actif maintenant */}
      <section
        className="rounded-2xl border-2 p-5 shadow-md"
        style={{
          borderColor: active?.color ?? "#9CA3AF",
          backgroundColor: active?.bg ?? "#F3F4F6",
        }}
      >
        <p className="text-xs font-bold uppercase tracking-wide text-neutral-600">
          Maintenant · {nowLabel} (Zurich)
        </p>
        {active ? (
          <>
            <p
              className="mt-2 text-3xl font-bold"
              style={{ color: active.tx }}
            >
              {active.zh} {active.name}
            </p>
            <p
              className="text-sm font-semibold"
              style={{ color: active.color }}
            >
              {active.pinyin} · {active.element} · {active.label}
            </p>
            <p
              className="mt-1 text-xs"
              style={{ color: active.tx }}
            >
              Chromothérapie : {active.chromoName}
            </p>
          </>
        ) : (
          <p className="mt-2 text-base font-semibold text-neutral-700">
            Fenêtre creuse — aucun Fu actif (les Zang Yin sont actifs)
          </p>
        )}
      </section>

      {/* 6 organes Fu */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((o) => {
          const isActiveNow = active?.id === o.id;
          return (
            <article
              key={o.id}
              className={`rounded-2xl border p-4 shadow-sm transition ${
                isActiveNow ? "ring-4 shadow-lg" : ""
              }`}
              style={{
                borderColor: o.color,
                backgroundColor: o.bg,
                ringColor: isActiveNow ? `${o.color}66` : undefined,
              }}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span
                  className="text-2xl font-bold"
                  style={{ color: o.tx }}
                >
                  {o.zh}
                </span>
                <span className="font-mono text-[11px] font-bold" style={{ color: o.color }}>
                  {o.label}
                </span>
              </div>
              <h2
                className="mt-1 text-base font-semibold"
                style={{ color: o.tx }}
              >
                {o.name}
              </h2>
              <p className="text-xs font-semibold" style={{ color: o.color }}>
                {o.pinyin} · {o.element}
              </p>
              <p className="mt-1 text-[11px] italic" style={{ color: o.tx }}>
                Chromo : {o.chromoName}
              </p>

              <div className="mt-3 space-y-1.5 border-t border-neutral-300/40 pt-2">
                <p className="text-[10px] font-bold uppercase" style={{ color: o.color }}>
                  Points clés
                </p>
                {o.points.map((p) => (
                  <div key={p.code} className="text-xs">
                    <span
                      className="font-mono font-bold"
                      style={{ color: o.tx }}
                    >
                      {p.code}
                    </span>{" "}
                    <span className="font-semibold text-neutral-800">
                      {p.name}
                    </span>
                    <p className="text-[10px] text-neutral-700">{p.action}</p>
                  </div>
                ))}
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
