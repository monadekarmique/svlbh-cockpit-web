// 8 Pierres d'enseignement SVLBH — port PierreEnseignement.swift.
// Source : 8-pierres-svlbh-landscape-v0.9.5.docx

export type Pierre = {
  id: string;
  nom: string;
  symbole: string;
  formule: string;
  absorbe: string[];
  signature: string;
  contexte: string;
  usage: string;
};

export const PIERRES: Pierre[] = [
  {
    id: "tourm",
    nom: "Tourmaline noire",
    symbole: "◼",
    formule: "Schorl — NaFe₃Al₆(BO₃)₃Si₆O₁₈(OH)₄",
    absorbe: ["Champs denses", "Empreintes vibratoires", "Liens ancestraux"],
    signature:
      "Bouclier vibratoire de première ligne — absorbe et neutralise les champs denses sur 15 niveaux de résonance ancestrale.",
    contexte:
      "La Tourmaline noire est la gardienne principale de l'espace d'accompagnement SVLBH. Sa structure cristalline pyroélectrique génère un champ électromagnétique naturel qui entre en résonance avec les couches denses du champ aurique. Elle harmonise les empreintes vibratoires lourdes transmises sur de nombreuses générations — ces héritages fréquentiels qui circulent dans les tuyaux ancestraux sans que la personne en soit consciente. Dans la pratique SVLBH, elle est active à tous les niveaux du corps de lumière et constitue la fondation de tout espace d'accompagnement.",
    usage:
      "Disposée en périmètre de l'espace de soin et sous la table. Indispensable avant toute session pour créer un conteneur vibratoire cohérent. L'accompagnant peut en porter une en poche pour maintenir son propre champ lumineux stable.",
  },
  {
    id: "obsid",
    nom: "Obsidienne noire",
    symbole: "◉",
    formule: "Verre volcanique — SiO₂ amorphe",
    absorbe: ["Liens vibratoires parasitaires", "Empreintes ancestrales", "Champs transgénérationnels"],
    signature:
      "Miroir vibratoire — révèle et dissout les liens énergétiques parasitaires transmis sur 25 niveaux générationnels.",
    contexte:
      "L'Obsidienne noire est un verre volcanique né de la solidification ultra-rapide de la lave. Elle n'a pas de structure cristalline, ce qui en fait un miroir vibratoire parfait. Dans la pratique SVLBH, elle agit sur les liens vibratoires qui relient deux personnes dans une dynamique déséquilibrée : l'une capte l'énergie de l'autre sans que ni l'une ni l'autre n'en soit consciente. Ces liens peuvent traverser 25 niveaux générationnels et s'ancrer dès la conception.",
    usage:
      "Posée dans les mains du consultant.e ou placée sur le centre CV1 (périnée) pour ancrer la dissolution des liens dans le corps physique. L'accompagnant ne la touche pas directement durant la session.",
  },
  {
    id: "nuum",
    nom: "Nuummite",
    symbole: "◈",
    formule: "Amphibolite métamorphique — 3,5 milliards d'années",
    absorbe: ["Empreintes pré-biologiques", "Énergie vitale ancestrale", "Mémoires profondes"],
    signature:
      "Pierre la plus ancienne de la collection — accède aux empreintes vibratoires antérieures à la naissance biologique et aux mémoires de l'énergie vitale originelle.",
    contexte:
      "La Nuummite du Groenland est l'une des roches les plus anciennes de la planète (3,5 milliards d'années). Cette antiquité en fait un vecteur vibratoire unique : elle résonne avec des couches de mémoire qui précèdent toute forme de vie terrestre. Dans la pratique SVLBH, elle accède aux empreintes vibratoires stockées dans l'énergie vitale (Jing) — cette réserve ancestrale reçue de nos parents, de leurs parents, jusqu'à l'origine. Elle est associée au chakra 12 dans le protocole SVLBH.",
    usage:
      "Placée sur le GV4 (Mingmen, bas du dos) ou sur le KI1 (plante du pied). Utilisation uniquement par l'accompagnant formé — jamais laissée seule sur le consultant.e.",
  },
  {
    id: "shung",
    nom: "Shungite élite",
    symbole: "◆",
    formule: "Carbone natif amorphe — C > 98%",
    absorbe: ["Protection praticien", "Harmonisation électromagnétique", "Champs parasitaires intimes"],
    signature:
      "Pierre de protection de l'accompagnant — bouclier fréquentiel stable face aux champs vibratoires parasitaires intimes et aux émissions électromagnétiques.",
    contexte:
      "La Shungite élite est une forme rare de carbone quasi-pur originaire de Carélie, Russie. Sa structure en fullerènes lui confère des propriétés de résonance électromagnétique uniques. Dans la pratique SVLBH, elle est la pierre de protection personnelle de l'accompagnant : elle maintient la cohérence de son champ lumineux face aux résonances intimes denses et aux perturbations des appareils électroniques présents dans l'espace de soin.",
    usage:
      "Portée en poche par l'accompagnant pendant toute la durée de la session. Placée aux coins du cabinet à côté des prises et appareils connectés. Ne doit pas être partagée entre praticiens.",
  },
  {
    id: "aegir",
    nom: "Aegyrine",
    symbole: "◇",
    formule: "Pyroxène sodique — NaFe³⁺Si₂O₆",
    absorbe: ["Champs non-harmoniques denses", "Influences extérieures intenses", "Résonances collectives"],
    signature:
      "Bouclier vibratoire de haute intensité — harmonise les champs vibratoires extérieurs très denses qui résistent aux autres pierres de la collection.",
    contexte:
      "L'Aegyrine est un pyroxène sodique de teinte noire à reflets verts, formé dans des environnements géologiques extrêmes. Cette origine dans l'extrême en fait un outil vibratoire pour les situations où d'autres pierres ne suffisent plus — quand le champ aurique est soumis à des résonances extérieures particulièrement intenses, opérant hors des systèmes hermétiques habituels. Elle est fragile — à manipuler avec soin.",
    usage:
      "Disposée en grille de 4 points autour de la table pour créer un conteneur vibratoire renforcé. Utilisée uniquement lorsque le champ de la personne présente des résistances inhabituelles aux autres pierres.",
  },
  {
    id: "apache",
    nom: "Apache Tears",
    symbole: "○",
    formule: "Perlite obsidienne volcanique — SiO₂",
    absorbe: ["Accompagnement du deuil", "Âmes en transition", "Empreintes traumatisme féminin"],
    signature:
      "Pierre du passage et du deuil — dissout les empreintes vibratoires liées aux pertes non intégrées, particulièrement dans les lignées féminines.",
    contexte:
      "Les Apache Tears sont de petites nodules d'obsidienne perlitique translucides. Dans la pratique SVLBH, elles résonnent avec les mémoires vibratoires des âmes qui n'ont pas terminé leur passage — ces présences en transition liées à leurs proches par des liens d'amour non résolu. Elles sont particulièrement associées aux traumatismes féminins transmis de mère en fille et aux deuils périnataux (fausses couches, enfants perdus) qui laissent une empreinte dans la lignée.",
    usage:
      "Disposées en cercle autour du consultant.e pour créer un espace sacré de passage. Le cercle symbolise la complétude du cycle. À utiliser avec une intention d'accompagnement bienveillant.",
  },
  {
    id: "labra",
    nom: "Labradorite",
    symbole: "◐",
    formule: "Feldspath plagioclase — (Ca,Na)(Si,Al)₄O₈",
    absorbe: ["Protection aura praticien", "Miroir vibratoire", "Cohérence du champ personnel"],
    signature:
      "Pierre maîtresse de l'accompagnant SVLBH — maintient la cohérence de l'aura du praticien et évite l'absorption des résonances du consultant.e.",
    contexte:
      "La Labradorite agit comme un miroir qui réfléchit vers l'extérieur les fréquences qui ne lui appartiennent pas, tout en laissant passer la lumière propre. Dans la pratique SVLBH, elle est la pierre personnelle de l'accompagnant. Elle est également utilisée dans le protocole du Stern-Tetraeder (miroir praticien/patient) pour créer une séparation vibratoire claire entre les deux champs.",
    usage:
      "Portée par l'accompagnant en continu (autour du cou ou en poche). Jamais retirée pendant une session. L'accompagnant doit avoir sa propre Labradorite — non partagée.",
  },
  {
    id: "kyani",
    nom: "Kyanite noire",
    symbole: "◁",
    formule: "Silicate d'aluminium — Al₂SiO₅",
    absorbe: ["Flux d'énergie vitale", "Tuyau masculin ancestral", "Ancrage sans rétention"],
    signature:
      "Pierre du flux libre — harmonise le canal de l'énergie vitale ancestrale (lignée masculine) sans aucune accumulation.",
    contexte:
      "La Kyanite noire se forme en lames allongées dans les roches métamorphiques sous haute pression. Sa particularité unique : elle ne retient pas les énergies qu'elle traverse — elle est auto-purifiante. Dans la pratique SVLBH, elle est utilisée sur le canal de transmission de l'énergie vitale de la lignée masculine, qui peut se bloquer ou porter des empreintes d'interruption (trauma, rupture de transmission). La Kyanite noire harmonise ce flux sans jamais accumuler elle-même.",
    usage:
      "Posée sur l'axe GV4 (Mingmen, bas du dos) ↔ KI3 (cheville interne). Seule pierre de la collection ne nécessitant aucune purification.",
  },
];

export function findPierre(id: string): Pierre | null {
  return PIERRES.find((p) => p.id === id) ?? null;
}
