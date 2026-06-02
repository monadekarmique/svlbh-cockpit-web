// Bazi 八字 — Les Quatre Piliers (四柱) : Année · Mois · Jour · Heure.
// Chaque pilier = un tronc céleste (Tian Gan 天干) + une branche terrestre (Di Zhi 地支).
//
// Le web n'avait jusqu'ici que le calcul Jour (référence 1900-01-01, cf. linggui-bafa.ts)
// et Heure (double-heure Di Zhi). Ce module ajoute Année + Mois et expose les 4 piliers
// complets, avec True Local Time et les tables MTC (méridiens + 8 vaisseaux).
//
// ⚠️ APPROXIMATION DES TERMES SOLAIRES :
// L'algorithme Bazi exact dépend des 24 termes solaires (节气), dont les dates varient
// d'année en année (±1 jour). Pour rester sans dépendance astronomique, on approxime les
// bornes par des dates fixes documentées (les « 节 », points d'entrée de chaque mois solaire) :
//   Lìchūn 立春 ≈ 4 févr.  → début année solaire + mois Yín 寅 (mois 1)
//   Jīngzhé 惊蛰 ≈ 6 mars  → mois Mǎo 卯
//   Qīngmíng 清明 ≈ 5 avr. → mois Chén 辰
//   Lìxià 立夏 ≈ 6 mai     → mois Sì 巳
//   Mángzhòng 芒种 ≈ 6 juin → mois Wǔ 午
//   Xiǎoshǔ 小暑 ≈ 7 juil. → mois Wèi 未
//   Lìqiū 立秋 ≈ 8 août    → mois Shēn 申
//   Báilù 白露 ≈ 8 sept.   → mois Yǒu 酉
//   Hánlù 寒露 ≈ 8 oct.    → mois Xū 戌
//   Lìdōng 立冬 ≈ 7 nov.   → mois Hài 亥
//   Dàxuě 大雪 ≈ 7 déc.    → mois Zǐ 子
//   Xiǎohán 小寒 ≈ 6 janv. → mois Chǒu 丑
// Pour une précision clinique (±1 j autour des bornes), il faudra une éphéméride.

// ── Tables canoniques ────────────────────────────────────────────────────────

export type WuXing = "Bois" | "Feu" | "Terre" | "Métal" | "Eau";

export type TianGan = {
  index: number; // 0-9
  pinyin: string;
  zh: string;
  fr: string;
  element: WuXing;
  yin: boolean; // true = Yin, false = Yang
};

export type DiZhi = {
  index: number; // 0-11
  pinyin: string;
  zh: string;
  fr: string;
  animalEn: string; // ex. "Sheep", "Dragon" — tel qu'affiché dans l'écran de réf.
  animalFr: string;
  element: WuXing;
  yin: boolean;
  /** Fenêtre horaire de la double-heure (Zi Wu Liu Zhu) */
  hourLabel: string;
};

/** 10 Troncs célestes 天干 — ordre canonique Jiǎ … Guǐ */
export const TIAN_GAN: TianGan[] = [
  { index: 0, pinyin: "jiǎ", zh: "甲", fr: "Jia", element: "Bois", yin: false },
  { index: 1, pinyin: "yǐ", zh: "乙", fr: "Yi", element: "Bois", yin: true },
  { index: 2, pinyin: "bǐng", zh: "丙", fr: "Bing", element: "Feu", yin: false },
  { index: 3, pinyin: "dīng", zh: "丁", fr: "Ding", element: "Feu", yin: true },
  { index: 4, pinyin: "wù", zh: "戊", fr: "Wu", element: "Terre", yin: false },
  { index: 5, pinyin: "jǐ", zh: "己", fr: "Ji", element: "Terre", yin: true },
  { index: 6, pinyin: "gēng", zh: "庚", fr: "Geng", element: "Métal", yin: false },
  { index: 7, pinyin: "xīn", zh: "辛", fr: "Xin", element: "Métal", yin: true },
  { index: 8, pinyin: "rén", zh: "壬", fr: "Ren", element: "Eau", yin: false },
  { index: 9, pinyin: "guǐ", zh: "癸", fr: "Gui", element: "Eau", yin: true },
];

