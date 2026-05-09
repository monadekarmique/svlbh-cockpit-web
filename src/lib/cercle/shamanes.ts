// Shamanes du Cercle — port ShamanesOverviewView.swift.
// Fetch SHAMANES-PENDING via webhook Make.com PULL.

const PULL_URL = "https://hook.eu2.make.com/n00qt5bxbemy49l3woix0xaopltg8sas";

export type ShamaneRef = {
  code: string;
  name: string;
  emoji: string;
};

/** 8 shamanes hardcodées (référence du Cercle de Lumière). */
export const SHAMANES: ShamaneRef[] = [
  { code: "200", name: "Véronique", emoji: "🔮" },
  { code: "0300", name: "Cornelia", emoji: "🐱" },
  { code: "0301", name: "Flavia", emoji: "✨" },
  { code: "0302", name: "Anne", emoji: "🌸" },
  { code: "0303", name: "Chloé", emoji: "💫" },
  { code: "0304", name: "Irène", emoji: "🌿" },
  { code: "455000", name: "Patrick", emoji: "🔬" },
  { code: "754545", name: "Patrick P.", emoji: "🛡" },
];

export type ShamaneBadge = ShamaneRef & { count: number };

/**
 * Format réponse webhook : "0300:6|0301:4|0302:3|0303:1|455000:16"
 * READ ou réponse vide → tous les counts à 0.
 */
function parsePending(text: string): Record<string, number> {
  const result: Record<string, number> = {};
  for (const pair of text.split("|")) {
    const [code, count] = pair.split(":");
    const n = parseInt(count);
    if (code && !isNaN(n)) result[code.trim()] = n;
  }
  return result;
}

export async function fetchShamanesPending(): Promise<ShamaneBadge[]> {
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
  return SHAMANES.map((s) => ({ ...s, count: counts[s.code] ?? 0 }));
}
