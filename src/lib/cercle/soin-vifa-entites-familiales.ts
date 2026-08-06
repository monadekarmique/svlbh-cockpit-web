// Préparation Soin VIFA — Répercussions spirituelles et médicales de la
// présence d'entités familiales. DEC Patrick 2026-08-06 : publication cockpit,
// menu « Préparation Soins au Cabinet » (soins pour ST5+), gate ST6 strict.
//
// Motif Monadic Medium : la trame de chaque auteur est citée ENTIÈRE
// (verbatims AssemblyAI non retouchés), la lecture VLBH se pose PAR-DESSUS.
// Règle : sources vivantes citées AVEC leurs adresses, jamais maquillées.
// Les médias vivent dans le bucket privé programmes-media — URLs signées
// APRÈS le gate, jamais de lien TikTok embarqué (les liens meurent).

export const SOIN_VIFA_EF = {
  titre: "Soin VIFA — Répercussions spirituelles et médicales de la présence d'entités familiales",
  statut:
    "PRÉPARATION — kickoff 2026-08-06. Les points doctrine ouverts attendent des MESURES en séance ; rien ici n'est câblé dans l'app VIFA.",
  bucket: "programmes-media",
  prefix: "soins-cabinet/vifa-entites-familiales",
} as const;

export type SourceVideo = {
  id: string;
  titre: string;
  auteur: string;
  adresses: { label: string; url: string }[];
  fichier: string; // clé dans le bucket, sous prefix
  mime: string;
  duree: string;
  langue: string;
  note?: string;
  verbatim: string;
};

export const SOURCE_JOSE: SourceVideo = {
  id: "jose",
  titre: "« Chacun influence et révèle l'autre » — le vertical et l'horizontal",
  auteur: "José Chouraqui",
  adresses: [
    { label: "TikTok @josechouraqui", url: "https://www.tiktok.com/@josechouraqui" },
    { label: "www.neuro-training.fr", url: "https://www.neuro-training.fr" },
  ],
  fichier: "jose-chouraqui-vertical-horizontal.mp4",
  mime: "video/mp4",
  duree: "1 min 32",
  langue: "FR",
  verbatim:
    "Ce relationnel, il est horizontal, mais il dépend du vertical. Donc, le vertical va influencer notre relationnel, et notre relationnel va venir révéler notre vertical. Ça veut dire que si, en fonction de ma perception, je n'arrive pas à exprimer mes valeurs, mon énergie s'inverse, je ne fonctionne pas, et que le cerveau a trouvé comme solution de me déséquilibrer au niveau structure, si je veux corriger la structure, il faut qu'en fonction du déséquilibre structurel que j'ai, je voie comment je ne fonctionne pas. Puisque je ne fonctionne pas, c'est que je n'ai pas pu m'adapter. C'est que j'ai pas trouvé, vous voyez là-bas, c'est que j'ai pas pu trouver la solution par rapport à cette situation. Donc de cette structure, je reviens sur comment j'aurais dû fonctionner. L'énergie, je vois comment elle est déséquilibrée. Je trouve l'émotion que j'aurais dû exprimer. Et du coup, je perçois la situation d'une autre façon. Comme je la perçois d'une autre façon, je n'ai plus besoin de ça. À chaque fois qu'on va avoir un déséquilibre de structure, dites-vous, j'en ai eu besoin. Pourquoi? Parce que tout ça.",
};

/** Relevé du tableau blanc de José (capture jointe dans le bucket). */
export const TABLEAU_JOSE = {
  capture: "tableau-jose-liste-verticale.png",
  horizontal: "Conditionnement → Perception → Émotion → Événement (flèches dans les deux sens — « chacun influence et révèle l'autre »)",
  listeVerticale: [
    "Ancêtres",
    "Projet-sens",
    "Grossesse",
    "Moi négatif / Étoile à 5 branches",
    "Naissance",
    "Vécu",
    "Prénom",
    "Numéro de fratrie",
    "Cycles A/F",
    "Signe astrologique",
    "I Ching de naissance",
    "Transfert",
    "Autre",
  ],
  partiel:
    "Partie droite du tableau (relevé partiel, moins lisible) : Intelligence · Perception/Vue · Solution · Adaptation · F. cérébrales · Habitudes · Proprioception ; triangle Mental/Physique — Actions · Fonctions · Survie.",
} as const;