/** 12 Branches terrestres 地支 — ordre canonique Zǐ … Hài */
export const DI_ZHI: DiZhi[] = [
  { index: 0, pinyin: "zǐ", zh: "子", fr: "Zi", animalEn: "Rat", animalFr: "Rat", element: "Eau", yin: false, hourLabel: "23h–01h" },
  { index: 1, pinyin: "chǒu", zh: "丑", fr: "Chou", animalEn: "Ox", animalFr: "Buffle", element: "Terre", yin: true, hourLabel: "01h–03h" },
  { index: 2, pinyin: "yín", zh: "寅", fr: "Yin", animalEn: "Tiger", animalFr: "Tigre", element: "Bois", yin: false, hourLabel: "03h–05h" },
  { index: 3, pinyin: "mǎo", zh: "卯", fr: "Mao", animalEn: "Rabbit", animalFr: "Lapin", element: "Bois", yin: true, hourLabel: "05h–07h" },
  { index: 4, pinyin: "chén", zh: "辰", fr: "Chen", animalEn: "Dragon", animalFr: "Dragon", element: "Terre", yin: false, hourLabel: "07h–09h" },
  { index: 5, pinyin: "sì", zh: "巳", fr: "Si", animalEn: "Snake", animalFr: "Serpent", element: "Feu", yin: true, hourLabel: "09h–11h" },
  { index: 6, pinyin: "wǔ", zh: "午", fr: "Wu", animalEn: "Horse", animalFr: "Cheval", element: "Feu", yin: false, hourLabel: "11h–13h" },
  { index: 7, pinyin: "wèi", zh: "未", fr: "Wei", animalEn: "Sheep", animalFr: "Chèvre", element: "Terre", yin: true, hourLabel: "13h–15h" },
  { index: 8, pinyin: "shēn", zh: "申", fr: "Shen", animalEn: "Monkey", animalFr: "Singe", element: "Métal", yin: false, hourLabel: "15h–17h" },
  { index: 9, pinyin: "yǒu", zh: "酉", fr: "You", animalEn: "Cock", animalFr: "Coq", element: "Métal", yin: true, hourLabel: "17h–19h" },
  { index: 10, pinyin: "xū", zh: "戌", fr: "Xu", animalEn: "Dog", animalFr: "Chien", element: "Terre", yin: false, hourLabel: "19h–21h" },
  { index: 11, pinyin: "hài", zh: "亥", fr: "Hai", animalEn: "Pig", animalFr: "Cochon", element: "Eau", yin: true, hourLabel: "21h–23h" },
];

// ── Lieux (longitudes) — repris de LingguiBafaView.swift TimeZonePickerSheet ──

export type Place = {
  label: string;
  timeZone: string; // identifiant IANA
  longitude: number; // degrés Est (négatif = Ouest)
};

export const PLACES: Place[] = [
  { label: "Suisse (Avenches)", timeZone: "Europe/Zurich", longitude: 7.04 },
  { label: "France (Paris)", timeZone: "Europe/Paris", longitude: 2.35 },
  { label: "Italie (Rome)", timeZone: "Europe/Rome", longitude: 12.5 },
  { label: "Allemagne (Berlin)", timeZone: "Europe/Berlin", longitude: 13.4 },
  { label: "Royaume-Uni (Londres)", timeZone: "Europe/London", longitude: -0.12 },
  { label: "USA Est (New York)", timeZone: "America/New_York", longitude: -74.0 },
  { label: "USA Ouest (Los Angeles)", timeZone: "America/Los_Angeles", longitude: -118.24 },
  { label: "Japon (Tokyo)", timeZone: "Asia/Tokyo", longitude: 139.69 },
  { label: "Inde (Delhi)", timeZone: "Asia/Kolkata", longitude: 77.21 },
  { label: "Australie (Sydney)", timeZone: "Australia/Sydney", longitude: 151.21 },
  { label: "Brésil (São Paulo)", timeZone: "America/Sao_Paulo", longitude: -46.63 },
  { label: "Maroc (Casablanca)", timeZone: "Africa/Casablanca", longitude: -7.59 },
];

export const DEFAULT_PLACE = PLACES[0];

// ── True Local Time ───────────────────────────────────────────────────────────

