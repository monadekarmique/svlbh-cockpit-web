import type { Metadata } from "next";
import Link from "next/link";
import { requireSt6 } from "@/lib/owner-gate";
import { createClient } from "@/lib/supabase/server";
import type { Element, Phrase } from "./actions";
import { IndexerClient } from "./indexer-client";

export const metadata: Metadata = { title: "Indexer" };
export const dynamic = "force-dynamic";

// Patrick, 20.10.2026 : « ce serait 4 canaux qui défilent dans lesquel je peux identifier pour les médias et les textes si cela
// doit être indexé et la même chose sur les fils ? » ; « on construit pour la page du cockpit ».
// Lecture : index_flux(jour) (migration 2026-10-20k) — propriétaire seul, un message une fois même vu par deux ponts, colonne
// z1…z4 ou « fils ». Les médias s'affichent quand leur fichier est en base (fil_media, seau privé fil-medias, signé 1 h avec la
// session de Patrick) ; ceux des groupes n'ont pas encore de fichier (mesuré le 20.10 : 0 sur 134 en trois jours).
// Ajouts du 20.10 (14h1x) : la colonne DiGiSha, sa propre définition sous un mot, les stickers et la phrase énergétique.

const zurichJour = (d: Date) =>
  new Intl.DateTimeFormat("fr-CH", { timeZone: "Europe/Zurich", year: "numeric", month: "2-digit", day: "2-digit" })
    .format(d).split(".").reverse().join("-");

function decaler(jour: string, n: number): string {
  const d = new Date(`${jour}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export default async function IndexerPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireSt6();
  const q = await searchParams;
  const aujourdhui = zurichJour(new Date());
  const brut = typeof q.jour === "string" && /^\d{4}-\d{2}-\d{2}$/.test(q.jour) ? q.jour : aujourdhui;
  const jour = brut > aujourdhui ? aujourdhui : brut;
  const sb = await createClient();
  const { data, error } = await sb.rpc("index_flux", { p_jour: jour });
  const elements = ((data ?? []) as Element[]);
  const { data: ph } = await sb.rpc("index_phrases", { p_jour: jour });
  const phrases = ((ph ?? []) as Phrase[]);
  // une signature par seau (fil-medias : les chats ; abo-medias : les groupes inscrits au ramassage), avec la session de Patrick
  const urls = new Map<string, string>();
  const erreurs: string[] = [];
  for (const seau of ["fil-medias", "abo-medias"]) {
    const chemins = [...new Set(elements.filter((e) => e.seau === seau && e.chemin).map((e) => e.chemin as string))];
    for (let i = 0; i < chemins.length; i += 100) {
      const { data: s, error: es } = await sb.storage.from(seau).createSignedUrls(chemins.slice(i, i + 100), 3600);
      if (es) erreurs.push(`${seau} : ${es.message}`);
      for (const x of s ?? []) {
        if (x.path && x.signedUrl) urls.set(`${seau}/${x.path}`, x.signedUrl);
        else if (x.error) erreurs.push(`${seau} : ${x.error}`);
      }
    }
  }
  for (const e of elements) e.url = e.chemin && e.seau ? urls.get(`${e.seau}/${e.chemin}`) ?? null : null;
  const medias = elements.filter((e) => e.media_type);
  const affiches = medias.filter((e) => e.url).length;
  const [jj, mm, aaaa] = [jour.slice(8, 10), jour.slice(5, 7), jour.slice(0, 4)];
  return (
    <div className="p-4">
      <div className="flex flex-wrap items-baseline gap-3 mb-1">
        <h1 className="text-xl font-semibold">📖 Indexer — {jj}.{mm}.{aaaa}</h1>
        <Link href={`/indexer?jour=${decaler(jour, -1)}`} className="text-sm underline">← veille</Link>
        {jour < aujourdhui && <Link href={`/indexer?jour=${decaler(jour, 1)}`} className="text-sm underline">lendemain →</Link>}
        {jour < aujourdhui && <Link href="/indexer" className="text-sm underline">aujourd&apos;hui</Link>}
      </div>
      <p className="text-sm text-gray-500 mb-1">
        Banc de montage : clique sur les pièces dans l&apos;ordre (textes, photos, stickers, échanges DiGiSha) — elles se numérotent et
        s&apos;assemblent en haut. Nomme le montage, choisis la zone, « Valider » : il part au passage suivant (toutes les deux heures).
      </p>
      <p className="text-xs text-gray-400 mb-4">
        {medias.length} média(s) ce jour · {affiches} affiché(s) · {medias.filter((e) => !e.chemin).length} sans fichier en base (restés sur le pont)
        {erreurs.length > 0 && <span className="text-red-700"> · signature refusée : {[...new Set(erreurs)].slice(0, 3).join(" ; ")}</span>}
      </p>
      {error ? <p className="text-red-700">Lecture impossible : {error.message}</p> : <IndexerClient initial={elements} phrases={phrases} jour={jour} />}
    </div>
  );
}
