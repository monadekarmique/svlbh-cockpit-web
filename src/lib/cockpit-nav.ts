// Source unique de vérité pour la navigation cockpit.
// Utilisé par :
//   - src/app/(app)/dashboard/page.tsx (tiles avec icône + desc)
//   - src/app/(app)/layout.tsx (NAV header avec juste label)
// Modifier l'ordre/ajouter/retirer un module ici met à jour les 2.

export type CockpitNavGroup = "shamanes" | "routines" | "chakras" | "autonome";

export type CockpitNavItem = {
  href: string;
  label: string;
  /** Label court pour le NAV header (défaut : label) */
  navLabel?: string;
  icon: string;
  desc: string;
  color: string;
  group: CockpitNavGroup;
};

export const COCKPIT_NAV: CockpitNavItem[] = [
  // ── Bloc Shamanes ──
  {
    href: "/shamanes",
    label: "Shamanes du Cercle",
    navLabel: "Shamanes",
    icon: "👥",
    desc: "8 codes praticien·nes + badges sessions pending",
    color: "#000099",
    group: "shamanes",
  },
  {
    href: "/scores",
    label: "Scores de Lumière",
    navLabel: "Scores",
    icon: "💡",
    desc: "SLA · SLSA · SLPMO · SLM avec seuils",
    color: "#C28D43",
    group: "shamanes",
  },
  {
    href: "/historique",
    label: "Historique sessions",
    navLabel: "Historique",
    icon: "📜",
    desc: "Timeline · diff log · provocations",
    color: "#6B3A8A",
    group: "shamanes",
  },

  // ── Bloc Routines ──
  {
    href: "/routines",
    label: "Routine matin",
    navLabel: "Routines",
    icon: "🔄",
    desc: "Quotas billing certifiées + checks énergie M/F",
    color: "#7C3AED",
    group: "routines",
  },
  {
    href: "/tores",
    label: "Tores énergétiques",
    navLabel: "Tores",
    icon: "🌀",
    desc: "4 dimensions : Champ · Glycémie · Sclérose · Sclérose tissulaire",
    color: "#0E7490",
    group: "routines",
  },

  // ── Bloc Chakras (MTC) ──
  {
    href: "/chakras",
    label: "Chakras / Dimensions",
    navLabel: "Chakras",
    icon: "◈",
    desc: "46 chakras hDOM sur 11 dimensions (D22, D9-D1, D99)",
    color: "#BE185D",
    group: "chakras",
  },
  {
    href: "/chrono-fu",
    label: "Chrono Fu",
    icon: "⏰",
    desc: "6 organes Fu MTC · Zi Wu Liu Zhu · organe actif live",
    color: "#4A7C3F",
    group: "chakras",
  },
  {
    href: "/linggui-bafa",
    label: "Linggui Bafa 灵龟八法",
    navLabel: "Linggui Bafa",
    icon: "灵",
    desc: "8 points de confluence MTC · paire active selon Tian Gan / Di Zhi",
    color: "#C28D43",
    group: "chakras",
  },
  {
    href: "/pierres",
    label: "Pierres d'enseignement",
    navLabel: "Pierres",
    icon: "💎",
    desc: "8 pierres de protection — Tourmaline, Obsidienne, Nuummite…",
    color: "#1E3A8A",
    group: "chakras",
  },

  // ── Autonome ──
  {
    href: "/demandes",
    label: "Demandes",
    icon: "📥",
    desc: "Factures + sessions via vlbh-energy-mcp",
    color: "#1D9E75",
    group: "autonome",
  },
];

/** Items du NAV header (label court, sans Dashboard car ajouté séparément). */
export function navItems(): { href: string; label: string }[] {
  return COCKPIT_NAV.map((i) => ({
    href: i.href,
    label: i.navLabel ?? i.label,
  }));
}

/** Métadonnées des 4 groupes affichés en dropdowns dans le NAV header. */
export const GROUP_LABELS: Record<CockpitNavGroup, string> = {
  shamanes: "Shamanes",
  routines: "Routines",
  chakras: "Chakras MTC",
  autonome: "Demandes",
};

export type CockpitNavGroupRendered = {
  id: CockpitNavGroup;
  label: string;
  items: CockpitNavItem[];
};

/** Items regroupés par group, dans l'ordre du COCKPIT_NAV. */
export function groupedNav(): CockpitNavGroupRendered[] {
  const order: CockpitNavGroup[] = ["shamanes", "routines", "chakras", "autonome"];
  return order
    .map((id) => ({
      id,
      label: GROUP_LABELS[id],
      items: COCKPIT_NAV.filter((i) => i.group === id),
    }))
    .filter((g) => g.items.length > 0);
}
