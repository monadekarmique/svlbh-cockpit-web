// Shamanes du Cercle — port ShamanesOverviewView.swift.
// Fetch SHAMANES-PENDING via webhook Make.com PULL.

const PULL_URL = "https://hook.eu2.make.com/n00qt5bxbemy49l3woix0xaopltg8sas";

export type ShamaneRole =
  | "cercle" // Shamane du Cercle officielle (numérotée)
  | "cercle-t2" // Shamane du Cercle de niveau T2 (apprenante intégrée)
  | "t3-en-attente" // T3 en cours de certification
  | "superviseur"; // Patrick/Patrick P. — non visibles aux participantes

/** Apprenantes en parcours sans code praticien actif. DEC Patrick 2026-05-18 :
 * 4 catégories distinctes selon le mouvement de la praticienne dans le parcours.
 * - formation : en apprentissage actif (Irène, Véronique)
 * - parcours-passif : ST2 en parcours mais sans engagement actif (Paola)
 * - cercle-akashique : ST2 reconnue Shamane du Cercle akashiques (Béatrice)
 * - t3-en-attente : ST3 en cours de certification (legacy, conservé pour compat)
 */
export type ParticipantTier =
  | "st3-active"
  | "st1-active"
  | "formation"
  | "parcours-passif"
  | "cercle-akashique"
  | "t3-en-attente"
  | "t0"
  | "t2";

export type Participant = {
  name: string;
  tier: ParticipantTier;
  emoji?: string;
  /** Code praticien actif si la personne en a un. */
  code?: string;
  /** Sigle DESA visible top-right de la carte (display only — pas de
   *  capacités attribuables faute de svlbh_id). DEC Patrick 2026-05-29. */
  desa_active?: boolean;
  /** Pastilles affichées en colonne gauche de la carte (mêmes 3 que sur
   *  les cartes therapeute). Valeurs DISPLAY (ex. tx="T14", cx="C15"). */
  tx?: string;
  cx?: string;
  stx?: string;
  /** Mini-pastilles « NSB · <nom> [· <cercle>] » — annotations visuelles
   *  de relations de supervision (sans valeur numérique). DEC Patrick
   *  2026-05-29. */
  nsb_links?: Array<{ name: string; cercle?: string }>;
  /** Pastille verte NSB familiales (sa propre branche transgénérationnelle)
   *  avec une description courte du contexte. DEC Patrick 2026-05-29. */
  nsb_familial?: { count: number; description: string };
};

/** Apprenantes en parcours — visibles uniquement aux Owners.
 * DEC Patrick 2026-05-29 — Irène (#304 ST4) retirée d'ici : sa carte
 * therapeute SR existante suffit (le doublon apprenante du 2026-05-18 est
 * supprimé). DEC Patrick 2026-05-20 — Shamanes passives membres du cercle
 * Māṁsa (consultantes liées à Patrick en DB consultante_record).
 * DEC Patrick 2026-05-29 — sigle DESA sur Julie/Sarah/Léa. */
