// Chakras / Dimensions hDOM — V2 référence des 10 dimensions.

import Link from "next/link";
import { DIMENSIONS } from "@/lib/cercle/dimensions";

export const dynamic = "force-static";

export default function ChakrasPage() {
  // Toutes les dimensions sauf restricted (D0 Patrick+Cornelia uniquement) en V2
  const visible = DIMENSIONS.filter((d) => !d.restricted);

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
          ◈ Chakras / Dimensions hDOM
        </h1>
        <p className="mt-1 text-sm text-neutral-700">
          Système hyper-Dimensionnel Optimisé Multidimensionnel —{" "}
          {visible.length} dimensions visibles. 46 chakras au total répartis,
          du corps physique D1 au système Bash D22.
        </p>
      </header>

      <ul className="space-y-2">
        {visible.map((d) => (
          <li
            key={d.id}
            className="flex items-baseline gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm"
          >
            <span className="font-mono text-base font-extrabold text-blue-900">
              D{d.num}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-neutral-900">{d.label}</p>
              <p className="mt-0.5 text-sm text-neutral-600">
                {d.description}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <p className="font-semibold">⏳ V2 — référence des dimensions</p>
        <p className="mt-1 text-xs">
          V3 ajoutera : détail des 46 chakras par dimension (icônes, nom EN,
          codes CIM-10/11, issues), tracker « clean / blocked » par chakra
          avec persistance Supabase, accès D0 conditionnel pour Patrick et
          Cornelia.
        </p>
      </section>
    </div>
  );
}
