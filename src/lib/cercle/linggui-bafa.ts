// Linggui Bafa 灵龟八法 — 8 points de confluence des merveilleux vaisseaux MTC.
// Port LingguiBafaView.swift (engine de calcul Tian Gan / Di Zhi).

export type BafaPoint = {
  id: number; // 1-8
  code: string;
  pinyin: string;
  vessel: string;
};

export const BAFA_POINTS: BafaPoint[] = [
  { id: 1, code: "L4 / SP4", pinyin: "gongsun", vessel: "Chong Mai" },
  { id: 2, code: "Pc6 / P6", pinyin: "neiguan", vessel: "Yin Wei Mai" },
  { id: 3, code: "IT3 / SI3", pinyin: "houxi", vessel: "Du Mai" },
  { id: 4, code: "V62 / UB62", pinyin: "shenmo", vessel: "Yang Qiao Mai" },
  { id: 5, code: "T5 / SJ5", pinyin: "waiguan", vessel: "Yang Wei Mai" },
  { id: 6, code: "F41 / GB41", pinyin: "linqi", vessel: "Dai Mai" },
  { id: 7, code: "R6 / KD6", pinyin: "zhaohai", vessel: "Yin Qiao Mai" },
  { id: 8, code: "P7 / LU7", pinyin: "lieque", vessel: "Ren Mai" },
];

const TIAN_GAN_NAMES = ["Jia", "Yi", "Bing", "Ding", "Wu", "Ji", "Geng", "Xin", "Ren", "Gui"];
const DI_ZHI_NAMES = [
  "Zi (Rat)",
  "Chou (Buffle)",
  "Yin (Tigre)",
  "Mao (Lapin)",
  "Chen (Dragon)",
  "Si (Serpent)",
  "Wu (Cheval)",
  "Wei (Chèvre)",
  "Shen (Singe)",
  "You (Coq)",
  "Xu (Chien)",
  "Hai (Cochon)",
];

const DI_ZHI_HOUR_LABELS = [
  "23h–01h",
  "01h–03h",
  "03h–05h",
  "05h–07h",
  "07h–09h",
  "09h–11h",
  "11h–13h",
  "13h–15h",
  "15h–17h",
  "17h–19h",
  "19h–21h",
  "21h–23h",
];

/** Référence : 1er janvier 1900 = Tian Gan index 0 (Jia 甲) */
function tianGanIndex(date: Date): number {
  const ref = new Date(Date.UTC(1900, 0, 1));
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const days = Math.floor((target.getTime() - ref.getTime()) / 86400000);
  return ((days % 10) + 10) % 10;
}

/** 23-01 = Zi(0), 01-03 = Chou(1), 03-05 = Yin(2), ... */
function diZhiIndex(hour: number): number {
  const adjusted = (hour + 1) % 24;
  return Math.floor(adjusted / 2);
}

/** Mapping du résultat modulo 9 vers indices de paires de points Bafa */
const BAFA_PAIR_MAP: { upper: number; lower: number }[] = [
  { upper: 7, lower: 8 },
  { upper: 7, lower: 8 },
  { upper: 5, lower: 6 },
  { upper: 4, lower: 3 },
  { upper: 7, lower: 8 },
  { upper: 5, lower: 6 },
  { upper: 1, lower: 2 },
  { upper: 6, lower: 5 },
  { upper: 7, lower: 8 },
];

const TIAN_GAN_COEFF = [1, 6, 2, 7, 3, 8, 4, 9, 5, 10];
const DI_ZHI_COEFF = [1, 6, 2, 7, 3, 8, 4, 9, 5, 10, 1, 6];

export type BafaResult = {
  date: Date;
  hour: number;
  hourLabel: string;
  tianGanIndex: number;
  tianGanName: string;
  diZhiIndex: number;
  diZhiName: string;
  upper: BafaPoint;
  lower: BafaPoint;
};

export function bafaForDate(date: Date, hour: number): BafaResult {
  const tg = tianGanIndex(date);
  const dz = diZhiIndex(hour);
  const sum = TIAN_GAN_COEFF[tg] + DI_ZHI_COEFF[dz];
  const idx = ((sum - 1) % 9 + 9) % 9;
  const pair = BAFA_PAIR_MAP[idx];
  return {
    date,
    hour,
    hourLabel: DI_ZHI_HOUR_LABELS[dz],
    tianGanIndex: tg,
    tianGanName: TIAN_GAN_NAMES[tg],
    diZhiIndex: dz,
    diZhiName: DI_ZHI_NAMES[dz],
    upper: BAFA_POINTS[pair.upper - 1],
    lower: BAFA_POINTS[pair.lower - 1],
  };
}

/** Tableau des 12 créneaux du jour donné */
export function bafaSlotsForDay(date: Date): BafaResult[] {
  // Créneaux Di Zhi : 23, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21
  const startHours = [23, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21];
  return startHours.map((h) => bafaForDate(date, h));
}
