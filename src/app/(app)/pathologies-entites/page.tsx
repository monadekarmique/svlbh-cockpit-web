import type { Metadata } from "next";
import Link from "next/link";
import { VERSION } from "@/lib/version";
import { requireSt5Plus } from "@/lib/owner-gate";
import { chargerFlux, chargerFluxPraticienne, ciblesVoirComme, demarrerVoirComme, listerDemandes, listerGroupes, quitterVoirComme, voirComme } from "./actions";
import { IndexerClient } from "./indexer-client";

export const metadata: Metadata = { title: "Pathologies & entités" };
export const dynamic = "force-dynamic";

// Patrick, 20.10.2026 : « ce serait 4 canaux qui défilent dans lesquel je peux identifier pour les médias et les textes si cela
// doit être indexé et la même chose sur les fils ? » ; « on construit pour la page du cockpit ».
// 21.10 : « tu peux envoyer le lien à Anne vers cockpit / pathologies-entités » — UNE page pour tout le monde, le périmètre tenu
// par la base : Patrick lit index_flux (ses quatre ponts, les fils, DiGiSha) et porte par ses ponts ; une praticienne ST5 lit
// index_flux_praticienne (les groupes où elle est, ses tours DiGiSha — rien des ponts de Patrick : « elle n'a donc pas accès à
// mes z1 à z4 ni au z5 de Cornelia »), valide en zone Soin, et « Préparer pour WhatsApp » lui met la planche en main.
// En « voir comme », Patrick lit comme la cible et n'écrit pas (migration 2026-10-21h).

const zurichJour = (d: Date) =>
  new Intl.DateTimeFormat("fr-CH", { timeZone: "Europe/Zurich", year: "numeric", month: "2-digit", day: "2-digit" })
    .format(d).split(".").reverse().join("-");

function decaler(jour: string, n: number): string {
  const d = new Date(`${jour}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export default async function IndexerPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const gate = await requireSt5Plus();
  const q = await searchParams;
  const aujourdhui = zurichJour(new Date());
  const brut = typeof q.jour === "string" && /^\d{4}-\d{2}-\d{2}$/.test(q.jour) ? q.jour : aujourdhui;
  const jour = brut > aujourdhui ? aujourdhui : brut;
  const erreurVoirComme = typeof q.erreur === "string" ? q.erreur : null;
  const vc = gate.isOwner ? await voirComme() : null;
  const cibles = gate.isOwner && !vc ? await ciblesVoirComme() : [];
  // atelier : une praticienne, ou Patrick qui voit comme elle — la lecture de la praticienne, sans les ponts
  const atelier = !gate.isOwner || vc !== null;
  const { elements, phrases, erreurs, erreur } = atelier ? await chargerFluxPraticienne(jour) : await chargerFlux(jour);
  const [groupes, demandes] = atelier || erreur ? [[], []] : await Promise.all([listerGroupes(jour), listerDemandes(jour)]);
  const medias = elements.filter((e) => e.media_type);
  const affiches = medias.filter((e) => e.url).length;
  const conversations = new Set(elements.filter((e) => e.chat_jid).map((e) => e.chat_jid)).size;
  const [jj, mm, aaaa] = [jour.slice(8, 10), jour.slice(5, 7), jour.slice(0, 4)];
  return (
    <div className="p-4">
      <div className="mb-1 flex flex-wrap items-baseline gap-3">
        <h1 className="text-xl font-semibold">📖 Pathologies &amp; entités — {jj}.{mm}.{aaaa}</h1>
        <Link href={`/pathologies-entites?jour=${decaler(jour, -1)}`} className="text-sm underline">← veille</Link>
        {jour < aujourdhui && <Link href={`/pathologies-entites?jour=${decaler(jour, 1)}`} className="text-sm underline">lendemain →</Link>}
        {jour < aujourdhui && <Link href="/pathologies-entites" className="text-sm underline">aujourd&apos;hui</Link>}
      </div>
      <p className="mb-1 text-base text-gray-600">
        {atelier
          ? <>Tes groupes du jour. Clique les pièces dans l&apos;ordre — elles se numérotent sur le banc. Nomme la planche, « Valider » : elle est à toi, en zone Soin.
              « Copier pour WhatsApp » te donne le texte prêt à coller ; « Préparer pour WhatsApp » te tend les médias — tu publies depuis ton téléphone.</>
          : <>Banc de montage : clique sur les pièces dans l&apos;ordre (textes, photos, stickers, échanges DiGiSha) — elles se numérotent et
              s&apos;assemblent en haut. Nomme le montage, choisis la zone, « Valider » : il part au passage suivant (toutes les deux heures).</>}
      </p>
      <p className="mb-3 text-xs text-gray-400">
        version <strong className="text-gray-600">{VERSION}</strong> <code className="rounded bg-gray-100 px-1">{(process.env.RENDER_GIT_COMMIT ?? "locale").slice(0, 7)}</code>
        {" · "}{conversations} conversation(s) · {medias.length} média(s) · {affiches} affiché(s)
        {medias.length - affiches > 0 && <> · {medias.length - affiches} resté(s) sur le pont</>}
        {erreurs.length > 0 && <span className="text-red-700"> · signature refusée : {[...new Set(erreurs)].slice(0, 3).join(" ; ")}</span>}
      </p>

      {vc ? (
        <div className="mb-3 flex flex-wrap items-center gap-3 rounded-xl bg-violet-50 p-3 text-sm text-violet-900 ring-1 ring-violet-200">
          <span>
            👁 Tu vois comme <strong>{vc.prenom} {vc.nom}</strong> — ses groupes, ses tours, ses planches, tels que la base les lui sert.
            Lecture seule : « Valider » et DiGiSha sont fermés pendant le voir-comme. La session vaut pour toutes tes surfaces, 60 min glissantes.
          </span>
          <form action={quitterVoirComme}>
            <button type="submit" className="rounded-md border border-violet-300 bg-white px-3 py-1 text-sm font-semibold text-violet-900">Quitter</button>
          </form>
        </div>
      ) : gate.isOwner && (
        <form action={demarrerVoirComme} className="mb-3 flex flex-wrap items-center gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
          <span>Voir cette page comme une praticienne :</span>
          <select name="cible" defaultValue={cibles[0]?.svlbh_id} className="rounded-md border border-amber-300 bg-white px-2 py-1 text-xs">
            {cibles.map((c) => <option key={c.svlbh_id} value={c.svlbh_id}>{c.first_name} {c.last_name ?? ""}</option>)}
          </select>
          <button type="submit" disabled={cibles.length === 0} className="rounded-md bg-amber-700 px-3 py-1 text-xs font-semibold text-white disabled:opacity-40">Voir comme</button>
          {erreurVoirComme && <span className="text-red-700">refusé : {erreurVoirComme}</span>}
        </form>
      )}

      {erreur ? (
        <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">
          {/aucune identité/i.test(erreur)
            ? <>Aucune identité WhatsApp n&apos;est encore rattachée à ton compte — demande à Patrick de l&apos;ajouter, et cette page s&apos;ouvrira sur tes groupes.</>
            : <>Lecture impossible : {erreur}</>}
        </p>
      ) : (
        <IndexerClient key={`${jour}-${vc?.svlbhId ?? (atelier ? "atelier" : "moi")}`} initial={elements} phrases={phrases} jour={jour}
          groupes={groupes} demandes={demandes} atelier={atelier} lectureSeule={vc !== null} />
      )}
    </div>
  );
}
