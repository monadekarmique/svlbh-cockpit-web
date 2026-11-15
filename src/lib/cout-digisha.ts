// La ligne de coût DiGiSha — Patrick, 11.11.2026 : « sur tous les DigiSha nous allons brancher cela » (carte 91c366cd).
// La base fait tout le calcul : rpc mon_cout_digisha(), sans argument, sous la session de la personne. Ici on ne fait
// que l'écrire, au caractère près la même ligne que sur Priv web et Pro web :
//   Aujourd'hui 5,11 $ · 4,19 CHF — ce mois 9,06 $ · 7,43 CHF
// Ce que rend la rpc (définition lue en base le 15.11.2026) :
//   null                → aucune identité derrière la session
//   { ouvert: false }   → sous ST3
//   { ouvert: true, vu_comme, jour { appels, usd, chf }, mois { appels, usd, chf }, taux_usd_chf, taux_releve_le }
// usd et chf arrivent déjà arrondis à deux décimales ; chf est nul si aucun taux n'est relevé.
// Tout ce qui n'est pas « ouvert, avec ses quatre montants » rend null — et null n'affiche RIEN : ni ligne, ni erreur.

export type CoutDigisha = {
  ouvert: boolean;
  vu_comme?: boolean;
  jour?: { appels: number; usd: number; chf: number | null };
  mois?: { appels: number; usd: number; chf: number | null };
  taux_usd_chf?: number | null;
  taux_releve_le?: string | null;
};

/** Deux décimales, virgule décimale. Sans Intl : le rendu ne dépend ni du navigateur ni de la langue du serveur. */
export function montant(n: number): string {
  return n.toFixed(2).replace(".", ",");
}

const estMontant = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

/** La ligne à afficher pour une réponse de mon_cout_digisha(), ou null quand rien ne doit s'afficher. */
export function ligneCoutDigisha(reponse: unknown): string | null {
  if (typeof reponse !== "object" || reponse === null) return null;
  const { ouvert, jour, mois } = reponse as Partial<CoutDigisha>;
  if (ouvert !== true) return null;
  const [jourUsd, jourChf, moisUsd, moisChf] = [jour?.usd, jour?.chf, mois?.usd, mois?.chf];
  if (!estMontant(jourUsd) || !estMontant(jourChf) || !estMontant(moisUsd) || !estMontant(moisChf)) return null;
  return `Aujourd'hui ${montant(jourUsd)} $ · ${montant(jourChf)} CHF — ce mois ${montant(moisUsd)} $ · ${montant(moisChf)} CHF`;
}
