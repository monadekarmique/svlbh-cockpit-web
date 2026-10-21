"use client";

// Ajouter un pack d'OUTILS — Patrick, 21.10.2026 : « j'aimerais aussi pouvoir ajouter des packs d'outils interponts ».
// Un pack que Patrick donne lui-même, en fichiers (webp, png, jpg), sans groupe ni pont : ses stickers sont les outils de la
// méthode. Les fichiers montent du navigateur au seau index-packs sous SA session (le seau s'écrit pour lui seul —
// migration 2026-10-21q), dossier = l'uuid du pack ; puis index_pack_creer pose le pack. Visible de toute praticienne,
// publiable par n'importe quel pont : c'est ce qui le rend « interponts ». Un .webp part comme sticker (dès le correctif Go),
// un .png ou .jpg comme image.

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { creerPack } from "./actions";

const TYPES: Record<string, string> = { "image/webp": "webp", "image/png": "png", "image/jpeg": "jpg" };

export function AjouterPackClient({ apresAjout }: { apresAjout: () => Promise<void> }) {
  const [ouvert, setOuvert] = useState(false);
  const [nom, setNom] = useState("");
  const [editeur, setEditeur] = useState("");
  const [fichiers, setFichiers] = useState<File[]>([]);
  const [etat, setEtat] = useState<string | null>(null);
  const [enCours, demarrer] = useTransition();

  const ajouter = () =>
    demarrer(async () => {
      if (!nom.trim()) { setEtat("donne un nom au pack"); return; }
      const retenus = fichiers.filter((f) => TYPES[f.type]);
      if (retenus.length === 0) { setEtat("choisis des fichiers webp, png ou jpg"); return; }
      const packId = crypto.randomUUID();
      const sb = createClient();
      const stickers: { rang: number; chemin: string }[] = [];
      for (let i = 0; i < retenus.length; i++) {
        const f = retenus[i];
        const chemin = `${packId}/${i + 1}.${TYPES[f.type]}`;
        setEtat(`envoi ${i + 1}/${retenus.length}…`);
        const { error } = await sb.storage.from("index-packs").upload(chemin, f, { contentType: f.type, upsert: true });
        if (error) { setEtat(`refusé au fichier ${i + 1} : ${error.message}`); return; }
        stickers.push({ rang: i + 1, chemin });
      }
      const r = await creerPack(packId, nom.trim(), editeur.trim(), stickers);
      if (!r.ok) { setEtat(r.erreur ?? "refusé"); return; }
      setEtat(`pack « ${nom.trim()} » posé : ${stickers.length} outil(s) — il arrive dans la colonne « Packs de stickers »`);
      setNom(""); setEditeur(""); setFichiers([]);
      await apresAjout();
    });

  return (
    <section className="mb-4 rounded-xl border border-teal-200 bg-teal-50/60 p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <button type="button" onClick={() => setOuvert((o) => !o)} className="text-base font-semibold text-teal-900">
          {ouvert ? "▾" : "▸"} Ajouter un pack d&apos;outils
        </button>
        <span className="text-xs text-teal-900/70">tes fichiers (webp, png, jpg), sans pont ni groupe — visibles des praticiennes, publiables par tous tes ponts</span>
      </div>
      {ouvert && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input value={nom} onChange={(x) => setNom(x.target.value)} maxLength={120} placeholder="nom du pack — ex. Outils du Creuset"
            className="min-w-[14rem] flex-1 rounded-md border border-teal-200 px-2 py-1 text-[15px]" />
          <input value={editeur} onChange={(x) => setEditeur(x.target.value)} maxLength={80} placeholder="éditeur (facultatif)"
            className="w-44 rounded-md border border-teal-200 px-2 py-1 text-sm" />
          <input type="file" multiple accept="image/webp,image/png,image/jpeg"
            onChange={(x) => setFichiers(Array.from(x.target.files ?? []))}
            className="text-sm" />
          <button type="button" onClick={ajouter} disabled={enCours || !nom.trim() || fichiers.length === 0}
            className="rounded-md bg-teal-700 px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-40">
            {enCours ? "…" : `Ajouter${fichiers.length ? ` (${fichiers.length})` : ""}`}
          </button>
          {etat && <span className="text-xs text-teal-900">{etat}</span>}
        </div>
      )}
    </section>
  );
}
