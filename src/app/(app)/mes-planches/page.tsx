import type { Metadata } from "next";
import Link from "next/link";
import { requireSt5Plus } from "@/lib/owner-gate";
import { chargerFluxPraticienne, ciblesVoirComme, demarrerVoirComme, quitterVoirComme, voirComme } from "../pathologies-entites/actions";
import { IndexerClient } from "../pathologies-entites/indexer-client";

export const metadata: Metadata = { title: "Mes planches" };
export const dynamic = "force-dynamic";

// L'atelier d'une praticienne — Patrick, 21.10.2026 : « Anne publie par son numéro privé à elle […] elle a
// accès aux groupes dans lesquels elle est active — elle n'a donc pas accès à mes z1 à z4 ni au z5 de
// Cornelia », puis « je ne veux pas voir ses conversations privées », puis « je veux qu'elle puisse comme
// moi créer un banc ».
//
// Donc : pas de pont sur son numéro. Elle voit ici les groupes où elle est membre — connus par les ponts de
// Patrick, qui y sont aussi — et ses propres tours DiGiSha. Elle monte sa planche sur le banc, la nomme,
// « Valider » (zone Soin : la sienne, que le passage des 2 h ne verse nulle part — DEC Patrick 21.10 : « une
// praticienne ne nourrit pas DiGiSha »), puis « Préparer pour WhatsApp » lui met texte et médias en main :
// c'est son téléphone qui publie. Le périmètre est tenu par la base (migrations 2026-10-21e/g/h), pas par cette page.
//
// Voir comme (Patrick, 21.10 : « j'ai une fonction voir comme qui existe ») : la session est celle de ses apps
// (coach_view_session) ; ici elle se démarre et se quitte par les mêmes RPC, et la lecture suit la cible dès que
// la requête porte l'en-tête de surface. En session, Valider est refusé par la base — on regarde, on n'écrit pas.

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
  const erreurVoirComme = typeof q.erreur === "string" ? q.erreur : null;
  const vc = await voirComme();
  const cibles = gate.isOwner && !vc ? await ciblesVoirComme() : [];
  const { elements, phrases, erreurs, erreur } = await chargerFluxPraticienne(jour);
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
        Tes groupes du jour. Clique les pièces dans l&apos;ordre — elles se numérotent sur le banc. Nomme-le, « Valider » : il est à toi,
        en zone Soin, et tu le retrouves. « Préparer pour WhatsApp » te met le texte et les médias en main — tu publies depuis ton téléphone, avec ton numéro.
      </p>
      <p className="mb-3 text-xs text-gray-400">
        version <code className="rounded bg-gray-100 px-1">{(process.env.RENDER_GIT_COMMIT ?? "locale").slice(0, 7)}</code>
        {" · "}{conversations} conversation(s) · {medias.length} média(s) · {affiches} affiché(s)
        {medias.length - affiches > 0 && <> · {medias.length - affiches} resté(s) sur le pont</>}
        {erreurs.length > 0 && <span className="text-red-700"> · signature refusée : {[...new Set(erreurs)].slice(0, 3).join(" ; ")}</span>}
      </p>

      {vc ? (
        <div className="mb-3 flex flex-wrap items-center gap-3 rounded-xl bg-violet-50 p-3 text-sm text-violet-900 ring-1 ring-violet-200">
          <span>
            👁 Tu vois comme <strong>{vc.prenom} {vc.nom}</strong> — ses groupes, ses tours, ses planches, tels que la base les lui sert.
            Lecture seule : « Valider » est refusé pendant le voir-comme. La session vaut pour toutes tes surfaces (Kanban, Priv…), 60 min glissantes.
          </span>
          <form action={quitterVoirComme}>
            <button type="submit" className="rounded-md border border-violet-300 bg-white px-3 py-1 text-sm font-semibold text-violet-900">Quitter</button>
          </form>
        </div>
      ) : gate.isOwner && (
        <form action={demarrerVoirComme} className="mb-3 flex flex-wrap items-center gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-amber-200">
          <span>Tu es propriétaire : cet atelier montre les groupes de TES identités WhatsApp. Pour le voir comme une praticienne :</span>
          <select name="cible" defaultValue={cibles[0]?.svlbh_id} className="rounded-md border border-amber-300 bg-white px-2 py-1 text-sm">
            {cibles.map((c) => <option key={c.svlbh_id} value={c.svlbh_id}>{c.first_name} {c.last_name ?? ""}</option>)}
          </select>
          <button type="submit" disabled={cibles.length === 0} className="rounded-md bg-amber-700 px-3 py-1 text-sm font-semibold text-white disabled:opacity-40">Voir comme</button>
          {erreurVoirComme && <span className="text-red-700">refusé : {erreurVoirComme}</span>}
        </form>
      )}

      {erreur ? (
        <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">
          {/aucune identité/i.test(erreur)
            ? gate.isOwner
              ? <>Sans voir-comme, cet atelier n&apos;a pas d&apos;identité à montrer — choisis une praticienne ci-dessus.</>
              : <>Aucune identité WhatsApp n&apos;est encore rattachée à ton compte — demande à Patrick de l&apos;ajouter, et cet atelier s&apos;ouvrira.</>
            : <>Lecture impossible : {erreur}</>}
        </p>
      ) : (
        <IndexerClient key={`${jour}-${vc?.svlbhId ?? "moi"}`} initial={elements} phrases={phrases} jour={jour} groupes={[]} demandes={[]} atelier lectureSeule={!!vc} />
      )}
    </div>
  );
}
