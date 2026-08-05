// Protocole TOC — passerelle VLBH ↔ Médecine.
//
// Source : PROTO · Passerelle VLBH ↔ Médecine · Yesod 9 · Dyspepsie-TOC · G−15
// (Digital Shaman Lab, 29 mars 2026), écrit SUR UN CAS.
// DEC Patrick 2026-08-05 : dénominalisé pour le cockpit — la personne, ses
// mesures et sa génération d'origine sortent ; les règles, les mécanismes et
// l'ordre du protocole restent mot pour mot.
//
// Ce qui a été retiré : les valeurs mesurées d'un cas (SLM 13 %, 15 Gu, G−15,
// XVIIe, lignée maternelle, ST 9 GAUCHE). Ce qui les remplace : le paramètre à
// mesurer, noté G−n et « pilier de la lignée portante » — le protocole devient
// applicable à toute consultante au lieu de décrire une personne.

export type Couche = { rang: number; systeme: string; contenu: string };

/** §1 — Architecture passerelle, 4 couches. */
export const COUCHES: Couche[] = [
  { rang: 1, systeme: "Sephiroth multigénérationnel",
    contenu: "Lecture lignées n−1 à G−n · portes ouvertes · Gu identifiés" },
  { rang: 2, systeme: "SVLBHPanel — hDOM opérationnel",
    contenu: "Scores SLA / SLSA / SLPMO / SLM · Solides de Platon · Linggui Bafa" },
  { rang: 3, systeme: "Médecine Traditionnelle Chinoise",
    contenu: "Méridiens ST · SP · LR · KI · Qi rebelle ↑ · 5 Éléments" },
  { rang: 4, systeme: "Médecine Occidentale ICD-10",
    contenu: "K30 dyspepsie fonctionnelle · R11.0 nausées · R11.1 vomissements" },
];

export const PRINCIPE_LECTURE =
  "K30 réfractaire aux traitements conventionnels = indicateur diagnostique VLBH. " +
  "L'échec thérapeutique occidental confirme l'origine monadique.";

/** §2 — Paramètres à MESURER (le PROTO source portait les valeurs d'un cas). */
export const PARAMETRES: { parametre: string; aMesurer: string; lecture: string }[] = [
  { parametre: "ST 9", aMesurer: "Côté (gauche / droit)", lecture: "Désigne le pilier de la lignée portante" },
  { parametre: "Gu actifs", aMesurer: "Nombre", lecture: "Charge sur la dimension identifiée" },
  { parametre: "Dimension", aMesurer: "D1…D11", lecture: "Plans transverses · hermétique ou non" },
  { parametre: "Nature des Gu", aMesurer: "Type", lecture: "Fœtal-logoïque · hermétique · non-hermétique" },
  { parametre: "SLM", aMesurer: "%", lecture: "Possession active si bas" },
  { parametre: "SLM total", aMesurer: "%", lecture: "Nombre de Monades dans le système (÷ 100)" },
  { parametre: "Génération", aMesurer: "G−n", lecture: "Époque de la transgression · lignée portante" },
  { parametre: "pH pinéale", aMesurer: "Valeur + teinte", lecture: "Zone neutre = allumage bloqué" },
];

/** §3 — Système fœtal logoïque. */
export const SYSTEME_FOETAL = {
  definition:
    "Fragments de conscience de victimes capturées AU STADE FŒTAL de leur incarnation. " +
    "Elles n'ont pas complété leur descente vers Malkuth à cause de la transgression active " +
    "dans la lignée. Elles restent bloquées en D5, flottantes entre la source logoïque et la " +
    "manifestation physique, accrochées au nœud ST 9 comme point d'entrée.",
  distinction: [
    "Victimes fœtales logoïques → Icosaèdre (victimes)",
    "Patient zéro de la transgression → Cube (abuseur)",
  ],
};