/**
 * Correction (en secondes) à appliquer à un instant UTC pour obtenir le vrai
 * temps solaire local du lieu, lu ensuite en UTC.
 *
 *   correction = longitude/15·3600   (secondes par rapport à Greenwich)
 *
 * NB : le port Swift original retournait `solarOffset − utcOffset` car Swift
 * fournit l'instant déjà exprimé dans le fuseau local. En JS, `Date.getTime()`
 * est toujours UTC, donc soustraire `utcOffset` faisait dériver l'affichage
 * d'une heure entière (ex. Londres à 07:06 UTC affichait 06:06 au lieu de
 * ~07:06). Le paramètre `_utcOffsetSecondsUnused` est conservé pour la signature
 * publique mais n'entre plus dans le calcul.
 */
export function trueLocalTimeCorrectionSeconds(longitude: number, _utcOffsetSecondsUnused: number): number {
  const solarOffset = (longitude / 15) * 3600; // secondes par rapport à Greenwich
  return Math.round(solarOffset);
}

/** Décalage UTC (en secondes) d'un fuseau IANA à une date donnée (gère l'heure d'été). */
export function utcOffsetSeconds(timeZone: string, at: Date): number {
  // Astuce sans dépendance : formate la même instant dans le fuseau cible et en UTC,
  // puis compare. On utilise Intl.DateTimeFormat avec timeZoneName pour extraire l'offset.
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = dtf.formatToParts(at);
  const map: Record<string, number> = {};
  for (const p of parts) {
    if (p.type !== "literal") map[p.type] = Number(p.value);
  }
  // "24:00" peut apparaître pour minuit selon le moteur — normalise.
  const hour = map.hour === 24 ? 0 : map.hour;
  const asUTC = Date.UTC(map.year, map.month - 1, map.day, hour, map.minute, map.second);
  return Math.round((asUTC - at.getTime()) / 1000);
}

/** Applique la correction True Local Time à un instant et renvoie une nouvelle Date. */
export function toTrueLocalTime(at: Date, longitude: number, timeZone: string): Date {
  const offset = utcOffsetSeconds(timeZone, at);
  const correction = trueLocalTimeCorrectionSeconds(longitude, offset);
  return new Date(at.getTime() + correction * 1000);
}

export function formatCorrection(totalSeconds: number): string {
  const sign = totalSeconds < 0 ? "−" : "+";
  const abs = Math.abs(totalSeconds);
  const h = Math.floor(abs / 3600);
  const m = Math.floor((abs % 3600) / 60);
  const s = abs % 60;
  return `${sign}${h}h ${m}m ${s}s`;
}

// ── Composants horaires du lieu (an/mois/jour/heure en vrai temps solaire) ─────

type LocalParts = {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  hour: number; // 0-23
  minute: number;
};

/**
 * Extrait l'année/mois/jour/heure « tels que vus à l'horloge solaire vraie du lieu ».
 * `at` est un instant absolu (Date) ; on le décale du True Local Time puis on lit ses
 * composants en UTC (le décalage a déjà été appliqué, donc lire en UTC = heure du lieu).
 */
export function trueLocalParts(at: Date, longitude: number, timeZone: string): LocalParts {
  const tlt = toTrueLocalTime(at, longitude, timeZone);
  return {
    year: tlt.getUTCFullYear(),
    month: tlt.getUTCMonth() + 1,
    day: tlt.getUTCDate(),
    hour: tlt.getUTCHours(),
    minute: tlt.getUTCMinutes(),
  };
}

// ── Algorithme des Quatre Piliers ─────────────────────────────────────────────

/** Bornes approximatives (mois, jour) des 12 « 节 » qui ouvrent chaque mois solaire.
 *  Index 0 = Lìchūn → mois Yín (branche index 2). Voir avertissement en tête de fichier. */
const SOLAR_MONTH_BOUNDS: { month: number; day: number; branch: number }[] = [
  { month: 2, day: 4, branch: 2 }, // 立春 Lìchūn → Yín 寅
  { month: 3, day: 6, branch: 3 }, // 惊蛰 Jīngzhé → Mǎo 卯
  { month: 4, day: 5, branch: 4 }, // 清明 Qīngmíng → Chén 辰
  { month: 5, day: 6, branch: 5 }, // 立夏 Lìxià → Sì 巳
  { month: 6, day: 6, branch: 6 }, // 芒种 Mángzhòng → Wǔ 午
  { month: 7, day: 7, branch: 7 }, // 小暑 Xiǎoshǔ → Wèi 未
  { month: 8, day: 8, branch: 8 }, // 立秋 Lìqiū → Shēn 申
  { month: 9, day: 8, branch: 9 }, // 白露 Báilù → Yǒu 酉
  { month: 10, day: 8, branch: 10 }, // 寒露 Hánlù → Xū 戌
  { month: 11, day: 7, branch: 11 }, // 立冬 Lìdōng → Hài 亥
  { month: 12, day: 7, branch: 0 }, // 大雪 Dàxuě → Zǐ 子
  { month: 1, day: 6, branch: 1 }, // 小寒 Xiǎohán → Chǒu 丑
];

