"use client";

// Préparer pour WhatsApp — l'atelier d'une praticienne (Patrick, 21.10.2026 : « je ne veux pas voir
// ses conversations privées »). Aucun pont sur son numéro, donc rien ne part d'ici : la page lui met
// la planche EN MAIN — le texte à copier, chaque média à ouvrir ou télécharger — et c'est son téléphone,
// avec son numéro, qui publie. Les liens de médias sont signés une heure avec sa propre session.

import { useState } from "react";
import type { Element } from "./actions";
import { copier as copierTexte, markdownVersWhatsApp, pourWhatsApp, texteDe } from "./whatsapp";

const GENRE: Record<string, string> = { image: "photo", video: "vidéo", audio: "vocal", sticker: "sticker", document: "document", sticker_pack: "pack de stickers" };

export function PreparerClient({ sequence, parId }: { sequence: string[]; parId: Map<string, Element> }) {
  const [copie, setCopie] = useState<string | null>(null);
  const pieces = sequence.map((id, i) => ({ rang: i + 1, e: parId.get(id) }));
  // le commentaire d'une pièce (21.10) suit la pièce : à la suite d'un texte, en légende d'un média
  const avecCom = (e: Element) => [markdownVersWhatsApp(texteDe(e)), (e.commentaire ?? "").trim()].filter(Boolean).join("\n");
  const textes = pieces.filter((p) => p.e && !p.e.media_type && avecCom(p.e));
  const medias = pieces.filter((p) => p.e?.media_type);
  // le texte tel que WhatsApp le prend (gras *…*, commentaires en italique) — Patrick, 21.10 : « un format qui me permette un copy paste »
  const bloc = pourWhatsApp(textes.map((p) => p.e!.wa_message_id), parId);

  const copier = async (t: string, cle: string) => {
    if (await copierTexte(t)) { setCopie(cle); setTimeout(() => setCopie(null), 2000); } else setCopie("refus");
  };

  if (sequence.length === 0) return null;
  return (
    <section className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
      <div className="mb-2 flex flex-wrap items-baseline gap-2">
        <h2 className="text-base font-semibold text-emerald-900">Préparer pour WhatsApp</h2>
        <span className="text-xs text-emerald-900/70">
          rien ne part d&apos;ici — tu copies, tu ouvres, et tu publies depuis ton téléphone, avec ton numéro
        </span>
      </div>

      {textes.length > 0 && (
        <div className="mb-3 rounded-lg bg-white p-3 ring-1 ring-emerald-200">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm font-medium">Le texte ({textes.length} pièce{textes.length > 1 ? "s" : ""})</span>
            <button type="button" onClick={() => copier(bloc, "tout")}
              className="rounded-md bg-emerald-700 px-3 py-1 text-sm font-semibold text-white">
              {copie === "tout" ? "copié ✓" : "Copier le texte"}
            </button>
          </div>
          <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap text-[14px] leading-relaxed text-gray-800">{bloc}</pre>
        </div>
      )}

      {medias.length > 0 && (
        <div className="rounded-lg bg-white p-3 ring-1 ring-emerald-200">
          <p className="mb-2 text-sm font-medium">Les médias, dans l&apos;ordre ({medias.length})</p>
          <ol className="space-y-2">
            {medias.map(({ rang, e }) => (
              <li key={e!.wa_message_id} className="flex items-center gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-xs font-bold text-white">{rang}</span>
                {e!.url && (e!.media_type === "image" || e!.media_type === "sticker")
                  ? <img src={e!.url} alt="" className="h-14 w-14 rounded object-contain" />
                  : <span className="w-14 text-center text-[11px] text-gray-500">{GENRE[e!.media_type!] ?? e!.media_type}</span>}
                <span className="min-w-0 flex-1 truncate text-sm text-gray-700">{avecCom(e!) || GENRE[e!.media_type!] || "média"}</span>
                {e!.url ? (
                  <a href={e!.url} target="_blank" rel="noreferrer"
                    className="shrink-0 rounded-md border border-emerald-300 px-2 py-1 text-xs font-medium text-emerald-900">
                    ouvrir
                  </a>
                ) : (
                  <span className="shrink-0 text-xs italic text-amber-800" title="le fichier n'est pas en base : ce groupe n'est pas inscrit au ramassage">
                    resté sur le pont
                  </span>
                )}
              </li>
            ))}
          </ol>
          <p className="mt-2 text-[11px] text-gray-500">
            Sur iPhone : ouvrir, puis Partager → WhatsApp → le groupe. Les liens valent une heure.
          </p>
        </div>
      )}
      {copie === "refus" && <p className="mt-1 text-xs text-red-700">le presse-papiers a refusé — sélectionne le texte à la main</p>}
    </section>
  );
}
