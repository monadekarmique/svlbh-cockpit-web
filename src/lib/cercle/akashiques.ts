// Cercles akashiques par dhātu (Caraka Saṃhitā) — appartenance des Shamanes
// du Cercle de Lumière SR à travers plusieurs incarnations.
//
// Un « cercle akashique » peut être nommé par 1 dhātu (« Rakta ») ou une
// paire (« Rasa Meda ») reflétant la combinaison de tissus mémorisée par
// la lignée d'âmes. DEC Patrick 2026-05-18.
//
// DEC Patrick 2026-05-27 — les adhésions des praticiennes DB (clé = svlbh_id)
// sont désormais lues depuis la table Supabase `dhatu_membership` via
// fetchDhatuMemberships(). Le statique MEMBERSHIPS ne garde que les entrées
// indexées par nom (apprenantes / shamanes hors DB).

import type { SupabaseClient } from "@supabase/supabase-js";

export type Dhatu =
  | "rasa"      // plasma, lymphe
  | "rakta"     // sang
  | "mamsa"     // muscle
  | "meda"      // adipeux
  | "asthi"     // osseux
  | "majja"     // moelle, système nerveux
  | "sukra-artava"; // reproducteur (semence / ovule)

export const DHATU_META: Record<Dhatu, { label: string; emoji: string; color: string }> = {
  rasa:           { label: "Rasa",          emoji: "💧", color: "#0ea5e9" }, // plasma/lymphe = sky
  rakta:          { label: "Rakta",         emoji: "🩸", color: "#dc2626" }, // sang = red
  mamsa:          { label: "Māṁsa",         emoji: "💪", color: "#b91c1c" }, // muscle = darker red
  meda:           { label: "Meda",          emoji: "🟡", color: "#eab308" }, // adipeux = amber
  asthi:          { label: "Asthi",         emoji: "🦴", color: "#a8a29e" }, // osseux = stone
  majja:          { label: "Majjā",         emoji: "🧠", color: "#8b5cf6" }, // moelle = violet
  "sukra-artava": { label: "Śukra/Ārtava",  emoji: "🌸", color: "#ec4899" }, // reproducteur = pink
};

/** Un cercle akashique nommé. Peut référencer 1 ou plusieurs dhātu liés. */
export type CercleAkashique = {
  name: string;       // ex « Rasa Meda » ou « Rakta »
  dhatus: Dhatu[];    // liste des dhātu composant ce cercle
};

/** Référence le membership d'une personne (membre ou en formation) */
export type AkashiqueMembership = {
  /** Cercles dans lesquels la personne est pleinement membre (incarnations passées). */
  membres: CercleAkashique[];
  /** Cercles dans lesquels elle est en formation (incarnation actuelle, lignée en cours). */
  formation: CercleAkashique[];
};

// Helpers
const c = (name: string, dhatus: Dhatu[]): CercleAkashique => ({ name, dhatus });

// Cercles canoniques nommés (les plus fréquents)
export const CERCLE_RASA_MEDA = c("Rasa Meda", ["rasa", "meda"]);
export const CERCLE_RASA_MAMSA = c("Rasa Māṁsa", ["rasa", "mamsa"]);
export const CERCLE_RAKTA = c("Rakta", ["rakta"]);
export const CERCLE_ASTHI = c("Asthi", ["asthi"]);
export const CERCLE_MAJJA = c("Majjā", ["majja"]);
export const CERCLE_SUKRA = c("Śukra/Ārtava", ["sukra-artava"]);

// Cercles individuels en formation (lignées en cours)
export const CERCLE_RASA = c("Rasa", ["rasa"]);
export const CERCLE_MAMSA = c("Māṁsa", ["mamsa"]);

/** Memberships statiques indexés par NOM uniquement — apprenantes / shamanes
 * hors DB (sans svlbh_id). DEC Patrick 2026-05-27 : les praticiennes DB
 * (clé = svlbh_id) sont désormais lues depuis la table `dhatu_membership`
 * via fetchDhatuMemberships() ; leurs entrées statiques ont été retirées. */