export const SOURCE_APACHE: SourceVideo = {
  id: "apache",
  titre: "One Breath Change Apache Runners Used to Move All Day Without Tiring — Part 1",
  auteur: "@knowledge.for.you50",
  adresses: [
    { label: "TikTok @knowledge.for.you50", url: "https://www.tiktok.com/@knowledge.for.you50" },
  ],
  fichier: "apache-runners-one-breath-part1.mov",
  mime: "video/quicktime",
  duree: "4 min 04",
  langue: "EN",
  note:
    "La vidéo se termine en plein milieu de phrase (« Your brainstem watches CO2— ») : c'est la fin réelle de la Part 1. Les parties suivantes ne sont pas en notre possession.",
  verbatim:
    "You saw 2 hearts on the way in, one burning bright, one barely lit. The only difference between them was the door each man breathed through. In 1886, a small Apache band, fewer than 40 people, Stayed ahead of an army across some of the driest country on this continent. Almost a year. They could not be caught. The trackers who finally questioned them kept landing on one detail. It had nothing to do with their legs. It was something they did with their breath. The same thing that decides which of those 2 hearts is yours. And most men reading this are breathing the wrong way at this exact moment. Not during sport, at the desk, in the car, asleep. The dim heart isn't a disease. It's a habit repeated a few thousand times a day for 40 years. Before any history, prove it to yourself. Close your mouth, breathe in slowly through the nose only, and notice where the air seems to land. Lower, Heavier, quieter. That single breath is the whole method in miniature. The Apache didn't invent it, they trained it. Stay, I'll show you the chemistry, then the way in. Right now, is your mouth open even slightly? Be honest. Most men sit with it parted and never notice. Hold that observation. We'll come back to what it costs. Before we go deeper, I want to know who's in the room. 2 things in the comments: your age and where you're watching from. This breath crossed a desert and more than a century to reach you. Let's see how far it's traveled now. The legend says they moved as much as 70 miles in a day, on foot, in heat that breaks horses. Take the number loosely. Take the reputation seriously— even their pursuers wrote about the endurance. These were people for whom efficiency wasn't a hobby— it was survival. Here's the part the trackers reported, and the part the Breath World later seized on. In training, the runners are said to have carried a mouthful of water, and kept it there, unswallowed, the entire run. You cannot breathe through your mouth with a mouthful of water, so the water was never the point. It was a lock. It forced every breath through the nose, mile after mile, until the nose became the only door the body knew. You don't need the water, you need the lock, and I'll give you a simpler one later. So what does the nose do that the mouth can't? Start with the bright heart. Inside the bones around your nose sit the paranasal sinuses. Their lining releases a gas continuously— nitric oxide. Breathe through the nose and you carry that gas into the lungs on every inhale. Breathe through the mouth and you bypass it completely. Nitric oxide widens blood vessels and matches airflow to blood flow inside the lung. Plain version: the same lungful of air gives up more of its oxygen when it arrives carrying nitric oxide. The bright heart isn't getting more air, it's getting more out of the air. The mouth breather throws that bonus away, every breath, every day, for decades. Now the part almost everyone has backwards. The urge to breathe, that pull to gasp, is not triggered by low oxygen. It's triggered by rising carbon dioxide. Your brainstem watches CO2—",
};

/** DEC débloquée par cette préparation — à confirmer par Patrick. */
export const DEC_ATTRIBUTION_SERIE_EN =
  "Cette vidéo apache est mot pour mot la source de la session 1 de « Garder le cap » (porte du nez, NO des sinus, alarme CO2, gorgée d'eau = verrou) et l'élément Apache Runner du raccord Apache. La DEC ouverte « auteur de la série vidéo EN non identifié » peut se fermer sur @knowledge.for.you50 — à confirmer, puis reporter l'attribution sur la page gatée /programmes/st2/garder-le-cap (on cite AVEC l'adresse, on ne maquille pas).";

