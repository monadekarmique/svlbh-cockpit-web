// Le texte tel que WhatsApp le prend — Patrick, 21.10.2026 : « j'ai besoin que les textes soient fournis dans un
// format qui me permette un copy paste dans whatsapp », puis, après l'essai des définitions : « ça n'est pas possible
// de travailler comme cela ». Mesuré : DiGiSha répond en Markdown (**gras** dans 222 réponses sur 300, listes « - »),
// que WhatsApp n'interprète pas — il veut *gras*, _italique_, ~barré~, ```code```, et des puces « • ».

import type { Element } from "./actions";

const MARQUE = "\n— DiGiSha : ";

/** Pour un tour DiGiSha (« dg: »), la pièce est la RÉPONSE (la définition) ; sinon le texte du message. */
export function texteDe(e: Element): string {
  if (!e.wa_message_id.startsWith("dg:")) return e.texte ?? "";
  const t = e.texte ?? "";
  const i = t.indexOf(MARQUE);
  return i >= 0 ? t.slice(i + MARQUE.length) : t;
}

/** La question posée à DiGiSha (première ligne : « Définition : <terme> » quand elle vient du volet). */
export function questionDe(e: Element): string {
  if (!e.wa_message_id.startsWith("dg:")) return "";
  const t = e.texte ?? "";
  const i = t.indexOf(MARQUE);
  return (i >= 0 ? t.slice(0, i) : "").split("\n")[0].trim();
}

/** Markdown → WhatsApp. Gras **x** → *x* ; titres « ## x » → *x* ; puces « - » → « • » ; liens [t](u) → t (u) ; code ``` gardé. */
export function markdownVersWhatsApp(s: string): string {
  return s
    .replace(/\r\n/g, "\n")
    .replace(/^#{1,6}\s+(.+)$/gm, "*$1*")
    .replace(/\*\*(.+?)\*\*/g, "*$1*")
    .replace(/__(.+?)__/g, "*$1*")
    .replace(/(^|[^*])\*(?!\*)([^*\n]+?)\*(?!\*)/g, "$1*$2*")
    .replace(/^\s*[-*+]\s+/gm, "• ")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, "$1 ($2)")
    .replace(/`([^`\n]+)`/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Le banc entier, prêt à coller : titre en gras, mot d'intro, puis un bloc par pièce (son texte, puis le commentaire
 *  en italique). Un média sans texte ni commentaire n'écrit rien : il part comme fichier. */
export function pourWhatsApp(sequence: string[], parId: Map<string, Element>, opts: { nom?: string; intro?: string } = {}): string {
  const blocs: string[] = [];
  if (opts.nom?.trim()) blocs.push(`*${opts.nom.trim()}*`);
  if (opts.intro?.trim()) blocs.push(opts.intro.trim());
  for (const id of sequence) {
    const e = parId.get(id);
    if (!e) continue;
    const t = markdownVersWhatsApp(texteDe(e));
    const c = (e.commentaire ?? "").trim();
    const bloc = [t, c ? `_${c}_` : ""].filter(Boolean).join("\n");
    if (bloc) blocs.push(bloc);
  }
  return blocs.join("\n\n");
}

/** Copie dans le presse-papiers ; rend false si le navigateur refuse (sélection à la main). */
export async function copier(texte: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(texte); return true; } catch { return false; }
}
