// Chakras V4 — 46 chakras détaillés par dimension + tracker Supabase.

import Link from "next/link";
import {
  ALL_DIMENSIONS,
  chakraKey,
  countTotal,
  type DimensionDetail,
  type ChakraInfo,
} from "@/lib/cercle/chakras-detail";
import { loadUserChakraStates } from "@/lib/cercle/chakra-state";
import { ChakraToggle } from "@/components/chakra-toggle";

export const dynamic = "force-dynamic";

export default async function ChakrasPage() {
  const cleanedKeys = await loadUserChakraStates();
  const total = countTotal();
  const cleanedCount = cleanedKeys.size;
  const pct = total > 0 ? Math.round((cleanedCount / total) * 100) : 0;

  // D99 restricted : à terme filtrer selon profile (Patrick + Cornelia uniquement).
  // Pour l'instant on affiche tout (cockpit déjà gated T4+/T3 whitelist).
  const visible = ALL_DIMENSIONS;

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
            ◈ Chakras / Dimensions hDOM
          </h1>
          <p className="mt-1 text-sm text-neutral-700">
            46 chakras répartis sur 11 dimensions (D22, D9-D1, D99 méta).
            Clique sur un chakra pour le marquer nettoyé/bloqué.
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-3xl font-extrabold tabular-nums text-emerald-700">
            {cleanedCount}/{total}
          </p>
          <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">
            Nettoyés · {pct}%
          </p>
        </div>
      </header>

      {/* Barre de progression globale */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200">
        <div
          className="h-full bg-emerald-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      {visible.map((dim) => (
        <DimensionAccordion
          key={dim.id}
          dim={dim}
          cleanedKeys={cleanedKeys}
        />
      ))}
    </div>
  );
}

function DimensionAccordion({
  dim,
  cleanedKeys,
}: {
  dim: DimensionDetail;
  cleanedKeys: Set<string>;
}) {
  const dimCleaned = dim.chakras.filter((c) =>
    cleanedKeys.has(chakraKey(dim.id, c)),
  ).length;
  const dimTotal = dim.chakras.length;
  const dimPct = dimTotal > 0 ? Math.round((dimCleaned / dimTotal) * 100) : 0;

  return (
    <details
      open={!dim.defaultCollapsed}
      className="rounded-xl border border-neutral-200 bg-white shadow-sm"
    >
      <summary className="cursor-pointer list-none p-4 hover:bg-neutral-50">
        <div className="flex items-baseline justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-base font-semibold text-blue-950">
              {dim.label}
              {dim.restricted ? (
                <span className="ml-2 text-[10px] font-bold uppercase text-amber-600">
                  🔒 Restricted
                </span>
              ) : null}
            </p>
            <p className="text-xs text-neutral-600">{dim.description}</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-sm font-bold text-emerald-700">
              {dimCleaned}/{dimTotal}
            </p>
            <p className="text-[10px] text-neutral-500">{dimPct}%</p>
          </div>
        </div>
      </summary>

      <ul className="space-y-2 border-t border-neutral-100 p-3">
        {dim.chakras.map((c, i) => {
          const key = chakraKey(dim.id, c);
          const cleaned = cleanedKeys.has(key);
          return (
            <li
              key={i}
              className={`rounded-lg border p-3 transition ${
                cleaned
                  ? "border-emerald-300 bg-emerald-50/40"
                  : "border-neutral-200 bg-neutral-50/40"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{c.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-neutral-900">
                    {c.num !== null ? `Chakra ${c.num} · ` : ""}
                    {c.nom}
                  </p>
                  {c.issues.length > 0 ? (
                    <ul className="mt-1 space-y-0.5">
                      {c.issues.map((issue, j) => (
                        <li
                          key={j}
                          className="flex items-center gap-2 text-xs text-neutral-700"
                        >
                          <span className="font-mono text-[10px] font-bold text-rose-700">
                            SLA {issue.sla}
                          </span>
                          <span>{issue.label}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {c.hasCIM && c.cimCodes.length > 0 ? (
                    <details className="mt-1.5">
                      <summary className="cursor-pointer text-[10px] font-bold uppercase text-blue-700">
                        CIM-10/11 ({c.cimCodes.length})
                      </summary>
                      <ul className="mt-1 space-y-0.5 pl-3">
                        {c.cimCodes.map((code, k) => (
                          <li
                            key={k}
                            className="flex items-baseline gap-2 text-[11px]"
                          >
                            <span className="font-mono font-bold text-blue-900">
                              {code.code}
                            </span>
                            <span className="text-neutral-700">{code.label}</span>
                          </li>
                        ))}
                      </ul>
                    </details>
                  ) : null}
                </div>
                <ChakraToggle chakraKey={key} initialCleaned={cleaned} />
              </div>
            </li>
          );
        })}
      </ul>
    </details>
  );
}