/** Lecture VLBH 2a — le « vertical » de José = le canal des VIFA. */
export const CORRESPONDANCES_JOSE_VLBH: { jose: string; vlbh: string }[] = [
  {
    jose: "Le vertical (ancêtres → transfert)",
    vlbh: "Canaux Lmasc (père→fils, Reins/Jing) et Lfem (mère→fille) — transmission depuis la Source, impossible d'y échapper",
  },
  {
    jose: "« Le vertical influence le relationnel »",
    vlbh: "Les pollutions lignagères s'expriment dans l'horizontal (couple, fratrie, travail)",
  },
  {
    jose: "« Le relationnel révèle le vertical »",
    vlbh: "Le symptôme relationnel est un instrument de MESURE du canal — c'est par lui qu'on remonte à la génération source (G−n)",
  },
  {
    jose: "« Déséquilibre de structure = solution du cerveau »",
    vlbh: "Répercussion MÉDICALE de la présence dans le canal : le corps porte ce que la lignée n'a pas résolu",
  },
  {
    jose: "« J'en ai eu besoin. Pourquoi ? Parce que tout ça. »",
    vlbh: "Le symptôme n'est pas une erreur : il est l'équilibre trouvé AVEC l'entité présente. Le soin VIFA ne combat pas le symptôme, il libère ce qui l'a rendu nécessaire",
  },
];

export const LECTURE_CE_QUE_JOSE_NE_DIT_PAS =
  "Dans le vertical ne circulent pas seulement des mémoires et des conditionnements — y circulent aussi des PRÉSENCES (entités familiales ; cf. Livre 3 : dark entities/attachments = permutations VIFA). D'où le titre du soin : répercussions SPIRITUELLES (inversion d'énergie, perception voilée, valeurs inexprimables — les mots mêmes de José) et MÉDICALES (déséquilibre de structure) de ces présences.";

/** Lecture VLBH 2b — les deux cœurs apaches = la porte et le verrou. */
export const LECTURE_PORTES = {
  image:
    "Deux cœurs, un ardent, un presque éteint — la seule différence est la porte. Et le geste : le VERROU (la gorgée d'eau qui force le nez), qui n'est pas la porte elle-même mais ce qui la tient.",
  echos: [
    "La porte du nez est la session 1 de « Garder le cap » (NO des sinus, alarme CO2) — rapprochement déjà acté côté programme.",
    "Les portes d'entrée des présences sont doctrine Phantom Matrix : GV16 Nuque · CV12 Plexus · GV4 Sacrum (porte canonique des canaux Lmasc/Lfem — LA porte lignagère) · CV17 Cœur · GV20 Sommet.",
  ],
  gardeFou:
    "La bouche ne fait PAS partie des 5 portes canoniques. Le pont « bouche ouverte = porte laissée ouverte aux présences » serait séduisant mais il n'est PAS en doctrine — ne pas l'écrire, le MESURER (point 1 ci-dessous).",
} as const;

/** Points à MESURER en séance — rien de ce qui suit n'est affirmé. */
export const POINTS_A_MESURER: string[] = [
  "La respiration bouche ouverte constitue-t-elle une porte d'entrée (6e porte ?) ou seulement un affaiblissement du terrain (NO contourné, cœur « éteint ») qui rend les 5 portes canoniques plus franchissables ?",
  "Pour une présence familiale donnée : quelle porte parmi les 5 (mesure), et GV4 Sacrum est-elle systématiquement impliquée quand la présence est lignagère (Lmasc/Lfem) ?",
  "Génération source (G−n) de la présence, canal (Lmasc / Lfem / croisement), latéralité (D / G / bilatérale).",
  "Répercussion médicale : le « déséquilibre de structure » de José se lit-il sur l'axe KI–HT (Eau–Feu Shao Yin, signature Lmasc hDOM) ?",
  "Le verrou respiratoire (nez forcé, façon gorgée d'eau) modifie-t-il les scores pendant la libération — le verrou est-il un GESTE DE SOIN à intégrer au protocole VIFA, ou une simple hygiène de terrain ?",
  "Homéostasie : quelles vibrations/fréquences pour la séquence de retour à l'équilibre (45 % du travail — la suite complète fait le soin, ne pas trier).",
];
