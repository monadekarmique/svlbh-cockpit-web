// Si Zhu 四柱 — Points de validation radiesthésique des pathologies chromathiques
// monadiques par axe élémentaire.
//
// Doctrine validée Patrick 2026-05-09 (transmission corpus chrono-acupuncture).
// Les "cas parfaits" sont les jours où les 4 piliers (Année / Mois / Jour / Heure)
// portent tous la même branche terrestre 地支. Pour 10 des 12 branches, il existe
// un sous-ensemble où les 4 tiges célestes 天干 sont également identiques —
// produisant une tension Sheng/Ke spécifique entre Ciel et Terre.
//
// Ce sont les fenêtres temporelles où la validation pendulaire des pathologies
// chromathiques monadiques (axe Bois / Feu / Terre / Métal / Eau) atteint sa
// précision maximale — points d'ancrage du Linggui Bafa sur le cycle Zi Wu Liu Zhu.

export type ElementAxis = "BOIS" | "FEU" | "TERRE" | "METAL" | "EAU";

export type TensionType =
  | "SHENG" // Tige nourrit Branche (Mère→Fils)
  | "SHENG_INV" // Branche nourrit Tige (Fils→Mère, drainage vers le haut)
  | "KE" // Tige contrôle Branche (pression descendante)
  | "KE_INV" // Branche contre-attaque Tige (inversion polarité)
  | "IDENTITE"; // Même élément, même polarité — résonance pure (calibration)

export type SiZhuPoint = {
  /** Combinaison gan-zhi du cas parfait (ex: "辛卯") */
  ganZhi: string;
  /** Pinyin de la combinaison */
  pinyin: string;
  /** Branche terrestre seule */
  branch: string;
  /** Pinyin de la branche + animal */
  branchLabel: string;
  /** Élément de la branche → axe de validation */
  axis: ElementAxis;
  /** Méridien actif sur cette tranche horaire (Zi Wu Liu Zhu) */
  meridian: string;
  /** Code MTC du méridien */
  meridianCode: string;
  /** Tranche horaire d'ouverture (vrai temps solaire local) */
  hourSlot: string;
  /** Type de tension Ciel↔Terre */
  tension: TensionType;
  /** Description de la tension élémentaire */
  tensionDescription: string;
  /** Lecture clinique radiesthésique */
  clinicalReading: string;
  /** Dates passées documentées (ISO YYYY-MM-DD) */
  pastDates: string[];
  /** Dates futures documentées */
  futureDates: string[];
};