/** Pilier Année — l'année solaire commence à Lìchūn (≈ 4 févr.). */
function yearPillar(parts: LocalParts): { gan: TianGan; zhi: DiZhi } {
  // Si avant Lìchūn (≈ 4 févr.), on est encore dans l'année solaire précédente.
  let solarYear = parts.year;
  if (parts.month < 2 || (parts.month === 2 && parts.day < 4)) {
    solarYear -= 1;
  }
  // Référence canonique : 1984 = 甲子 (Jiǎ-Zǐ), début du cycle sexagésimal.
  // Tronc année : (solarYear − 4) mod 10 ; Branche année : (solarYear − 4) mod 12.
  const ganIdx = ((solarYear - 4) % 10 + 10) % 10;
  const zhiIdx = ((solarYear - 4) % 12 + 12) % 12;
  return { gan: TIAN_GAN[ganIdx], zhi: DI_ZHI[zhiIdx] };
}

/** Branche du mois solaire (selon les 节). Renvoie aussi le « numéro » de mois Yín-based. */
function solarMonthBranchIndex(parts: LocalParts): number {
  // On cherche le dernier 节 franchi.
  // Construit la liste ordonnée en jours-de-l'année approximatifs et compare.
  const md = parts.month * 100 + parts.day;
  // SOLAR_MONTH_BOUNDS n'est pas trié par mois calendaire (déc → janv), on évalue
  // chaque borne et on prend celle dont (month,day) ≤ courant la plus tardive dans
  // l'année solaire. Plus simple : mapper chaque mois calendaire vers sa branche.
  // Règle : le mois solaire courant est défini par le 节 du mois calendaire si on l'a
  // franchi, sinon par le 节 du mois calendaire précédent.
  for (const b of SOLAR_MONTH_BOUNDS) {
    if (b.month === parts.month) {
      if (parts.day >= b.day) {
        return b.branch; // 节 du mois courant franchi
      }
      // pas encore franchi → branche du 节 précédent (mois calendaire − 1)
      const prevMonth = parts.month === 1 ? 12 : parts.month - 1;
      const prev = SOLAR_MONTH_BOUNDS.find((x) => x.month === prevMonth)!;
      return prev.branch;
    }
  }
  // (md non utilisé directement, gardé pour lisibilité de la borne)
  void md;
  // Fallback impossible normalement (tous les mois 1-12 couverts).
  return 2;
}

/**
 * Pilier Mois — tronc dérivé du tronc de l'année par la règle des « 5 tigres » 五虎遁 :
 * le tronc du mois Yín (1er mois solaire) dépend du tronc de l'année :
 *   année Jiǎ/Jǐ  → mois Yín = Bǐng (2)
 *   année Yǐ/Gēng → mois Yín = Wù (4)
 *   année Bǐng/Xīn→ mois Yín = Gēng (6)
 *   année Dīng/Rén→ mois Yín = Rén (8)
 *   année Wù/Guǐ  → mois Yín = Jiǎ (0)
 * Puis on incrémente le tronc d'autant de mois solaires que de pas depuis Yín.
 */
function monthPillar(parts: LocalParts, yearGan: TianGan): { gan: TianGan; zhi: DiZhi } {
  const branchIdx = solarMonthBranchIndex(parts);
  // Position du mois dans l'année solaire : Yín(2)=0, Mǎo(3)=1, … Chǒu(1)=11.
  const monthOrder = (branchIdx - 2 + 12) % 12;
  // Tronc du mois Yín selon le tronc d'année (五虎遁).
  const yinStemByYearStem: Record<number, number> = {
    0: 2, // 甲 → 丙
    5: 2, // 己 → 丙
    1: 4, // 乙 → 戊
    6: 4, // 庚 → 戊
    2: 6, // 丙 → 庚
    7: 6, // 辛 → 庚
    3: 8, // 丁 → 壬
    8: 8, // 壬 → 壬
    4: 0, // 戊 → 甲
    9: 0, // 癸 → 甲
  };
  const yinStem = yinStemByYearStem[yearGan.index];
  const ganIdx = (yinStem + monthOrder) % 10;
  return { gan: TIAN_GAN[ganIdx], zhi: DI_ZHI[branchIdx] };
}

