"use client";

// Drag-and-drop des apprenantes entre les 3 sous-catégories. Owner ST6
// uniquement. Mutation optimiste avec rollback on error.
// DEC Patrick 2026-05-18.

import { useState, useTransition } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useDroppable,
  useDraggable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { setApprenanteTier } from "./apprenante-tier-action";
import { TIER_LABEL, TIER_COLOR } from "@/lib/cercle/shamanes";
import type { ParticipantTier } from "@/lib/cercle/shamanes";
import { lookupMembership, DHATU_META } from "@/lib/cercle/akashiques";
import type { AkashiqueMembership } from "@/lib/cercle/akashiques";

export type DnDApprenante = {
  name: string;
  tier: "formation" | "parcours-passif" | "cercle-akashique";
  emoji?: string;
  description?: string | null;
};

type ZoneKey = "formation" | "parcours-passif" | "cercle-akashique";

const ZONES: Array<{ key: ZoneKey; emoji: string; title: string }> = [
  { key: "formation", emoji: "🌱", title: "Apprenantes en formation" },
  { key: "parcours-passif", emoji: "💤", title: "Shamanes passives de Cercles akashiques actifs" },
  { key: "cercle-akashique", emoji: "🌌", title: "Shamanes du Cercle akashique ex-Shamanes passives" },
];

function CerclesAkashiquesChips({ membership }: { membership: AkashiqueMembership | null }) {
  if (!membership) return null;
  const all = [
    ...membership.membres.map((c) => ({ c, isFormation: false })),
    ...membership.formation.map((c) => ({ c, isFormation: true })),
  ];
  if (all.length === 0) return null;
  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {all.map(({ c, isFormation }) => {
        const primary = c.dhatus[0];
        const meta = DHATU_META[primary];
        return (
          <span
            key={c.name}
            className="inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[10px] font-medium"
            style={{
              borderColor: meta.color,
              color: meta.color,
              backgroundColor: isFormation ? "transparent" : `${meta.color}10`,
              opacity: isFormation ? 0.7 : 1,
              borderStyle: isFormation ? "dashed" : "solid",
            }}
          >
            {c.dhatus.map((d) => DHATU_META[d].emoji).join("")} {c.name}
          </span>
        );
      })}
    </div>
  );
}

export function ApprenantesDnD({ initial }: { initial: DnDApprenante[] }) {
  const [items, setItems] = useState<DnDApprenante[]>(initial);
  const [draggingName, setDraggingName] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor),
  );

  function onDragStart(e: DragStartEvent) {
    setDraggingName(String(e.active.id));
  }

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setDraggingName(null);
    if (!over) return;
    const name = String(active.id);
    const targetZone = String(over.id).replace("zone-", "") as ZoneKey;
    if (!ZONES.some((z) => z.key === targetZone)) return;
    const current = items.find((t) => t.name === name);
    if (!current || current.tier === targetZone) return;

    setItems((prev) => prev.map((t) => (t.name === name ? { ...t, tier: targetZone } : t)));

    const fd = new FormData();
    fd.append("name", name);
    fd.append("tier", targetZone);
    startTransition(() => {
      setApprenanteTier(fd).catch((err) => {
        console.error("[apprenantes-dnd] rollback", err);
        setItems((prev) => prev.map((t) => (t.name === name ? { ...t, tier: current.tier } : t)));
      });
    });
  }

  const dragging = draggingName ? items.find((t) => t.name === draggingName) : null;

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="space-y-5 pt-2">
        <p className="text-[10px] font-normal text-neutral-500">
          🔒 Vue Owner — non visible aux thérapeutes · Glisse les cartes
          entre les zones pour mettre à jour le parcours.
        </p>
        {ZONES.map((z) => {
          const c = TIER_COLOR[z.key as ParticipantTier];
          const inZone = items.filter((it) => it.tier === z.key);
          return (
            <DropZone key={z.key} id={`zone-${z.key}`} title={`${z.emoji} ${z.title} (${inZone.length})`} color={c}>
              {inZone.map((a) => (
                <DraggableCard key={a.name} name={a.name}>
                  <ApprenanteCardInner a={a} color={c} />
                </DraggableCard>
              ))}
            </DropZone>
          );
        })}
      </div>

      <DragOverlay>
        {dragging ? (
          <div className="opacity-90 shadow-2xl ring-2 ring-blue-400">
            <ApprenanteCardInner a={dragging} color={TIER_COLOR[dragging.tier as ParticipantTier]} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function DropZone({
  id, title, color, children,
}: { id: string; title: string; color: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const childArray = Array.isArray(children) ? children : [children];
  const empty = childArray.filter(Boolean).length === 0;
  return (
    <section className="space-y-2">
      <h2 className="text-base font-semibold" style={{ color }}>
        {title}
      </h2>
      <div
        ref={setNodeRef}
        className={
          "rounded-xl p-2 transition-colors " +
          (isOver ? "ring-2 ring-blue-400" : "")
        }
        style={isOver ? { backgroundColor: `${color}15` } : undefined}
      >
        {empty ? (
          <p className="px-2 py-4 text-center text-xs italic text-neutral-500">
            Glisse une apprenante ici.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">{children}</ul>
        )}
      </div>
    </section>
  );
}

function DraggableCard({ name, children }: { name: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: name });
  return (
    <li
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={
        "cursor-grab touch-none active:cursor-grabbing " +
        (isDragging ? "opacity-30 " : "")
      }
      title="Glisse pour changer de catégorie"
    >
      {children}
    </li>
  );
}

function ApprenanteCardInner({ a, color }: { a: DnDApprenante; color: string }) {
  const memb = lookupMembership(a.name);
  return (
    <div
      className="flex items-start gap-3 rounded-xl border bg-white p-4 shadow-sm"
      style={{ borderLeftColor: color, borderLeftWidth: 4 }}
    >
      <span className="text-2xl">{a.emoji ?? "·"}</span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-neutral-900">{a.name}</p>
        <p className="mt-0.5 text-[11px] font-semibold" style={{ color }}>
          {TIER_LABEL[a.tier as ParticipantTier]}
        </p>
        <CerclesAkashiquesChips membership={memb} />
        {a.description ? (
          <p className="mt-1.5 text-[10px] italic text-neutral-600">{a.description}</p>
        ) : null}
      </div>
    </div>
  );
}
