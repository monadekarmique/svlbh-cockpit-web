// @ts-nocheck — composant porté tel quel, à typer dans une passe ultérieure
"use client";

import { useState, useMemo, useCallback } from "react";

// Session Gui 鬼 — Énergies Parasitaires Permanentes.
// Visualisation hDOM × méridiens MTC × Gui (Adam/Eve propagation).
// Composant porté depuis ~/Downloads/gui-hdom-viz.tsx (DEC Patrick 2026-06-03).

export const SESSION_META = {
  id: "VIZ-GUI-ENERGIES-PARASITAIRES-PERMANENTES",
  date: "2026-06-03",
  titre: "Gui 鬼 — Énergies Parasitaires Permanentes",
  sousTitre: "Visualisation hDOM × méridiens MTC × propagation Adam/Eve",
  auteur: "Patrick Bays × Claude.ai",
  destination: "SVLBH Cockpit — Historique sessions",
  statut: "active" as const,
};

// ═══ Composant porté tel quel ═══

const PALETTE = {
  roseProfond: "#8B3A62",
  roseMoyen: "#C27894",
  beige: "#F5EDE4",
  or: "#B8965A",
  bg: "#FBF7F2",
  text: "#3D2B1F",
  textLight: "#7A6A5E",
  guiActive: "#D94040",
  guiDormant: "#E8A060",
  guiAncien: "#9B59B6",
  meridienHighlight: "#2E86AB",
  gridLine: "#E0D5C8",
  white: "#FFFFFF",
};

const DIMENSIONS = [
  { id: 1, name: "D1 — Physique", chakras: 4 },
  { id: 2, name: "D2 — Éthérique", chakras: 4 },
  { id: 3, name: "D3 — Astral", chakras: 4 },
  { id: 4, name: "D4 — Mental", chakras: 4 },
  { id: 5, name: "D5 — Causal", chakras: 3 },
  { id: 6, name: "D6 — Bouddhique", chakras: 4 },
  { id: 7, name: "D7 — Atmique", chakras: 3 },
  { id: 8, name: "D8 — Monadique", chakras: 4 },
  { id: 9, name: "D9 — Logoïque", chakras: 3 },
];

const MERIDIENS = [
  { code: "LU", name: "Poumon", element: "Métal", yin: true },
  { code: "LI", name: "Gros Intestin", element: "Métal", yin: false },
  { code: "ST", name: "Estomac", element: "Terre", yin: false },
  { code: "SP", name: "Rate", element: "Terre", yin: true },
  { code: "HT", name: "Cœur", element: "Feu", yin: true },
  { code: "SI", name: "Intestin Grêle", element: "Feu", yin: false },
  { code: "BL", name: "Vessie", element: "Eau", yin: false },
  { code: "KI", name: "Rein", element: "Eau", yin: true },
  { code: "PC", name: "Péricarde", element: "Feu Min.", yin: true },
  { code: "TE", name: "Triple Réchauffeur", element: "Feu Min.", yin: false },
  { code: "GB", name: "Vésicule Biliaire", element: "Bois", yin: false },
  { code: "LR", name: "Foie", element: "Bois", yin: true },
  { code: "GV", name: "Vaisseau Gouverneur", element: "Extra", yin: false },
  { code: "CV", name: "Vaisseau Conception", element: "Extra", yin: true },
];

const ELEMENT_COLORS = {
  Métal: "#C0C0C0",
  Terre: PALETTE.or,
  Feu: "#E74C3C",
  Eau: "#2E86AB",
  Bois: "#27AE60",
  "Feu Min.": "#E67E22",
  Extra: PALETTE.roseProfond,
};

// Generate deterministic parasitic data
function generateGuiData() {
  const guis = [];
  let id = 0;
  const seed = [3,1,7,2,5,0,4,8,6,1,3,7,2,0,5,8,4,6,1,3,2,7,0,5,4,8,6,1,3,2,5,0,7];
  let si = 0;
  const next = () => seed[si++ % seed.length];

  DIMENSIONS.forEach((dim) => {
    for (let c = 0; c < dim.chakras; c++) {
      if ((next() + dim.id + c) % 3 === 0) {
        const lignee = (next() + c) % 2 === 0 ? "adam" : "eve";
        const types = ["actif", "dormant", "ancien"];
        const type = types[(next() + dim.id) % 3];
        const mIdx = (next() * 2 + dim.id + c) % MERIDIENS.length;
        const gen = ((next() + c) % 7) + 1;
        guis.push({
          id: id++,
          dim: dim.id,
          chakra: c,
          lignee,
          type,
          meridien: MERIDIENS[mIdx].code,
          generation: gen,
          intensite: 30 + ((next() * 10 + dim.id * 5 + c * 8) % 70),
        });
      }
    }
  });
  return guis;
}

