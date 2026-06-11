"use client";

import { useState, useCallback } from "react";
import { UserPlus, Pencil, Users, Trash2, Link2 } from "lucide-react";
import {
  RELATION_CARD_TEMPLATES,
  PURPOSE_OPTIONS,
  RELATION_STATE_OPTIONS,
  type RelationCardTemplate,
} from "@/lib/cercle/audit-entites";

const PLATON_SOLIDS = [
  { id: "circle", name: "Cercle", icon: "⬤", clipPath: "circle(50%)" },
  { id: "tetrahedron", name: "Tétraèdre", icon: "△", clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" },
  { id: "cube", name: "Cube", icon: "◼", clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)" },
  { id: "octahedron", name: "Octaèdre", icon: "◆", clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" },
  { id: "dodecahedron", name: "Dodécaèdre", icon: "⬠", clipPath: "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)" },
  { id: "icosahedron", name: "Icosaèdre", icon: "⬡", clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)" },
] as const;

type PlatonSolidId = typeof PLATON_SOLIDS[number]["id"];

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
  prenom: string;
  nom: string;
  autresPrenoms: string;
  titre: string;
  sexe: "F" | "M";
  shape: PlatonSolidId;
  evenements: Array<{ type: string; date: string }>;
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
      prenom: "",
      nom: "",
      autresPrenoms: "",
      titre: "",
      sexe: draggedCard.gender,
      shape: draggedCard.gender === "F" ? "circle" : "cube",
      evenements: [],
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

  const addEvenement = useCallback((cardId: string) => {
    setCards((prev) =>
      prev.map((c) =>
        c.id === cardId
          ? { ...c, evenements: [...c.evenements, { type: "Événement", date: "" }] }
          : c
      )
    );
  }, []);

  const openCard = cards.find((c) => c.id === openCardId);

  return (
    <div className="flex gap-4">
      {/* Zone de travail : cartes placées */}
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="relative min-h-[400px] flex-1 rounded-xl border bg-gradient-to-b from-neutral-50 to-white p-4"
      >
        {/* Cartes placées avec formes Platon */}
        {cards.length > 0 && (
          <div className="flex flex-wrap gap-4">
            {cards.map((c) => {
              const isOpen = c.id === openCardId;
              const solid = PLATON_SOLIDS.find((s) => s.id === c.shape) ?? PLATON_SOLIDS[0];
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleCard(c.id)}
                  className="group flex flex-col items-center"
                >
                  {/* Forme avec clip-path */}
                  <div
                    className={`flex h-20 w-20 items-center justify-center border-4 bg-white shadow-lg transition hover:scale-105 ${
                      isOpen ? "ring-4 ring-offset-2" : ""
                    }`}
                    style={{
                      clipPath: solid.clipPath,
                      borderColor: c.template.color,
                      backgroundColor: `${c.template.color}15`,
                      boxShadow: isOpen ? `0 0 0 4px ${c.template.color}` : undefined,
                    }}
                  >
                    <span className="text-2xl">{c.template.icon}</span>
                  </div>
                  <p className="mt-2 max-w-[80px] truncate text-center text-xs font-bold" style={{ color: c.template.color }}>
                    {c.prenom || c.template.name}
                  </p>
                  <p className="text-[9px] text-neutral-500">{c.state}</p>
                </button>
              );
            })}
          </div>
        )}

        {/* Drop zone indicator */}
        {draggedCard && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl bg-blue-500/5">
            <p className="rounded-lg bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-700">
              Relâchez pour ajouter {draggedCard.name}
            </p>
          </div>
        )}

        {/* État vide */}
        {cards.length === 0 && !draggedCard && (
          <div className="flex h-full min-h-[300px] items-center justify-center">
            <p className="text-sm text-neutral-400">
              Glissez des cartes depuis le drawer pour créer la structure familiale
            </p>
          </div>
        )}
      </div>

      {/* Panneau latéral sombre (ouvert quand une carte est sélectionnée) */}
      {openCard && (
        <div className="w-80 shrink-0 overflow-y-auto rounded-xl bg-slate-800 p-4 text-white shadow-xl">
          {/* Header avec avatar */}
          <div className="mb-4 flex items-center gap-3">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-lg text-3xl"
              style={{ backgroundColor: `${openCard.template.color}30` }}
            >
              {openCard.template.icon}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-white">
                {openCard.prenom || openCard.template.name} {openCard.nom}
              </p>
              <p className="truncate text-xs text-slate-400">{openCard.titre || openCard.template.relation_type}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="mb-4 rounded-lg bg-slate-700/50 p-3">
            <p className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-300">
              <span className="flex h-5 w-5 items-center justify-center rounded bg-cyan-500 text-[10px]">▶</span>
              Actions
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button className="flex flex-col items-center gap-1 rounded-lg bg-slate-600/50 p-2 text-[10px] text-cyan-400 hover:bg-slate-600">
                <UserPlus className="h-5 w-5" />
                Ajouter des proches
              </button>
              <button className="flex flex-col items-center gap-1 rounded-lg bg-slate-600/50 p-2 text-[10px] text-cyan-400 hover:bg-slate-600">
                <Pencil className="h-5 w-5" />
                Éditer la personne
              </button>
              <button className="flex flex-col items-center gap-1 rounded-lg bg-slate-600/50 p-2 text-[10px] text-cyan-400 hover:bg-slate-600">
                <Users className="h-5 w-5" />
                Personnes influentes (0)
              </button>
              <button
                onClick={() => removeCard(openCard.id)}
                className="flex flex-col items-center gap-1 rounded-lg bg-red-900/50 p-2 text-[10px] text-red-400 hover:bg-red-900"
              >
                <Trash2 className="h-5 w-5" />
                Supprimer
              </button>
              <button className="col-span-2 flex items-center justify-center gap-2 rounded-lg bg-slate-600/50 p-2 text-[10px] text-cyan-400 hover:bg-slate-600">
                <Link2 className="h-4 w-4" />
                Sélectionner une famille...
              </button>
            </div>
          </div>

          {/* Nom & sexe */}
          <div className="mb-4 rounded-lg bg-slate-700/50 p-3">
            <p className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-300">
              <span className="flex h-5 w-5 items-center justify-center rounded bg-cyan-500 text-[10px]">👤</span>
              Nom & sexe
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-[9px] text-slate-400">Prénom</label>
                <input
                  type="text"
                  value={openCard.prenom}
                  onChange={(e) => updateCard(openCard.id, { prenom: e.target.value })}
                  className="w-full rounded bg-slate-600 px-2 py-1 text-xs text-white placeholder-slate-400"
                  placeholder="Prénom"
                />
              </div>
              <div>
                <label className="mb-1 block text-[9px] text-slate-400">Nom</label>
                <input
                  type="text"
                  value={openCard.nom}
                  onChange={(e) => updateCard(openCard.id, { nom: e.target.value })}
                  className="w-full rounded bg-slate-600 px-2 py-1 text-xs text-white placeholder-slate-400"
                  placeholder="Nom"
                />
              </div>
              <div>
                <label className="mb-1 block text-[9px] text-slate-400">Autres prénoms</label>
                <input
                  type="text"
                  value={openCard.autresPrenoms}
                  onChange={(e) => updateCard(openCard.id, { autresPrenoms: e.target.value })}
                  className="w-full rounded bg-slate-600 px-2 py-1 text-xs text-white placeholder-slate-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-[9px] text-slate-400">Titre</label>
                <input
                  type="text"
                  value={openCard.titre}
                  onChange={(e) => updateCard(openCard.id, { titre: e.target.value })}
                  className="w-full rounded bg-slate-600 px-2 py-1 text-xs text-white placeholder-slate-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-[9px] text-slate-400">Sexe</label>
                <select
                  value={openCard.sexe}
                  onChange={(e) => updateCard(openCard.id, { sexe: e.target.value as "F" | "M" })}
                  className="w-full rounded bg-slate-600 px-2 py-1 text-xs text-white"
                >
                  <option value="F">🔴 Féminin</option>
                  <option value="M">🔵 Masculin</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[9px] text-slate-400">Forme</label>
                <select
                  value={openCard.shape}
                  onChange={(e) => updateCard(openCard.id, { shape: e.target.value as PlatonSolidId })}
                  className="w-full rounded bg-slate-600 px-2 py-1 text-xs text-white"
                >
                  {PLATON_SOLIDS.map((s) => (
                    <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Scores */}
          <div className="mb-4 rounded-lg bg-slate-700/50 p-3">
            <p className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-300">
              <span className="flex h-5 w-5 items-center justify-center rounded bg-amber-500 text-[10px]">📊</span>
              Scores
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-[9px] text-slate-400">But</label>
                <select
                  value={openCard.purpose}
                  onChange={(e) => updateCard(openCard.id, { purpose: e.target.value })}
                  className="w-full rounded bg-slate-600 px-2 py-1 text-xs text-white"
                >
                  {PURPOSE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[9px] text-slate-400">État</label>
                <select
                  value={openCard.state}
                  onChange={(e) => updateCard(openCard.id, { state: e.target.value })}
                  className="w-full rounded bg-slate-600 px-2 py-1 text-xs text-white"
                >
                  {RELATION_STATE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              {(["sla", "slsa", "slpmo", "slm"] as const).map((key) => (
                <div key={key}>
                  <label className="mb-1 block text-[9px] text-slate-400">{key.toUpperCase()}</label>
                  <input
                    type="number"
                    value={openCard[key] ?? ""}
                    onChange={(e) => updateCard(openCard.id, { [key]: e.target.value ? Number(e.target.value) : null })}
                    onFocus={(e) => e.currentTarget.select()}
                    placeholder="—"
                    className="w-full rounded bg-slate-600 px-2 py-1 text-center font-mono text-xs text-white"
                  />
                </div>
              ))}
              <div>
                <label className="mb-1 block text-[9px] text-slate-400">NSB</label>
                <input
                  type="number"
                  value={openCard.nsb ?? ""}
                  onChange={(e) => updateCard(openCard.id, { nsb: e.target.value ? Number(e.target.value) : null })}
                  onFocus={(e) => e.currentTarget.select()}
                  placeholder="—"
                  className="w-full rounded bg-slate-600 px-2 py-1 text-center font-mono text-xs text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-[9px] text-slate-400">Score Lumière</label>
                <input
                  type="number"
                  value={openCard.scoreLumiere ?? ""}
                  onChange={(e) => updateCard(openCard.id, { scoreLumiere: e.target.value ? Number(e.target.value) : null })}
                  onFocus={(e) => e.currentTarget.select()}
                  placeholder="—"
                  className="w-full rounded bg-slate-600 px-2 py-1 text-center font-mono text-xs text-white"
                />
              </div>
            </div>
          </div>

          {/* Événements */}
          <div className="rounded-lg bg-slate-700/50 p-3">
            <p className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-300">
              <span className="flex h-5 w-5 items-center justify-center rounded bg-yellow-500 text-[10px]">⭐</span>
              Événements ({openCard.evenements.length})
            </p>
            {openCard.evenements.map((evt, i) => (
              <div key={i} className="mb-2 flex items-center gap-2 rounded bg-slate-600/50 p-2 text-xs">
                <span>📜</span>
                <div className="flex-1">
                  <p className="font-medium text-white">{evt.type}</p>
                  <p className="text-slate-400">{evt.date || "Aucune date saisie"}</p>
                </div>
              </div>
            ))}
            <button
              onClick={() => addEvenement(openCard.id)}
              className="mt-2 w-full rounded bg-slate-600 py-1 text-[10px] text-cyan-400 hover:bg-slate-500"
            >
              + Ajouter un événement
            </button>
          </div>

          {/* Fermer */}
          <button
            onClick={() => setOpenCardId(null)}
            className="mt-4 w-full rounded-lg bg-slate-600 py-2 text-xs font-medium text-slate-300 hover:bg-slate-500"
          >
            Fermer
          </button>
        </div>
      )}

      {/* Drawer à droite : 6 cartes de base (masqué si panneau ouvert) */}
      {!openCard && (
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
      )}
    </div>
  );
}
