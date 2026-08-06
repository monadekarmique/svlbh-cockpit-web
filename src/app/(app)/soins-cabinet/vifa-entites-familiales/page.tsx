// Préparation Soin VIFA — Répercussions spirituelles et médicales de la
// présence d'entités familiales (DEC Patrick 2026-08-06, gate ST6 strict).
// Médias : bucket privé programmes-media, URLs signées APRÈS le gate
// (createAdminClient) — jamais de lien TikTok embarqué ; le lien vers le
// CRÉATEUR est affiché, download libre par la même URL signée.

import Link from "next/link";
import { requireSt6 } from "@/lib/owner-gate";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  CORRESPONDANCES_JOSE_VLBH,
  DEC_ATTRIBUTION_SERIE_EN,
  LECTURE_CE_QUE_JOSE_NE_DIT_PAS,
  LECTURE_PORTES,
  POINTS_A_MESURER,
  SOIN_VIFA_EF,
  SOURCE_APACHE,
  SOURCE_JOSE,
  TABLEAU_JOSE,
  type SourceVideo,
} from "@/lib/cercle/soin-vifa-entites-familiales";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Convention SVLBHMediaRef : signedURLExpiry 3600.
const SIGNED_URL_EXPIRY = 3600;

async function signMedia(fichier: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin.storage
    .from(SOIN_VIFA_EF.bucket)
    .createSignedUrl(`${SOIN_VIFA_EF.prefix}/${fichier}`, SIGNED_URL_EXPIRY);
  return data?.signedUrl ?? null;
}

