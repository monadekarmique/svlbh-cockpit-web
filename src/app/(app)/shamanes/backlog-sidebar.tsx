"use client";

// Backlog Cercle SR — VUE de tri & priorisation des Soins en commun.
// Pas de saisie : les items s'empilent automatiquement depuis les soins
// en commun (relation OU énergie offensive ≥ 2 ST4+). Patrick drag&drop
// les cartes entre 3 buckets : Trois+ / Deux / Un.
// Repliée par défaut, déploie au clic sur le titre.
// DEC Patrick 2026-05-18.

import { useState, useEffect, useTransition } from "react";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  closestCorners,
  useDroppable,
  useDraggable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { setSoinSaturation, setDissipationMode } from "./saturation-action";
import type { SoinCommun } from "./soins-communs-list";

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
};

export function BacklogSidebar({ soins, saturationMap, dissipationMap, canEdit }: BacklogProps) {
  const [open, setOpen] = useState(false);
  // Map locale optimiste : key = `${kind}:${ref_id}` → bucket
  const initialMap = (): Record<string, Bucket> => {
    const m: Record<string, Bucket> = {};
    for (const s of soins) {
      const key = `${s.kind}:${s.ref_id}`;
      m[key] = saturationMap[key] ?? "un";
    }
    return m;
  };
  const [local, setLocal] = useState<Record<string, Bucket>>(initialMap);
  const [draggingKey, setDraggingKey] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Resync quand props changent (revalidatePath après save)
  const sig = soins.map((s) => `${s.kind}:${s.ref_id}:${saturationMap[`${s.kind}:${s.ref_id}`] ?? "un"}`).join("|");
  useEffect(() => {
    setLocal(initialMap());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor),
  );

  function onDragStart(e: DragStartEvent) {
    setDraggingKey(String(e.active.id));
  }

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setDraggingKey(null);
    if (!over || !canEdit) return;
    const key = String(active.id);
    const overId = String(over.id);
    let target: Bucket;
    if (overId.startsWith("bucket-")) {
      target = overId.replace("bucket-", "") as Bucket;
    } else {
      // drop sur une carte → prend son bucket
      const otherBucket = local[overId];
      if (!otherBucket) return;
      target = otherBucket;
    }
    if (!BUCKETS.some((b) => b.key === target)) return;
    const current = local[key];
    if (!current || current === target) return;

    const [kind, refId] = key.split(":", 2);
    setLocal((prev) => ({ ...prev, [key]: target }));

    const fd = new FormData();
    fd.append("ref_type", kind === "energie" ? "energie_offensive" : "relation");
    fd.append("ref_id", refId);
    fd.append("saturation_level", target);
    startTransition(() => {
      setSoinSaturation(fd).catch((err) => {
        console.error("[backlog-dnd] rollback", err);
        setLocal((prev) => ({ ...prev, [key]: current }));
      });
    });
  }

  const total = soins.length;
  const draggingSoin = draggingKey ? soins.find((s) => `${s.kind}:${s.ref_id}` === draggingKey) ?? null : null;
  void draggingSoin; // référence inutilisée mais préparée si on veut un DragOverlay

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

      {open ? (
        total === 0 ? (
          <p className="px-2 py-3 text-center text-xs italic text-neutral-500">
            Aucun cas de libération commune. Les soins partagés entre ≥ 2 ST4+ apparaissent ici automatiquement.
          </p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragEnd={onDragEnd}>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {BUCKETS.map((b) => {
                const items = soins.filter((s) => (local[`${s.kind}:${s.ref_id}`] ?? "un") === b.key);
                return (
                  <DropZone key={b.key} bucket={b}>
                    {items.length === 0 ? (
                      <p className="px-2 py-3 text-center text-[10px] italic text-neutral-500">
                        Glisse une carte ici.
                      </p>
                    ) : (
                      <ul className="space-y-1">
                        {items.map((s) => (
                          <DraggableSoin key={`${s.kind}:${s.ref_id}`} id={`${s.kind}:${s.ref_id}`} canMove={canEdit}>
                            <SoinMini item={s} dissipation={dissipationMap[`${s.kind}:${s.ref_id}`] ?? null} canEdit={canEdit} />
                          </DraggableSoin>
                        ))}
                      </ul>
                    )}
                  </DropZone>
                );
              })}
            </div>
          </DndContext>
        )
      ) : null}
    </section>
  );
}

function DropZone({
  bucket, children,
}: { bucket: { key: Bucket; label: string; emoji: string; color: string }; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: `bucket-${bucket.key}` });
  return (
    <div
      ref={setNodeRef}
      className="rounded-lg border-2 p-2 transition-colors"
      style={{
        borderColor: bucket.color,
        backgroundColor: isOver ? `${bucket.color}15` : "white",
      }}
    >
      <h3 className="mb-1 flex items-center gap-1 text-xs font-bold" style={{ color: bucket.color }}>
        {bucket.emoji} {bucket.label}
      </h3>
      {children}
    </div>
  );
}

function DraggableSoin({
  id, canMove, children,
}: { id: string; canMove: boolean; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({ id, disabled: !canMove });
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id });
  const setNodeRef = (el: HTMLLIElement | null) => { setDragRef(el); setDropRef(el); };
  return (
    <li
      ref={setNodeRef}
      {...(canMove ? attributes : {})}
      {...(canMove ? listeners : {})}
      className={
        (canMove ? "cursor-grab touch-none active:cursor-grabbing " : "") +
        (isDragging ? "opacity-30 " : "") +
        (isOver ? "ring-2 ring-blue-400 rounded " : "")
      }
    >
      {children}
    </li>
  );
}

function SoinMini({
  item, dissipation, canEdit,
}: { item: SoinCommun; dissipation: "massif" | "moyen" | "minimal" | null; canEdit: boolean }) {
  const refType = item.kind === "energie" ? "energie_offensive" : "relation";
  return (
    <div className="space-y-1 rounded border border-neutral-200 bg-white p-1.5 text-[11px] shadow-sm">
      <p className="font-semibold text-neutral-900 truncate">
        {item.kind === "energie" ? "⚡ " : "🪢 "}{item.title}
      </p>
      <p className="text-[9px] text-neutral-600">
        {item.contributors.length} ST4+ · {item.kind === "relation" ? (item.relation_state ?? "—") : `int. ${item.intensity ?? "?"}/100`}
      </p>
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
