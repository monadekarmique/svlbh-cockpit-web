// /charges — l'état d'une ligne à l'écran (carte 44551562, 15.11.2026).
//
// Trois états, jamais deux : « proposé » (la règle suggère, rien n'est écrit), « appris » (écrit par fable d'après ce que
// Patrick a déjà validé pour le même fournisseur ou la même opération bancaire — pose_par = 'fable-appris', sa règle du
// 01.10.2026) et « validé » (écrit par Patrick). Avant le 15.11 la page ne lisait pas QUI avait posé l'annotation : une
// ligne apprise s'affichait en vert, comme une ligne qu'il avait tranchée lui-même.

export type EtatLigne = "propose" | "appris" | "valide";

/** La signature des annotations apprises, dans public.rapprochement.pose_par. */
export const POSE_PAR_APPRIS = "fable-appris";

/** `nature` = ce qui est écrit en base (null : rien) ; `appris` = l'annotation est signée « fable-appris ». */
export function etatLigne(nature: string | null, appris: boolean): EtatLigne {
  if (nature === null) return "propose";
  return appris ? "appris" : "valide";
}

/** Les classes du menu d'une ligne : vert = validé par Patrick, bleu = appris, gris italique = proposé. */
export const CLASSES_ETAT: Record<EtatLigne, string> = {
  valide: "border-emerald-300 bg-emerald-50 text-emerald-900",
  appris: "border-sky-300 bg-sky-50 text-sky-900",
  propose: "border-neutral-300 bg-white text-neutral-500 italic",
};
