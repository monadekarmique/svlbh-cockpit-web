// Audit Entités Relationnelles — requêtes Supabase croisées.
// Croise : relation, session_scores, session_lignee_libration,
//          session_chakra, decodages_v0, lineage_vibrational_signatures,
//          cles_chromatiques_soin_matinal, session_stockage.
// Grille hDOM : 9 dimensions × 33 chakras.

import { SupabaseClient } from "@supabase/supabase-js";

// ── Architecture hDOM 9D × 33C ──

export type Dimension = {
  id: number; // 1–9
  name: string;
  corps: string;
  chakras: number[]; // indices des chakras dans cette dimension
};

export const DIMENSIONS: Dimension[] = [
  { id: 9, name: "D9 — Source créatrice / Temps", corps: "Corps Kéthérique", chakras: [33, 32, 31, 30] },
  { id: 8, name: "D8 — Lumière du Tout-Connaissant", corps: "Corps Céleste", chakras: [29, 28] },
  { id: 7, name: "D7 — Résonance vibratoire", corps: "Corps Émotionnel Sup.", chakras: [27] },
  { id: 6, name: "D6 — Formes géométriques", corps: "Corps Éthérique Sup.", chakras: [26, 25, 24] },
  { id: 5, name: "D5 — Amour / Pléiades", corps: "Corps Astral", chakras: [23, 22, 21, 20, 19, 18, 17] },
  { id: 4, name: "D4 — Couche autour Terre", corps: "Corps Mental", chakras: [16, 15, 14, 13, 12, 11, 10, 9] },
  { id: 3, name: "D3 — Réalité incarnée 3D", corps: "Corps Émotionnel", chakras: [8, 7, 6, 5, 4, 3, 2] },
  { id: 2, name: "D2 — Tellurique", corps: "Entre centre Terre et surface", chakras: [] },
  { id: 1, name: "D1 — Cristal de fer (7.8 Hz)", corps: "Centre Terre", chakras: [1] },
];

export const CHAKRA_NAMES: Record<number, string> = {
  33: "Intention", 32: "Symptômes", 31: "CIM-10", 30: "Sur-Âme",
  29: "Âme Sacrée", 28: "Soi Supérieur",
  27: "But Supérieur",
  26: "Arbre Géométrique", 25: "Formes Vibratoires", 24: "Dimensions Arbre",
  23: "Amour ❤", 22: "Sensualité ▽", 21: "Lumière Pléiades", 20: "Canal 3D",
  19: "Pont Universel", 18: "Étoile Nirodhah", 17: "Arbre de Vie ⊕",
  16: "Père Universel ☉", 15: "Mère Universelle ♀", 14: "Noyau Universel ♦",
  13: "Étoile Terrestre ⭐", 12: "Galactique 🌀", 11: "Étoile Solaire ☀",
  10: "Porte Atomique ⚛", 9: "Cœur Supérieur",
  8: "Couronne 👑", 7: "Troisième Œil 👁", 6: "Gorge 🔵",
  5: "Cœur 💚", 4: "Plexus Solaire 🟡", 3: "Sacré 🟠", 2: "Base 🔴",
  1: "Terrestre",
};

// ── Types de Gu (registre hDOM) ──

export const GU_TYPES = [
  "Black Magick", "Spell", "Biblical Dark Entity", "Impersonation Energy",
  "Spiritual Bypassing", "Stain", "Anchors/Chains/Hooks", "Energetic Rope",
  "Abuse Energy", "Archon/Reptilian", "Sabotage Energy", "In Limbo",
  "Incubus/Succubus", "Entity on Heart", "Bitch Energy", "Core Wound",
  "Secondary Gain",
] as const;

export type GuType = (typeof GU_TYPES)[number];

// ── Catégories de relations (table relation.categories) ──

export const RELATION_CATEGORIES = [
  "familles d'âmes", "monades", "système d'entités",
  "système qui assiste des entités",
  "attachements à des systèmes d'entités",
  "attachements à des systèmes qui aident des entités",
] as const;

// ── Requêtes Supabase ──

export type AuditRelation = {
  relation_id: string;
  end_a_label: string | null;
  end_b_label: string | null;
  relation_type: string;
  relation_state: string;
  purpose: string;
  score_lumiere: number | null;
  categories: string[];
  systemes_a_liberer: string[];
  platon_solid: string | null;
  niveau_shamanique_bloques: number | null;
  color_hex: string | null;
  created_at: string;
};

export type AuditSessionScore = {
  session_id: string;
  sla: number | null;
  slsa: number | null;
  slsa_s1: number | null;
  slsa_s2: number | null;
  slsa_s3: number | null;
  slsa_s4: number | null;
  slsa_s5: number | null;
  slm: number | null;
  tot_slm: number | null;
};

export type AuditLigneeLibration = {
  id: string;
  session_id: string;
  lignee: string | null;
  cbs_herite_value: string | null;
  cbs_session_value: string | null;
  generations_count: number | null;
  dpm_pattern_id: string | null;
  stress_lignes_temps: string | null;
  q1_libere: boolean | null;
  q2_valeur_sans: string | null;
};

export type AuditChakra = {
  id: string;
  session_id: string;
  chakra_key: string;
  cleaned: boolean;
  selected_cim: string | null;
};

export type AuditSignature = {
  signature_id: string;
  consultante_id: string;
  session_id: string;
  pattern: string | null;
  chromatic_key_color: string | null;
  chromatic_key_meridian: string | null;
  decoded_at: string;
};

export type AuditData = {
  relations: AuditRelation[];
  scores: AuditSessionScore[];
  lignees: AuditLigneeLibration[];
  chakras: AuditChakra[];
  signatures: AuditSignature[];
  totalSessions: number;
  totalDecodages: number;
  totalConsultantes: number;
};

export async function fetchAuditData(supabase: SupabaseClient): Promise<AuditData> {
  const [relations, scores, lignees, chakras, signatures, sessions, decodages, consultantes] =
    await Promise.all([
      supabase.from("relation").select("*").order("created_at", { ascending: false }),
      supabase.from("session_scores").select("*"),
      supabase.from("session_lignee_libration").select("*"),
      supabase.from("session_chakra").select("*"),
      supabase.from("lineage_vibrational_signatures").select("*"),
      supabase.from("session").select("session_id", { count: "exact", head: true }),
      supabase.from("decodages_v0").select("id", { count: "exact", head: true }),
      supabase.from("consultante_record").select("consultante_id", { count: "exact", head: true }),
    ]);

  return {
    relations: (relations.data ?? []) as AuditRelation[],
    scores: (scores.data ?? []) as AuditSessionScore[],
    lignees: (lignees.data ?? []) as AuditLigneeLibration[],
    chakras: (chakras.data ?? []) as AuditChakra[],
    signatures: (signatures.data ?? []) as AuditSignature[],
    totalSessions: sessions.count ?? 0,
    totalDecodages: decodages.count ?? 0,
    totalConsultantes: consultantes.count ?? 0,
  };
}
