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

const AUTRES_NOMS_TYPES = [
  "Autre nom", "Nom à double canon", "Nom d'adoption", "Nom de famille",
  "Nom de naissance", "Nom de scène", "Nom famille de fécondation adultère caché",
  "Nom marital", "Nom officiel", "Nom professionnel", "Nom religieux",
  "Surnom", "Titre", "Variation du nom",
] as const;

type AutreNom = { id: string; type: string; value: string };
type CardMedia = { id: string; url: string; title: string; order: number };

type LocalCard = {
  id: string;
  template: RelationCardTemplate;
  niveau: number; // freely editable; drives canvas row position
  xOrder: number; // horizontal sort order within a niveau band
  autresNoms: AutreNom[];
  medias: CardMedia[];
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

// Connection: undirected pair of card IDs + editable attributes
type Connection = {
  id: string;       // unique id for this connection
  a: string;        // card ID
  b: string;        // card ID
  color: string;    // hex color of the relation arc
  sla: number | null;
  slsa: number | null;
  slpmo: number | null;
  slm: number | null;
  token: string;    // free-text access token / label
};

// Co-acteur categories for the "Ajouter des co-acteurs" panel
type CoActeurCategory = {
  id: string;
  name: string;
  icon: string;
  templates: RelationCardTemplate[];
};

const CO_ACTEUR_CATEGORIES: CoActeurCategory[] = [
  {
    id: "guides",
    name: "Guides",
    icon: "✨",
    templates: [
      { id: "guide-lumiere",  name: "Guide de Lumière",  relation_type: "guide de lumière",  generation: 2, lignee: "consultante", gender: "F", color: "#F59E0B", icon: "✨" },
      { id: "ange-gardien",   name: "Ange Gardien",       relation_type: "ange gardien",       generation: 2, lignee: "consultante", gender: "F", color: "#A78BFA", icon: "🕊️" },
      { id: "ancetre-guide",  name: "Ancêtre Guide",      relation_type: "ancêtre guide",      generation: 3, lignee: "paternelle", gender: "M", color: "#6366F1", icon: "👴" },
      { id: "guide-totem",    name: "Guide Totem",        relation_type: "guide totem",        generation: 0, lignee: "consultante", gender: "M", color: "#10B981", icon: "🦅" },
      { id: "source-divine",  name: "Source Divine",      relation_type: "source divine",      generation: 120, lignee: "consultante", gender: "F", color: "#FBBF24", icon: "☀️" },
      { id: "observateur-quantique", name: "Observateur Quantique", relation_type: "observateur quantique", generation: 0, lignee: "consultante", gender: "M", color: "#06B6D4", icon: "ለ" },
    ],
  },
  {
    id: "mentors",
    name: "Mentors",
    icon: "🎓",
    templates: [
      { id: "mentor-m",       name: "Mentor",             relation_type: "mentor",             generation: 1, lignee: "paternelle", gender: "M", color: "#0EA5E9", icon: "🎓" },
      { id: "mentore-f",      name: "Mentore",            relation_type: "mentore",            generation: 1, lignee: "maternelle", gender: "F", color: "#EC4899", icon: "🎓" },
      { id: "enseignant",     name: "Enseignant·e",       relation_type: "enseignant",         generation: 1, lignee: "consultante", gender: "F", color: "#F97316", icon: "📚" },
      { id: "therapeute",     name: "Thérapeute",         relation_type: "thérapeute",         generation: 0, lignee: "consultante", gender: "F", color: "#14B8A6", icon: "💆" },
    ],
  },
  {
    id: "roles-familiaux",
    name: "Rôles familiaux",
    icon: "👨‍👩‍👧",
    templates: RELATION_CARD_TEMPLATES as unknown as RelationCardTemplate[],
  },
];

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
const MIN_ROWS = 4; // canvas minimum même sans carte

// Returns label for a given niveau in the current view mode
function levelLabel(niveau: number, mode: ViewMode): string {
  const prefix = mode === "generations" ? "G" : mode === "niveaux" ? "N" : "I";
  return `${prefix}${niveau}`;
}

type LayoutResult = {
  positions: Map<string, { cx: number; cy: number }>;
  sortedLevels: number[]; // descending (highest at top)
  canvasH: number;
};

// Positions cards by their `niveau` value. Higher niveau = higher on canvas.
// Canvas height adapts to the spread of levels present.
function computeLayout(cards: LocalCard[]): LayoutResult {
  const uniqueLevels = [...new Set(cards.map((c) => c.niveau))];
  // Sort descending so highest level = row 0 (top of canvas)
  const sortedLevels = uniqueLevels.sort((a, b) => b - a);
  const rowCount = Math.max(MIN_ROWS, sortedLevels.length);
  const canvasH = rowCount * ROW_H;

  // row index for each level (highest = 0)
  const levelRow = new Map(sortedLevels.map((lvl, i) => [lvl, i]));

  const byLevel = new Map<number, LocalCard[]>();
  for (const card of cards) {
    const n = card.niveau;
    if (!byLevel.has(n)) byLevel.set(n, []);
    byLevel.get(n)!.push(card);
  }

  const positions = new Map<string, { cx: number; cy: number }>();
  for (const [lvl, lvlCards] of byLevel) {
    const row = levelRow.get(lvl)!;
    const cy = row * ROW_H + ROW_H / 2;
    const sorted = [...lvlCards].sort((a, b) => a.xOrder - b.xOrder);
    const gap = 60;
    const totalW = sorted.length * CARD_SZ + (sorted.length - 1) * gap;
    let x = (CANVAS_W - totalW) / 2 + CARD_SZ / 2;
    for (const card of sorted) {
      positions.set(card.id, { cx: x, cy });
      x += CARD_SZ + gap;
    }
  }

  return { positions, sortedLevels, canvasH };
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

// ── Edit Person Panel ──────────────────────────────────────────────────────

function EditPersonPanel({
  card,
  onUpdate,
  sectionBg,
  inputBg,
  textColor,
}: {
  card: LocalCard;
  onUpdate: (updates: Partial<LocalCard>) => void;
  sectionBg: string;
  inputBg: string;
  textColor: string;
}) {
  const [diaporamaIdx, setDiaporamaIdx] = useState<number | null>(null);

  // ── Autres noms ──
  const addAutreNom = () =>
    onUpdate({
      autresNoms: [
        ...card.autresNoms,
        { id: `nom-${Date.now()}`, type: AUTRES_NOMS_TYPES[0], value: "" },
      ],
    });

  const updateAutreNom = (id: string, field: "type" | "value", val: string) =>
    onUpdate({
      autresNoms: card.autresNoms.map((n) =>
        n.id === id ? { ...n, [field]: val } : n,
      ),
    });

  const removeAutreNom = (id: string) =>
    onUpdate({ autresNoms: card.autresNoms.filter((n) => n.id !== id) });

  // ── Médias ──
  const addMedia = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const newMedias = files.map((f, i) => ({
      id: `media-${Date.now()}-${i}`,
      url: URL.createObjectURL(f),
      title: f.name.replace(/\.[^.]+$/, ""),
      order: card.medias.length + i,
    }));
    onUpdate({ medias: [...card.medias, ...newMedias] });
    e.target.value = "";
  };

  const removeMedia = (id: string) =>
    onUpdate({ medias: card.medias.filter((m) => m.id !== id) });

  const moveMedia = (id: string, dir: "left" | "right") => {
    const sorted = [...card.medias].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((m) => m.id === id);
    const swapIdx = dir === "left" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const a = sorted[idx], b = sorted[swapIdx];
    onUpdate({
      medias: card.medias.map((m) => {
        if (m.id === a.id) return { ...m, order: b.order };
        if (m.id === b.id) return { ...m, order: a.order };
        return m;
      }),
    });
  };

  const sortedMedias = [...card.medias].sort((a, b) => a.order - b.order);

  return (
    <>
      {/* Autres noms */}
      <div className="mt-4 rounded-lg p-3" style={{ backgroundColor: sectionBg }}>
        <p className="mb-2 flex items-center gap-2 text-xs font-bold" style={{ color: textColor, opacity: 0.85 }}>
          <span className="flex h-5 w-5 items-center justify-center rounded bg-blue-500 text-[10px]">👤+</span>
          Autres noms ({card.autresNoms.length})
        </p>
        <div className="space-y-2">
          {card.autresNoms.map((n) => (
            <div key={n.id} className="rounded p-2" style={{ backgroundColor: inputBg }}>
              <div className="mb-1 flex items-center gap-1">
                <select
                  value={n.type}
                  onChange={(e) => updateAutreNom(n.id, "type", e.target.value)}
                  className="flex-1 rounded px-1.5 py-0.5 text-[10px]"
                  style={{ backgroundColor: darken(inputBg, 0.1), color: textColor }}
                >
                  {AUTRES_NOMS_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => removeAutreNom(n.id)}
                  className="text-red-400 hover:text-red-300 text-xs px-1"
                >✕</button>
              </div>
              <input
                type="text"
                value={n.value}
                onChange={(e) => updateAutreNom(n.id, "value", e.target.value)}
                placeholder="Valeur…"
                className="w-full rounded px-2 py-1 text-xs"
                style={{ backgroundColor: darken(inputBg, 0.08), color: textColor }}
              />
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addAutreNom}
          className="mt-2 w-full rounded py-1 text-[10px] text-cyan-300 transition hover:brightness-110"
          style={{ backgroundColor: inputBg }}
        >
          + Ajouter un nom
        </button>
      </div>

      {/* Médias */}
      <div className="mt-4 rounded-lg p-3" style={{ backgroundColor: sectionBg }}>
        <div className="mb-2 flex items-center justify-between">
          <p className="flex items-center gap-2 text-xs font-bold" style={{ color: textColor, opacity: 0.85 }}>
            <span className="flex h-5 w-5 items-center justify-center rounded bg-blue-500 text-[10px]">🖼</span>
            Médias ({card.medias.length})
          </p>
          <div className="flex gap-1">
            {sortedMedias.length > 0 && (
              <button
                type="button"
                onClick={() => setDiaporamaIdx(0)}
                className="rounded px-2 py-0.5 text-[9px] transition hover:brightness-110"
                style={{ backgroundColor: inputBg, color: textColor }}
              >
                ▶ Diaporama
              </button>
            )}
            <label className="cursor-pointer rounded px-2 py-0.5 text-[9px] text-cyan-300 transition hover:brightness-110"
              style={{ backgroundColor: inputBg }}>
              + Ajouter
              <input type="file" accept="image/*" multiple className="hidden" onChange={addMedia} />
            </label>
          </div>
        </div>

        {sortedMedias.length === 0 ? (
          <p className="py-4 text-center text-[10px]" style={{ color: textColor, opacity: 0.4 }}>
            Aucun média — cliquez + Ajouter
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-1.5">
            {sortedMedias.map((m, i) => (
              <div key={m.id} className="group relative rounded overflow-hidden"
                style={{ backgroundColor: darken(inputBg, 0.1) }}>
                <img
                  src={m.url}
                  alt={m.title}
                  className="h-20 w-full object-cover"
                />
                {/* Overlay controls */}
                <div className="absolute inset-0 flex flex-col justify-between p-1 opacity-0 transition group-hover:opacity-100"
                  style={{ background: "rgba(0,0,0,0.55)" }}>
                  <div className="flex justify-end">
                    <button type="button" onClick={() => removeMedia(m.id)}
                      className="rounded bg-red-700/80 px-1 text-[9px] text-white">✕</button>
                  </div>
                  <div>
                    <p className="truncate text-[8px] text-white">{m.title}</p>
                    <div className="mt-0.5 flex gap-0.5">
                      <button type="button" onClick={() => moveMedia(m.id, "left")}
                        disabled={i === 0}
                        className="rounded bg-white/20 px-1.5 text-[9px] text-white disabled:opacity-30">←</button>
                      <button type="button" onClick={() => moveMedia(m.id, "right")}
                        disabled={i === sortedMedias.length - 1}
                        className="rounded bg-white/20 px-1.5 text-[9px] text-white disabled:opacity-30">→</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Diaporama overlay */}
      {diaporamaIdx !== null && sortedMedias[diaporamaIdx] && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.92)" }}
          onClick={() => setDiaporamaIdx(null)}
        >
          <img
            src={sortedMedias[diaporamaIdx].url}
            alt={sortedMedias[diaporamaIdx].title}
            className="max-h-[80vh] max-w-[90vw] rounded-xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <p className="mt-3 text-sm text-white/70">{sortedMedias[diaporamaIdx].title}</p>
          <div className="mt-4 flex items-center gap-4">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setDiaporamaIdx((i) => Math.max(0, (i ?? 0) - 1)); }}
              disabled={diaporamaIdx === 0}
              className="rounded-full bg-white/10 px-4 py-2 text-white transition hover:bg-white/20 disabled:opacity-30"
            >←</button>
            <span className="text-xs text-white/50">{diaporamaIdx + 1} / {sortedMedias.length}</span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setDiaporamaIdx((i) => Math.min(sortedMedias.length - 1, (i ?? 0) + 1)); }}
              disabled={diaporamaIdx === sortedMedias.length - 1}
              className="rounded-full bg-white/10 px-4 py-2 text-white transition hover:bg-white/20 disabled:opacity-30"
            >→</button>
          </div>
          <button
            type="button"
            onClick={() => setDiaporamaIdx(null)}
            className="mt-4 text-xs text-white/40 hover:text-white/70"
          >Fermer le diaporama</button>
        </div>
      )}
    </>
  );
}

// ── Sephiroth Tree overlay ─────────────────────────────────────────────────

const SEPHIROTH = [
  { id:  1, name: "Keter",    abbr: "KTR", x: 90,  y: 18,  color: "#F8F8F8", stroke: "#C0C0C0" },
  { id:  2, name: "Chokhmah", abbr: "CHK", x: 152, y: 54,  color: "#C0C0C0", stroke: "#808080" },
  { id:  3, name: "Binah",    abbr: "BIN", x: 28,  y: 54,  color: "#1E2A4A", stroke: "#4A6090" },
  { id:  0, name: "Daath",    abbr: "DA",  x: 90,  y: 90,  color: "#9070B0", stroke: "#6040A0" }, // hidden
  { id:  4, name: "Chesed",   abbr: "CHS", x: 152, y: 130, color: "#3B82F6", stroke: "#2563EB" },
  { id:  5, name: "Geburah",  abbr: "GBR", x: 28,  y: 130, color: "#EF4444", stroke: "#DC2626" },
  { id:  6, name: "Tiferet",  abbr: "TIF", x: 90,  y: 165, color: "#F59E0B", stroke: "#D97706" },
  { id:  7, name: "Netzach",  abbr: "NTZ", x: 152, y: 205, color: "#22C55E", stroke: "#16A34A" },
  { id:  8, name: "Hod",      abbr: "HOD", x: 28,  y: 205, color: "#F97316", stroke: "#EA580C" },
  { id:  9, name: "Yesod",    abbr: "YSD", x: 90,  y: 242, color: "#A78BFA", stroke: "#7C3AED" },
  { id: 10, name: "Malkuth",  abbr: "MLK", x: 90,  y: 280, color: "#78716C", stroke: "#57534E" },
] as const;

// Main structural paths (pairs of sephirah indices in SEPHIROTH array)
const SEPHIROTH_PATHS: Array<[number, number]> = [
  [0, 1], [0, 2],          // Keter → Chokhmah, Binah
  [1, 2],                  // Chokhmah ↔ Binah
  [1, 3], [2, 3],          // → Daath
  [1, 4], [2, 5],          // right/left pillar
  [3, 4], [3, 5], [3, 6],  // Daath → Chesed, Geburah, Tiferet
  [4, 5], [4, 6], [5, 6],  // Chesed/Geburah/Tiferet triangle
  [4, 7], [5, 8],          // pillars continue
  [6, 7], [6, 8], [6, 9],  // Tiferet → Netzach, Hod, Yesod
  [7, 8], [7, 9], [8, 9],  // Netzach/Hod/Yesod
  [9, 10],                 // Yesod → Malkuth
];

function SephirothOverlay() {
  const W = 182;
  const H = 300;
  const R = 14; // node radius
  return (
    <div
      className="pointer-events-none absolute right-4 top-4 rounded-xl"
      style={{ backgroundColor: "rgba(0,0,0,0.45)", padding: 8 }}
    >
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        {/* Paths */}
        {SEPHIROTH_PATHS.map(([ai, bi]) => {
          const a = SEPHIROTH[ai];
          const b = SEPHIROTH[bi];
          const isDaath = a.id === 0 || b.id === 0;
          return (
            <line
              key={`${ai}-${bi}`}
              x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              stroke="rgba(255,255,255,0.2)"
              strokeWidth={isDaath ? 1 : 1.5}
              strokeDasharray={isDaath ? "3 3" : undefined}
            />
          );
        })}
        {/* Nodes */}
        {SEPHIROTH.map((s) => {
          const isDaath = s.id === 0;
          return (
            <g key={s.id}>
              <circle
                cx={s.x} cy={s.y} r={R}
                fill={isDaath ? "rgba(144,112,176,0.3)" : s.color}
                stroke={s.stroke}
                strokeWidth={isDaath ? 1 : 1.5}
                strokeDasharray={isDaath ? "3 2" : undefined}
                opacity={isDaath ? 0.7 : 1}
              />
              <text
                x={s.x} y={s.y + 1}
                textAnchor="middle" dominantBaseline="middle"
                fontSize={isDaath ? 6 : 7}
                fontWeight="bold"
                fill={isDaath ? "#C0A0D0" : (["#F8F8F8","#C0C0C0"].includes(s.color) ? "#333" : "#fff")}
              >
                {s.abbr}
              </text>
            </g>
          );
        })}
        {/* Title */}
        <text x={W / 2} y={H - 6} textAnchor="middle" fontSize={7} fill="rgba(255,255,255,0.4)" fontStyle="italic">
          Arbre des Séphiroth
        </text>
      </svg>
    </div>
  );
}

function RelationsSection({
  card,
  allCards,
  connections,
  openConnId,
  onSelectConn,
  onUpdateConn,
  sectionBg,
  inputBg,
  textColor,
}: {
  card: { id: string; template: { name: string; color: string; icon: string } };
  allCards: Array<{ id: string; template: { name: string; color: string; icon: string }; prenom: string }>;
  connections: Connection[];
  openConnId: string | null;
  onSelectConn: (id: string) => void;
  onUpdateConn: (id: string, updates: Partial<Connection>) => void;
  sectionBg: string;
  inputBg: string;
  textColor: string;
}) {
  const cardConns = connections.filter((c) => c.a === card.id || c.b === card.id);

  if (cardConns.length === 0) return null;

  return (
    <div className="mb-4 rounded-lg p-3" style={{ backgroundColor: sectionBg }}>
      <p className="mb-2 flex items-center gap-2 text-xs font-bold" style={{ color: textColor, opacity: 0.85 }}>
        <span className="flex h-5 w-5 items-center justify-center rounded bg-fuchsia-500 text-[10px]">↔</span>
        Relations ({cardConns.length})
      </p>
      <div className="space-y-1">
        {cardConns.map((conn) => {
          const otherId = conn.a === card.id ? conn.b : conn.a;
          const other = allCards.find((c) => c.id === otherId);
          const isOpen = openConnId === conn.id;
          return (
            <div key={conn.id}>
              {/* Relation row: arc icon + other card icon + name + select */}
              <button
                type="button"
                onClick={() => onSelectConn(conn.id)}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs transition hover:brightness-110"
                style={{
                  backgroundColor: isOpen ? darken(inputBg, 0.08) : inputBg,
                  borderLeft: `3px solid ${conn.color}`,
                }}
              >
                {/* Arc indicator */}
                <svg width="20" height="14" viewBox="0 0 20 14">
                  <path d="M2 12 C2 2, 18 2, 18 12" stroke={conn.color} strokeWidth="2" fill="none" />
                  <circle cx="2" cy="12" r="2.5" fill={card.template.color} />
                  <circle cx="18" cy="12" r="2.5" fill={other?.template.color ?? "#94A3B8"} />
                </svg>
                <span className="text-base">{other?.template.icon ?? "?"}</span>
                <span style={{ color: textColor }}>
                  {other?.prenom || other?.template.name || "—"}
                </span>
                <span className="ml-auto text-[9px]" style={{ opacity: 0.5 }}>
                  {isOpen ? "▾" : "▸"}
                </span>
              </button>

              {/* Relation editor */}
              {isOpen && (
                <div className="mt-1 space-y-2 rounded p-2" style={{ backgroundColor: darken(inputBg, 0.12) }}>
                  {/* Color */}
                  <div className="flex items-center gap-2">
                    <span className="text-[9px]" style={{ color: textColor, opacity: 0.6 }}>Couleur</span>
                    <label className="relative h-6 w-9 cursor-pointer overflow-hidden rounded border" style={{ borderColor: "rgba(0,0,0,0.15)" }}>
                      <span className="absolute inset-0" style={{ backgroundColor: conn.color }} />
                      <input
                        type="color"
                        value={conn.color}
                        onChange={(e) => onUpdateConn(conn.id, { color: e.target.value })}
                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                      />
                    </label>
                    <span className="font-mono text-[9px]" style={{ color: textColor, opacity: 0.5 }}>{conn.color}</span>
                  </div>
                  {/* 4 scores */}
                  <div className="grid grid-cols-2 gap-1.5">
                    {(["sla", "slsa", "slpmo", "slm"] as const).map((key) => (
                      <div key={key}>
                        <label className="mb-0.5 block text-[8px]" style={{ color: textColor, opacity: 0.55 }}>{key.toUpperCase()}</label>
                        <input
                          type="number"
                          value={conn[key] ?? ""}
                          onChange={(e) =>
                            onUpdateConn(conn.id, {
                              [key]: e.target.value ? Number(e.target.value) : null,
                            })
                          }
                          onFocus={(e) => e.currentTarget.select()}
                          placeholder="—"
                          className="w-full rounded px-1.5 py-1 text-center font-mono text-xs"
                          style={{ backgroundColor: inputBg, color: textColor }}
                        />
                      </div>
                    ))}
                  </div>
                  {/* Token */}
                  <div>
                    <label className="mb-0.5 block text-[8px]" style={{ color: textColor, opacity: 0.55 }}>Token</label>
                    <input
                      type="text"
                      value={conn.token}
                      onChange={(e) => onUpdateConn(conn.id, { token: e.target.value })}
                      placeholder="access token…"
                      className="w-full rounded px-2 py-1 font-mono text-xs"
                      style={{ backgroundColor: inputBg, color: textColor }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CoActeurPanel({
  categories,
  onAdd,
  sectionBg,
  inputBg,
  textColor,
}: {
  categories: CoActeurCategory[];
  onAdd: (tpl: RelationCardTemplate) => void;
  sectionBg: string;
  inputBg: string;
  textColor: string;
}) {
  const [openCat, setOpenCat] = useState<string | null>(categories[0]?.id ?? null);

  return (
    <div className="mt-2 space-y-1 rounded-lg p-2" style={{ backgroundColor: inputBg }}>
      <p className="mb-1.5 text-[9px] font-bold uppercase tracking-wide" style={{ color: textColor, opacity: 0.6 }}>
        Ajouter un co-acteur
      </p>
      {categories.map((cat) => (
        <div key={cat.id}>
          <button
            type="button"
            onClick={() => setOpenCat((o) => (o === cat.id ? null : cat.id))}
            className="flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-xs font-semibold transition hover:brightness-110"
            style={{ backgroundColor: sectionBg, color: textColor }}
          >
            <span>{cat.icon}</span>
            <span>{cat.name}</span>
            <span className="ml-auto text-[10px]" style={{ opacity: 0.5 }}>
              {openCat === cat.id ? "▾" : "▸"}
            </span>
          </button>
          {openCat === cat.id && (
            <div className="mt-0.5 space-y-0.5 pl-1">
              {cat.templates.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => onAdd(tpl)}
                  className="flex w-full items-center gap-2 rounded px-2 py-1 text-[11px] transition hover:brightness-110"
                  style={{ backgroundColor: darken(sectionBg, 0.08) }}
                >
                  <span className="text-sm">{tpl.icon}</span>
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
          )}
        </div>
      ))}
    </div>
  );
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
  const [openConnId, setOpenConnId] = useState<string | null>(null);
  const [showSephiroth, setShowSephiroth] = useState(false);
  const [editPersonOpen, setEditPersonOpen] = useState(false);

  const textColor = useMemo(() => textOnColor(canvasColor), [canvasColor]);
  const sectionBg = useMemo(() => darken(canvasColor, 0.18), [canvasColor]);
  const inputBg = useMemo(() => darken(canvasColor, 0.28), [canvasColor]);

  const layout = useMemo(() => computeLayout(cards), [cards]);

  const handleDragStart = useCallback((e: React.DragEvent, card: RelationCardTemplate) => {
    setDraggedCard(card);
    e.dataTransfer.setData("text/plain", card.id);
    e.dataTransfer.effectAllowed = "copy";
  }, []);

  const addCardFromTemplate = useCallback(
    (tpl: RelationCardTemplate) => {
      const siblingsCount = cards.filter((c) => c.niveau === tpl.generation).length;
      const newCard: LocalCard = {
        id: `${tpl.id}-${Date.now()}`,
        template: tpl,
        niveau: tpl.generation,
        xOrder: siblingsCount,
        purpose: "soul_mission",
        state: "absente",
        sla: null, slsa: null, slpmo: null, slm: null,
        nsb: null, scoreLumiere: null,
        prenom: "", nom: "", autresPrenoms: "", titre: "",
        sexe: tpl.gender,
        shape: tpl.gender === "F" ? "circle" : "cube",
        evenements: [],
        autresNoms: [],
        medias: [],
      };
      const newConns: Connection[] = [];
      const mkConn = (a: string, b: string): Connection => ({
        id: `conn-${a}-${b}-${Date.now()}`,
        a, b,
        color: "#a289f0",
        sla: null, slsa: null, slpmo: null, slm: null,
        token: "",
      });
      for (const [tA, tB] of TEMPLATE_EDGES) {
        if (tpl.id === tA) {
          const match = cards.find((c) => c.template.id === tB);
          if (match) newConns.push(mkConn(newCard.id, match.id));
        } else if (tpl.id === tB) {
          const match = cards.find((c) => c.template.id === tA);
          if (match) newConns.push(mkConn(newCard.id, match.id));
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
    setEditPersonOpen(false);
  }, []);

  const updateCard = useCallback((cardId: string, updates: Partial<LocalCard>) => {
    setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, ...updates } : c)));
  }, []);

  const moveCard = useCallback((cardId: string, direction: "left" | "right") => {
    setCards((prev) => {
      const card = prev.find((c) => c.id === cardId);
      if (!card) return prev;
      const siblings = [...prev.filter((c) => c.niveau === card.niveau)]
        .sort((a, b) => a.xOrder - b.xOrder);
      const idx = siblings.findIndex((c) => c.id === cardId);
      const swapIdx = direction === "left" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= siblings.length) return prev;
      const swapCard = siblings[swapIdx];
      const newXOrder = swapCard.xOrder;
      const swapNewXOrder = card.xOrder;
      return prev.map((c) => {
        if (c.id === cardId) return { ...c, xOrder: newXOrder };
        if (c.id === swapCard.id) return { ...c, xOrder: swapNewXOrder };
        return c;
      });
    });
  }, []);

  const updateConnection = useCallback((connId: string, updates: Partial<Connection>) => {
    setConnections((prev) =>
      prev.map((c) => (c.id === connId ? { ...c, ...updates } : c)),
    );
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
          {/* Sephiroth toggle */}
          <button
            type="button"
            onClick={() => setShowSephiroth((v) => !v)}
            className="rounded px-2.5 py-1 text-[11px] font-medium transition"
            style={
              showSephiroth
                ? { backgroundColor: canvasColor, color: textColor, border: "1px solid rgba(0,0,0,0.15)" }
                : { backgroundColor: "#F3F4F6", color: "#6B7280", border: "1px solid #E5E7EB" }
            }
          >
            ✡ Séphiroth
          </button>

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
            height: layout.canvasH,
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
          {/* Row dividers + labels — dynamic, based on levels actually present */}
          {Array.from({ length: Math.ceil(layout.canvasH / ROW_H) }, (_, rowIdx) => {
            const rowTop = rowIdx * ROW_H;
            const niveau = layout.sortedLevels[rowIdx]; // may be undefined (empty rows)
            return (
              <div key={rowIdx}>
                {rowIdx > 0 && (
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
                      opacity: niveau !== undefined ? (niveau === 0 ? 1 : 0.75) : 0.25,
                    }}
                  >
                    {niveau !== undefined
                      ? levelLabel(niveau, viewMode)
                      : `${viewMode === "generations" ? "G" : viewMode === "niveaux" ? "N" : "I"}—`}
                  </span>
                </div>
              </div>
            );
          })}

          {/* SVG connection lines */}
          <svg
            className="absolute inset-0"
            style={{ pointerEvents: "none" }}
            width={CANVAS_W}
            height={layout.canvasH}
          >
            {connections.map((conn) => {
              const aPos = layout.positions.get(conn.a);
              const bPos = layout.positions.get(conn.b);
              if (!aPos || !bPos) return null;
              const isSelected = conn.id === openConnId;
              return (
                <g key={conn.id} style={{ pointerEvents: "visibleStroke", cursor: "pointer" }}>
                  {/* Wider invisible hit area */}
                  <path
                    d={bezierPath(aPos, bPos)}
                    stroke="transparent"
                    strokeWidth={16}
                    fill="none"
                    onClick={() => {
                      setOpenConnId((prev) => (prev === conn.id ? null : conn.id));
                      setOpenCardId(null);
                    }}
                  />
                  {/* Visible arc */}
                  <path
                    d={bezierPath(aPos, bPos)}
                    stroke={conn.color}
                    strokeWidth={isSelected ? 3.5 : 2}
                    fill="none"
                    opacity={isSelected ? 1 : 0.7}
                    strokeDasharray={isSelected ? "6 3" : undefined}
                    onClick={() => {
                      setOpenConnId((prev) => (prev === conn.id ? null : conn.id));
                      setOpenCardId(null);
                    }}
                  />
                </g>
              );
            })}
          </svg>

          {/* Cards */}
          {cards.map((card) => {
            const pos = layout.positions.get(card.id);
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

          {/* Séphiroth overlay — top right */}
          {showSephiroth && <SephirothOverlay />}

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
          {/* Relations de cette carte */}
          <RelationsSection
            card={openCard}
            allCards={cards}
            connections={connections}
            openConnId={openConnId}
            onSelectConn={(id) => setOpenConnId((prev) => (prev === id ? null : id))}
            onUpdateConn={updateConnection}
            sectionBg={sectionBg}
            inputBg={inputBg}
            textColor={textColor}
          />

          {/* Header + déplacement horizontal */}
          <div className="mb-3 flex items-center gap-3">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg text-3xl"
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
          {/* ← position → */}
          <div className="mb-4 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => moveCard(openCard.id, "left")}
              title="Déplacer à gauche"
              className="flex h-8 w-10 items-center justify-center rounded text-base font-bold transition hover:brightness-110"
              style={{ backgroundColor: sectionBg, color: textColor }}
            >
              ←
            </button>
            <span className="text-[9px]" style={{ color: textColor, opacity: 0.45 }}>
              position dans la bande
            </span>
            <button
              type="button"
              onClick={() => moveCard(openCard.id, "right")}
              title="Déplacer à droite"
              className="flex h-8 w-10 items-center justify-center rounded text-base font-bold transition hover:brightness-110"
              style={{ backgroundColor: sectionBg, color: textColor }}
            >
              →
            </button>
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
                Ajouter co-acteurs
              </button>
              <button
                onClick={() => setEditPersonOpen((v) => !v)}
                className="flex flex-col items-center gap-1 rounded-lg p-2 text-[10px] text-cyan-300 transition hover:brightness-110"
                style={{ backgroundColor: editPersonOpen ? darken(inputBg, 0.1) : inputBg }}
              >
                <Pencil className="h-5 w-5" />
                Éditer la personne
              </button>
              <button className="flex flex-col items-center gap-1 rounded-lg p-2 text-[10px] text-cyan-300 transition hover:brightness-110"
                style={{ backgroundColor: inputBg }}>
                <span className="text-lg leading-none">ለ</span>
                Observateur Quantique
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

            {/* Popup co-acteurs — 3 catégories */}
            {addProcheOpen && (
              <CoActeurPanel
                categories={CO_ACTEUR_CATEGORIES}
                onAdd={(tpl) => { addCardFromTemplate(tpl); setAddProcheOpen(false); }}
                sectionBg={sectionBg}
                inputBg={inputBg}
                textColor={textColor}
              />
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

          {/* Niveau */}
          <div className="mb-4 rounded-lg p-3" style={{ backgroundColor: sectionBg }}>
            <p className="mb-2 flex items-center gap-2 text-xs font-bold" style={{ color: textColor, opacity: 0.85 }}>
              <span className="flex h-5 w-5 items-center justify-center rounded bg-violet-500 text-[10px]">N</span>
              Niveau dans la séquence
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => updateCard(openCard.id, { niveau: Math.max(0, openCard.niveau - 1) })}
                className="flex h-8 w-8 items-center justify-center rounded text-lg font-bold transition hover:brightness-110"
                style={{ backgroundColor: inputBg, color: textColor }}
              >
                −
              </button>
              <input
                type="number"
                value={openCard.niveau}
                onChange={(e) =>
                  updateCard(openCard.id, {
                    niveau: isNaN(parseInt(e.target.value)) ? 0 : parseInt(e.target.value),
                  })
                }
                onFocus={(e) => e.currentTarget.select()}
                className="w-full rounded px-2 py-1.5 text-center font-mono text-lg font-bold"
                style={{ backgroundColor: inputBg, color: textColor }}
                min={0}
              />
              <button
                type="button"
                onClick={() => updateCard(openCard.id, { niveau: openCard.niveau + 1 })}
                className="flex h-8 w-8 items-center justify-center rounded text-lg font-bold transition hover:brightness-110"
                style={{ backgroundColor: inputBg, color: textColor }}
              >
                +
              </button>
            </div>
            <p className="mt-1 text-center text-[9px]" style={{ color: textColor, opacity: 0.5 }}>
              {levelLabel(openCard.niveau, viewMode)} · positionne la carte sur le canvas
            </p>
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

          {/* Autres noms + Médias (mode édition) */}
          {editPersonOpen && (
            <EditPersonPanel
              card={openCard}
              onUpdate={(updates) => updateCard(openCard.id, updates)}
              sectionBg={sectionBg}
              inputBg={inputBg}
              textColor={textColor}
            />
          )}

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
