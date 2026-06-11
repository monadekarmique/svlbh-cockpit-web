"use client";

import { useState, useCallback } from "react";
import {
  RELATION_CARD_TEMPLATES,
  PURPOSE_OPTIONS,
  RELATION_STATE_OPTIONS,
  type RelationCardTemplate,
  type AuditRelation,
} from "@/lib/cercle/audit-entites";

type FamilyCanvasProps = {
  relations: AuditRelation[];
  onCardPlaced?: (card: RelationCardTemplate) => void;
  onUpdateRelation?: (relationId: string, updates: Partial<AuditRelation>) => void;
};

export function FamilyCanvas({ relations, onCardPlaced, onUpdateRelation }: FamilyCanvasProps) {
  const [openCardId, setOpenCardId] = useState<string | null>(null);
  const [draggedCard, setDraggedCard] = useState<RelationCardTemplate | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, card: RelationCardTemplate) => {
    setDraggedCard(card);
    e.dataTransfer.setData("text/plain", card.id);
    e.dataTransfer.effectAllowed = "copy";
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedCard) return;
    onCardPlaced?.(draggedCard);
    setDraggedCard(null);
  }, [draggedCard, onCardPlaced]);

  const toggleCard = useCallback((relationId: string) => {
    setOpenCardId((prev) => (prev === relationId ? null : relationId));
  }, []);

  const openRelation = relations.find((r) => r.relation_id === openCardId);

  return (
    <div className="flex gap-4">
      {/* Zone de travail : cartes fermées + carte ouverte */}
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="relative flex-1 rounded-xl border bg-gradient-to-b from-neutral-50 to-white p-4"
      >
        {/* Cartes fermées (vignettes cliquables) */}
        <div className="mb-4 flex flex-wrap gap-2">
          {relations.map((r) => {
            const isOpen = r.relation_id === openCardId;
            return (
              <button
                key={r.relation_id}
                type="button"
                onClick={() => toggleCard(r.relation_id)}
                className={`flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs transition ${
                  isOpen
                    ? "border-2 shadow-md"
                    : "border-neutral-200 bg-white hover:bg-neutral-50"
                }`}
                style={{
                  borderColor: isOpen ? r.color_hex ?? "#8B3A62" : undefined,
                  backgroundColor: isOpen ? `${r.color_hex ?? "#8B3A62"}10` : undefined,
                }}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: r.color_hex ?? "#8B3A62" }}
                />
                <span className="font-medium" style={{ color: isOpen ? r.color_hex ?? "#8B3A62" : "#374151" }}>
                  {r.relation_type}
                </span>
                <span className="text-[9px] text-neutral-400">{r.relation_state}</span>
              </button>
            );
          })}
        </div>

        {/* Carte ouverte (détails complets) */}
        {openRelation && (
          <div
            className="rounded-xl border-2 bg-white p-4 shadow-lg"
            style={{ borderColor: openRelation.color_hex ?? "#8B3A62" }}
          >
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h3
                  className="text-lg font-bold"
                  style={{ color: openRelation.color_hex ?? "#8B3A62" }}
                >
                  {openRelation.relation_type}
                </h3>
                <p className="text-xs text-neutral-500">{openRelation.relation_state}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpenCardId(null)}
                className="rounded-lg bg-neutral-100 px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-200"
              >
                Fermer
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {/* But (dropdown) */}
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-neutral-500">
                  But
                </label>
                <select
                  value={openRelation.purpose}
                  onChange={(e) => onUpdateRelation?.(openRelation.relation_id, { purpose: e.target.value })}
                  className="w-full rounded-lg border px-2 py-1.5 text-sm"
                >
                  {PURPOSE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              {/* État (dropdown) */}
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-neutral-500">
                  État
                </label>
                <select
                  value={openRelation.relation_state}
                  onChange={(e) => onUpdateRelation?.(openRelation.relation_id, { relation_state: e.target.value })}
                  className="w-full rounded-lg border px-2 py-1.5 text-sm"
                >
                  {RELATION_STATE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              {/* 4 Scores */}
              <div className="col-span-2 grid grid-cols-4 gap-2">
                {(["sla", "slsa", "slpmo", "slm"] as const).map((scoreKey) => (
                  <div key={scoreKey}>
                    <label className="mb-1 block text-[9px] font-bold uppercase tracking-wide text-neutral-400">
                      {scoreKey.toUpperCase()}
                    </label>
                    <input
                      type="number"
                      value={String((openRelation as Record<string, unknown>)[scoreKey] ?? "")}
                      onChange={(e) =>
                        onUpdateRelation?.(openRelation.relation_id, {
                          [scoreKey]: e.target.value ? Number(e.target.value) : null,
                        } as Partial<AuditRelation>)
                      }
                      onFocus={(e) => e.currentTarget.select()}
                      placeholder="—"
                      className="w-full rounded-lg border px-2 py-1 text-center font-mono text-sm"
                    />
                  </div>
                ))}
              </div>

              {/* NSB */}
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-neutral-500">
                  Niveaux shamaniques bloqués
                </label>
                <input
                  type="number"
                  value={openRelation.niveau_shamanique_bloques ?? ""}
                  onChange={(e) =>
                    onUpdateRelation?.(openRelation.relation_id, {
                      niveau_shamanique_bloques: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  onFocus={(e) => e.currentTarget.select()}
                  placeholder="—"
                  className="w-full rounded-lg border px-2 py-1.5 font-mono text-sm"
                />
              </div>

              {/* Score Lumière */}
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-neutral-500">
                  Score Lumière
                </label>
                <input
                  type="number"
                  value={openRelation.score_lumiere ?? ""}
                  onChange={(e) =>
                    onUpdateRelation?.(openRelation.relation_id, {
                      score_lumiere: e.target.value ? Number(e.target.value) : null,
                    } as Partial<AuditRelation>)
                  }
                  onFocus={(e) => e.currentTarget.select()}
                  placeholder="—"
                  className="w-full rounded-lg border px-2 py-1.5 font-mono text-sm"
                />
              </div>
            </div>

            {/* Catégories */}
            {openRelation.categories.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {openRelation.categories.map((c) => (
                  <span
                    key={c}
                    className="rounded-full bg-rose-50 px-2 py-0.5 text-[9px] font-medium text-rose-700"
                  >
                    {c}
                  </span>
                ))}
              </div>
            )}

            {/* Menu Sentiers */}
            <div className="mt-4 flex gap-2">
              <a
                href="/parasites"
                className="rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-200"
              >
                Parasites
              </a>
              <a
                href="/soul-mission"
                className="rounded-lg bg-purple-100 px-3 py-1.5 text-xs font-medium text-purple-800 hover:bg-purple-200"
              >
                Scores de lumière
              </a>
            </div>
          </div>
        )}

        {/* Indicateur drop zone */}
        {draggedCard && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl bg-blue-500/5">
            <p className="rounded-lg bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-700">
              Relâchez pour ajouter {draggedCard.name}
            </p>
          </div>
        )}

        {/* État vide */}
        {relations.length === 0 && !draggedCard && (
          <div className="flex h-40 items-center justify-center">
            <p className="text-sm text-neutral-400">
              Glissez des cartes depuis le drawer pour créer la structure familiale
            </p>
          </div>
        )}
      </div>

      {/* Drawer à droite : 6 cartes de base */}
      <div className="w-48 shrink-0 space-y-2 rounded-xl border bg-neutral-50 p-3">
        <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">
          6 cartes de base
        </p>
        <div className="space-y-1.5">
          {RELATION_CARD_TEMPLATES.map((card) => (
            <div
              key={card.id}
              draggable
              onDragStart={(e) => handleDragStart(e, card)}
              className="flex cursor-grab items-center gap-2 rounded-lg border bg-white px-2 py-2 text-xs shadow-sm transition hover:shadow-md active:cursor-grabbing"
              style={{ borderLeftWidth: 4, borderLeftColor: card.color }}
            >
              <span className="text-base">{card.icon}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-neutral-800">{card.name}</p>
                <p className="text-[9px] text-neutral-400">
                  {card.generation === 0 ? "Origine" : `G${card.generation}`} · {card.gender === "F" ? "Fém" : "Masc"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