const GUI_DATA = generateGuiData();

const GuiMarker = ({ gui, x, y, size, selected, onClick }) => {
  const color = gui.type === "actif" ? PALETTE.guiActive : gui.type === "dormant" ? PALETTE.guiDormant : PALETTE.guiAncien;
  const opacity = 0.4 + (gui.intensite / 100) * 0.6;
  const r = (size / 2) * (0.5 + (gui.intensite / 100) * 0.5);

  return (
    <g onClick={() => onClick(gui)} style={{ cursor: "pointer" }}>
      <circle cx={x} cy={y} r={r + 4} fill={color} opacity={opacity * 0.25} />
      <circle cx={x} cy={y} r={r} fill={color} opacity={opacity} stroke={selected ? PALETTE.or : "none"} strokeWidth={selected ? 2.5 : 0} />
      <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="middle" fill={PALETTE.white} fontSize={8} fontWeight="bold" style={{ pointerEvents: "none" }}>
        鬼
      </text>
    </g>
  );
};

const PropagationLines = ({ guis, getPos, cellSize }) => {
  const lines = [];
  for (let i = 0; i < guis.length; i++) {
    for (let j = i + 1; j < guis.length; j++) {
      const a = guis[i], b = guis[j];
      if (a.lignee === b.lignee && Math.abs(a.dim - b.dim) <= 2 && a.meridien === b.meridien) {
        const pa = getPos(a.dim, a.chakra);
        const pb = getPos(b.dim, b.chakra);
        const col = a.lignee === "adam" ? PALETTE.roseProfond : PALETTE.roseMoyen;
        lines.push(<line key={`${i}-${j}`} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y} stroke={col} strokeWidth={1.5} strokeDasharray="4,3" opacity={0.4} />);
      }
    }
  }
  return <>{lines}</>;
};

const Tooltip = ({ gui, x, y }) => {
  if (!gui) return null;
  const m = MERIDIENS.find((m) => m.code === gui.meridien);
  const w = 220, h = 135;
  const tx = Math.min(x + 12, 700), ty = Math.max(y - h / 2, 10);

  return (
    <g style={{ pointerEvents: "none" }}>
      <rect x={tx} y={ty} width={w} height={h} rx={8} fill={PALETTE.white} stroke={PALETTE.or} strokeWidth={1.5} filter="url(#shadow)" />
      <text x={tx + 12} y={ty + 22} fill={PALETTE.roseProfond} fontSize={13} fontWeight="bold">Gui 鬼 — {gui.type.charAt(0).toUpperCase() + gui.type.slice(1)}</text>
      <text x={tx + 12} y={ty + 42} fill={PALETTE.text} fontSize={11}>Lignée : {gui.lignee === "adam" ? "Adam ♂" : "Eve ♀"}</text>
      <text x={tx + 12} y={ty + 58} fill={PALETTE.text} fontSize={11}>Dimension : D{gui.dim} — Chakra {gui.chakra + 1}</text>
      <text x={tx + 12} y={ty + 74} fill={PALETTE.text} fontSize={11}>Méridien : {m ? `${m.code} (${m.name})` : gui.meridien}</text>
      <text x={tx + 12} y={ty + 90} fill={PALETTE.text} fontSize={11}>Génération source : G-{gui.generation}</text>
      <text x={tx + 12} y={ty + 108} fill={PALETTE.text} fontSize={11}>Intensité : {gui.intensite}%</text>
      <rect x={tx + 12} y={ty + 116} width={(w - 24) * gui.intensite / 100} height={5} rx={2} fill={gui.type === "actif" ? PALETTE.guiActive : gui.type === "dormant" ? PALETTE.guiDormant : PALETTE.guiAncien} />
      <rect x={tx + 12} y={ty + 116} width={w - 24} height={5} rx={2} fill="none" stroke={PALETTE.gridLine} />
    </g>
  );
};