export const MEMBERSHIPS: Record<string, AkashiqueMembership> = {
  // Béatrice Pathey — apprenante (clé = name)
  "Béatrice Pathey": {
    membres: [CERCLE_RAKTA],
    formation: [],
  },
  // Irène — apprenante en formation (clé legacy = name, conservé au cas où)
  "Irène": {
    membres: [],
    formation: [CERCLE_RASA, CERCLE_RAKTA, CERCLE_MAMSA],
  },
  // Shamanes passives membres du cercle Māṁsa (DEC Patrick 2026-05-20).
  // Clé = name (cf ApprenantesDnD lookup par name).
  "Julie Bays":   { membres: [CERCLE_MAMSA], formation: [] },
  "Camille Bays": { membres: [CERCLE_MAMSA], formation: [] },
  "Léa Bays":     { membres: [CERCLE_MAMSA], formation: [] },
  "Sarah Bays":   { membres: [CERCLE_MAMSA], formation: [] },
  // Paola — membre du Cercle Rasa Meda (DEC Patrick 2026-05-20).
  "Paola": { membres: [CERCLE_RASA_MEDA], formation: [] },
};

export function lookupMembership(key: string | null | undefined): AkashiqueMembership | null {
  if (!key) return null;
  return MEMBERSHIPS[key] ?? null;
}

/**
 * Fetch toutes les adhésions dhātu des praticiennes DB depuis la table
 * Supabase `dhatu_membership`, retourné en map indexée par svlbh_id (UUID).
 *
 * Une praticienne peut être membre de 0..N cercles et en formation sur
 * 0..N autres. Le champ `dhatus` du cercle est déjà un text[] de clés Dhatu.
 *
 * Calque la signature/typage de fetchDynamiquesByPraticienne (lib/cercle/dynamiques).
 */
export async function fetchDhatuMemberships(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sb: SupabaseClient<any, any, any>,
): Promise<Record<string, AkashiqueMembership>> {
  const { data, error } = await sb
    .from("dhatu_membership")
    .select("praticienne_svlbh_id, status, dhatu_cercle:cercle_id ( name, dhatus )");

  if (error || !data) return {};

  // Supabase typage : l'embedded peut être inféré comme objet OU array selon
  // la relation. On normalise via unknown puis manipulation manuelle (comme
  // dynamiques.ts gère svlbh_dynamique array|objet).
  type EmbeddedCercle = {
    name: string;
    dhatus: Dhatu[] | null;
  };
  type Row = {
    praticienne_svlbh_id: string;
    status: string;
    dhatu_cercle: EmbeddedCercle | EmbeddedCercle[] | null;
  };

  const map: Record<string, AkashiqueMembership> = {};
  for (const row of data as unknown as Row[]) {
    const cercle = Array.isArray(row.dhatu_cercle)
      ? row.dhatu_cercle[0]
      : row.dhatu_cercle;
    if (!cercle || !row.praticienne_svlbh_id) continue;

    const entry: CercleAkashique = {
      name: cercle.name,
      dhatus: (cercle.dhatus ?? []) as Dhatu[],
    };

    if (!map[row.praticienne_svlbh_id]) {
      map[row.praticienne_svlbh_id] = { membres: [], formation: [] };
    }
    if (row.status === "formation") {
      map[row.praticienne_svlbh_id].formation.push(entry);
    } else {
      // 'membre' (et tout autre statut par défaut) → membres
      map[row.praticienne_svlbh_id].membres.push(entry);
    }
  }

  // Tri stable des cercles par name pour un rendu déterministe.
  const byName = (a: CercleAkashique, b: CercleAkashique) => a.name.localeCompare(b.name);
  for (const key of Object.keys(map)) {
    map[key].membres.sort(byName);
    map[key].formation.sort(byName);
  }

  return map;
}
