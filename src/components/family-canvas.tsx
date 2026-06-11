"use client";

import { useState, useCallback } from "react";
import {
  RELATION_CARD_TEMPLATES,
  PURPOSE_OPTIONS,
  RELATION_STATE_OPTIONS,
  type RelationCardTemplate,
} from "@/lib/cercle/audit-entites";

type LocalCard = {
  id: string;
  template: RelationCardTemplate;
  purpose: string;
  state: string;
  sla: number | null;
  slsa: number | null;
  slpmo: number | null;
  slm: number | null;
  nsb: number | null;
  scoreLumiere: number | null;
};

export function FamilyCanvas() {
  const [cards, setCards] = useState<LocalCard[]>([]);
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
    const newCard: LocalCard = {
      id: `${draggedCard.id}-${Date.now()}`,
      template: draggedCard,
      purpose: "soul_mission",
      state: "absente",
      sla: null,
      slsa: null,
      slpmo: null,
      slm: null,
      nsb: null,
      scoreLumiere: null,
    };
    setCards((prev) => [...prev, newCard]);
    setOpenCardId(newCard.id);
    setDraggedCard(null);
  }, [draggedCard]);

  const toggleCard = useCallback((cardId: string) => {
    setOpenCardId((prev) => (prev === cardId ? null : cardId));
  }, []);

  const updateCard = useCallback((cardId: string, updates: Partial<LocalCard>) => {
    setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, ...updates } : c)));
  }, []);

  const removeCard = useCallback((cardId: string) => {
    setCards((prev) => prev.filter((c) => c.id !== cardId));
    setOpenCardId((prev) => (prev === cardId ? null : prev));
  }, []);

  const openCard = cards.find((c) => c.id === openCardId);

  return (
    <div className="flex gap-4">
      {/* Zone de travail : cartes fermées + carte ouverte */}
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="relative min-h-[300px] flex-1 rounded-xl border bg-gradient-to-b from-neutral-50 to-white p-4"
      >
        {/* Cartes fermées (vignettes cliquables) */}
        {cards.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {cards.map((c) => {
              const isOpen = c.id === openCardId;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleCard(c.id)}
                  className={`group flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs transition ${
                    isOpen
                      ? "border-2 shadow-md"
                      : "border-neutral-200 bg-white hover:bg-neutral-50"
                  }`}
                  style={{
                    borderColor: isOpen ? c.template.color : undefined,
                    backgroundColor: isOpen ? `${c.template.color}10` : undefined,
                  }}
                >
                  <span>{c.template.icon}</span>
                  <span className="font-medium" style={{ color: isOpen ? c.template.color : "#374151" }}>
                    {c.template.name}
                  </span>
                  <span className="text-[9px] text-neutral-400">{c.state}</span>
                  <span
                    onClick={(e) => { e.stopPropagation(); removeCard(c.id); }}
                    className="ml-1 hidden text-red-500 hover:text-red-700 group-hover:inline"
                  >
                    ×
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Carte ouverte (détails complets) */}
        {openCard && (
          <div
            className="rounded-xl border-2 bg-white p-4 shadow-lg"
            style={{ borderColor: openCard.template.color }}
          >
            <div className="mb-3 flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{openCard.template.icon}</span>
                <div>
                  <h3 className="text-lg font-bold" style={{ color: openCard.template.color }}>
                    {openCard.template.name}
                  </h3>
                  <p className="text-xs text-neutral-500">
                    G{openCard.template.generation} · {openCard.template.gender === "F" ? "Féminin" : "Masculin"}
                  </p>
                </div>
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
                  value={openCard.purpose}
                  onChange={(e) => updateCard(openCard.id, { purpose: e.target.value })}
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
                  value={openCard.state}
                  onChange={(e) => updateCard(openCard.id, { state: e.target.value })}
                  className="w-full rounded-lg border px-2 py-1.5 text-sm"
                >
                  {RELATION_STATE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              {/* 4 Scores */}
              <div className="col-span-2 grid grid-cols-4 gap-2">
                {(["sla", "slsa", "slpmo", "slm"] as const).map((key) => (
                  <div key={key}>
                    <label className="mb-1 block text-[9px] font-bold uppercase tracking-wide text-neutral-400">
                      {key.toUpperCase()}
                    </label>
                    <input
                      type="number"
                      value={openCard[key] ?? ""}
                      onChange={(e) => updateCard(openCard.id, { [key]: e.target.value ? Number(e.target.value) : null })}
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
                  value={openCard.nsb ?? ""}
                  onChange={(e) => updateCard(openCard.id, { nsb: e.target.value ? Number(e.target.value) : null })}
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
                  value={openCard.scoreLumiere ?? ""}
                  onChange={(e) => updateCard(openCard.id, { scoreLumiere: e.target.value ? Number(e.target.value) : null })}
                  onFocus={(e) => e.currentTarget.select()}
                  placeholder="—"
                  className="w-full rounded-lg border px-2 py-1.5 font-mono text-sm"
                />
              </div>
            </div>

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
        {cards.length === 0 && !draggedCard && (
          <div className="flex h-full min-h-[200px] items-center justify-center">
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
