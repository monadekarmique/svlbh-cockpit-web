"use client";

// Kanban drag-and-drop natif HTML5 — DEC Patrick 2026-05-12.
// 3 colonnes : Backlog / Pre-sprint / Sprint. ST6 déplace les programmes.
// HTML5 DnD natif suffit (pas besoin de lib externe).

import { useState, useTransition } from "react";
import { setProgramPhase, addReferent, removeReferent } from "./actions";

type Phase = "BACKLOG" | "PRE_SPRINT" | "SPRINT";

export type Program = {
  code: string;
  label: string;
  phase: Phase;
  sort_order: number;
};

export type Referent = {
  svlbh_id: string;
  name: string;
  stx: string | null;
};

export type Praticienne = {
  svlbh_id: string;
  first_name: string | null;
  last_name: string | null;
  stx: string | null;
};

const PHASE_META: Record<Phase, { label: string; color: string; emoji: string }> = {
  BACKLOG: { label: "Backlog", color: "bg-neutral-100 border-neutral-300", emoji: "📦" },
  PRE_SPRINT: { label: "Pre-sprint", color: "bg-amber-50 border-amber-300", emoji: "🌱" },
  SPRINT: { label: "Sprint actif", color: "bg-emerald-50 border-emerald-300", emoji: "🚀" },
};

export function KanbanBoard({
  programs,
  referentsByTheme,
  praticiennes,
}: {
  programs: Program[];
  referentsByTheme: Record<string, Referent[]>;
  praticiennes: Praticienne[];
}) {
  const [items, setItems] = useState(programs);
  const [pending, startTransition] = useTransition();
  const [dragging, setDragging] = useState<string | null>(null);

  function moveTo(code: string, newPhase: Phase) {
    const cur = items.find((p) => p.code === code);
    if (!cur || cur.phase === newPhase) return;
    // optimistic
    setItems(items.map((p) => (p.code === code ? { ...p, phase: newPhase } : p)));
    startTransition(async () => {
      const fd = new FormData();
      fd.append("code", code);
      fd.append("phase", newPhase);
      try {
        await setProgramPhase(fd);
      } catch (e) {
        console.error(e);
        // revert
        setItems(items);
      }
    });
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {(["BACKLOG", "PRE_SPRINT", "SPRINT"] as const).map((phase) => {
        const meta = PHASE_META[phase];
        const cards = items
          .filter((p) => p.phase === phase)
          .sort((a, b) => a.sort_order - b.sort_order);
        return (
          <div
            key={phase}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const code = e.dataTransfer.getData("text/plain");
              if (code) moveTo(code, phase);
              setDragging(null);
            }}
            className={`min-h-[400px] rounded-xl border-2 border-dashed p-3 ${meta.color}`}
          >
            <header className="mb-3 flex items-baseline justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wide">
                {meta.emoji} {meta.label}
              </h2>
              <span className="text-xs text-neutral-500">
                {cards.length} programme{cards.length !== 1 ? "s" : ""}
              </span>
            </header>

            <div className="space-y-3">
              {cards.map((p) => (
                <ProgramCard
                  key={p.code}
                  program={p}
                  referents={referentsByTheme[p.code] ?? []}
                  praticiennes={praticiennes}
                  isDragging={dragging === p.code}
                  onDragStart={() => setDragging(p.code)}
                  onDragEnd={() => setDragging(null)}
                  disabled={pending}
                />
              ))}
              {cards.length === 0 && (
                <p className="rounded-lg border border-dashed border-neutral-300 bg-white/50 p-4 text-center text-xs italic text-neutral-500">
                  Glisser un programme ici
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ProgramCard({
  program,
  referents,
  praticiennes,
  isDragging,
  onDragStart,
  onDragEnd,
  disabled,
}: {
  program: Program;
  referents: Referent[];
  praticiennes: Praticienne[];
  isDragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  disabled: boolean;
}) {
  const assignedIds = new Set(referents.map((r) => r.svlbh_id));
  const available = praticiennes.filter((p) => !assignedIds.has(p.svlbh_id));

  return (
    <article
      draggable={!disabled}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", program.code);
        e.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      className={`space-y-2 rounded-lg border border-neutral-200 bg-white p-3 shadow-sm transition ${
        isDragging ? "opacity-40" : "hover:shadow-md"
      } cursor-grab active:cursor-grabbing`}
    >
      <header className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold">{program.label}</h3>
        <code className="font-mono text-[9px] text-neutral-400">{program.code}</code>
      </header>

      {referents.length > 0 ? (
        <ul className="space-y-1">
          {referents.map((r) => (
            <li
              key={r.svlbh_id}
              className="flex items-center justify-between rounded bg-violet-50 px-2 py-1"
            >
              <span className="text-xs">
                {r.name}{" "}
                {r.stx && (
                  <span className="font-mono text-[9px] text-neutral-500">· {r.stx}</span>
                )}
              </span>
              <form action={removeReferent}>
                <input type="hidden" name="theme" value={program.code} />
                <input type="hidden" name="svlbh_id" value={r.svlbh_id} />
                <button
                  type="submit"
                  className="text-[10px] text-red-600 hover:underline"
                >
                  Retirer
                </button>
              </form>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded bg-neutral-50 px-2 py-1 text-[11px] italic text-neutral-500">
          Aucune référente — seul ST6 voit les inscriptions
        </p>
      )}

      {available.length > 0 && (
        <form action={addReferent} className="flex items-center gap-1 pt-1">
          <input type="hidden" name="theme" value={program.code} />
          <select
            name="svlbh_id"
            required
            defaultValue=""
            className="h-7 flex-1 rounded border border-neutral-200 bg-white px-1 text-[10px]"
          >
            <option value="" disabled>
              + Ajouter référente…
            </option>
            {available.map((p) => (
              <option key={p.svlbh_id} value={p.svlbh_id}>
                {p.first_name} {p.last_name} ({p.stx ?? "—"})
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded bg-blue-600 px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-blue-700"
          >
            +
          </button>
        </form>
      )}
    </article>
  );
}
