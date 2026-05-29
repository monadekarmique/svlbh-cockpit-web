"use client";

// Backlog Cercle SR — VUE de tri & priorisation des Soins en commun.
// Les items s'empilent dans 3 buckets (Trois+ / Deux / Un) selon
// saturationMap calculé côté server. DEC Patrick 2026-05-29 : DnD retiré
// (rendait le survol mobile impraticable). Pour reclasser un item,
// utiliser le menu de saturation sous chaque carte.
// DEC Patrick 2026-05-18 (legacy).

import { useState } from "react";
import { setSoinSaturation, setDissipationMode } from "./saturation-action";
import type { SoinCommun } from "./soins-communs-list";
import { BacklogCountersList, type BacklogCounter } from "./backlog-counters";

const DISSIPATION_MODES: Array<{ key: "massif" | "moyen" | "minimal"; n: 3 | 2 | 1; label: string; color: string }> = [
  { key: "massif",  n: 3, label: "Massif",  color: "#dc2626" },
  { key: "moyen",   n: 2, label: "Moyen",   color: "#ea580c" },
  { key: "minimal", n: 1, label: "Minimal", color: "#ca8a04" },
];

type Bucket = "trois_plus" | "deux" | "un";

const BUCKETS: Array<{ key: Bucket; label: string; emoji: string; color: string }> = [
  { key: "trois_plus", label: "Trois +", emoji: "🔥", color: "#dc2626" },
  { key: "deux",       label: "Deux",    emoji: "🟧", color: "#ea580c" },
  { key: "un",         label: "Un",      emoji: "🟨", color: "#ca8a04" },
];

export type BacklogProps = {
  soins: SoinCommun[];                      // Liste des soins en commun (relation + energie)
  saturationMap: Record<string, Bucket>;    // key = `${kind}:${ref_id}` → bucket
  dissipationMap: Record<string, "massif" | "moyen" | "minimal" | null>;
  canEdit: boolean;
  counters?: BacklogCounter[];              // Compteurs collaboratifs (Esprits désincarnés, Champignons, …)
};

