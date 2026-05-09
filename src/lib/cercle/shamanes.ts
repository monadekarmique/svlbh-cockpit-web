// Shamanes du Cercle — port ShamanesOverviewView.swift.
// Fetch SHAMANES-PENDING via webhook Make.com PULL.

const PULL_URL = "https://hook.eu2.make.com/n00qt5bxbemy49l3woix0xaopltg8sas";

export type ShamaneRole =
  | "cercle" // Shamane du Cercle officielle (numérotée)
  | "cercle-t2" // Shamane du Cercle de niveau T2 (apprenante intégrée)
  | "t3-en-attente" // T3 en cours de certification
  | "superviseur"; // Patrick/Patrick P. — non visibles aux participantes

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

/** 8 shamanes hardcodées (référence du Cercle de Lumière). */
export const SHAMANES_ALL: ShamaneRef[] = [
  {
    code: "200",
    name: "Véronique",
    emoji: "🔮",
    role: "t3-en-attente",
  },
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

export async function fetchShamanesPending(
  isSuperviseur: boolean,
): Promise<ShamaneBadge[]> {
  let counts: Record<string, number> = {};
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
      if (text && text !== "READ") counts = parsePending(text);
    }
  } catch (e) {
    console.error(
      "[shamanes] fetch error:",
      e instanceof Error ? e.message : e,
    );
  }
  return visibleShamanes(isSuperviseur).map((s) => ({
    ...s,
    count: counts[s.code] ?? 0,
  }));
}
