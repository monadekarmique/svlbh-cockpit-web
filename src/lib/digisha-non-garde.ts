// DiGiSha — « ce tour n'a pas été gardé » (carte ac79ce6b, 15.11.2026).
//
// Le 09.11.2026, quatorze tours d'une praticienne ont été refusés à l'enregistrement sans que rien ne s'affiche. Depuis le
// 15.11 (vlbh-energy-mcp 56874ef), le serveur le dit dans sa réponse : `non_garde` (vrai quand le tour, une pièce jointe ou
// des consignes ne sont pas dans ses pages) et `non_garde_motif` (la phrase à afficher, écrite par lui, jamais le message
// de la base). Ce module est le seul endroit du cockpit qui lit ces deux champs : l'action dialoguerDigisha de
// /pathologies-entites s'en sert, et `npm test` le prouve. Même module que sur priv.svlbh.com.

/** La phrase du serveur quand il n'a pas de motif à donner : le fait seul, sans raison inventée. */
export const NON_GARDE_SANS_MOTIF = "Ce tour n'a pas été gardé.";

/**
 * La phrase à afficher sous la réponse quand le serveur dit que quelque chose du tour n'a pas été gardé ; `null` sinon.
 * Seul `non_garde === true` compte : un champ absent (serveur d'avant le 15.11) ou une autre valeur ne dit rien.
 */
export function phraseNonGarde(data: unknown): string | null {
  if (data === null || typeof data !== "object") return null;
  const d = data as { non_garde?: unknown; non_garde_motif?: unknown };
  if (d.non_garde !== true) return null;
  const motif = typeof d.non_garde_motif === "string" ? d.non_garde_motif.trim() : "";
  return motif !== "" ? motif : NON_GARDE_SANS_MOTIF;
}