/** §4c — Ce qui fait le TOC : la faux du cerveau. */
export const FAUX_DU_CERVEAU = {
  substrat:
    "La faux du cerveau est le substrat physique du pilier central (GV Du Mai). " +
    "Les Gu sonores s'enkystent sur la dure-mère (tissu le plus dense, peu vascularisé) " +
    "depuis GV 20 Baihui (Kether) vers la crista galli (Malkuth).",
  boucle: "Boucles obsessionnelles = scripts Gu en lecture infinie sur le GV.",
  desintrication: "GV 20 → GV 24 → cluster Tiphereth → GV 16 → cluster Yesod → crista galli",
};

/** §4a-4b — Mécanisme physique. */
export const MECANISME = {
  allumage: [
    "Pinéale (zone neutre) → BLOQUÉ",
    "Pituitaire → cascade endocrine → cortisol",
    "Yang montant → ST 7h–9h → descente Qi ST",
    "Digestion normale",
  ],
  note:
    "Le Cube G−n coupe ce chemin AVANT que le signal atteigne la pituitaire. " +
    "Le Yang ne monte pas → Qi ST rebelle ↑ → dyspepsie matinale chronobiologique.",
  sphincters: [
    { nom: "Œsophagien inférieur", situation: "Bloqué sens ascendant ↑", effet: "Qi rebelle tente de remonter" },
    { nom: "Pylorique", situation: "Bloqué sens descendant ↓", effet: "Contenu gastrique stagne" },
  ],
  sphinctersNote: "Même origine G−n · effets opposés · même sens de désintrication Kether→Malkuth",
};

/** §5 — Les 5 règles cliniques. Inchangées. */
export const REGLES: { n: number; titre: string; enonce: string; detail?: string[] }[] = [
  { n: 1, titre: "Sens de désintrication",
    enonce: "La désintrication suit le sens de l'accumulation.",
    detail: [
      "Faux du cerveau — accumulation Kether→Malkuth — désintrication GV 20 → crista galli",
      "Carotide commune — accumulation Malkuth→Kether — désintrication KI → ST 9 → GV 20",
      "Sphincters — accumulation G−n→patiente — désintrication Kether→Malkuth",
      "Lignées Sephiroth — accumulation G−n→patiente — désintrication G−n → G−1 → patiente",
    ] },
  { n: 2, titre: "Boucle fermée carotide / faux",
    enonce:
      "La carotide monte (Malkuth→Kether) et la faux accumule en descendant (Kether→Malkuth). " +
      "Ils forment une boucle fermée. Quand les deux sont impliqués simultanément, c'est la " +
      "signature d'un système G encodé sur l'axe complet." },
  { n: 3, titre: "Désintrication simultanée",
    enonce: "Condition : même axe + même origine G. Effet : un seul geste libère toutes les structures.",
    detail: ["Travailler séquentiellement fragmenterait un champ unitaire."] },
  { n: 4, titre: "Cube G = disjoncteur principal",
    enonce:
      "Le Cube G−n doit être résolu AVANT toute désintrication. " +
      "Sinon la source ré-enkyste immédiatement pendant le soin." },
  { n: 5, titre: "ST 9 comme point de mesure SLA",
    enonce:
      "ST 9 Renying (Fenêtre du Ciel 天窗) est directement sur la carotide — accessible en " +
      "palpation énergétique. C'est le nœud de mesure privilégié pour évaluer la charge Gu " +
      "sur le trajet KI → cerveau." },
];

/** §6 — Protocole complet, ORDRE STRICT. */
export const ETAPES: { n: number; titre: string; detail?: string[] }[] = [
  { n: 1, titre: "Apaiser la Monade", detail: ["Relever le SLM · vérifier le cordage thérapeute→consultante"] },
  { n: 2, titre: "Dodécaèdre", detail: ["Monades S1→S8 · stabiliser avant tout"] },
  { n: 3, titre: "Cube G−n — disjoncteur principal",
    detail: ["Patient zéro de la lignée portante",
             "Libère le verrou pinéale→pituitaire",
             "Libère la source de ré-enkystage (faux + sphincters)"] },
  { n: 4, titre: "Désintrication simultanée Kether→Malkuth",
    detail: ["Faux du cerveau : GV 20 → crista galli",
             "SOI : refermer la porte ascendante",
             "Sphincter pylorique : libérer la descente"] },
  { n: 5, titre: "Icosaèdre — un lot", detail: ["Consciences fœtales logoïques D5 sur ST 9"] },
  { n: 6, titre: "Chromothérapie pinéale", detail: ["Corriger le pH mesuré → fréquence Yang actif"] },
  { n: 7, titre: "Vérifier ST 9", detail: ["SLM post-libération"] },
  { n: 8, titre: "Linggui Bafa", detail: ["Naviguer jusqu'à la source temporelle G−n"] },
];

