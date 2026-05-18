"use client";

// Zones drag-and-drop Thérapeutes actives ↔ Thérapeutes cachées.
// Chaque ST4+ peut déplacer sa propre carte. Patrick (ST6) peut déplacer
// n'importe quelle carte. DEC Patrick 2026-05-18.
//
// Note : les server actions setTherapeuteDailyStatus revalident /shamanes
// après chaque drop. Mutation optimiste pour rendu instantané.

import { useState, useTransition, useEffect } from "react";
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
import { setTherapeuteDailyStatus } from "./daily-status-actions";

export type DnDTherapeute = {
  svlbh_id: string;
  first_name: string | null;
  last_name: string | null;
  code_praticien: number | null;
  stx: string | null;
  tx: string | null;
  capacity_anchor: string | null;
  cercle_lumiere_sr: boolean | null;
  status: "active" | "hidden" | "formation" | "parcours-passif" | "cercle-akashique";
  attention_color: string | null;
  attention_steps: number | null;
};

type ZoneKey = "active" | "hidden";

export function TherapeutesDnDZones({
  initial,
  mySvlbhId,
  isOwner,
  renderCard,
}: {
  initial: DnDTherapeute[];
  mySvlbhId?: string;
  isOwner: boolean;
  renderCard: (t: DnDTherapeute, ctx: { isMe: boolean; isDragging: boolean }) => React.ReactNode;
}) {
  const [items, setItems] = useState<DnDTherapeute[]>(initial);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Resync local state with server props after revalidatePath
  // (form actions update DB + revalidate but client state would stay stale).
  // Compare by signature (svlbh_id + status) to avoid resyncing on identical re-renders.
  const initialSig = initial.map((t) => `${t.svlbh_id}:${t.status}`).join("|");
  useEffect(() => {
    setItems(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSig]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor),
  );

  const canMove = (svlbhId: string) => isOwner || svlbhId === mySvlbhId;

  function onDragStart(e: DragStartEvent) {
    setDraggingId(String(e.active.id));
  }

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setDraggingId(null);
    if (!over) return;
    const id = String(active.id);
    const target = (String(over.id) === "zone-hidden" ? "hidden" : "active") as ZoneKey;
    const current = items.find((t) => t.svlbh_id === id);
    if (!current || current.status === target) return;
    if (!canMove(id)) return;

    // Optimistic update
    setItems((prev) => prev.map((t) => (t.svlbh_id === id ? { ...t, status: target } : t)));

    const fd = new FormData();
    fd.append("target_svlbh_id", id);
    fd.append("status", target);
    startTransition(() => {
      setTherapeuteDailyStatus(fd).catch((err) => {
        console.error("[dnd] rollback", err);
        // Rollback
        setItems((prev) => prev.map((t) => (t.svlbh_id === id ? { ...t, status: current.status } : t)));
      });
    });
  }

  const actives = items.filter((t) => t.status === "active");
  const hidden = items.filter((t) => t.status === "hidden");
  const draggingItem = draggingId ? items.find((t) => t.svlbh_id === draggingId) : null;

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <DropZone
        id="zone-active"
        title={`✨ Thérapeutes actives (${actives.length})`}
        emptyHint="Aucune active aujourd'hui."
      >
        {actives.map((t) => (
          <DraggableCard
            key={t.svlbh_id}
            id={t.svlbh_id}
            canMove={canMove(t.svlbh_id)}
          >
            {renderCard(t, { isMe: t.svlbh_id === mySvlbhId, isDragging: false })}
          </DraggableCard>
        ))}
      </DropZone>

      <DropZone
        id="zone-hidden"
        title={`🌙 Thérapeutes cachées (${hidden.length})`}
        emptyHint="Aucune cachée aujourd'hui. Glisse une carte ici pour te cacher."
      >
        {hidden.map((t) => (
          <DraggableCard
            key={t.svlbh_id}
            id={t.svlbh_id}
            canMove={canMove(t.svlbh_id)}
          >
            {renderCard(t, { isMe: t.svlbh_id === mySvlbhId, isDragging: false })}
          </DraggableCard>
        ))}
      </DropZone>

      <DragOverlay>
        {draggingItem ? (
          <div className="opacity-90 shadow-2xl ring-2 ring-blue-400">
            {renderCard(draggingItem, { isMe: draggingItem.svlbh_id === mySvlbhId, isDragging: true })}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function DropZone({
  id, title, emptyHint, children,
}: {
  id: string;
  title: string;
  emptyHint: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const childArray = Array.isArray(children) ? children : [children];
  const empty = childArray.filter(Boolean).length === 0;
  return (
    <section className="space-y-2">
      <h2 className="text-base font-semibold text-blue-900">{title}</h2>
      <div
        ref={setNodeRef}
        className={
          "rounded-xl p-2 transition-colors " +
          (isOver ? "bg-blue-100 ring-2 ring-blue-400" : "bg-transparent")
        }
      >
        {empty ? (
          <p className="px-2 py-4 text-center text-xs italic text-neutral-500">{emptyHint}</p>
        ) : (
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">{children}</ul>
        )}
      </div>
    </section>
  );
}

function DraggableCard({
  id, canMove, children,
}: {
  id: string;
  canMove: boolean;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    disabled: !canMove,
  });
  return (
    <li
      ref={setNodeRef}
      {...(canMove ? attributes : {})}
      {...(canMove ? listeners : {})}
      className={
        (canMove ? "cursor-grab touch-none active:cursor-grabbing " : "") +
        (isDragging ? "opacity-30 " : "")
      }
      title={canMove ? "Glisse pour changer de zone" : "Drag réservé à toi ou à l'Owner"}
    >
      {children}
    </li>
  );
}