/** Index du tronc du jour — réf. 1900-01-01 = Jiǎ (index 0), identique à linggui-bafa.ts.
 *  Utilise la date *du lieu* (an/mois/jour True Local Time). */
function dayGanIndex(parts: LocalParts): number {
  const ref = Date.UTC(1900, 0, 1);
  const target = Date.UTC(parts.year, parts.month - 1, parts.day);
  const days = Math.floor((target - ref) / 86400000);
  return ((days % 10) + 10) % 10;
}

/** Index de la branche du jour — réf. 1900-01-01 = Zǐ ? Non : le 1900-01-01 julien-day
 *  donne une branche connue. On ancre sur la branche connue du 1984-02-02 (甲子 jour) :
 *  en pratique, branche jour = (joursDepuisRefBranche) mod 12. On dérive d'une date repère
 *  fiable : 2000-01-07 était un jour 甲子 (Jiǎ-Zǐ) → tronc 0, branche 0. */
function dayZhiIndex(parts: LocalParts): number {
  // 2000-01-07 = jour 甲子 (vérifié contre tables 干支 standard) → branche Zǐ (0).
  const ref = Date.UTC(2000, 0, 7);
  const target = Date.UTC(parts.year, parts.month - 1, parts.day);
  const days = Math.floor((target - ref) / 86400000);
  return ((days % 12) + 12) % 12;
}

/** Pilier Jour. */
function dayPillar(parts: LocalParts): { gan: TianGan; zhi: DiZhi } {
  return {
    gan: TIAN_GAN[dayGanIndex(parts)],
    zhi: DI_ZHI[dayZhiIndex(parts)],
  };
}

/** Branche de l'heure (double-heure Di Zhi) : 23–01 = Zǐ(0), 01–03 = Chǒu(1), … */
function hourBranchIndex(hour: number): number {
  return Math.floor(((hour + 1) % 24) / 2);
}

/**
 * Pilier Heure — tronc dérivé du tronc du jour par la règle des « 5 rats » 五鼠遁 :
 * le tronc de l'heure Zǐ (1ère double-heure, 23–01) dépend du tronc du jour :
 *   jour Jiǎ/Jǐ  → heure Zǐ = Jiǎ (0)
 *   jour Yǐ/Gēng → heure Zǐ = Bǐng (2)
 *   jour Bǐng/Xīn→ heure Zǐ = Wù (4)
 *   jour Dīng/Rén→ heure Zǐ = Gēng (6)
 *   jour Wù/Guǐ  → heure Zǐ = Rén (8)
 * Puis +1 tronc par double-heure.
 */
function hourPillar(parts: LocalParts, dayGan: TianGan): { gan: TianGan; zhi: DiZhi } {
  const branchIdx = hourBranchIndex(parts.hour);
  const ziStemByDayStem: Record<number, number> = {
    0: 0, // 甲 → 甲
    5: 0, // 己 → 甲
    1: 2, // 乙 → 丙
    6: 2, // 庚 → 丙
    2: 4, // 丙 → 戊
    7: 4, // 辛 → 戊
    3: 6, // 丁 → 庚
    8: 6, // 壬 → 庚
    4: 8, // 戊 → 壬
    9: 8, // 癸 → 壬
  };
  const ziStem = ziStemByDayStem[dayGan.index];
  const ganIdx = (ziStem + branchIdx) % 10;
  return { gan: TIAN_GAN[ganIdx], zhi: DI_ZHI[branchIdx] };
}

export type Pillar = {
  key: "hour" | "day" | "month" | "year";
  label: string; // FR
  gan: TianGan;
  zhi: DiZhi;
};

export type FourPillars = {
  /** Parties horaires en vrai temps solaire local utilisées pour le calcul. */
  parts: LocalParts;
  hour: Pillar;
  day: Pillar;
  month: Pillar;
  year: Pillar;
};

/**
 * Calcule les 4 piliers Bazi pour un instant absolu, un lieu (longitude) et un fuseau.
 * Toutes les bornes calendaires sont évaluées en vrai temps solaire local du lieu.
 */
