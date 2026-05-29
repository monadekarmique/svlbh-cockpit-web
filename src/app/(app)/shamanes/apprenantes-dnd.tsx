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
  closestCorners,
  useDroppable,
  useDraggable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { setApprenanteTier } from "./apprenante-tier-action";
import { TIER_LABEL, TIER_COLOR } from "@/lib/cercle/shamanes";
import type { ParticipantTier } from "@/lib/cercle/shamanes";
import { lookupMembership } from "@/lib/cercle/akashiques";
import type { AkashiqueMembership, Dhatu, DhatuMeta } from "@/lib/cercle/akashiques";
import type { DesaAtom } from "@/lib/cercle/desa";
import { DesaEditModal } from "./desa-edit-modal";

export type DnDApprenante = {
  name: string;
  /** UUIDv5 déterministe (cf. apprenanteSvlbhId) — clé pour les
   *  attributions DESA. Pas un vrai svlbh_id en DB. */
  svlbh_id: string;
  tier: "formation" | "parcours-passif" | "cercle-akashique";
  emoji?: string;
  description?: string | null;
  niveaux_bloques?: number | null;
  /** Champ legacy — conservé pour compatibilité, plus utilisé pour l'affichage. */
  desa_active?: boolean;
  /** Codes DESA accordés (capacité détenue). */
  desa_granted?: string[];
  /** Codes DESA marqués karmiques à libérer — affichés en rouge à gauche du
   *  sigle DESA sur le devant de la carte. DEC Patrick 2026-05-29. */
  desa_karmic?: string[];
};

type ZoneKey = "formation" | "parcours-passif" | "cercle-akashique";

const ZONES: Array<{ key: ZoneKey; emoji: string; title: string }> = [
  { key: "formation", emoji: "🌱", title: "Apprenantes en formation" },
  { key: "parcours-passif", emoji: "💤", title: "Shamanes passives de Cercles akashiques actifs" },
  { key: "cercle-akashique", emoji: "🌌", title: "Shamanes du Cercle akashique ex-Shamanes passives" },
];

function CerclesAkashiquesChips({
  membership,
  dhatuMeta,
}: {
  membership: AkashiqueMembership | null;
  dhatuMeta: Record<Dhatu, DhatuMeta>;
}) {
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
        const meta = dhatuMeta[primary];
        if (!meta) return null;
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
            {c.dhatus.map((d) => dhatuMeta[d]?.emoji ?? "").join("")} {c.name}
          </span>
        );
      })}
    </div>
  );
}

export function ApprenantesDnD({
  initial,
  dhatuMeta,
  desaCatalog,
}: {
  initial: DnDApprenante[];
  dhatuMeta: Record<Dhatu, DhatuMeta>;
  desaCatalog: Record<string, DesaAtom>;
}) {
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
    const overId = String(over.id);

    // Résolution : drop sur background zone OU sur une carte voisine
    // (auquel cas on prend la zone de cette carte).
    let targetZone: ZoneKey;
    if (overId.startsWith("zone-")) {
      const z = overId.replace("zone-", "") as ZoneKey;
      if (!ZONES.some((zone) => zone.key === z)) return;
      targetZone = z;
    } else {
      const overCard = items.find((t) => t.name === overId);
      if (!overCard) return;
      targetZone = overCard.tier as ZoneKey;
    }

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
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragEnd={onDragEnd}>
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
                  <ApprenanteCardInner a={a} color={c} dhatuMeta={dhatuMeta} desaCatalog={desaCatalog} />
                </DraggableCard>
              ))}
            </DropZone>
          );
        })}
      </div>

      <DragOverlay>
        {dragging ? (
          <div className="opacity-90 shadow-2xl ring-2 ring-blue-400">
            <ApprenanteCardInner a={dragging} color={TIER_COLOR[dragging.tier as ParticipantTier]} dhatuMeta={dhatuMeta} desaCatalog={desaCatalog} />
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
  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({ id: name });
  // Carte aussi droppable → drop sur le bord d'une autre carte vise la zone
  // de cette carte voisine. Match l'attente Patrick : « toucher le bord =
  // prendre sa place ».
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: name });
  const setNodeRef = (el: HTMLLIElement | null) => { setDragRef(el); setDropRef(el); };
  return (
    <li
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={
        "cursor-grab touch-none active:cursor-grabbing " +
        (isDragging ? "opacity-30 " : "") +
        (isOver ? "ring-2 ring-blue-400 rounded-xl " : "")
      }
      title="Glisse pour changer de catégorie"
    >
      {children}
    </li>
  );
}

function ApprenanteCardInner({
  a,
  color,
  dhatuMeta,
  desaCatalog,
}: {
  a: DnDApprenante;
  color: string;
  dhatuMeta: Record<Dhatu, DhatuMeta>;
  desaCatalog: Record<string, DesaAtom>;
}) {
  const memb = lookupMembership(a.name);
  const [desaOpen, setDesaOpen] = useState(false);
  return (
    <div
      className="flex items-start gap-3 rounded-xl border bg-white p-4 shadow-sm"
      style={{ borderLeftColor: color, borderLeftWidth: 4 }}
    >
      <span className="text-2xl">{a.emoji ?? "·"}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-neutral-900">{a.name}</p>
          {/* Section apprenantes = Owner-only (page-level gate). DESA toujours
              rendu (outil admin). Codes karmiques en rouge à gauche du sigle. */}
          <div className="flex flex-shrink-0 flex-col items-end gap-1">
            {a.niveaux_bloques != null ? (
              <span
                className="rounded-full border border-rose-300 bg-rose-50 px-2 py-0.5 font-mono text-[11px] font-bold text-rose-900"
                title="NSB — Niveaux Shamaniques Bloqués (apprenante_tier.niveaux_bloques)"
              >
                NSB {a.niveaux_bloques}
              </span>
            ) : null}
            <div className="flex items-center gap-1">
              {(a.desa_karmic ?? []).map((code) => (
                <span
                  key={code}
                  className="rounded-md border-2 border-red-500 bg-red-50 px-1 py-0.5 font-mono text-[10px] font-bold text-red-600"
                  title={`${code} — DESA karmique encore à libérer`}
                >
                  {code}
                </span>
              ))}
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  setDesaOpen(true);
                }}
                className="rounded-md bg-indigo-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-indigo-900 transition hover:ring-2 hover:ring-indigo-300"
                title="Attribuer les capacités DESA (Owner)"
              >
                DESA
              </button>
            </div>
          </div>
        </div>
        <p className="mt-0.5 text-[11px] font-semibold" style={{ color }}>
          {TIER_LABEL[a.tier as ParticipantTier]}
        </p>
        <CerclesAkashiquesChips membership={memb} dhatuMeta={dhatuMeta} />
        {a.description ? (
          <p className="mt-1.5 text-[10px] italic text-neutral-600">{a.description}</p>
        ) : null}
      </div>
      <DesaEditModal
        open={desaOpen}
        onClose={() => setDesaOpen(false)}
        svlbhId={a.svlbh_id}
        praticienneName={a.name}
        initialGranted={a.desa_granted ?? []}
        initialKarmic={a.desa_karmic ?? []}
        catalog={desaCatalog}
      />
    </div>
  );
}