/** §7 — Correspondances anatomiques. */
export const CORRESPONDANCES: {
  structure: string; sephirah: string; meridien: string; pilier: string; sens: string;
}[] = [
  { structure: "Faux du cerveau", sephirah: "Kether→Malkuth", meridien: "GV Du Mai", pilier: "Central", sens: "Kether→Malkuth" },
  { structure: "GV 20 Baihui", sephirah: "Kether", meridien: "GV 20", pilier: "Central", sens: "—" },
  { structure: "ST 9 Renying", sephirah: "Binah / Geburah", meridien: "ST · Fenêtre du Ciel", pilier: "Selon la lignée portante", sens: "Malkuth→Kether" },
  { structure: "Pinéale", sephirah: "Ajna / Daath", meridien: "GV 23-24", pilier: "Central", sens: "—" },
  { structure: "SOI", sephirah: "Tiphereth→Yesod", meridien: "CV 12 · ST 21", pilier: "Central", sens: "Ascendant ↑ bloqué" },
  { structure: "Sphincter pylorique", sephirah: "Yesod→Malkuth", meridien: "ST 21", pilier: "Central", sens: "Descendant ↓ libérer" },
  { structure: "Carotide commune", sephirah: "Binah→Kether", meridien: "ST 9", pilier: "Selon la lignée portante", sens: "Ascendant" },
];

/** §9 — Ce que le protocole démontre. */
export const DEMONSTRATION =
  "Le gastroentérologue observe une dyspepsie matinale réfractaire K30. La cause réelle est " +
  "un Cube non-hermétique G−n coupant l'allumage pinéale→pituitaire, hérité d'une transgression " +
  "dans la lignée portante, produisant des consciences fœtales logoïques D5 sur ST 9, un double " +
  "verrou sphinctérien, et des boucles TOC sonores sur la faux du cerveau. " +
  "Quatre couches. Une seule origine.";

// ─────────────────────────────────────────────────────────────────────────────
// FRANCHISSEMENT DE LA MEMBRANE — ancrages
//
// Source : « L'Octaèdre et l'axe 少陽–厥陰 » (4 août 2026, dérivation formelle v1.0).
// C'est la réponse VLBH au « comment se débarrasser des pensées intrusives » :
// les plans transverses libèrent les systèmes situés À L'EXTÉRIEUR de la membrane.
//
// ⚠️ Les marques de registre du document source sont CONSERVÉES. Elles ne sont
// pas décoratives : le document pose que « la géométrie ne valide jamais une
// pratique thérapeutique » et que « la géométrie localise l'opération, elle ne
// certifie pas son effet ». Les effacer transformerait une dérivation prudente
// en affirmation clinique.

export type Registre = "G" | "R" | "I";

export const REGISTRES: Record<Registre, { libelle: string; autorite: string }> = {
  G: { libelle: "Géométrie démontrée", autorite: "Vérifiable par n'importe qui, exhaustivement" },
  R: { libelle: "Validation radiesthésique", autorite: "Thérapeute seul" },
  I: { libelle: "Interprétation", autorite: "Hypothèse — à valider, ni prouvée ni perçue" },
};