export function fourPillars(at: Date, longitude: number, timeZone: string): FourPillars {
  const parts = trueLocalParts(at, longitude, timeZone);
  const yp = yearPillar(parts);
  const mp = monthPillar(parts, yp.gan);
  const dp = dayPillar(parts);
  const hp = hourPillar(parts, dp.gan);
  return {
    parts,
    year: { key: "year", label: "Année", ...yp },
    month: { key: "month", label: "Mois", ...mp },
    day: { key: "day", label: "Jour", ...dp },
    hour: { key: "hour", label: "Heure", ...hp },
  };
}

/** Helper d'affichage : « jǐ-wèi », chinois « 己未 », etc. */
export function ganZhiPinyin(p: Pillar): string {
  return `${p.gan.pinyin}-${p.zhi.pinyin}`;
}
export function ganZhiZh(p: Pillar): string {
  return `${p.gan.zh}${p.zhi.zh}`;
}

// ── Najia 纳甲 (esquisse) ──────────────────────────────────────────────────────
// La méthode Najia 纳甲 fait varier le point Bafa ouvert selon le tronc du jour.
// Une implémentation exacte demande la table complète gan→trigramme→point ;
// faute de source validée par Patrick, on expose seulement le tronc du jour pour
// que la page affiche « (selon troncs du jour) ».
export function najiaHint(pillars: FourPillars): string {
  return `tronc du jour ${pillars.day.gan.zh} ${pillars.day.gan.pinyin} (${pillars.day.gan.element})`;
}

// ── Méridiens d'organes (12) + horaires Zi Wu Liu Zhu ──────────────────────────

export type OrganMeridian = {
  code: string; // LU, LI, ST, …
  name: string; // FR
  zh: string;
  pinyin: string;
  element: WuXing;
  hourLabel: string; // fenêtre d'ouverture Zi Wu Liu Zhu
  /** Points clés des Cinq Transport — au minimum Shu-stream / Yuan-source. */
  keyPoints: { code: string; role: string }[];
};

export const ORGAN_MERIDIANS: OrganMeridian[] = [
  {
    code: "LU", name: "Poumon", zh: "肺", pinyin: "Fèi", element: "Métal", hourLabel: "03h–05h",
    keyPoints: [
      { code: "LU9 Taiyuan", role: "Shu-stream + Yuan-source (太淵)" },
      { code: "LU7 Lieque", role: "Luo + point clé Ren Mai" },
    ],
  },
  {
    code: "LI", name: "Gros intestin", zh: "大腸", pinyin: "Dà Cháng", element: "Métal", hourLabel: "05h–07h",
    keyPoints: [
      { code: "LI3 Sanjian", role: "Shu-stream (三間)" },
      { code: "LI4 Hegu", role: "Yuan-source (合谷)" },
    ],
  },
  {
    code: "ST", name: "Estomac", zh: "胃", pinyin: "Wèi", element: "Terre", hourLabel: "07h–09h",
    keyPoints: [
      { code: "ST43 Xiangu", role: "Shu-stream (陷谷)" },
      { code: "ST42 Chongyang", role: "Yuan-source (衝陽)" },
    ],
  },
  {
    code: "SP", name: "Rate", zh: "脾", pinyin: "Pí", element: "Terre", hourLabel: "09h–11h",
    keyPoints: [
      { code: "SP3 Taibai", role: "Shu-stream + Yuan-source (太白)" },
      { code: "SP4 Gongsun", role: "Luo + point clé Chong Mai" },
    ],
  },
  {
    code: "HT", name: "Cœur", zh: "心", pinyin: "Xīn", element: "Feu", hourLabel: "11h–13h",
    keyPoints: [
      { code: "HT7 Shenmen", role: "Shu-stream + Yuan-source (神門)" },
      { code: "HT5 Tongli", role: "Luo — apaise le Shen" },
    ],
  },
  {
    code: "SI", name: "Intestin grêle", zh: "小腸", pinyin: "Xiǎo Cháng", element: "Feu", hourLabel: "13h–15h",
    keyPoints: [
      { code: "SI3 Houxi", role: "Shu-stream (後谿) + point clé Du Mai" },
      { code: "SI4 Wangu", role: "Yuan-source (腕骨)" },
    ],
  },
  {
    code: "BL", name: "Vessie", zh: "膀胱", pinyin: "Páng Guāng", element: "Eau", hourLabel: "15h–17h",
    keyPoints: [
      { code: "BL65 Shugu", role: "Shu-stream (束骨)" },
      { code: "BL64 Jinggu", role: "Yuan-source (京骨)" },
      { code: "BL62 Shenmai", role: "Point clé Yang Qiao Mai (申脈)" },
    ],
  },
  {
    code: "KI", name: "Rein", zh: "腎", pinyin: "Shèn", element: "Eau", hourLabel: "17h–19h",
    keyPoints: [
      { code: "KI3 Taixi", role: "Shu-stream + Yuan-source (太谿)" },
      { code: "KI6 Zhaohai", role: "Point clé Yin Qiao Mai (照海)" },
    ],
  },
  {
    code: "PC", name: "Maître du cœur (Péricarde)", zh: "心包", pinyin: "Xīn Bāo", element: "Feu", hourLabel: "19h–21h",
    keyPoints: [
      { code: "PC7 Daling", role: "Shu-stream + Yuan-source (大陵)" },
      { code: "PC6 Neiguan", role: "Luo + point clé Yin Wei Mai (內關)" },
    ],
  },
  {
    code: "TE", name: "Triple réchauffeur", zh: "三焦", pinyin: "Sān Jiāo", element: "Feu", hourLabel: "21h–23h",
    keyPoints: [
      { code: "TE3 Zhongzhu", role: "Shu-stream (中渚)" },
      { code: "TE4 Yangchi", role: "Yuan-source (陽池)" },
      { code: "TE5 Waiguan", role: "Point clé Yang Wei Mai (外關)" },
    ],
  },
  {
    code: "GB", name: "Vésicule biliaire", zh: "膽", pinyin: "Dǎn", element: "Bois", hourLabel: "23h–01h",
    keyPoints: [
      { code: "GB41 Zulinqi", role: "Shu-stream (足臨泣) + point clé Dai Mai" },
      { code: "GB40 Qiuxu", role: "Yuan-source (丘墟)" },
      { code: "GB13 Benshen", role: "Racine de l'Esprit — apaise le Shen (本神)" },
    ],
  },
  {
    code: "LR", name: "Foie", zh: "肝", pinyin: "Gān", element: "Bois", hourLabel: "01h–03h",
    keyPoints: [
      { code: "LR3 Taichong", role: "Shu-stream + Yuan-source (太衝)" },
      { code: "LR8 Ququan", role: "He-mer — nourrit le Sang du Foie" },
    ],
  },
];