export const APPRENANTES: Participant[] = [
  {
    name: "Carine", tier: "st1-active", emoji: "🌸",
    tx: "T14", cx: "C15", stx: "ST1",
    // Liens NSB de Carine (source) → rendus sur les cartes des
    // superviseurs/anchors, pas sur la sienne. DEC Patrick 2026-05-29 :
    // Julie/Léa retirées (la pastille NSB · Carine sur leurs cartes n'a
    // pas lieu d'être) — seul Patrick reste comme anchor.
    nsb_links: [
      { name: "Patrick Bays" },
    ],
    nsb_familial: {
      count: 2,
      description: "Apprenants masculins supervisés par Patrick",
    },
  },
  // Duplication de Carine pour Augustin / Emilie (duo apprenant supervisé
  // par Patrick). DEC Patrick 2026-05-29.
  {
    name: "Augustin / Emilie", tier: "st1-active", emoji: "🌿",
    tx: "T14", cx: "C15", stx: "ST1",
    nsb_links: [
      { name: "Patrick Bays" },
    ],
    nsb_familial: {
      count: 2,
      description: "Apprenants masculins supervisés par Patrick",
    },
  },
  // Duplication de Carine pour Quentin / Gilles (duo apprenant supervisé
  // par Patrick). DEC Patrick 2026-05-29.
  {
    name: "Quentin / Gilles", tier: "st1-active", emoji: "🌾",
    tx: "T14", cx: "C15", stx: "ST1",
    nsb_links: [
      { name: "Patrick Bays" },
    ],
    nsb_familial: {
      count: 2,
      description: "Apprenants masculins supervisés par Patrick",
    },
  },
  { name: "Paola", tier: "parcours-passif", emoji: "🌺" },
  // Duplication de Paola pour Myriam Blal (apprenante ST2 passive).
  // DEC Patrick 2026-05-29.
  { name: "Myriam Blal", tier: "parcours-passif", emoji: "🪷" },
  {
    name: "Julie Bays", tier: "formation", emoji: "🌷", desa_active: true,
    nsb_familial: { count: 1, description: "Son compagnon" },
  },
  { name: "Camille Bays", tier: "formation", emoji: "🌼" },
  {
    name: "Léa Bays", tier: "formation", emoji: "🍀", desa_active: true,
    nsb_familial: { count: 1, description: "Son compagnon" },
  },
  { name: "Sarah Bays", tier: "formation", emoji: "🌻", desa_active: true },
  { name: "Béatrice Pathey", tier: "cercle-akashique", emoji: "🌌" },
  // Duplication de Béatrice Pathey pour Ildiko Togni-Kosma (apprenante
  // ST1 Passive). DEC Patrick 2026-05-29.
  { name: "Ildiko Togni-Kosma", tier: "cercle-akashique", emoji: "🌠" },
];

export const TIER_LABEL: Record<ParticipantTier, string> = {
  "st3-active": "Apprenante ST3 active",
  "st1-active": "Apprenante ST1 active",
  formation: "Apprenante ST2 active",
  "parcours-passif": "Apprenante ST2 Passive",
  "cercle-akashique": "Apprenante ST1 Passive",
  "t3-en-attente": "ST3 en attente",
  t0: "ST0 · Lead",
  t2: "ST2 · myShaman (Formation)",
};

export const TIER_COLOR: Record<ParticipantTier, string> = {
  "st3-active": "#d97706", // amber — maîtrise en chemin
  "st1-active": "#0ea5e9", // sky — naissance
  formation: "#10b981", // emerald — en mouvement
  "parcours-passif": "#94a3b8", // slate — en pause
  "cercle-akashique": "#7c3aed", // violet — akashique
  "t3-en-attente": "#C28D43",
  t0: "#6B7280",
  t2: "#7C3AED",
};

/** Cartes virtuelles Patrick — 2 rôles superviseurs ajoutés en tête des
 * Thérapeutes actives. Indépendantes du système DB praticienne_profile
 * (Patrick a 1 svlbh_id mais 2 fonctions de supervision). */
export type SupervisorVirtual = {
  cercle_number: number | null;
  code: string;
  role_label: string;
  emoji: string;
  color: string;
  /** Codes BDEC karmiques affichés top-right de la carte virtuelle
   *  (consciences gisantes vertes, sous-codes du système BDEC).
   *  DEC Patrick 2026-05-29. */
  bdec_karmic?: string[];
};

export const SUPERVISORS_VIRTUAL: SupervisorVirtual[] = [
  {
    cercle_number: 1,
    code: "455000",
    role_label: "Superviseur méthodologique familial",
    emoji: "🔬",
    color: "#1d4ed8", // bleu (n°1 bleu)
    bdec_karmic: ["DEII", "Dra"],
  },
  {
    cercle_number: null,
    code: "754545",
    role_label: "Superviseur protection méthodologique",
    emoji: "🛡",
    color: "#1d4ed8",
    bdec_karmic: ["DEII", "Dra"],
  },
];

