// Chrono Fu — 6 Organes Fu MTC selon Zi Wu Liu Zhu (子午流注).
// Port direct de ChronoFuData.swift.

export type AcuPoint = { code: string; name: string; action: string };

export type FuOrgan = {
  id: "GB" | "LI" | "ST" | "SI" | "BL" | "TE";
  name: string;
  zh: string;
  pinyin: string;
  startHour: number;
  label: string;
  element: string;
  color: string;
  bg: string;
  tx: string;
  chromoName: string;
  points: AcuPoint[];
};

export const FU_ORGANS: FuOrgan[] = [
  {
    id: "GB",
    name: "Vésicule biliaire",
    zh: "膽",
    pinyin: "Dǎn",
    startHour: 23,
    label: "23h – 1h",
    element: "Bois",
    color: "#4A7C3F",
    bg: "#EAF3DE",
    tx: "#27500A",
    chromoName: "Vert forêt",
    points: [
      { code: "GB34", name: "Yanglingquan", action: "Tonifie la vésicule biliaire, fluidifie la bile" },
      { code: "GB41", name: "Foot-Linqi", action: "Point maître Dai Mai, régulation latérale" },
      { code: "GB21", name: "Jianjing", action: "Libère la tension, descend le Qi digestif" },
    ],
  },
  {
    id: "LI",
    name: "Gros intestin",
    zh: "大腸",
    pinyin: "Dà Cháng",
    startHour: 5,
    label: "5h – 7h",
    element: "Métal",
    color: "#888780",
    bg: "#F1EFE8",
    tx: "#444441",
    chromoName: "Blanc ivoire",
    points: [
      { code: "LI4", name: "Hegu", action: "Point souverain – évacuation et transit intestinal" },
      { code: "LI11", name: "Quchi", action: "Régule la chaleur, favorise l'excrétion" },
      { code: "LI6", name: "Pianli", action: "Luo – mobilise les liquides corporels" },
    ],
  },
  {
    id: "ST",
    name: "Estomac",
    zh: "胃",
    pinyin: "Wèi",
    startHour: 7,
    label: "7h – 9h",
    element: "Terre",
    color: "#BA7517",
    bg: "#FAEEDA",
    tx: "#633806",
    chromoName: "Jaune ambré",
    points: [
      { code: "ST36", name: "Zusanli", action: "Grand tonique digestif, transformation des aliments" },
      { code: "ST25", name: "Tianshu", action: "Point mu de LI – régulation intestinale directe" },
      { code: "ST40", name: "Fenglong", action: "Dissout l'humidité et les glaires digestives" },
    ],
  },
  {
    id: "SI",
    name: "Intestin grêle",
    zh: "小腸",
    pinyin: "Xiǎo Cháng",
    startHour: 13,
    label: "13h – 15h",
    element: "Feu",
    color: "#D85A30",
    bg: "#FAECE7",
    tx: "#4A1B0C",
    chromoName: "Rouge vermeil",
    points: [
      { code: "SI4", name: "Wangu", action: "Source – sépare le pur de l'impur, assimilation" },
      { code: "SI6", name: "Yanglao", action: "Xi – douleurs et stagnation de l'intestin grêle" },
      { code: "SI8", name: "Xiaohai", action: "Mer – calme les fermentations intestinales" },
    ],
  },
  {
    id: "BL",
    name: "Vessie",
    zh: "膀胱",
    pinyin: "Páng Guāng",
    startHour: 15,
    label: "15h – 17h",
    element: "Eau",
    color: "#185FA5",
    bg: "#E6F1FB",
    tx: "#042C53",
    chromoName: "Bleu saphir",
    points: [
      { code: "BL25", name: "Dachangshu", action: "Shu dos de LI – transit et évacuation" },
      { code: "BL27", name: "Xiaochangshu", action: "Shu dos de SI – séparation des liquides" },
      { code: "BL40", name: "Weizhong", action: "Point commande – dépuration et drainage" },
    ],
  },
  {
    id: "TE",
    name: "Triple réchauffeur",
    zh: "三焦",
    pinyin: "Sān Jiāo",
    startHour: 21,
    label: "21h – 23h",
    element: "Feu min.",
    color: "#993C1D",
    bg: "#FAECE7",
    tx: "#4A1B0C",
    chromoName: "Orange feu",
    points: [
      { code: "TE6", name: "Zhigou", action: "Point clé constipation – descend le foyer moyen" },
      { code: "TE10", name: "Tianjing", action: "Mer – harmonise les 3 foyers (sup/moy/inf)" },
      { code: "TE4", name: "Yangchi", action: "Source – circule l'énergie originelle Yuan Qi" },
    ],
  },
];

/** L'organe est-il actif à l'heure donnée ? */
export function isActive(organ: FuOrgan, hour: number): boolean {
  if (organ.startHour === 23) return hour >= 23 || hour < 1;
  return hour >= organ.startHour && hour < organ.startHour + 2;
}

/** Retourne l'organe actif maintenant ou null si fenêtre creuse */
export function activeOrganNow(now: Date = new Date()): FuOrgan | null {
  const h = now.getHours();
  return FU_ORGANS.find((o) => isActive(o, h)) ?? null;
}