// ── 8 vaisseaux extraordinaires + point de confluence (Linggui Bafa) ───────────

export type ExtraVessel = {
  code: string; // ex. Du Mai
  zh: string;
  pinyin: string;
  confluencePoint: string; // point d'ouverture (8 points de confluence)
  pairedWith: string; // vaisseau couplé
};

export const EXTRA_VESSELS: ExtraVessel[] = [
  { code: "Du Mai", zh: "督脈", pinyin: "Dū Mài", confluencePoint: "SI3 Houxi (後谿)", pairedWith: "Yang Qiao Mai" },
  { code: "Ren Mai", zh: "任脈", pinyin: "Rèn Mài", confluencePoint: "LU7 Lieque (列缺)", pairedWith: "Yin Qiao Mai" },
  { code: "Chong Mai", zh: "衝脈", pinyin: "Chōng Mài", confluencePoint: "SP4 Gongsun (公孫)", pairedWith: "Yin Wei Mai" },
  { code: "Dai Mai", zh: "帶脈", pinyin: "Dài Mài", confluencePoint: "GB41 Zulinqi (足臨泣)", pairedWith: "Yang Wei Mai" },
  { code: "Yang Qiao Mai", zh: "陽蹻脈", pinyin: "Yáng Qiāo Mài", confluencePoint: "BL62 Shenmai (申脈)", pairedWith: "Du Mai" },
  { code: "Yin Qiao Mai", zh: "陰蹻脈", pinyin: "Yīn Qiāo Mài", confluencePoint: "KI6 Zhaohai (照海)", pairedWith: "Ren Mai" },
  { code: "Yang Wei Mai", zh: "陽維脈", pinyin: "Yáng Wéi Mài", confluencePoint: "TE5 Waiguan (外關)", pairedWith: "Dai Mai" },
  { code: "Yin Wei Mai", zh: "陰維脈", pinyin: "Yīn Wéi Mài", confluencePoint: "PC6 Neiguan (內關)", pairedWith: "Chong Mai" },
];
