// 10 Dimensions du système hDOM VLBH — port DimensionsData.swift.
// V2 minimal : id + num + label + description (sans détail chakras).
// Source : ~/Developer/svlbh-cercle-de-lumiere/SVLBH Panel/Models/DimensionsData.swift

export type Dimension = {
  id: string;
  num: number;
  label: string;
  description: string;
  /** Visible uniquement Patrick + Cornelia 0300 */
  restricted?: boolean;
};

export const DIMENSIONS: Dimension[] = [
  {
    id: "d22",
    num: 22,
    label: "D22 — SVLBH Bash",
    description:
      "Bloqueurs d'ascensions méta-dimensionnels qui mènent à l'Épuisement",
  },
  {
    id: "d9",
    num: 9,
    label: "D9 — Source créatrice · Temps",
    description: "Corps Kéthérique",
  },
  {
    id: "d8",
    num: 8,
    label: "D8 — Lumière du Tout-Connaissant",
    description: "Corps Céleste",
  },
  {
    id: "d7",
    num: 7,
    label: "D7 — Résonance vibratoire",
    description: "Corps Émotionnel Supérieur",
  },
  {
    id: "d6",
    num: 6,
    label: "D6 — Formes géométriques",
    description: "5–7 mois avant manifestation",
  },
  {
    id: "d5",
    num: 5,
    label: "D5 — Amour · Sensualité · Pléiades",
    description: "Pont vers les Pléiades, sensualité, vie immunitaire",
  },
  {
    id: "d4",
    num: 4,
    label: "D4 — Mémoire émotionnelle",
    description: "Corps Astral / mémoires émotionnelles",
  },
  {
    id: "d3",
    num: 3,
    label: "D3 — Mental",
    description: "Corps Mental",
  },
  {
    id: "d2",
    num: 2,
    label: "D2 — Émotionnel",
    description: "Corps Émotionnel",
  },
  {
    id: "d1",
    num: 1,
    label: "D1 — Physique",
    description: "Corps Éthérique / racine",
  },
  {
    id: "d0",
    num: 0,
    label: "D0 — Ancrage",
    description: "Pré-incarnation, Patrick + Cornelia uniquement",
    restricted: true,
  },
];
