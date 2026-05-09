// 46 chakras hDOM détaillés — port DimensionsData.swift complet.
// Source : svlbh-cercle-de-lumiere/SVLBH Panel/Models/DimensionsData.swift

export type CIMCode = { code: string; label: string };
export type ChakraIssue = { label: string; sla: number };

export type ChakraInfo = {
  num: number | null;
  icon: string;
  nom: string;
  issues: ChakraIssue[];
  hasCIM: boolean;
  cimCodes: CIMCode[];
};

export type DimensionDetail = {
  id: string;
  num: number;
  label: string;
  description: string;
  defaultCollapsed: boolean;
  chakras: ChakraInfo[];
  /** D0/D99 visible Patrick + Cornelia uniquement */
  restricted?: boolean;
};

export const ALL_DIMENSIONS: DimensionDetail[] = [
  {
    id: "d22",
    num: 22,
    label: "D22 — SVLBH Bash",
    description: "Bloqueurs d'ascensions méta-dimensionnels qui mènent à l'Épuisement",
    defaultCollapsed: false,
    chakras: [
      { num: null, icon: "◈", nom: "Consultante Programmes de Protection Gui", issues: [], hasCIM: false, cimCodes: [] },
    ],
  },
  {
    id: "d9",
    num: 9,
    label: "D9 — Source créatrice · Temps",
    description: "Corps Kéthérique",
    defaultCollapsed: false,
    chakras: [
      { num: 33, icon: "◈", nom: "Intention, Symptômes et signes",
        issues: [{ label: "Diabète T2 — symptôme fork", sla: 89 }], hasCIM: false, cimCodes: [] },
      { num: 32, icon: "⇄", nom: "Symptômes et signes relatifs",
        issues: [{ label: "Polyurie, polydipsie, fatigue", sla: 89 }], hasCIM: true,
        cimCodes: [
          { code: "R35.89", label: "Polyurie" },
          { code: "R63.1", label: "Polydipsie" },
          { code: "R53.83", label: "Fatigue — autre" },
        ] },
      { num: 31, icon: "▶", nom: "Classification CIM-10/11",
        issues: [{ label: "5A11.0 T2DM", sla: 89 }], hasCIM: true,
        cimCodes: [
          { code: "E11.9", label: "T2DM sans complications" },
          { code: "E11.65", label: "T2DM avec hyperglycémie" },
          { code: "E11.22", label: "T2DM — néphropathie chronique" },
        ] },
      { num: 30, icon: "♥", nom: "Oversoul", issues: [], hasCIM: false, cimCodes: [] },
    ],
  },
  {
    id: "d8",
    num: 8,
    label: "D8 — Lumière du Tout-Connaissant",
    description: "Corps Céleste",
    defaultCollapsed: true,
    chakras: [
      { num: 29, icon: "◉", nom: "Sacred Soul", issues: [], hasCIM: false, cimCodes: [] },
      { num: 28, icon: "♥", nom: "Electronic Higherself", issues: [], hasCIM: false, cimCodes: [] },
    ],
  },
  {
    id: "d7",
    num: 7,
    label: "D7 — Résonance vibratoire",
    description: "Corps Émotionnel Supérieur",
    defaultCollapsed: false,
    chakras: [
      { num: 27, icon: "◎", nom: "Higher Purpose",
        issues: [{ label: "Impersonation Energy", sla: 63 }], hasCIM: false, cimCodes: [] },
    ],
  },
  {
    id: "d6",
    num: 6,
    label: "D6 — Formes géométriques",
    description: "5–7 mois avant manifestation",
    defaultCollapsed: false,
    chakras: [
      { num: 26, icon: "✚", nom: "Geometric Universal Tree",
        issues: [{ label: "Stain G-5", sla: 77 }], hasCIM: false, cimCodes: [] },
      { num: 25, icon: "◎", nom: "Vibrat. Geometric Forms",
        issues: [{ label: "Motif géométrique diabète", sla: 76 }], hasCIM: true,
        cimCodes: [
          { code: "E11.51", label: "T2DM — angiopathie périphérique" },
          { code: "E11.8", label: "T2DM — complications non spécifiées" },
        ] },
      { num: 24, icon: "◌", nom: "Dimensions of the World Tree", issues: [], hasCIM: false, cimCodes: [] },
    ],
  },
  {
    id: "d5",
    num: 5,
    label: "D5 — Amour · Sensualité · Pléiades",
    description: "Corps Astral",
    defaultCollapsed: false,
    chakras: [
      { num: 23, icon: "♥", nom: "Love — Immunodéficience",
        issues: [{ label: "Abuse Energy", sla: 70 }], hasCIM: false, cimCodes: [] },
      { num: 22, icon: "▽", nom: "Sensuality — Trouble sommeil",
        issues: [{ label: "Incubus/Succubus G-1", sla: 67 }], hasCIM: false, cimCodes: [] },
      { num: 21, icon: "✦", nom: "Light from the Pleiades", issues: [], hasCIM: false, cimCodes: [] },
      { num: 20, icon: "合", nom: "Channel for love 3D", issues: [], hasCIM: false, cimCodes: [] },
      { num: 19, icon: "◉", nom: "Universal Higher Bridge", issues: [], hasCIM: false, cimCodes: [] },
      { num: 18, icon: "✤", nom: "Nirodhah Star", issues: [], hasCIM: false, cimCodes: [] },
      { num: 17, icon: "◎", nom: "Life Tree — Génito-Urinaire",
        issues: [{ label: "Tuyau Jing 3.5 Ga", sla: 83 }], hasCIM: false, cimCodes: [] },
    ],
  },
  {
    id: "d4",
    num: 4,
    label: "D4 — Couche autour de la Terre",
    description: "Corps Mental — Mythes · Archétypes",
    defaultCollapsed: false,
    chakras: [
      { num: 16, icon: "☉", nom: "Universal Father — Égrégores",
        issues: [{ label: "Archétype Père abuseur 15 G", sla: 74 }], hasCIM: false, cimCodes: [] },
      { num: 15, icon: "▽", nom: "Universal Mother — Mythes",
        issues: [{ label: "Mythe \"femme = proie\" — Ph.1", sla: 89 }], hasCIM: false, cimCodes: [] },
      { num: 14, icon: "◈", nom: "Universal Core — Implants",
        issues: [{ label: "Implant Archon/Reptilian G-10", sla: 66 }], hasCIM: false, cimCodes: [] },
      { num: 13, icon: "⬛", nom: "Earth Star — Maladie rénale",
        issues: [{ label: "KI×4 — risque néphropathie", sla: 83 }], hasCIM: false, cimCodes: [] },
      { num: 12, icon: "◉", nom: "Galactic — Lésion vaisseaux",
        issues: [{ label: "Fork galactiques 3.5 Ga — Ph.2", sla: 89 }], hasCIM: false, cimCodes: [] },
      { num: 11, icon: "☀", nom: "Solar Star", issues: [], hasCIM: false, cimCodes: [] },
      { num: 10, icon: "⊛", nom: "Atomic Doorway", issues: [], hasCIM: false, cimCodes: [] },
      { num: 9, icon: "♻", nom: "Higher Heart — Cœur Supérieur",
        issues: [{ label: "Phase 3 séance", sla: 89 }], hasCIM: false, cimCodes: [] },
    ],
  },
  {
    id: "d3",
    num: 3,
    label: "D3 — Réalité incarnée 3D",
    description: "7 chakras classiques",
    defaultCollapsed: false,
    chakras: [
      { num: 8, icon: "♛", nom: "Crown / Sahasrāra", issues: [], hasCIM: false, cimCodes: [] },
      { num: 7, icon: "—", nom: "Brow / Ājñā", issues: [], hasCIM: false, cimCodes: [] },
      { num: 6, icon: "⊞", nom: "Throat / Viśuddha",
        issues: [{ label: "LU×1 — expression bloquée G-7", sla: 83 }], hasCIM: false, cimCodes: [] },
      { num: 5, icon: "♥", nom: "Heart / Anāhata — CV17",
        issues: [{ label: "Phase 4 — Porte du Cœur", sla: 89 }], hasCIM: false, cimCodes: [] },
      { num: 4, icon: "◉", nom: "Naval / Manipūra — Plexus",
        issues: [{ label: "SP×6 — Yi saturé", sla: 80 }], hasCIM: false, cimCodes: [] },
      { num: 3, icon: "⊗", nom: "Sacral / Svādhisthāna",
        issues: [{ label: "Honte ancestrale 15 G", sla: 85 }], hasCIM: false, cimCodes: [] },
      { num: 2, icon: "◑", nom: "Base / Mūlādhāra",
        issues: [{ label: "KI racine — Jing pollué", sla: 85 }], hasCIM: false, cimCodes: [] },
    ],
  },
  {
    id: "d2",
    num: 2,
    label: "D2 — Espace tellurique",
    description: "Entre centre Terre et surface",
    defaultCollapsed: true,
    chakras: [
      { num: null, icon: "◌", nom: "Royaume tellurique", issues: [], hasCIM: false, cimCodes: [] },
    ],
  },
  {
    id: "d1",
    num: 1,
    label: "D1 — Cristal de fer · Centre Terre",
    description: "7.8 Hz Schumann",
    defaultCollapsed: false,
    chakras: [
      { num: 1, icon: "◈", nom: "Earth Chakra",
        issues: [{ label: "Ancrage défaillant — KI1 Nuummite", sla: 83 }], hasCIM: false, cimCodes: [] },
    ],
  },
  {
    id: "d99",
    num: 99,
    label: "D99 — Architecture Galactique",
    description: "Méta-dimensionnel · Patient / Système (Patrick + Cornelia)",
    defaultCollapsed: true,
    restricted: true,
    chakras: [
      { num: 45, icon: "◈", nom: "Monade — Unité source", issues: [], hasCIM: false, cimCodes: [] },
      { num: 44, icon: "⧫", nom: "Interface biophotonique — ADN lumière", issues: [], hasCIM: false, cimCodes: [] },
      { num: 43, icon: "⬟", nom: "Dodécaèdre — Éther universel", issues: [], hasCIM: false, cimCodes: [] },
      { num: 42, icon: "◎", nom: "Anneau Tor — Flux toroïdal vital", issues: [], hasCIM: false, cimCodes: [] },
      { num: 41, icon: "⌖", nom: "Point zéro — Vide quantique", issues: [], hasCIM: false, cimCodes: [] },
      { num: 40, icon: "☯", nom: "Équilibre Yin/Yang — Polarité systémique", issues: [], hasCIM: false, cimCodes: [] },
      { num: 39, icon: "◬", nom: "Portail ascension — Transit S0↔S8", issues: [], hasCIM: false, cimCodes: [] },
      { num: 38, icon: "⬡", nom: "Matrice Métatronique — Géométrie sacrée", issues: [], hasCIM: false, cimCodes: [] },
      { num: 37, icon: "✦", nom: "Système nerveux subtil — Nadis", issues: [], hasCIM: false, cimCodes: [] },
      { num: 36, icon: "⊛", nom: "Plans transverses — Champs morphiques", issues: [], hasCIM: false, cimCodes: [] },
      { num: 35, icon: "⊗", nom: "Réseau Akashique — Mémoire collective", issues: [], hasCIM: false, cimCodes: [] },
      { num: 34, icon: "⊕", nom: "Système Source — Origine primordiale", issues: [], hasCIM: false, cimCodes: [] },
    ],
  },
];

/** Clé unique pour persistance Supabase : "d3.5" pour chakra 5 dans D3 */
export function chakraKey(dimId: string, chakra: ChakraInfo): string {
  return `${dimId}.${chakra.num ?? "x"}.${chakra.nom.slice(0, 20)}`;
}

/** Stats : nombre total / nettoyés */
export function countTotal(): number {
  return ALL_DIMENSIONS.reduce((s, d) => s + d.chakras.length, 0);
}
