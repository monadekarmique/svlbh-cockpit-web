// Shamanes du Cercle — liste avec badges count (sessions pending).

import Link from "next/link";
import { fetchShamanesPending } from "@/lib/cercle/shamanes";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ShamanesPage() {
  const badges = await fetchShamanesPending();
  const totalPending = badges.reduce((s, b) => s + b.count, 0);

  return (
    <div className="space-y-5">
      <Link
        href="/dashboard"
        className="text-sm text-neutral-500 hover:text-neutral-900"
      >
        ← Cockpit
      </Link>

      <header className="flex items-baseline justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-blue-950">
            👥 Shamanes du Cercle
          </h1>
          <p className="mt-1 text-sm text-neutral-700">
            Les 8 codes praticien·nes du Cercle de Lumière. Le badge indique
            le nombre de sessions reçues en attente de relai.
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-3xl font-extrabold text-blue-900 tabular-nums">
            {totalPending}
          </p>
          <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">
            En attente
          </p>
        </div>
      </header>

      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {badges.map((s) => (
          <li
            key={s.code}
            className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="text-2xl">{s.emoji}</span>
              <div className="min-w-0">
                <p className="font-semibold text-neutral-900">{s.name}</p>
                <p className="font-mono text-[11px] text-neutral-500">
                  Code {s.code}
                </p>
              </div>
            </div>
            {s.count > 0 ? (
              <span
                className="inline-flex h-8 min-w-[32px] items-center justify-center rounded-full bg-rose-500 px-2 text-sm font-extrabold text-white shadow-sm"
                title={`${s.count} en attente`}
              >
                {s.count}
              </span>
            ) : (
              <span className="text-[10px] text-neutral-400">—</span>
            )}
          </li>
        ))}
      </ul>

      <p className="text-center text-[10px] text-neutral-400">
        Source : webhook Make.com SHAMANES-PENDING · pull en temps réel à
        chaque visite
      </p>
    </div>
  );
}