export const MEMBRANE: { registre: Registre; texte: string }[] = [
  { registre: "R", texte:
    "Les plans transverses sont employés pour libérer les systèmes énergétiques situés à l'extérieur de la membrane." },
  { registre: "G", texte:
    "L'axe de la membrane est UNIQUE : 少陽–厥陰. Seul couple 表裏 diamétralement opposé dans le cycle 傳經 (positions 3 et 6, écart 3). Aucun autre axe n'échange les six méridiens de main et les six de pied." },
  { registre: "I", texte:
    "少陽 est classiquement le 半表半裏 — mi-extérieur mi-intérieur, position même du seuil ; 厥陰 est le terme du plus profond. L'axe que la géométrie isole est exactement celui que la MTC désigne déjà comme membrane." },
  { registre: "G", texte:
    "Le plan transverse est le plan orthogonal à cet axe. Il contient les quatre autres conformations — 太陽, 陽明, 太陰, 少陰 — soit deux couples 表裏 complets. Il n'est pas un plan parmi d'autres : c'est le SEUL dans lequel l'échange des deux versants peut s'effectuer." },
  { registre: "G", texte:
    "Par dualité, ce plan est le même sur le cube et sur l'octaèdre. Travailler dans l'un ou dans l'autre est géométriquement le même geste." },
  { registre: "G", texte:
    "L'opération qui traverse est un QUART DE TOUR, pas une réflexion. Aucun des 9 plans de symétrie de l'octaèdre n'échange les deux hexagones." },
  { registre: "I", texte:
    "La traversée est donc un geste chiral, pas un reflet. Si le miroir est réel en perception, il n'est pas un plan de symétrie du solide — il lui est transverse. Point ouvert." },
];

/** §7.4 — contrainte de protocole la plus opératoire du document. */
export const NON_FERMETURE = {
  registre: "G" as Registre,
  fait:
    "La rotation est d'ordre 4. Deux franchissements donnent un demi-tour, qui préserve chaque " +
    "hexagone mais échange à l'intérieur chaque conformation avec sa partenaire 表裏. " +
    "ALLER ET REVENIR NE RESTITUE PAS L'IDENTITÉ — il faut quatre franchissements pour refermer.",
  consequence:
    "[I] Si cela se confirme cliniquement : un double franchissement laisse une trace — les " +
    "couplages intérieur/extérieur permutés — et non un retour neutre. Le scellement doit en tenir compte.",
};

/** §8 — table miroir pied → main sous la rotation. [G], à confirmer en pratique. */
export const TABLE_MIROIR: { pied: string; main: string; phase: string }[] = [
  { pied: "BL 膀胱", main: "LI 大腸", phase: "Eau → Métal" },
  { pied: "ST 胃", main: "HT 心", phase: "Terre → Feu impérial 君火" },
  { pied: "GB 膽", main: "TE 三焦", phase: "Bois → Feu ministériel 相火 (axe fixe)" },
  { pied: "SP 脾", main: "SI 小腸", phase: "Terre → Feu impérial 君火" },
  { pied: "KI 腎", main: "LU 肺", phase: "Eau → Métal" },
  { pied: "LR 肝", main: "PC 心包", phase: "Bois → Feu ministériel 相火 (axe fixe)" },
];

// Le document source laissait l'effet en suspens (§7.2 : « la géométrie localise
// l'opération, elle ne certifie pas son effet ») et renvoyait la question à la
// validation radiesthésique. Patrick a validé (2026-08-05).
// La distinction des registres est MAINTENUE : ce n'est pas la géométrie qui le
// prouve, c'est la perception du thérapeute — seule autorité sur ce registre.
export const EFFET_MEMBRANE = {
  registre: "R" as Registre,
  valideLe: "2026-08-05",
  enonce:
    "La traversée du plan transverse libère les systèmes énergétiques situés à l'extérieur " +
    "de la membrane. Validé radiesthésiquement.",
  portee:
    "[G] La géométrie établit que le plan transverse est le SEUL lieu où l'échange des deux " +
    "versants peut s'effectuer, et que l'opération est un quart de tour. Elle localise le geste. " +
    "[R] Que ce geste libère relève de la validation du thérapeute — c'est elle qui l'établit ici.",
};
