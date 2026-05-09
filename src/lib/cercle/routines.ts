// Routine matin Certifiées — port RoutineMatinTab.swift.
// Fetch quotas billing_praticien via webhook Make.com svlbh-sync-praticien.

const SYNC_URL = "https://hook.eu2.make.com/f5ezym67mfmywuwoov7fbb4gf3ufhqq8";

const BILLING_KEYS = [
  "200",
  "0300",
  "0301",
  "0302",
  "0303",
  "0304",
  "455000",
  "754545",
];

export type CertifieeQuota = {
  id: string;
  nom: string;
  categorie: "praticien" | "superviseur" | "formation" | string;
  max: number;
  compteur: number;
  quotaLibre: number;
  pourcentage: number;
  indicateur: "🟢" | "🔴";
};

type RawRecord = {
  code: string;
  nom_praticien: string;
  compteur_max_patient: number;
  compteur: number;
  categorie?: string;
};

async function fetchSingle(key: string): Promise<CertifieeQuota | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 10_000);
    const res = await fetch(SYNC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "get", billing_key: key }),
      signal: ctrl.signal,
      cache: "no-store",
    });
    clearTimeout(t);
    if (!res.ok) return null;
    const rec = (await res.json()) as Partial<RawRecord>;
    if (
      typeof rec.code !== "string" ||
      typeof rec.nom_praticien !== "string" ||
      typeof rec.compteur_max_patient !== "number" ||
      typeof rec.compteur !== "number"
    )
      return null;
    const max = rec.compteur_max_patient;
    const compteur = rec.compteur;
    const quotaLibre = max - compteur;
    return {
      id: rec.code,
      nom: rec.nom_praticien,
      categorie: rec.categorie ?? "praticien",
      max,
      compteur,
      quotaLibre,
      pourcentage: max === 0 ? 0 : (quotaLibre / max) * 100,
      indicateur: quotaLibre >= 0 ? "🟢" : "🔴",
    };
  } catch (e) {
    console.error(
      `[routines] fetchSingle ${key} error:`,
      e instanceof Error ? e.message : e,
    );
    return null;
  }
}

export async function fetchAllQuotas(): Promise<CertifieeQuota[]> {
  const all = await Promise.all(BILLING_KEYS.map((k) => fetchSingle(k)));
  return all.filter((q): q is CertifieeQuota => q !== null);
}

/** Cercle de Lumière checks (port des computed Swift) */
export type CercleChecks = {
  certifiees: CertifieeQuota[];
  patrick: CertifieeQuota | null;
  totalCompteurs: number;
  totalMax: number;
  // Check 1 — Énergie masculine : Patrick couvre les certifiées
  couvertureCheck1Pct: number;
  // Check 2 — Énergie féminine : Cornelia + Anne couvrent Flavia + Chloé + Irène
  couvertureCheck2Pct: number;
};

export function computeChecks(all: CertifieeQuota[]): CercleChecks {
  const certifiees = all
    .filter((q) => q.categorie === "praticien")
    .sort((a, b) => b.compteur - a.compteur);
  const patrick = all.find((q) => q.categorie === "superviseur") ?? null;
  const patrickMax = patrick?.max ?? 0;
  const totalCompteurs = certifiees.reduce((s, q) => s + q.compteur, 0);
  const totalMax = certifiees.reduce((s, q) => s + q.max, 0);

  const groupA = certifiees.filter((q) => ["0300", "0302"].includes(q.id));
  const groupB = certifiees.filter((q) => !["0300", "0302"].includes(q.id));
  const capaciteA = groupA.reduce((s, q) => s + q.quotaLibre, 0);
  const compteurB = groupB.reduce((s, q) => s + q.compteur, 0);

  return {
    certifiees,
    patrick,
    totalCompteurs,
    totalMax,
    couvertureCheck1Pct: totalMax === 0 ? 0 : (patrickMax / totalMax) * 100,
    couvertureCheck2Pct: compteurB === 0 ? 100 : (capaciteA / compteurB) * 100,
  };
}
