// Types et constantes partagés — séparés d'actions.ts parce qu'un fichier
// "use server" ne peut exporter QUE des fonctions async (Next.js 16, mesuré
// au build : "A 'use server' file can only export async functions, found
// object" sur APPS_GROUPE_Z2 quand elle vivait dans actions.ts).

export type PraticienneARevoir = {
  svlbh_id: string;
  prenom: string;
  nom: string;
  canal: string | null;
  apps_autorisees: string[];
};

export const APPS_GROUPE_Z2 = [
  { app_id: "6761095011", nom: "Priv-1" },
  { app_id: "6767023770", nom: "Priv 2 de-CH" },
  { app_id: "6761704163", nom: "Priv 3 Palette" },
  { app_id: "6761706084", nom: "Priv 4 VIFA" },
  { app_id: "6763618919", nom: "Priv 5 Clélect" },
  // DEC Patrick 21.09 : « entre dans la grille » — même règle que les cinq autres,
  // déjà couvert par la contrainte CHECK de autorisation_app (6802336804).
  { app_id: "6802336804", nom: "Priv Core" },
] as const;
