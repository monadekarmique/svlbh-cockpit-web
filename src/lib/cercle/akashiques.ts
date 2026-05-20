// Cercles akashiques par dhātu (Caraka Saṃhitā) — appartenance des Shamanes
// du Cercle de Lumière SR à travers plusieurs incarnations.
//
// Un « cercle akashique » peut être nommé par 1 dhātu (« Rakta ») ou une
// paire (« Rasa Meda ») reflétant la combinaison de tissus mémorisée par
// la lignée d'âmes. DEC Patrick 2026-05-18.

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

/** Memberships indexés par clé. Pour praticiennes ST4+ DB → clé = svlbh_id.
 * Pour apprenantes hors DB → clé = name (Irène / Paola / Béatrice / Véronique).
 * Patrick = svlbh_id 52adbc98… (clé DB). */
export const MEMBERSHIPS: Record<string, AkashiqueMembership> = {
  // Patrick Bays — Owner ST6
  "52adbc98-d2b0-4444-b89c-b1311a02a983": {
    membres: [CERCLE_RASA_MEDA, CERCLE_RAKTA],
    formation: [],
  },
  // Anne Grangier Bays — ST4
  "57bd2f8e-53c5-49f8-a778-ed8c2cd75bcc": {
    membres: [
      CERCLE_RASA_MEDA,
      CERCLE_RASA_MAMSA,
      CERCLE_ASTHI,
      CERCLE_MAJJA,
      CERCLE_SUKRA,
    ],
    formation: [],
  },
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
  // Irène #304 — promue ST4 le 2026-05-18 (svlbh_id 9746f232).
  // DEC Patrick 2026-05-20 — Rakta + Māṁsa passent en membre active
  // (comme Cornelia), Rasa reste en formation.
  "9746f232-77ed-4086-ad64-1bde5805ed83": {
    membres: [CERCLE_RAKTA, CERCLE_MAMSA],
    formation: [CERCLE_RASA],
  },
  // Shamanes passives membres du cercle Māṁsa (DEC Patrick 2026-05-20).
  // Clé = name (cf ApprenantesDnD lookup par name).
  "Julie Bays": { membres: [CERCLE_MAMSA], formation: [] },
  "Camille":    { membres: [CERCLE_MAMSA], formation: [] },
  "Léa Bays":   { membres: [CERCLE_MAMSA], formation: [] },
  "Sarah Bays": { membres: [CERCLE_MAMSA], formation: [] },
  // Paola — membre du Cercle Rasa Meda (DEC Patrick 2026-05-20).
  "Paola": { membres: [CERCLE_RASA_MEDA], formation: [] },
  // Véronique — promue ST4 le 2026-05-18 (svlbh_id f73d2429, code 200).
  // Membre du Cercle Rakta. DEC Patrick 2026-05-18.
  "f73d2429-871f-4641-8bd4-ca6a0fe9e34b": {
    membres: [CERCLE_RAKTA],
    formation: [],
  },
  // Cornelia Althaus — ST4 (basculée 2026-05-20). 6 cercles akashiques :
  // Rasa Māṁsa, Asthi, Majjā, Śukra/Ārtava, Rakta, Māṁsa. DEC Patrick 2026-05-20.
  "e4f77c12-aeda-4dac-b653-3d6514a6e0c0": {
    membres: [
      CERCLE_RASA_MAMSA,
      CERCLE_ASTHI,
      CERCLE_MAJJA,
      CERCLE_SUKRA,
      CERCLE_RAKTA,
      CERCLE_MAMSA,
    ],
    formation: [],
  },
};

export function lookupMembership(key: string | null | undefined): AkashiqueMembership | null {
  if (!key) return null;
  return MEMBERSHIPS[key] ?? null;
}