/** Cas parfaits 4×branche+tige identiques — 10 points d'ancrage Linggui Bafa */
export const SIZHU_PERFECT: SiZhuPoint[] = [
  {
    ganZhi: "壬寅",
    pinyin: "Rén Yín",
    branch: "寅",
    branchLabel: "Yín (Tigre)",
    axis: "BOIS",
    meridian: "Poumons",
    meridianCode: "LU",
    hourSlot: "03h–05h",
    tension: "SHENG",
    tensionDescription: "Eau 水 → Bois 木 (Tige nourrit Branche, Mère→Fils)",
    clinicalReading:
      "L'Eau céleste nourrit le Bois terrestre. Lecture en deux temps : Color Gel de la tige d'abord (source qui s'épuise), branche ensuite. Pathologies où la mère se vide à nourrir le fils.",
    pastDates: ["1902-02-12"],
    futureDates: ["2082-02-27"],
  },
  {
    ganZhi: "辛卯",
    pinyin: "Xīn Mǎo",
    branch: "卯",
    branchLabel: "Mǎo (Lapin)",
    axis: "BOIS",
    meridian: "Gros Intestin",
    meridianCode: "LI",
    hourSlot: "05h–07h",
    tension: "KE",
    tensionDescription: "Métal 金 克 Bois 木 (Tige contrôle Branche)",
    clinicalReading:
      "Métal céleste coupe Bois terrestre. Stagnation max du Qi du Foie — points cibles LR-3 太衝, LR-14 期門, LI-4 合谷. Pendule sens horaire en contrôle.",
    pastDates: ["1951-03-16"],
    futureDates: ["2131-04-01"],
  },
  {
    ganZhi: "庚辰",
    pinyin: "Gēng Chén",
    branch: "辰",
    branchLabel: "Chén (Dragon)",
    axis: "TERRE",
    meridian: "Estomac",
    meridianCode: "ST",
    hourSlot: "07h–09h",
    tension: "SHENG_INV",
    tensionDescription: "Terre 土 → Métal 金 (Branche nourrit Tige, Fils→Mère)",
    clinicalReading:
      "Drainage vers le haut : la Terre terrestre alimente le Métal céleste. Signature d'un système lymphatique monadique qui aspire au lieu de distribuer. Fenêtre matinale critique.",
    pastDates: ["1940-05-01", "2000-04-16"],
    futureDates: [],
  },
  {
    ganZhi: "己巳",
    pinyin: "Jǐ Sì",
    branch: "巳",
    branchLabel: "Sì (Serpent)",
    axis: "FEU",
    meridian: "Rate",
    meridianCode: "SP",
    hourSlot: "09h–11h",
    tension: "SHENG_INV",
    tensionDescription: "Feu 火 → Terre 土 (Branche nourrit Tige, Fils→Mère)",
    clinicalReading:
      "Feu terrestre alimente Terre céleste. Drainage vers le haut, fenêtre matinale 7h-13h (avec 庚辰 et 戊午) — moment optimal pour dissoudre les hashs chromathiques monadiques à leur source.",
    pastDates: ["1989-06-02"],
    futureDates: ["2049-05-18"],
  },
  {
    ganZhi: "戊午",
    pinyin: "Wù Wǔ",
    branch: "午",
    branchLabel: "Wǔ (Cheval)",
    axis: "FEU",
    meridian: "Cœur",
    meridianCode: "HT",
    hourSlot: "11h–13h",
    tension: "SHENG_INV",
    tensionDescription: "Feu 火 → Terre 土 (Branche nourrit Tige, Fils→Mère)",
    clinicalReading:
      "Feu terrestre nourrit Terre céleste — le Cœur alimente la Rate. Continuité du bloc matinal Sheng inverse (辰巳午).",
    pastDates: [],
    futureDates: ["2038-07-04", "2098-06-19"],
  },
  {
    ganZhi: "丁未",
    pinyin: "Dīng Wèi",
    branch: "未",
    branchLabel: "Wèi (Chèvre)",
    axis: "TERRE",
    meridian: "Intestin Grêle",
    meridianCode: "SI",
    hourSlot: "13h–15h",
    tension: "SHENG",
    tensionDescription: "Feu 火 → Terre 土 (Tige nourrit Branche, Mère→Fils)",
    clinicalReading:
      "Feu céleste nourrit Terre terrestre. Lecture en deux temps comme 壬寅 — source d'abord, fils ensuite.",
    pastDates: ["1907-07-21"],
    futureDates: ["2087-08-05"],
  },
  {
    ganZhi: "丙申",
    pinyin: "Bǐng Shēn",
    branch: "申",
    branchLabel: "Shēn (Singe)",
    axis: "METAL",
    meridian: "Vessie",
    meridianCode: "BL",
    hourSlot: "15h–17h",
    tension: "KE",
    tensionDescription: "Feu 火 克 Métal 金 (Tige contrôle Branche)",
    clinicalReading:
      "Feu céleste fond Métal terrestre. Pression descendante du plan monadique sur le plan physique — la tige impose sa couleur sur la branche.",
    pastDates: ["1956-08-21"],
    futureDates: [],
  },
  {
    ganZhi: "乙酉",
    pinyin: "Yǐ Yǒu",
    branch: "酉",
    branchLabel: "Yǒu (Coq)",
    axis: "METAL",
    meridian: "Reins",
    meridianCode: "KI",
    hourSlot: "17h–19h",
    tension: "KE_INV",
    tensionDescription:
      "Métal 金 克 Bois 木 (Branche contre-attaque Tige — seul cas)",
    clinicalReading:
      "La Terre se rebelle contre le Ciel — inversion de polarité monadique. Bois Yin de la tige étranglé par Métal des 4 branches. Signature du fork transgénérationnel : le plan physique refuse la programmation ancestrale. Point de validation des inversions de polarité Reins.",
    pastDates: ["1945-10-07", "2005-09-22"],
    futureDates: ["2065-09-07"],
  },
  {
    ganZhi: "甲戌",
    pinyin: "Jiǎ Xū",
    branch: "戌",
    branchLabel: "Xū (Chien)",
    axis: "TERRE",
    meridian: "Maître du Cœur",
    meridianCode: "PC",
    hourSlot: "19h–21h",
    tension: "KE",
    tensionDescription: "Bois 木 克 Terre 土 (Tige contrôle Branche)",
    clinicalReading:
      "Bois céleste pénètre Terre terrestre. Fenêtre soir critique pour les pathologies cardio-péricardiques — résonance directe avec CV 17 (Mu antérieur du Péricarde, axe Alzheimer).",
    pastDates: [],
    futureDates: ["2054-10-24"],
  },
  {
    ganZhi: "癸亥",
    pinyin: "Guǐ Hài",
    branch: "亥",
    branchLabel: "Hài (Cochon)",
    axis: "EAU",
    meridian: "Triple Réchauffeur",
    meridianCode: "TE",
    hourSlot: "21h–23h",
    tension: "IDENTITE",
    tensionDescription:
      "Eau 水 = Eau 水 (Tige et Branche même élément, même polarité Yin)",
    clinicalReading:
      "Identité totale, résonance pure — aucune tension. Point ZÉRO de calibration : si le pendule ne réagit pas sur 癸亥×4, l'instrument est correctement calibré pour l'axe Eau. Le Triple Réchauffeur, non-organe régulateur des 3 foyers, est le méridien idéal pour cette fonction.",
    pastDates: ["1923-11-10"],
    futureDates: [],
  },
];

