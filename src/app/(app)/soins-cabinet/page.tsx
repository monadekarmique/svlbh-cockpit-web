// Préparation Soins au Cabinet — index (DEC Patrick 2026-08-06).
// Soins délivrés au cabinet pour des ST5+ ; préparations gatées ST6 STRICT
// (requireSt6 — Cercle SR ne suffit pas, ponts doctrinaux non mesurés).

import Link from "next/link";
import { requireSt6 } from "@/lib/owner-gate";
import { SOIN_VIFA_EF } from "@/lib/cercle/soin-vifa-entites-familiales";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SoinsCabinetPage() {
  await requireSt6();

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-blue-950">
          Préparation Soins au Cabinet
        </h1>
        <p className="mt-1 text-sm text-neutral-700">
          Préparations des soins délivrés au cabinet pour des praticiennes et
          consultantes <strong>ST5+</strong> — sources attribuées, verbatims
          intégraux, lecture VLBH, points à mesurer en séance.
        </p>
        <p className="mt-1 text-xs text-neutral-500">
          Accès ST6 · les préparations portent des ponts doctrinaux qui
          attendent leurs mesures — rien n&rsquo;est affirmé avant séance.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href="/soins-cabinet/vifa-entites-familiales"
          className="group rounded-2xl border-2 border-rose-200 bg-gradient-to-br from-rose-50 to-amber-50 p-5 shadow-sm transition hover:shadow-md active:scale-[0.99]"
        >
          <div className="text-3xl">🕯️</div>
          <h2 className="mt-3 text-lg font-semibold" style={{ color: "#7A0F26" }}>
            Soin VIFA — entités familiales
          </h2>
          <p className="mt-1 text-sm text-neutral-700">
            Répercussions spirituelles et médicales de la présence
            d&rsquo;entités familiales. 2 sources vidéo (José Chouraqui ·
            Apache Runners), 6 points à mesurer.
          </p>
          <p className="mt-2 text-xs text-neutral-500">{SOIN_VIFA_EF.statut}</p>
        </Link>
      </div>
    </div>
  );
}