function SourceCard({
  source,
  mediaUrl,
  children,
}: {
  source: SourceVideo;
  mediaUrl: string | null;
  children?: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-rose-800">
        {source.langue} · {source.duree} · {source.auteur}
      </p>
      <h2 className="mt-1 text-lg font-bold text-blue-950">{source.titre}</h2>
      <p className="mt-1 text-xs text-neutral-500">
        Créateur&nbsp;:{" "}
        {source.adresses.map((a, i) => (
          <span key={a.url}>
            {i > 0 && " · "}
            <a
              href={a.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-rose-800 hover:opacity-75"
            >
              {a.label}
            </a>
          </span>
        ))}
      </p>
      {mediaUrl ? (
        <div className="mt-3">
          {/* Vidéo hébergée (bucket privé) — le lien TikTok mourra, pas celle-ci. */}
          <video
            controls
            preload="metadata"
            playsInline
            className="w-full max-w-md rounded-xl border border-neutral-200 bg-black"
            src={mediaUrl}
          />
          <p className="mt-1 text-xs text-neutral-500">
            <a
              href={mediaUrl}
              download={source.fichier}
              className="font-semibold text-rose-800 hover:opacity-75"
            >
              ⬇︎ Télécharger la vidéo
            </a>{" "}
            (hébergée SVLBH — download libre, créditez le créateur ci-dessus)
          </p>
        </div>
      ) : (
        <p className="mt-3 text-sm text-amber-700">
          Média indisponible (signature d&rsquo;URL échouée) — fichier :{" "}
          <code>{SOIN_VIFA_EF.prefix}/{source.fichier}</code>
        </p>
      )}
      {source.note && (
        <p className="mt-2 text-xs text-amber-800">⚠️ {source.note}</p>
      )}
      {children}
      <details className="mt-3">
        <summary className="cursor-pointer text-sm font-semibold text-blue-950">
          Verbatim intégral ({source.langue}, AssemblyAI, non retouché)
        </summary>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-neutral-800">
          {source.verbatim}
        </p>
      </details>
    </section>
  );
}

export default async function SoinVifaEntitesFamilialesPage() {
  await requireSt6();

  const [joseUrl, apacheUrl, tableauUrl] = await Promise.all([
    signMedia(SOURCE_JOSE.fichier),
    signMedia(SOURCE_APACHE.fichier),
    signMedia(TABLEAU_JOSE.capture),
  ]);

  return (
    <div className="space-y-5">
      <Link
        href="/soins-cabinet"
        className="text-sm text-neutral-500 hover:text-neutral-900"
      >
        ← Préparation Soins au Cabinet
      </Link>

      <header>
        <h1 className="text-2xl font-bold tracking-tight text-blue-950">
          Soin VIFA — Répercussions spirituelles et médicales de la présence
          d&rsquo;entités familiales
        </h1>
        <p className="mt-1 text-sm text-neutral-700">
          Deux sources vidéo, la lecture VLBH par-dessus (motif Monadic
          Medium&nbsp;: la trame de l&rsquo;auteur citée entière, jamais
          résumée par prudence), et les points qui attendent leurs mesures.
        </p>
        <p className="mt-1 text-xs text-neutral-500">{SOIN_VIFA_EF.statut}</p>
      </header>

      {/* ── Source A — José Chouraqui ── */}
      <SourceCard source={SOURCE_JOSE} mediaUrl={joseUrl}>
        <div className="mt-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-neutral-600">
            Relevé du tableau blanc
          </p>
          <p className="mt-1 text-sm text-neutral-800">
            <strong>Horizontal</strong> — {TABLEAU_JOSE.horizontal}
          </p>
          <p className="mt-2 text-sm font-semibold text-neutral-800">
            Vertical&nbsp;:
          </p>
          <ol className="mt-1 grid list-decimal grid-cols-1 gap-x-6 pl-5 text-sm text-neutral-800 sm:grid-cols-2">
            {TABLEAU_JOSE.listeVerticale.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
          <p className="mt-2 text-xs text-neutral-500">{TABLEAU_JOSE.partiel}</p>
          {tableauUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- URL signée éphémère, pas d'optimisation Next
            <img
              src={tableauUrl}
              alt="Tableau blanc de José Chouraqui — liste verticale 1-13"
              className="mt-3 max-w-[280px] rounded-lg border border-neutral-200"
            />
          )}
        </div>
      </SourceCard>

      {/* ── Source B — Apache Runners ── */}
      <SourceCard source={SOURCE_APACHE} mediaUrl={apacheUrl}>
        <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-emerald-800">
            ⚡ DEC débloquée — attribution de la série vidéo EN
          </p>
          <p className="mt-1 text-sm text-neutral-800">{DEC_ATTRIBUTION_SERIE_EN}</p>
        </div>
      </SourceCard>

      {/* ── Lecture VLBH 2a ── */}
      <section className="rounded-2xl border-2 border-violet-300 bg-gradient-to-br from-violet-50 to-indigo-50 p-5 shadow-md">
        <h2 className="text-lg font-bold text-blue-950">
          La lecture VLBH — le « vertical » de José = le canal des VIFA
        </h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-violet-700">
                <th className="pb-2 pr-4 font-bold">José (neuro-training)</th>
                <th className="pb-2 font-bold">VLBH</th>
              </tr>
            </thead>
            <tbody>
              {CORRESPONDANCES_JOSE_VLBH.map((row) => (
                <tr key={row.jose} className="border-t border-violet-200 align-top">
                  <td className="py-2 pr-4 font-medium text-neutral-800">{row.jose}</td>
                  <td className="py-2 text-neutral-800">{row.vlbh}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm font-semibold leading-relaxed text-violet-900">
          {LECTURE_CE_QUE_JOSE_NE_DIT_PAS}
        </p>
      </section>

      {/* ── Lecture VLBH 2b ── */}
      <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-blue-950">
          Les deux cœurs apaches — la porte et le verrou
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-neutral-800">
          {LECTURE_PORTES.image}
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-neutral-800">
          {LECTURE_PORTES.echos.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
        <p className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm font-semibold text-amber-900">
          ⚠️ {LECTURE_PORTES.gardeFou}
        </p>
      </section>

      {/* ── Points à mesurer ── */}
      <section className="rounded-2xl border-2 border-rose-300 bg-gradient-to-br from-rose-50 to-amber-50 p-5 shadow-md">
        <h2 className="text-lg font-bold" style={{ color: "#7A0F26" }}>
          Points à MESURER en séance
        </h2>
        <p className="mt-1 text-xs text-neutral-600">
          Rien de ce qui suit n&rsquo;est affirmé — chaque point attend sa
          mesure radiesthésique.
        </p>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-neutral-800">
          {POINTS_A_MESURER.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ol>
      </section>
    </div>
  );
}
