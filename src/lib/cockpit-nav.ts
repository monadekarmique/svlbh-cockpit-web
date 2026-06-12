// Source unique de vérité pour la navigation cockpit.
// Utilisé par :
//   - src/app/(app)/dashboard/page.tsx (tiles avec icône + desc)
//   - src/app/(app)/layout.tsx (NAV header avec juste label)
// Modifier l'ordre/ajouter/retirer un module ici met à jour les 2.

export type CockpitNavGroup =
  | "shamanes"
  | "routines"
  | "chakras"
  | "akakarm"
  | "support"
  | "owner";

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
    label: "Shamanes du ◉",
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

  {
    href: "/audit-entites",
    label: "Audit Entités Relationnelles",
    navLabel: "Audit Entités",
    icon: "🔬",
    desc: "Big data 9D×33C — entités familiales, CBS lignées, signatures chromatiques",
    color: "#8B3A62",
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
    href: "/traces",
    label: "API Traces",
    navLabel: "Traces",
    icon: "📊",
    desc: "Observabilité backend — requêtes, erreurs, latences",
    color: "#6366F1",
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
  {
    href: "/demandes",
    label: "Fenêtres efficaces",
    navLabel: "Fenêtres",
    icon: "⏳",
    desc: "Cas parfaits Si Zhu 四柱 · prochaines fenêtres temporelles (Zi Wu Liu Zhu)",
    color: "#1D9E75",
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
    href: "/benshen",
    label: "Benshen · Chrono-Acupuncture",
    navLabel: "Benshen",
    icon: "🧠",
    desc: "GB13 本神 · 4 Piliers Bazi 四柱 · acupoints chrono-optimaux + sélecteur de méridien",
    color: "#4A7C3F",
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

  // ── Owner (ST6 only — gate côté layout via requireOwner) ──
  {
    href: "/admin",
    label: "Admin",
    icon: "🛠️",
    desc: "Gestion stx praticiennes, révocations, whitelist cockpit_access",
    color: "#9333EA",
    group: "owner",
  },
  {
    href: "/compliance",
    label: "Compliance",
    icon: "📋",
    desc: "DPIA, registre Art. 30, journaux audit, DPA",
    color: "#0891B2",
    group: "owner",
  },
  {
    href: "/facturation",
    label: "Facturation",
    icon: "💰",
    desc: "Paiements praticiennes, PostFinance, exports comptables",
    color: "#15803D",
    group: "owner",
  },
  {
    href: "/statutspostfinance",
    label: "Statut PostFinance",
    navLabel: "PostFinance",
    icon: "🏦",
    desc: "Santé de la solution bancaire suisse — encaissements, échecs, rapprochement",
    color: "#FFCC00",
    group: "owner",
  },

  // ── Support (co-browsing) — visible à toutes les praticiennes
  {
    href: "/z3-inbox",
    label: "Queue z3 — certifiées-pro",
    navLabel: "Queue z3",
    icon: "📥",
    desc: "Inbox WhatsApp +41 79 930 28 00 (bridge z3) — lecture + réponses, réservé ST4+",
    color: "#25D366",
    group: "support",
  },
  {
    href: "/support",
    label: "Support · Co-browsing",
    navLabel: "Support",
    icon: "💬",
    desc: "Partager mon onglet navigateur avec Patrick / Anne pour accompagnement en direct (WebRTC, données CH, 60 min max, consentement explicite)",
    color: "#2563EB",
    group: "support",
  },

  // ── Bloc Dettes AkaKarm ──
  {
    href: "/dettes-akakarm-articles",
    label: "Articles AkaKarm",
    navLabel: "Articles",
    icon: "📄",
    desc: "Palette de Lumière (port), audits & lectures sur les dettes akakarmiques",
    color: "#8B3A62",
    group: "akakarm",
  },
];

/** Items du NAV header (label court, sans Dashboard car ajouté séparément). */
export function navItems(): { href: string; label: string }[] {
  return COCKPIT_NAV.map((i) => ({
    href: i.href,
    label: i.navLabel ?? i.label,
  }));
}

/** Métadonnées des 6 groupes affichés en dropdowns dans le NAV header. */
export const GROUP_LABELS: Record<CockpitNavGroup, string> = {
  shamanes: "Shamanes",
  routines: "Routines",
  chakras: "Chakras MTC",
  akakarm: "Dettes AkaKarm",
  support: "Support",
  owner: "Owner",
};

export type CockpitNavGroupRendered = {
  id: CockpitNavGroup;
  label: string;
  items: CockpitNavItem[];
};

/** Items regroupés par group, dans l'ordre du COCKPIT_NAV.
 * Si includeOwner=false, exclut le groupe "owner" (modules ST6).
 * DEC Patrick 2026-05-12 — apparaît auto dans la nav pour ST6 + Cercle SR. */
export function groupedNav(options?: { includeOwner?: boolean }): CockpitNavGroupRendered[] {
  const includeOwner = options?.includeOwner ?? false;
  // Owner (ST6) fusionné EN TÊTE du groupe Support — gate conservé via includeOwner
  // (les non-ST6 ne voient pas les items Owner ; les pages restent gatées par requireOwner).
  const order: CockpitNavGroup[] = ["shamanes", "routines", "chakras", "akakarm", "support"];
  return order
    .map((id) => {
      let items = COCKPIT_NAV.filter((i) => i.group === id);
      if (id === "support") {
        const ownerItems = includeOwner
          ? COCKPIT_NAV.filter((i) => i.group === "owner")
          : [];
        items = [...ownerItems, ...items];
      }
      return { id, label: GROUP_LABELS[id], items };
    })
    .filter((g) => g.items.length > 0);
}