export function BacklogSidebar({ soins, saturationMap, dissipationMap, canEdit, counters = [] }: BacklogProps) {
  const [open, setOpen] = useState(false);
  const total = soins.length;

  return (
    <section className="space-y-2 rounded-xl border border-amber-200 bg-amber-50/40 p-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 text-left"
        title={open ? "Replier" : "Déplier"}
      >
        <span className="text-base font-semibold text-amber-900">
          {open ? "▾" : "▸"} 📋 <span className="underline">Backlog</span> Cercle SR ({total})
        </span>
        <span className="text-[10px] italic text-neutral-600">
          {open ? "tri par saturation" : "clic pour ouvrir"}
        </span>
      </button>

      {/* Compteurs collaboratifs (Esprits désincarnés, Champignons, …) —
          toujours visibles, indépendants du collapse. DEC Patrick 2026-05-29. */}
      {counters.length > 0 ? (
        <BacklogCountersList counters={counters} canWrite={canEdit} />
      ) : null}

      {open ? (
        total === 0 ? (
          <p className="px-2 py-3 text-center text-xs italic text-neutral-500">
            Aucun cas de libération commune. Les soins partagés entre ≥ 2 ST4+ apparaissent ici automatiquement.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {BUCKETS.map((b) => {
              const items = soins.filter(
                (s) => (saturationMap[`${s.kind}:${s.ref_id}`] ?? "un") === b.key,
              );
              return (
                <div
                  key={b.key}
                  className="rounded-lg border-2 p-2"
                  style={{ borderColor: b.color, backgroundColor: "white" }}
                >
                  <h3 className="mb-1 flex items-center gap-1 text-xs font-bold" style={{ color: b.color }}>
                    {b.emoji} {b.label}
                  </h3>
                  {items.length === 0 ? (
                    <p className="px-2 py-3 text-center text-[10px] italic text-neutral-500">
                      Aucun item.
                    </p>
                  ) : (
                    <ul className="space-y-1">
                      {items.map((s) => (
                        <li key={`${s.kind}:${s.ref_id}`}>
                          <SoinMini
                            item={s}
                            currentBucket={b.key}
                            dissipation={dissipationMap[`${s.kind}:${s.ref_id}`] ?? null}
                            canEdit={canEdit}
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )
      ) : null}
    </section>
  );
}

function SoinMini({
  item, currentBucket, dissipation, canEdit,
}: { item: SoinCommun; currentBucket: Bucket; dissipation: "massif" | "moyen" | "minimal" | null; canEdit: boolean }) {
  const refType = item.kind === "energie" ? "energie_offensive" : "relation";
  return (
    <div className="space-y-1 rounded border border-neutral-200 bg-white p-1.5 text-[11px] shadow-sm">
      <p className="font-semibold text-neutral-900 truncate">
        {item.kind === "energie" ? "⚡ " : "🪢 "}{item.title}
      </p>
      <p className="text-[9px] text-neutral-600">
        {item.contributors.length} ST4+ · {item.kind === "relation" ? (item.relation_state ?? "—") : `int. ${item.intensity ?? "?"}/100`}
      </p>
      {/* Pickers de saturation (3 boutons Trois+/Deux/Un) — remplacement
          du DnD. Le bouton du bucket courant est plein. Owner only. */}
      {canEdit ? (
        <div
          className="flex items-center gap-0.5 pt-0.5"
          title="Niveau de saturation observé sur cette manifestation."
        >
          <span className="mr-0.5 text-[9px] text-neutral-500">Sat.</span>
          {BUCKETS.map((b) => {
            const isActive = b.key === currentBucket;
            return (
              <form key={b.key} action={setSoinSaturation} className="inline-flex">
                <input type="hidden" name="ref_type" value={refType} />
                <input type="hidden" name="ref_id" value={item.ref_id} />
                <input type="hidden" name="saturation_level" value={b.key} />
                <button
                  type="submit"
                  className="h-5 rounded border px-1 text-[9px] font-bold transition"
                  style={{
                    borderColor: b.color,
                    backgroundColor: isActive ? b.color : "white",
                    color: isActive ? "white" : b.color,
                  }}
                  title={`Reclasser en « ${b.label} »`}
                >
                  {b.emoji}
                </button>
              </form>
            );
          })}
        </div>
      ) : null}
      {canEdit ? (
        <div
          className="flex items-center gap-0.5 pt-0.5"
          onPointerDown={(e) => e.stopPropagation()}
          title="Mode de dissipation observable (3 massif / 2 moyen / 1 minimal). Clic sur le mode actif pour effacer."
        >
          <span className="mr-0.5 text-[9px] text-neutral-500">Dissip.</span>
          {DISSIPATION_MODES.map((m) => {
            const isActive = dissipation === m.key;
            return (
              <form key={m.key} action={setDissipationMode} className="inline-flex">
                <input type="hidden" name="ref_type" value={refType} />
                <input type="hidden" name="ref_id" value={item.ref_id} />
                <input type="hidden" name="dissipation_mode" value={isActive ? "" : m.key} />
                <button
                  type="submit"
                  onPointerDown={(e) => e.stopPropagation()}
                  className="h-5 w-5 rounded-full border text-[10px] font-bold transition"
                  style={{
                    borderColor: m.color,
                    backgroundColor: isActive ? m.color : "white",
                    color: isActive ? "white" : m.color,
                  }}
                  title={`${m.n} · ${m.label}${isActive ? " (clic pour effacer)" : ""}`}
                >
                  {m.n}
                </button>
              </form>
            );
          })}
        </div>
      ) : dissipation ? (
        <span
          className="inline-block rounded-full px-1.5 py-0.5 text-[9px] font-bold text-white"
          style={{ backgroundColor: DISSIPATION_MODES.find((m) => m.key === dissipation)!.color }}
        >
          Dissip. {DISSIPATION_MODES.find((m) => m.key === dissipation)!.n} · {DISSIPATION_MODES.find((m) => m.key === dissipation)!.label}
        </span>
      ) : null}
    </div>
  );
}