export type ShamaneRef = {
  code: string;
  name: string;
  emoji: string;
  role: ShamaneRole;
  /** Numéro dans le Cercle (1, 2, 3, 4...) — undefined pour T3 attente / T2 / superviseur */
  cercleNumber?: number;
  /** Cachée aux T2/T3 — visible uniquement T4/T5 superviseur */
  hiddenForParticipantes?: boolean;
};

/** Shamanes du Cercle actives — Véronique (T3 attente) déplacée dans
 * APPRENANTES, gardée hors de cette liste car non encore certifiée. */
export const SHAMANES_ALL: ShamaneRef[] = [
  {
    code: "0300",
    name: "Cornelia",
    emoji: "🐱",
    role: "cercle",
    cercleNumber: 1,
  },
  {
    code: "0301",
    name: "Flavia",
    emoji: "✨",
    role: "cercle",
    cercleNumber: 2,
  },
  {
    code: "0302",
    name: "Anne",
    emoji: "🌸",
    role: "cercle",
    cercleNumber: 3,
  },
  {
    code: "0303",
    name: "Chloé",
    emoji: "💫",
    role: "cercle",
    cercleNumber: 4,
  },
  {
    code: "305",
    name: "Daphné",
    emoji: "🌙",
    role: "cercle",
    cercleNumber: 5,
  },
  {
    code: "0304",
    name: "Irène",
    emoji: "🌿",
    role: "cercle-t2",
  },
  {
    code: "455000",
    name: "Patrick",
    emoji: "🔬",
    role: "superviseur",
    hiddenForParticipantes: true,
  },
  {
    code: "754545",
    name: "Patrick P.",
    emoji: "🛡",
    role: "superviseur",
    hiddenForParticipantes: true,
  },
];

export const ROLE_LABEL: Record<ShamaneRole, string> = {
  cercle: "Shamane du Cercle",
  "cercle-t2": "Shamane du Cercle · T2",
  "t3-en-attente": "T3 en attente",
  superviseur: "Superviseur",
};

export const ROLE_COLOR: Record<ShamaneRole, string> = {
  cercle: "#000099",
  "cercle-t2": "#7C3AED",
  "t3-en-attente": "#C28D43",
  superviseur: "#1E3A8A",
};

/**
 * Filtre les shamanes visibles selon le rôle de l'utilisateur connecté.
 * - Superviseurs (T4/T5) → voient tout (incluant Patrick + Patrick P.)
 * - Participantes (T2/T3) → cachent les superviseurs
 */
export function visibleShamanes(isSuperviseur: boolean): ShamaneRef[] {
  if (isSuperviseur) return SHAMANES_ALL;
  return SHAMANES_ALL.filter((s) => !s.hiddenForParticipantes);
}

export type ShamaneBadge = ShamaneRef & { count: number };

function parsePending(text: string): Record<string, number> {
  const result: Record<string, number> = {};
  for (const pair of text.split("|")) {
    const [code, count] = pair.split(":");
    const n = parseInt(count);
    if (code && !isNaN(n)) result[code.trim()] = n;
  }
  return result;
}

/** Charge les counts SHAMANES-PENDING bruts (Record code → count). */
export async function fetchPendingCounts(): Promise<Record<string, number>> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 10_000);
    const res = await fetch(PULL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: "SHAMANES-PENDING" }),
      signal: ctrl.signal,
      cache: "no-store",
    });
    clearTimeout(t);
    if (res.ok) {
      const text = await res.text();
      if (text && text !== "READ") return parsePending(text);
    }
  } catch (e) {
    console.error(
      "[shamanes] fetch error:",
      e instanceof Error ? e.message : e,
    );
  }
  return {};
}

export async function fetchShamanesPending(
  isSuperviseur: boolean,
): Promise<ShamaneBadge[]> {
  const counts = await fetchPendingCounts();
  return visibleShamanes(isSuperviseur).map((s) => ({
    ...s,
    count: counts[s.code] ?? 0,
  }));
}
