"use client";

import { useState, useCallback, useMemo } from "react";
import { UserPlus, Pencil, Users, Trash2, Link2 } from "lucide-react";
import {
  RELATION_CARD_TEMPLATES,
  PURPOSE_OPTIONS,
  RELATION_STATE_OPTIONS,
  type RelationCardTemplate,
} from "@/lib/cercle/audit-entites";

const PLATON_SOLIDS = [
  { id: "circle", name: "Cercle", clipPath: "circle(50%)" },
  { id: "tetrahedron", name: "Tétraèdre", clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" },
  { id: "cube", name: "Cube", clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)" },
  { id: "octahedron", name: "Octaèdre", clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" },
  { id: "dodecahedron", name: "Dodécaèdre", clipPath: "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)" },
  { id: "icosahedron", name: "Icosaèdre", clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)" },
] as const;

type PlatonSolidId = (typeof PLATON_SOLIDS)[number]["id"];

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

// Undirected edges: templateId A ↔ templateId B (parent ↔ child in family tree)
const TEMPLATE_EDGES: Array<[string, string]> = [
  ["pere", "consultante"],
  ["mere", "consultante"],
  ["grand-pere", "pere"],
  ["grand-mere-paternelle", "pere"],
  ["arriere-grand-mere-paternelle", "grand-pere"],
];

// Connection is simply a pair of card IDs; direction determined by y-position at render time
type Connection = { a: string; b: string };

type ViewMode = "generations" | "niveaux" | "incarnations";

const VIEW_MODE_LABELS: Record<ViewMode, Record<number, string>> = {
  generations: {
    3: "G3 · Arrière-grands-parents",
    2: "G2 · Grands-parents",
    1: "G1 · Parents",
    0: "G0 · Consultante",
  },
  niveaux: {
    3: "N3 · Niveau Ancestral Profond",
    2: "N2 · Niveau Grand-parental",
    1: "N1 · Niveau Parental",
    0: "N0 · Niveau Personnel",
  },
  incarnations: {
    3: "I3 · 3ème Incarnation",
    2: "I2 · 2ème Incarnation",
    1: "I1 · 1ère Incarnation",
    0: "I0 · Incarnation Présente",
  },
};

const CANVAS_W = 960;
const ROW_H = 150;
const CARD_SZ = 76;
const CANVAS_H = 4 * ROW_H; // 600px

function genCY(generation: number): number {
  // G3 at top (row 0), G0 at bottom (row 3)
  return (3 - generation) * ROW_H + ROW_H / 2;
}

function computePositions(cards: LocalCard[]): Map<string, { cx: number; cy: number }> {
  const byGen = new Map<number, LocalCard[]>();
  for (const card of cards) {
    const g = card.template.generation;
    if (!byGen.has(g)) byGen.set(g, []);
    byGen.get(g)!.push(card);
  }
  const pos = new Map<string, { cx: number; cy: number }>();
  for (const [gen, genCards] of byGen) {
    const cy = genCY(gen);
    const gap = 60;
    const totalW = genCards.length * CARD_SZ + (genCards.length - 1) * gap;
    let x = (CANVAS_W - totalW) / 2 + CARD_SZ / 2;
    for (const card of genCards) {
      pos.set(card.id, { cx: x, cy });
      x += CARD_SZ + gap;
    }
  }
  return pos;
}

function connectionColor(card: LocalCard): string {
  if (card.template.lignee === "paternelle") return "#F97316";
  if (card.template.lignee === "maternelle") return "#EC4899";
  return "#94A3B8";
}

const DEFAULT_CANVAS_COLOR = "#a289f0";

// Returns white or near-black depending on background luminance
function textOnColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.55 ? "rgba(0,0,0,0.82)" : "rgba(255,255,255,0.95)";
}

// A slightly darkened version of the color for section overlays
function darken(hex: string, amount = 0.18): string {
  const r = Math.round(parseInt(hex.slice(1, 3), 16) * (1 - amount));
  const g = Math.round(parseInt(hex.slice(3, 5), 16) * (1 - amount));
  const b = Math.round(parseInt(hex.slice(5, 7), 16) * (1 - amount));
  return `rgb(${r},${g},${b})`;
}

function bezierPath(
  aPos: { cx: number; cy: number },
  bPos: { cx: number; cy: number },
): string {
  // Connect bottom of upper card to top of lower card; control points at midpoint y
  const upper = aPos.cy <= bPos.cy ? aPos : bPos;
  const lower = aPos.cy <= bPos.cy ? bPos : aPos;
  const y1 = upper.cy + CARD_SZ / 2;
  const y2 = lower.cy - CARD_SZ / 2;
  const my = (y1 + y2) / 2;
  return `M ${upper.cx} ${y1} C ${upper.cx} ${my}, ${lower.cx} ${my}, ${lower.cx} ${y2}`;
}

export function FamilyCanvas() {
  const [viewMode, setViewMode] = useState<ViewMode>("generations");
  const [canvasColor, setCanvasColor] = useState(DEFAULT_CANVAS_COLOR);
  const [cards, setCards] = useState<LocalCard[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [openCardId, setOpenCardId] = useState<string | null>(null);
  const [draggedCard, setDraggedCard] = useState<RelationCardTemplate | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [addProcheOpen, setAddProcheOpen] = useState(false);

  const textColor = useMemo(() => textOnColor(canvasColor), [canvasColor]);
  const sectionBg = useMemo(() => darken(canvasColor, 0.18), [canvasColor]);
  const inputBg = useMemo(() => darken(canvasColor, 0.28), [canvasColor]);
  const genLabels = VIEW_MODE_LABELS[viewMode];

  const positions = useMemo(() => computePositions(cards), [cards]);

  const handleDragStart = useCallback((e: React.DragEvent, card: RelationCardTemplate) => {
    setDraggedCard(card);
    e.dataTransfer.setData("text/plain", card.id);
    e.dataTransfer.effectAllowed = "copy";
  }, []);

  const addCardFromTemplate = useCallback(
    (tpl: RelationCardTemplate) => {
      const newCard: LocalCard = {
        id: `${tpl.id}-${Date.now()}`,
        template: tpl,
        purpose: "soul_mission",
        state: "absente",
        sla: null, slsa: null, slpmo: null, slm: null,
        nsb: null, scoreLumiere: null,
        prenom: "", nom: "", autresPrenoms: "", titre: "",
        sexe: tpl.gender,
        shape: tpl.gender === "F" ? "circle" : "cube",
        evenements: [],
      };
      const newConns: Connection[] = [];
      for (const [tA, tB] of TEMPLATE_EDGES) {
        if (tpl.id === tA) {
          const match = cards.find((c) => c.template.id === tB);
          if (match) newConns.push({ a: newCard.id, b: match.id });
        } else if (tpl.id === tB) {
          const match = cards.find((c) => c.template.id === tA);
          if (match) newConns.push({ a: newCard.id, b: match.id });
        }
      }
      setCards((prev) => [...prev, newCard]);
      if (newConns.length > 0) setConnections((prev) => [...prev, ...newConns]);
      setOpenCardId(newCard.id);
    },
    [cards],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (!draggedCard) return;
      addCardFromTemplate(draggedCard);
      setDraggedCard(null);
    },
    [draggedCard, addCardFromTemplate],
  );

  const toggleCard = useCallback((cardId: string) => {
    setOpenCardId((prev) => (prev === cardId ? null : cardId));
  }, []);

  const updateCard = useCallback((cardId: string, updates: Partial<LocalCard>) => {
    setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, ...updates } : c)));
  }, []);

  const removeCard = useCallback((cardId: string) => {
    setCards((prev) => prev.filter((c) => c.id !== cardId));
    setConnections((prev) => prev.filter((c) => c.a !== cardId && c.b !== cardId));
    setOpenCardId((prev) => (prev === cardId ? null : prev));
  }, []);

  const addEvenement = useCallback((cardId: string) => {
    setCards((prev) =>
      prev.map((c) =>
        c.id === cardId
          ? { ...c, evenements: [...c.evenements, { type: "Événement", date: "" }] }
          : c,
      ),
    );
  }, []);

  const openCard = cards.find((c) => c.id === openCardId);

  return (
    <div className="flex gap-4">
      {/* Canvas column */}
      <div className="flex flex-1 flex-col gap-2">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Mode toggle */}
          <div className="flex items-center rounded-lg border border-neutral-200 bg-neutral-50 p-0.5">
            {(["generations", "niveaux", "incarnations"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className="rounded px-2.5 py-1 text-[11px] font-medium transition"
                style={
                  viewMode === mode
                    ? { backgroundColor: canvasColor, color: textColor }
                    : { color: "#6B7280" }
                }
              >
                {mode === "generations" ? "Générations" : mode === "niveaux" ? "Niveaux" : "Incarnations"}
              </button>
            ))}
          </div>
          {/* Color picker */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-neutral-500">Couleur :</span>
            <label className="relative h-6 w-9 cursor-pointer overflow-hidden rounded border border-neutral-300 shadow-sm">
              <span className="absolute inset-0" style={{ backgroundColor: canvasColor }} />
              <input
                type="color"
                value={canvasColor}
                onChange={(e) => setCanvasColor(e.target.value)}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                title="Couleur du système"
              />
            </label>
            <span className="font-mono text-xs text-neutral-400">{canvasColor}</span>
          </div>
        </div>

      {/* Canvas */}
      <div className="overflow-x-auto rounded-xl border border-neutral-200">
        <div
          className="relative"
          style={{
            width: CANVAS_W,
            height: CANVAS_H,
            backgroundColor: canvasColor,
            backgroundImage:
              "linear-gradient(rgba(0,0,0,0.08) 1px, transparent 1px)," +
              "linear-gradient(90deg, rgba(0,0,0,0.08) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "copy";
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
        >
          {/* Generation row dividers + labels */}
          {[3, 2, 1, 0].map((gen) => {
            const rowTop = (3 - gen) * ROW_H;
            return (
              <div key={gen}>
                {gen < 3 && (
                  <div
                    className="absolute left-0 right-0 h-px"
                    style={{ top: rowTop, backgroundColor: "rgba(0,0,0,0.14)" }}
                  />
                )}
                <div
                  className="pointer-events-none absolute left-2"
                  style={{ top: rowTop + 6 }}
                >
                  <span
                    className="rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wider"
                    style={{
                      backgroundColor: "rgba(0,0,0,0.18)",
                      color: textColor,
                      opacity: gen === 0 ? 1 : 0.75,
                    }}
                  >
                    {genLabels[gen]}
                  </span>
                </div>
              </div>
            );
          })}

          {/* SVG connection lines */}
          <svg
            className="pointer-events-none absolute inset-0"
            width={CANVAS_W}
            height={CANVAS_H}
          >
            {connections.map((conn) => {
              const aPos = positions.get(conn.a);
              const bPos = positions.get(conn.b);
              if (!aPos || !bPos) return null;
              const cardA = cards.find((c) => c.id === conn.a);
              const cardB = cards.find((c) => c.id === conn.b);
              // Use the lower-generation card's color for the line
              const lineCard =
                (cardA?.template.generation ?? 0) < (cardB?.template.generation ?? 0)
                  ? cardA
                  : cardB;
              const color = lineCard ? connectionColor(lineCard) : "#94A3B8";
              return (
                <path
                  key={`${conn.a}-${conn.b}`}
                  d={bezierPath(aPos, bPos)}
                  stroke={color}
                  strokeWidth={2}
                  fill="none"
                  opacity={0.75}
                />
              );
            })}
          </svg>

          {/* Cards */}
          {cards.map((card) => {
            const pos = positions.get(card.id);
            if (!pos) return null;
            const solid = PLATON_SOLIDS.find((s) => s.id === card.shape) ?? PLATON_SOLIDS[0];
            const isOpen = card.id === openCardId;
            const isConsultante = card.template.id === "consultante";

            return (
              <button
                key={card.id}
                type="button"
                onClick={() => toggleCard(card.id)}
                className="absolute flex flex-col items-center transition-transform hover:scale-105"
                style={{
                  left: pos.cx - CARD_SZ / 2,
                  top: pos.cy - CARD_SZ / 2,
                  width: CARD_SZ,
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  overflow: "visible",
                  transformOrigin: "center center",
                }}
              >
                {/* Shape container */}
                <div style={{ position: "relative", width: CARD_SZ, height: CARD_SZ }}>
                  {/* Outer ring — circle for consultante, rounded-rect for others */}
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: isConsultante ? "50%" : 8,
                      border: `2px ${isConsultante ? "dashed" : "solid"} ${card.template.color}`,
                      boxShadow: isOpen
                        ? `0 0 0 3px ${card.template.color}50, 0 0 18px ${card.template.color}30`
                        : `0 0 8px ${card.template.color}20`,
                    }}
                  />
                  {/* Inner clip-path fill */}
                  <div
                    style={{
                      position: "absolute",
                      inset: 8,
                      clipPath: solid.clipPath,
                      backgroundColor: `${card.template.color}22`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 20,
                    }}
                  >
                    {card.template.icon}
                  </div>
                </div>
                {/* Labels */}
                <p
                  className="mt-1 truncate text-center text-[10px] font-semibold leading-tight"
                  style={{ color: card.template.color, maxWidth: CARD_SZ + 24, marginLeft: -12 }}
                >
                  {card.prenom || card.template.name}
                </p>
                <p
                  className="text-[8px]"
                  style={{ color: textColor, opacity: 0.65, maxWidth: CARD_SZ + 24, marginLeft: -12 }}
                >
                  {card.state}
                </p>
              </button>
            );
          })}

          {/* Drag-over overlay */}
          {isDragOver && draggedCard && (
            <div
              className="pointer-events-none absolute inset-0 flex items-center justify-center"
              style={{ backgroundColor: "rgba(59,130,246,.05)" }}
            >
              <p className="rounded-lg px-4 py-2 text-sm font-medium"
                style={{ backgroundColor: "rgba(0,0,0,0.18)", color: textColor }}>
                Relâchez pour placer {draggedCard.name} en G{draggedCard.generation}
              </p>
            </div>
          )}

          {/* Empty state */}
          {cards.length === 0 && !isDragOver && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-sm font-medium" style={{ color: textColor, opacity: 0.7 }}>
                  Glissez des cartes pour construire la structure familiale
                </p>
                <p className="mt-1 text-xs" style={{ color: textColor, opacity: 0.45 }}>
                  Commencez par la Consultante (G0), puis ajoutez Père et Mère (G1)…
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>{/* end canvas column */}

      {/* Side panel */}
      {openCard && (
        <div
          className="w-80 shrink-0 overflow-y-auto rounded-xl p-4 shadow-xl"
          style={{ backgroundColor: canvasColor, color: textColor }}
        >
          {/* Header */}
          <div className="mb-4 flex items-center gap-3">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-lg text-3xl"
              style={{ backgroundColor: `${openCard.template.color}30` }}
            >
              {openCard.template.icon}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold" style={{ color: textColor }}>
                {openCard.prenom || openCard.template.name} {openCard.nom}
              </p>
              <p className="truncate text-xs" style={{ color: textColor, opacity: 0.65 }}>
                {openCard.titre || openCard.template.relation_type}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="mb-4 rounded-lg p-3" style={{ backgroundColor: sectionBg }}>
            <p className="mb-2 flex items-center gap-2 text-xs font-bold" style={{ color: textColor, opacity: 0.85 }}>
              <span className="flex h-5 w-5 items-center justify-center rounded bg-cyan-500 text-[10px]">▶</span>
              Actions
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setAddProcheOpen((o) => !o)}
                className="flex flex-col items-center gap-1 rounded-lg p-2 text-[10px] text-cyan-300 transition hover:brightness-110"
                style={{ backgroundColor: addProcheOpen ? darken(inputBg, 0.1) : inputBg }}
              >
                <UserPlus className="h-5 w-5" />
                Ajouter des proches
              </button>
              <button className="flex flex-col items-center gap-1 rounded-lg p-2 text-[10px] text-cyan-300 transition hover:brightness-110"
                style={{ backgroundColor: inputBg }}>
                <Pencil className="h-5 w-5" />
                Éditer la personne
              </button>
              <button className="flex flex-col items-center gap-1 rounded-lg p-2 text-[10px] text-cyan-300 transition hover:brightness-110"
                style={{ backgroundColor: inputBg }}>
                <span className="text-lg leading-none">ለ</span>
                Audit·Perspective
              </button>
              <button
                onClick={() => removeCard(openCard.id)}
                className="flex flex-col items-center gap-1 rounded-lg bg-red-900/50 p-2 text-[10px] text-red-400 hover:bg-red-900"
              >
                <Trash2 className="h-5 w-5" />
                Supprimer
              </button>
              <button className="col-span-2 flex items-center justify-center gap-2 rounded-lg p-2 text-[10px] text-cyan-300 transition hover:brightness-110"
                style={{ backgroundColor: inputBg }}>
                <Link2 className="h-4 w-4" />
                Sélectionner une famille…
              </button>
            </div>

            {/* Popup ajout proche */}
            {addProcheOpen && (
              <div className="mt-2 rounded-lg p-2" style={{ backgroundColor: inputBg }}>
                <p className="mb-1.5 text-[9px] font-bold uppercase tracking-wide" style={{ color: textColor, opacity: 0.65 }}>
                  Choisir un proche à ajouter
                </p>
                <div className="space-y-1">
                  {RELATION_CARD_TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => {
                        addCardFromTemplate(tpl);
                        setAddProcheOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs transition hover:brightness-110"
                      style={{ backgroundColor: sectionBg }}
                    >
                      <span className="text-base">{tpl.icon}</span>
                      <span style={{ color: textColor }}>{tpl.name}</span>
                      <span
                        className="ml-auto rounded px-1 py-0.5 text-[9px] font-bold"
                        style={{ backgroundColor: `${tpl.color}30`, color: tpl.color }}
                      >
                        G{tpl.generation}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Nom & sexe */}
          <div className="mb-4 rounded-lg p-3" style={{ backgroundColor: sectionBg }}>
            <p className="mb-2 flex items-center gap-2 text-xs font-bold" style={{ color: textColor, opacity: 0.85 }}>
              <span className="flex h-5 w-5 items-center justify-center rounded bg-cyan-500 text-[10px]">👤</span>
              Nom & sexe
            </p>
            <div className="grid grid-cols-2 gap-2">
              {(["prenom", "nom", "autresPrenoms", "titre"] as const).map((field) => (
                <div key={field}>
                  <label className="mb-1 block text-[9px]" style={{ color: textColor, opacity: 0.6 }}>
                    {field === "prenom" ? "Prénom" : field === "nom" ? "Nom"
                      : field === "autresPrenoms" ? "Autres prénoms" : "Titre"}
                  </label>
                  <input
                    type="text"
                    value={openCard[field]}
                    onChange={(e) => updateCard(openCard.id, { [field]: e.target.value })}
                    className="w-full rounded px-2 py-1 text-xs"
                    style={{ backgroundColor: inputBg, color: textColor }}
                    placeholder={field === "prenom" ? "Prénom" : field === "nom" ? "Nom" : ""}
                  />
                </div>
              ))}
              <div>
                <label className="mb-1 block text-[9px]" style={{ color: textColor, opacity: 0.6 }}>Sexe</label>
                <select
                  value={openCard.sexe}
                  onChange={(e) => updateCard(openCard.id, { sexe: e.target.value as "F" | "M" })}
                  className="w-full rounded px-2 py-1 text-xs"
                  style={{ backgroundColor: inputBg, color: textColor }}
                >
                  <option value="F">Féminin</option>
                  <option value="M">Masculin</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[9px]" style={{ color: textColor, opacity: 0.6 }}>Forme</label>
                <select
                  value={openCard.shape}
                  onChange={(e) => updateCard(openCard.id, { shape: e.target.value as PlatonSolidId })}
                  className="w-full rounded px-2 py-1 text-xs"
                  style={{ backgroundColor: inputBg, color: textColor }}
                >
                  {PLATON_SOLIDS.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Scores */}
          <div className="mb-4 rounded-lg p-3" style={{ backgroundColor: sectionBg }}>
            <p className="mb-2 flex items-center gap-2 text-xs font-bold" style={{ color: textColor, opacity: 0.85 }}>
              <span className="flex h-5 w-5 items-center justify-center rounded bg-amber-500 text-[10px]">📊</span>
              Scores
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-[9px]" style={{ color: textColor, opacity: 0.6 }}>But</label>
                <select
                  value={openCard.purpose}
                  onChange={(e) => updateCard(openCard.id, { purpose: e.target.value })}
                  className="w-full rounded px-2 py-1 text-xs"
                  style={{ backgroundColor: inputBg, color: textColor }}
                >
                  {PURPOSE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[9px]" style={{ color: textColor, opacity: 0.6 }}>État</label>
                <select
                  value={openCard.state}
                  onChange={(e) => updateCard(openCard.id, { state: e.target.value })}
                  className="w-full rounded px-2 py-1 text-xs"
                  style={{ backgroundColor: inputBg, color: textColor }}
                >
                  {RELATION_STATE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              {(["sla", "slsa", "slpmo", "slm", "nsb", "scoreLumiere"] as const).map((key) => (
                <div key={key}>
                  <label className="mb-1 block text-[9px]" style={{ color: textColor, opacity: 0.6 }}>
                    {key === "scoreLumiere" ? "Score Lumière" : key.toUpperCase()}
                  </label>
                  <input
                    type="number"
                    value={openCard[key] ?? ""}
                    onChange={(e) =>
                      updateCard(openCard.id, {
                        [key]: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    onFocus={(e) => e.currentTarget.select()}
                    placeholder="—"
                    className="w-full rounded px-2 py-1 text-center font-mono text-xs"
                    style={{ backgroundColor: inputBg, color: textColor }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Événements */}
          <div className="rounded-lg p-3" style={{ backgroundColor: sectionBg }}>
            <p className="mb-2 flex items-center gap-2 text-xs font-bold" style={{ color: textColor, opacity: 0.85 }}>
              <span className="flex h-5 w-5 items-center justify-center rounded bg-yellow-500 text-[10px]">⭐</span>
              Événements ({openCard.evenements.length})
            </p>
            {openCard.evenements.map((evt, i) => (
              <div key={i} className="mb-2 flex items-center gap-2 rounded p-2 text-xs"
                style={{ backgroundColor: inputBg }}>
                <span>📜</span>
                <div className="flex-1">
                  <p className="font-medium" style={{ color: textColor }}>{evt.type}</p>
                  <p style={{ color: textColor, opacity: 0.55 }}>{evt.date || "Aucune date saisie"}</p>
                </div>
              </div>
            ))}
            <button
              onClick={() => addEvenement(openCard.id)}
              className="mt-2 w-full rounded py-1 text-[10px] text-cyan-300 transition hover:brightness-110"
              style={{ backgroundColor: inputBg }}
            >
              + Ajouter un événement
            </button>
          </div>

          <button
            onClick={() => setOpenCardId(null)}
            className="mt-4 w-full rounded-lg py-2 text-xs font-medium transition hover:brightness-110"
            style={{ backgroundColor: sectionBg, color: textColor }}
          >
            Fermer
          </button>
        </div>
      )}

      {/* Drawer */}
      {!openCard && (
        <div
          className="w-48 shrink-0 space-y-2 rounded-xl p-3"
          style={{ backgroundColor: canvasColor, border: "1px solid rgba(0,0,0,0.15)" }}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: textColor, opacity: 0.6 }}>
            6 cartes de base
          </p>
          <div className="space-y-1.5">
            {RELATION_CARD_TEMPLATES.map((card) => (
              <div
                key={card.id}
                draggable
                onDragStart={(e) => handleDragStart(e, card)}
                className="flex cursor-grab items-center gap-2 rounded-lg px-2 py-2 text-xs shadow-sm transition hover:brightness-110 active:cursor-grabbing"
                style={{
                  backgroundColor: sectionBg,
                  border: "1px solid rgba(0,0,0,0.1)",
                  borderLeft: `4px solid ${card.color}`,
                }}
              >
                <span className="text-base">{card.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium" style={{ color: textColor }}>{card.name}</p>
                  <p className="text-[9px]" style={{ color: textColor, opacity: 0.55 }}>
                    {card.generation === 0 ? "Origine" : `G${card.generation}`} ·{" "}
                    {card.gender === "F" ? "Fém" : "Masc"}
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