/** Branches sans cas parfait possible — pas de point d'ancrage fixe */
export const SIZHU_IMPOSSIBLE = [
  {
    branch: "子",
    branchLabel: "Zǐ (Rat)",
    axis: "EAU" as ElementAxis,
    meridian: "Vésicule Biliaire",
    meridianCode: "GB",
    hourSlot: "23h–01h",
    reason:
      "Eau Yang sur Eau Yang impossible mathématiquement (1ère branche du cycle, polarité non-différenciée). En hDOM : pas de hash chromathique verrouillable.",
  },
  {
    branch: "丑",
    branchLabel: "Chǒu (Bœuf)",
    axis: "TERRE" as ElementAxis,
    meridian: "Foie",
    meridianCode: "LR",
    hourSlot: "01h–03h",
    reason:
      "Terre Yin sur Terre Yin impossible mathématiquement (2ème branche, point d'origine du temps). Pas de tige parfaite calculable.",
  },
];

/** Dates 4×卯 sans tige parfaite — fenêtres Bois utilisables hors année du Lapin parfait */
export const SIZHU_MAO_SERIES = {
  past: ["2023-03-10", "2023-03-22", "2023-04-03"],
  future: ["2035-03-07", "2035-03-19", "2035-03-31"],
  hourSlot: "05h–07h",
  meridian: "Gros Intestin (LI)",
  axis: "BOIS" as ElementAxis,
  note: "4 piliers tous en 卯 sans tige unifiée — points d'ancrage Bois disponibles tous les ~12 ans dans l'année du Lapin (~2-3 jours en mois 卯, 5 mars – 4 avril).",
};

