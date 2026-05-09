// 8 Pierres d'enseignement SVLBH.

import Link from "next/link";
import { PIERRES } from "@/lib/cercle/pierres";

export const dynamic = "force-static";

export default function PierresPage() {
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
          💎 Pierres d'enseignement
        </h1>
        <p className="mt-1 text-sm text-neutral-700">
          Les 8 pierres de protection SVLBH — fiches complètes (formule,
          signature vibratoire, contexte, usage en session).
        </p>
      </header>

      <ul className="space-y-3">
        {PIERRES.map((p) => (
          <li key={p.id}>
            <Link
              href={`/pierres/${p.id}`}
              className="block rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:border-blue-300 hover:shadow-md"
            >
              <div className="flex items-baseline gap-3">
                <span className="text-2xl text-blue-900">{p.symbole}</span>
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold text-neutral-900">{p.nom}</h2>
                  <p className="font-mono text-[11px] text-neutral-500">
                    {p.formule}
                  </p>
                </div>
              </div>
              <p className="mt-2 text-sm italic text-neutral-700">
                {p.signature}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {p.absorbe.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-900"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