export function GuiEnergiesParasitairesPermanentesSession() {
  const [selectedGui, setSelectedGui] = useState(null);
  const [filterLignee, setFilterLignee] = useState("all");
  const [filterMeridien, setFilterMeridien] = useState("all");
  const [filterDim, setFilterDim] = useState("all");
  const [showPropagation, setShowPropagation] = useState(true);
  const [mode, setMode] = useState("grille");
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const MARGIN = { top: 60, left: 160, right: 30, bottom: 30 };
  const MAX_CHAKRAS = Math.max(...DIMENSIONS.map((d) => d.chakras));
  const CELL_W = 60, CELL_H = 52;
  const SVG_W = MARGIN.left + MAX_CHAKRAS * CELL_W + MARGIN.right + 100;
  const SVG_H = MARGIN.top + DIMENSIONS.length * CELL_H + MARGIN.bottom;

  const getPos = useCallback((dim, chakra) => ({
    x: MARGIN.left + chakra * CELL_W + CELL_W / 2,
    y: MARGIN.top + (dim - 1) * CELL_H + CELL_H / 2,
  }), []);

  const filteredGuis = useMemo(() => {
    return GUI_DATA.filter((g) => {
      if (filterLignee !== "all" && g.lignee !== filterLignee) return false;
      if (filterMeridien !== "all" && g.meridien !== filterMeridien) return false;
      if (filterDim !== "all" && g.dim !== parseInt(filterDim)) return false;
      return true;
    });
  }, [filterLignee, filterMeridien, filterDim]);

  const stats = useMemo(() => {
    const total = filteredGuis.length;
    const actifs = filteredGuis.filter((g) => g.type === "actif").length;
    const dormants = filteredGuis.filter((g) => g.type === "dormant").length;
    const anciens = filteredGuis.filter((g) => g.type === "ancien").length;
    const adam = filteredGuis.filter((g) => g.lignee === "adam").length;
    const eve = filteredGuis.filter((g) => g.lignee === "eve").length;
    return { total, actifs, dormants, anciens, adam, eve };
  }, [filteredGuis]);

  const affectedMeridiens = useMemo(() => {
    const set = new Set(filteredGuis.map((g) => g.meridien));
    return MERIDIENS.filter((m) => set.has(m.code));
  }, [filteredGuis]);

  const handleSvgMouseMove = (e) => {
    const svg = e.currentTarget;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
    setMousePos({ x: svgP.x, y: svgP.y });
  };

  const Btn = ({ active, onClick, children, color }) => (
    <button onClick={onClick} style={{ padding: "5px 12px", borderRadius: 6, border: `1.5px solid ${active ? (color || PALETTE.roseProfond) : PALETTE.gridLine}`, background: active ? (color || PALETTE.roseProfond) : PALETTE.white, color: active ? PALETTE.white : PALETTE.text, fontSize: 12, fontWeight: active ? 600 : 400, cursor: "pointer", transition: "all .2s" }}>
      {children}
    </button>
  );

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", background: PALETTE.bg, minHeight: "100vh", padding: 16 }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <h1 style={{ color: PALETTE.roseProfond, fontSize: 22, margin: 0, fontWeight: 700 }}>
          Gui 鬼 — Énergies Parasitaires Permanentes
        </h1>
        <p style={{ color: PALETTE.textLight, fontSize: 13, margin: "4px 0 0" }}>
          Grille hDOM · Lignées transgénérationnelles · Méridiens TCM
        </p>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <span style={{ fontSize: 11, color: PALETTE.textLight, marginRight: 4 }}>Lignée :</span>
          <Btn active={filterLignee === "all"} onClick={() => setFilterLignee("all")}>Toutes</Btn>
          <Btn active={filterLignee === "adam"} onClick={() => setFilterLignee("adam")} color={PALETTE.roseProfond}>Adam ♂</Btn>
          <Btn active={filterLignee === "eve"} onClick={() => setFilterLignee("eve")} color={PALETTE.roseMoyen}>Eve ♀</Btn>
        </div>
        <div style={{ width: 1, background: PALETTE.gridLine, margin: "0 4px" }} />
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <span style={{ fontSize: 11, color: PALETTE.textLight, marginRight: 4 }}>Dimension :</span>
          <select value={filterDim} onChange={(e) => setFilterDim(e.target.value)} style={{ padding: "4px 8px", borderRadius: 6, border: `1px solid ${PALETTE.gridLine}`, fontSize: 12, background: PALETTE.white, color: PALETTE.text }}>
            <option value="all">Toutes</option>
            {DIMENSIONS.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div style={{ width: 1, background: PALETTE.gridLine, margin: "0 4px" }} />
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <span style={{ fontSize: 11, color: PALETTE.textLight, marginRight: 4 }}>Méridien :</span>
          <select value={filterMeridien} onChange={(e) => setFilterMeridien(e.target.value)} style={{ padding: "4px 8px", borderRadius: 6, border: `1px solid ${PALETTE.gridLine}`, fontSize: 12, background: PALETTE.white, color: PALETTE.text }}>
            <option value="all">Tous</option>
            {MERIDIENS.map((m) => <option key={m.code} value={m.code}>{m.code} — {m.name}</option>)}
          </select>
        </div>
        <div style={{ width: 1, background: PALETTE.gridLine, margin: "0 4px" }} />
        <Btn active={showPropagation} onClick={() => setShowPropagation(!showPropagation)} color={PALETTE.or}>
          {showPropagation ? "⟶ Propagation ON" : "⟶ Propagation OFF"}
        </Btn>
      </div>

      {/* Stats bar */}
      <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 12, flexWrap: "wrap" }}>
        {[
          { label: "Total Gui", val: stats.total, color: PALETTE.text },
          { label: "Actifs", val: stats.actifs, color: PALETTE.guiActive },
          { label: "Dormants", val: stats.dormants, color: PALETTE.guiDormant },
          { label: "Anciens", val: stats.anciens, color: PALETTE.guiAncien },
          { label: "Adam ♂", val: stats.adam, color: PALETTE.roseProfond },
          { label: "Eve ♀", val: stats.eve, color: PALETTE.roseMoyen },
        ].map((s) => (
          <div key={s.label} style={{ background: PALETTE.white, borderRadius: 8, padding: "6px 14px", border: `1px solid ${PALETTE.gridLine}`, textAlign: "center", minWidth: 70 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 10, color: PALETTE.textLight }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Main SVG Grid */}
      <div style={{ overflowX: "auto", background: PALETTE.white, borderRadius: 12, border: `1px solid ${PALETTE.gridLine}`, padding: 8 }}>
        <svg width={SVG_W} height={SVG_H} onMouseMove={handleSvgMouseMove} style={{ display: "block" }}>
          <defs>
            <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#00000020" />
            </filter>
          </defs>

          {/* Column headers */}
          {Array.from({ length: MAX_CHAKRAS }).map((_, i) => (
            <text key={`ch-${i}`} x={MARGIN.left + i * CELL_W + CELL_W / 2} y={MARGIN.top - 12} textAnchor="middle" fontSize={10} fill={PALETTE.textLight} fontWeight={600}>
              C{i + 1}
            </text>
          ))}

          {/* Grid rows */}
          {DIMENSIONS.map((dim, di) => {
            const y = MARGIN.top + di * CELL_H;
            return (
              <g key={dim.id}>
                {/* Row label */}
                <text x={MARGIN.left - 10} y={y + CELL_H / 2 + 1} textAnchor="end" fontSize={11} fill={PALETTE.text} fontWeight={600}>
                  {dim.name}
                </text>
                {/* Cells */}
                {Array.from({ length: dim.chakras }).map((_, ci) => {
                  const cx = MARGIN.left + ci * CELL_W;
                  return (
                    <rect key={`cell-${di}-${ci}`} x={cx + 2} y={y + 2} width={CELL_W - 4} height={CELL_H - 4} rx={6} fill={PALETTE.beige} opacity={0.4} stroke={PALETTE.gridLine} strokeWidth={0.5} />
                  );
                })}
                {/* Empty cells indicator */}
                {Array.from({ length: MAX_CHAKRAS - dim.chakras }).map((_, ci) => {
                  const cx = MARGIN.left + (dim.chakras + ci) * CELL_W;
                  return <rect key={`empty-${di}-${ci}`} x={cx + 2} y={y + 2} width={CELL_W - 4} height={CELL_H - 4} rx={6} fill={PALETTE.bg} opacity={0.3} strokeDasharray="3,3" stroke={PALETTE.gridLine} strokeWidth={0.5} />;
                })}
              </g>
            );
          })}

          {/* Lignée indicators — left Adam, right Eve */}
          <rect x={4} y={MARGIN.top} width={12} height={DIMENSIONS.length * CELL_H} rx={6} fill={PALETTE.roseProfond} opacity={0.7} />
          <text x={10} y={MARGIN.top + (DIMENSIONS.length * CELL_H) / 2} textAnchor="middle" dominantBaseline="middle" fontSize={9} fill={PALETTE.white} fontWeight={700} transform={`rotate(-90, 10, ${MARGIN.top + (DIMENSIONS.length * CELL_H) / 2})`}>
            ADAM ♂ — Lignée masculine
          </text>
          <rect x={22} y={MARGIN.top} width={12} height={DIMENSIONS.length * CELL_H} rx={6} fill={PALETTE.roseMoyen} opacity={0.7} />
          <text x={28} y={MARGIN.top + (DIMENSIONS.length * CELL_H) / 2} textAnchor="middle" dominantBaseline="middle" fontSize={9} fill={PALETTE.white} fontWeight={700} transform={`rotate(-90, 28, ${MARGIN.top + (DIMENSIONS.length * CELL_H) / 2})`}>
            EVE ♀ — Lignée féminine
          </text>

          {/* KI — Vibration Originelle marker */}
          <rect x={MARGIN.left + MAX_CHAKRAS * CELL_W + 12} y={MARGIN.top} width={80} height={DIMENSIONS.length * CELL_H} rx={8} fill={PALETTE.beige} stroke={PALETTE.or} strokeWidth={1} opacity={0.6} />
          <text x={MARGIN.left + MAX_CHAKRAS * CELL_W + 52} y={MARGIN.top + 20} textAnchor="middle" fontSize={10} fill={PALETTE.or} fontWeight={700}>KI — Reins</text>
          <text x={MARGIN.left + MAX_CHAKRAS * CELL_W + 52} y={MARGIN.top + 36} textAnchor="middle" fontSize={8} fill={PALETTE.textLight}>Vibration</text>
          <text x={MARGIN.left + MAX_CHAKRAS * CELL_W + 52} y={MARGIN.top + 48} textAnchor="middle" fontSize={8} fill={PALETTE.textLight}>Originelle</text>

          {/* Propagation lines */}
          {showPropagation && <PropagationLines guis={filteredGuis} getPos={getPos} cellSize={CELL_W} />}

          {/* Gui markers */}
          {filteredGuis.map((gui) => {
            const pos = getPos(gui.dim, gui.chakra);
            return <GuiMarker key={gui.id} gui={gui} x={pos.x} y={pos.y} size={CELL_W} selected={selectedGui?.id === gui.id} onClick={(g) => setSelectedGui(selectedGui?.id === g.id ? null : g)} />;
          })}

          {/* Tooltip */}
          {selectedGui && <Tooltip gui={selectedGui} x={mousePos.x} y={mousePos.y} />}
        </svg>
      </div>

      {/* Méridiens Panel */}
      <div style={{ marginTop: 16, background: PALETTE.white, borderRadius: 12, border: `1px solid ${PALETTE.gridLine}`, padding: 16 }}>
        <h3 style={{ color: PALETTE.roseProfond, fontSize: 14, margin: "0 0 10px", fontWeight: 700 }}>
          Méridiens TCM impactés ({affectedMeridiens.length}/{MERIDIENS.length})
        </h3>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {MERIDIENS.map((m) => {
            const affected = affectedMeridiens.some((am) => am.code === m.code);
            const count = filteredGuis.filter((g) => g.meridien === m.code).length;
            return (
              <div key={m.code} onClick={() => setFilterMeridien(filterMeridien === m.code ? "all" : m.code)} style={{
                padding: "6px 12px", borderRadius: 8, cursor: "pointer", transition: "all .2s",
                background: affected ? `${ELEMENT_COLORS[m.element]}18` : PALETTE.bg,
                border: `1.5px solid ${filterMeridien === m.code ? PALETTE.or : affected ? ELEMENT_COLORS[m.element] : PALETTE.gridLine}`,
                opacity: affected ? 1 : 0.4,
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: ELEMENT_COLORS[m.element] }}>{m.code}</div>
                <div style={{ fontSize: 9, color: PALETTE.textLight }}>{m.name}</div>
                <div style={{ fontSize: 9, color: PALETTE.textLight }}>{m.element} · {m.yin ? "Yin" : "Yang"}</div>
                {affected && <div style={{ fontSize: 10, fontWeight: 700, color: PALETTE.guiActive, marginTop: 2 }}>{count} 鬼</div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div style={{ marginTop: 12, display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap", fontSize: 11, color: PALETTE.textLight }}>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: PALETTE.guiActive, display: "inline-block" }} /> Gui actif
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: PALETTE.guiDormant, display: "inline-block" }} /> Gui dormant
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: PALETTE.guiAncien, display: "inline-block" }} /> Gui ancien
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 16, height: 2, background: PALETTE.roseProfond, display: "inline-block", borderBottom: "1px dashed" }} /> Propagation Adam
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 16, height: 2, background: PALETTE.roseMoyen, display: "inline-block", borderBottom: "1px dashed" }} /> Propagation Eve
        </span>
      </div>

      <div style={{ textAlign: "center", marginTop: 8, fontSize: 10, color: PALETTE.textLight }}>
        Digital Shaman Lab — VLBH · v0.1.0
      </div>
    </div>
  );
}