/** Couleur tonale par axe (cohérent avec convention chromathique) */
export const AXIS_TONE: Record<ElementAxis, { bg: string; border: string; text: string; label: string }> = {
  BOIS: {
    bg: "bg-emerald-50",
    border: "border-emerald-300",
    text: "text-emerald-900",
    label: "Bois 木",
  },
  FEU: {
    bg: "bg-rose-50",
    border: "border-rose-300",
    text: "text-rose-900",
    label: "Feu 火",
  },
  TERRE: {
    bg: "bg-amber-50",
    border: "border-amber-300",
    text: "text-amber-900",
    label: "Terre 土",
  },
  METAL: {
    bg: "bg-slate-50",
    border: "border-slate-300",
    text: "text-slate-900",
    label: "Métal 金",
  },
  EAU: {
    bg: "bg-blue-50",
    border: "border-blue-300",
    text: "text-blue-900",
    label: "Eau 水",
  },
};

/** Tension type → tone + label court */
export const TENSION_TONE: Record<TensionType, { color: string; label: string; symbol: string }> = {
  SHENG: { color: "text-emerald-700", label: "Sheng (Mère→Fils)", symbol: "生" },
  SHENG_INV: { color: "text-teal-700", label: "Sheng inverse (Fils→Mère)", symbol: "↑生" },
  KE: { color: "text-rose-700", label: "Ke (contrôle descendant)", symbol: "克" },
  KE_INV: { color: "text-orange-700", label: "Ke inverse (contre-attaque)", symbol: "反克" },
  IDENTITE: { color: "text-blue-700", label: "Identité (résonance pure)", symbol: "同" },
};

/** Ordre des points par tranche horaire (cycle Zi Wu Liu Zhu) */
export const SIZHU_BY_HOUR: SiZhuPoint[] = [...SIZHU_PERFECT].sort((a, b) =>
  a.hourSlot.localeCompare(b.hourSlot),
);

/** Helper : à partir d'aujourd'hui, retourne les prochaines dates de libération efficace */
export function upcomingReleaseDates(
  from: Date = new Date(),
  limit: number = 8,
): { point: SiZhuPoint; date: string; daysUntil: number }[] {
  const today = new Date(Date.UTC(from.getFullYear(), from.getMonth(), from.getDate()));
  const all: { point: SiZhuPoint; date: string; daysUntil: number }[] = [];
  for (const p of SIZHU_PERFECT) {
    for (const d of p.futureDates) {
      const target = new Date(d + "T00:00:00Z");
      const days = Math.floor((target.getTime() - today.getTime()) / 86400000);
      if (days >= 0) all.push({ point: p, date: d, daysUntil: days });
    }
  }
  // Ajoute aussi la série 4×卯 future
  for (const d of SIZHU_MAO_SERIES.future) {
    const target = new Date(d + "T00:00:00Z");
    const days = Math.floor((target.getTime() - today.getTime()) / 86400000);
    if (days >= 0) {
      all.push({
        point: {
          ganZhi: "××卯",
          pinyin: "(série Mǎo non-parfaite)",
          branch: "卯",
          branchLabel: SIZHU_MAO_SERIES.meridian,
          axis: SIZHU_MAO_SERIES.axis,
          meridian: SIZHU_MAO_SERIES.meridian,
          meridianCode: "LI",
          hourSlot: SIZHU_MAO_SERIES.hourSlot,
          tension: "SHENG",
          tensionDescription: "Tige variable, branches 卯 alignées",
          clinicalReading: SIZHU_MAO_SERIES.note,
          pastDates: SIZHU_MAO_SERIES.past,
          futureDates: SIZHU_MAO_SERIES.future,
        } as SiZhuPoint,
        date: d,
        daysUntil: days,
      });
    }
  }
  return all.sort((a, b) => a.daysUntil - b.daysUntil).slice(0, limit);
}
