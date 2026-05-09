// Détail d'une pierre d'enseignement.

import Link from "next/link";
import { notFound } from "next/navigation";
import { findPierre } from "@/lib/cercle/pierres";

export const dynamic = "force-static";

export default async function PierreDetail({
  params,
}: {
  params: Promise<{ pierreId: string }>;
}) {
  const { pierreId } = await params;
  const p = findPierre(pierreId);
  if (!p) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <nav className="text-sm text-neutral-500">
        <Link href="/dashboard" className="hover:text-neutral-900">
          Cockpit
        </Link>{" "}
        ·{" "}
        <Link href="/pierres" className="hover:text-neutral-900">
          Pierres
        </Link>
      </nav>

      <header className="space-y-1 rounded-2xl border-l-8 border-blue-900 bg-white p-5 shadow-sm">
        <div className="flex items-baseline gap-3">
          <span className="text-4xl text-blue-900">{p.symbole}</span>
          <div>
            <h1 className="text-2xl font-bold text-blue-950">{p.nom}</h1>
            <p className="font-mono text-xs text-neutral-500">{p.formule}</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {p.absorbe.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-900"
            >
              {tag}
            </span>
          ))}
        </div>
      </header>

      <section className="rounded-xl border-2 border-amber-200 bg-amber-50 p-4 shadow-sm">
        <p className="text-xs font-bold uppercase text-amber-700">
          Signature vibratoire
        </p>
        <p className="mt-1 text-sm font-semibold italic text-neutral-800">
          {p.signature}
        </p>
      </section>

      <section className="space-y-2 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-bold text-blue-900">Contexte</h2>
        <p className="text-sm leading-relaxed text-neutral-800">
          {p.contexte}
        </p>
      </section>

      <section className="space-y-2 rounded-xl border border-purple-200 bg-purple-50 p-5 shadow-sm">
        <h2 className="text-base font-bold text-purple-900">Usage</h2>
        <p className="text-sm leading-relaxed text-neutral-800">{p.usage}</p>
      </section>
    </div>
  );
}
