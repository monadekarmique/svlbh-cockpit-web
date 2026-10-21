import type { Metadata } from "next";
import Link from "next/link";
import { requireSt5Plus } from "@/lib/owner-gate";
import { chargerFluxPraticienne } from "../pathologies-entites/actions";
import { IndexerClient } from "../pathologies-entites/indexer-client";

export const metadata: Metadata = { title: "Mes planches" };
export const dynamic = "force-dynamic";

// L'atelier d'une praticienne — Patrick, 21.10.2026 : « Anne publie par son numéro privé à elle […] elle a
// accès aux groupes dans lesquels elle est active — elle n'a donc pas accès à mes z1 à z4 ni au z5 de
// Cornelia », puis « je ne veux pas voir ses conversations privées ».
//
// Donc : pas de pont sur son numéro. Elle voit ici les groupes où elle est membre — connus par les ponts de
// Patrick, qui y sont aussi — et ses propres tours DiGiSha. Elle monte sa planche sur le banc, puis
// « Préparer pour WhatsApp » lui met le texte et les médias en main : c'est son téléphone qui publie.
// Le périmètre est tenu par la base (index_flux_praticienne, migration 2026-10-21e), pas par cette page.

const zurichJour = (d: Date) =>
  new Intl.DateTimeFormat("fr-CH", { timeZone: "Europe/Zurich", year: "numeric", month: "2-digit", day: "2-digit" })
    .format(d).split(".").reverse().join("-");

function decaler(jour: string, n: number): string {
  const d = new Date(`${jour}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export default async function MesPlanchesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const gate = await requireSt5Plus();
  const q = await searchParams;
  const aujourdhui = zurichJour(new Date());
  const brut = typeof q.jour === "string" && /^\d{4}-\d{2}-\d{2}$/.test(q.jour) ? q.jour : aujourdhui;
  const jour = brut > aujourdhui ? aujourdhui : brut;
  const { elements, erreurs, erreur } = await chargerFluxPraticienne(jour);
  const medias = elements.filter((e) => e.media_type);
  const affiches = medias.filter((e) => e.url).length;
  const conversations = new Set(elements.filter((e) => e.chat_jid).map((e) => e.chat_jid)).size;
  const [jj, mm, aaaa] = [jour.slice(8, 10), jour.slice(5, 7), jour.slice(0, 4)];

  return (
    <div className="p-4">
      <div className="mb-1 flex flex-wrap items-baseline gap-3">
        <h1 className="text-xl font-semibold">🪶 Mes planches — {jj}.{mm}.{aaaa}</h1>
        <Link href={`/mes-planches?jour=${decaler(jour, -1)}`} className="text-sm underline">← veille</Link>
        {jour < aujourdhui && <Link href={`/mes-planches?jour=${decaler(jour, 1)}`} className="text-sm underline">lendemain →</Link>}
        {jour < aujourdhui && <Link href="/mes-planches" className="text-sm underline">aujourd&apos;hui</Link>}
      </div>
      <p className="mb-1 text-base text-gray-600">
        Tes groupes du jour. Clique les pièces dans l&apos;ordre — elles se numérotent sur le banc. Puis « Préparer pour WhatsApp » :
        tu copies le texte, tu ouvres les médias, et tu publies depuis ton téléphone, avec ton numéro.
      </p>
      <p className="mb-4 text-xs text-gray-400">
        version <code className="rounded bg-gray-100 px-1">{(process.env.RENDER_GIT_COMMIT ?? "locale").slice(0, 7)}</code>
        {" · "}{conversations} conversation(s) · {medias.length} média(s) · {affiches} affiché(s)
        {medias.length - affiches > 0 && <> · {medias.length - affiches} resté(s) sur le pont</>}
        {gate.isOwner && <span className="ml-2 rounded bg-amber-100 px-1 text-amber-900">tu es propriétaire : cet atelier ne montre que les groupes de TES identités WhatsApp</span>}
        {erreurs.length > 0 && <span className="text-red-700"> · signature refusée : {[...new Set(erreurs)].slice(0, 3).join(" ; ")}</span>}
      </p>
      {erreur ? (
        <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">
          {/aucune identité/i.test(erreur)
            ? <>Aucune identité WhatsApp n&apos;est encore rattachée à ton compte — demande à Patrick de l&apos;ajouter, et cet atelier s&apos;ouvrira.</>
            : <>Lecture impossible : {erreur}</>}
        </p>
      ) : (
        <IndexerClient key={jour} initial={elements} phrases={[]} jour={jour} groupes={[]} demandes={[]} atelier />
      )}
    </div>
  );
}
