// Protocole TOC — passerelle VLBH ↔ Médecine.
// Doctrine extraite du PROTO Yesod 9 (29 mars 2026) et DÉNOMINALISÉE :
// les mesures d'un cas sortent, les règles et l'ordre restent (DEC Patrick 2026-08-05).
// Gate ST3+ hérité du layout cockpit.

import Link from "next/link";
import {
  CORRESPONDANCES,
  COUCHES,
  DEMONSTRATION,
  ETAPES,
  FAUX_DU_CERVEAU,
  MECANISME,
  PARAMETRES,
  PRINCIPE_LECTURE,
  REGLES,
  SYSTEME_FOETAL,
} from "@/lib/cercle/protocole-toc";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function ProtocoleTocPage() {
  return (
    <div className="space-y-5">
      <Link href="/dashboard" className="text-sm text-neutral-500 hover:text-neutral-900">
        ← Cockpit
      </Link>

      <header>
        <h1 className="text-2xl font-bold tracking-tight text-blue-950">
          Protocole TOC — passerelle VLBH ↔ Médecine
        </h1>
        <p className="mt-1 text-sm text-neutral-700">
          Boucles obsessionnelles lues comme scripts Gu sur la faux du cerveau.
          Verticale <strong>Pollution de l&rsquo;ancêtre racine</strong> (KI 18).
        </p>
        <p className="mt-1 text-xs text-neutral-500">
          Dénominalisé du PROTO Yesod 9 · les valeurs mesurées sont à relever par séance,
          jamais reprises d&rsquo;un cas.
        </p>
      </header>

      {/* Ce qui fait le TOC — mis en tête : c'est le cœur de cette verticale. */}
      <section className="rounded-2xl border-2 border-violet-300 bg-gradient-to-br from-violet-50 to-indigo-50 p-5 shadow-md">
        <p className="text-xs font-bold uppercase tracking-wide text-violet-700">
          La faux du cerveau — mémoires sonores
        </p>
        <p className="mt-2 text-sm leading-relaxed text-neutral-800">{FAUX_DU_CERVEAU.substrat}</p>
        <p className="mt-2 text-sm font-bold text-violet-900">{FAUX_DU_CERVEAU.boucle}</p>
        <p className="mt-2 font-mono text-xs text-violet-800">
          Désintrication : {FAUX_DU_CERVEAU.desintrication}
        </p>
      </section>

      {/* Ordre strict — l'information la plus opératoire. */}
      <section>
        <h2 className="text-lg font-bold text-blue-950">Protocole — ordre strict</h2>
        <ol className="mt-2 space-y-2">
          {ETAPES.map((e) => (
            <li key={e.n} className="rounded-xl border border-neutral-200 bg-white p-3">
              <p className="text-sm font-bold text-neutral-900">
                {e.n}. {e.titre}
              </p>
              {e.detail ? (
                <ul className="mt-1 list-disc pl-5 text-xs text-neutral-600">
                  {e.detail.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2 className="text-lg font-bold text-blue-950">Les 5 règles cliniques</h2>
        <div className="mt-2 space-y-2">
          {REGLES.map((r) => (
            <div key={r.n} className="rounded-xl border border-amber-200 bg-amber-50/60 p-3">
              <p className="text-sm font-bold text-amber-900">
                Règle {r.n} — {r.titre}
              </p>
              <p className="mt-1 text-sm text-neutral-800">{r.enonce}</p>
              {r.detail ? (
                <ul className="mt-1 list-disc pl-5 text-xs text-neutral-600">
                  {r.detail.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      {/* Paramètres à MESURER — le PROTO source portait les valeurs d'une personne. */}
      <section>
        <h2 className="text-lg font-bold text-blue-950">Paramètres à relever</h2>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-neutral-500">
              <tr>
                <th className="py-1 pr-3">Paramètre</th>
                <th className="py-1 pr-3">À mesurer</th>
                <th className="py-1">Lecture</th>
              </tr>
            </thead>
            <tbody>
              {PARAMETRES.map((p) => (
                <tr key={p.parametre} className="border-t border-neutral-100">
                  <td className="py-1 pr-3 font-bold text-neutral-900">{p.parametre}</td>
                  <td className="py-1 pr-3 text-neutral-700">{p.aMesurer}</td>
                  <td className="py-1 text-neutral-600">{p.lecture}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold text-blue-950">Système fœtal logoïque</h2>
        <p className="mt-1 text-sm leading-relaxed text-neutral-800">{SYSTEME_FOETAL.definition}</p>
        <ul className="mt-2 list-disc pl-5 text-sm text-neutral-700">
          {SYSTEME_FOETAL.distinction.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-bold text-blue-950">Mécanisme — allumage et sphincters</h2>
        <ol className="mt-2 font-mono text-xs text-neutral-700">
          {MECANISME.allumage.map((a, i) => (
            <li key={a}>
              {i > 0 ? "↓ " : ""}
              {a}
            </li>
          ))}
        </ol>
        <p className="mt-2 text-sm text-neutral-800">{MECANISME.note}</p>
        <div className="mt-2 space-y-1">
          {MECANISME.sphincters.map((s) => (
            <p key={s.nom} className="text-xs text-neutral-700">
              <strong>{s.nom}</strong> — {s.situation} → {s.effet}
            </p>
          ))}
        </div>
        <p className="mt-1 text-xs font-semibold text-neutral-600">{MECANISME.sphinctersNote}</p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-blue-950">Correspondances anatomiques</h2>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-neutral-500">
              <tr>
                <th className="py-1 pr-3">Structure</th>
                <th className="py-1 pr-3">Sephirah</th>
                <th className="py-1 pr-3">Méridien</th>
                <th className="py-1 pr-3">Pilier</th>
                <th className="py-1">Accumulation</th>
              </tr>
            </thead>
            <tbody>
              {CORRESPONDANCES.map((c) => (
                <tr key={c.structure} className="border-t border-neutral-100">
                  <td className="py-1 pr-3 font-bold text-neutral-900">{c.structure}</td>
                  <td className="py-1 pr-3 text-neutral-700">{c.sephirah}</td>
                  <td className="py-1 pr-3 text-neutral-700">{c.meridien}</td>
                  <td className="py-1 pr-3 text-neutral-700">{c.pilier}</td>
                  <td className="py-1 text-neutral-600">{c.sens}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold text-blue-950">Les 4 couches</h2>
        <div className="mt-2 space-y-1">
          {COUCHES.map((c) => (
            <p key={c.rang} className="text-xs text-neutral-700">
              <strong>{c.rang}. {c.systeme}</strong> — {c.contenu}
            </p>
          ))}
        </div>
        <p className="mt-2 text-sm font-semibold text-neutral-800">{PRINCIPE_LECTURE}</p>
      </section>

      <section className="rounded-2xl border-2 border-neutral-300 bg-neutral-50 p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-neutral-600">
          Ce que le protocole démontre
        </p>
        <p className="mt-2 text-sm italic leading-relaxed text-neutral-800">{DEMONSTRATION}</p>
      </section>
    </div>
  );
}
