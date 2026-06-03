// Dettes AkaKarm — Articles. Section qui agrège les lectures, audits et
// outils en lien avec les dettes akakarmiques. DEC Patrick 2026-06-03.
//
// Stratégie de "port depuis SVLBH Routines Cercle Lum" (DEC Patrick) :
//   1) Lien externe vers la palette priv.svlbh.com (Option 4) — actif.
//   2) Article HTML descriptif sur la palette (Option 3) — actif.
//   3) Port natif SwiftUI → React de PDLPaletteView (Option 2) — à venir.

export const dynamic = "force-dynamic";

type ItemKind = "external" | "doc" | "internal";
type Item = {
  href: string;
  label: string;
  context?: string;
  source?: string;
  kind: ItemKind;
  /** target=_blank si true */
  external?: boolean;
};

const ITEMS: Item[] = [
  // (1) Lien externe vers la palette priv.svlbh.com — fidèle 1:1 à
  // l'expérience web existante (hexagones · color picker · harmony ·
  // gradient ancestral · 20 swatches d'accumulation).
  {
    href: "https://priv.svlbh.com/palette",
    label: "Palette de Lumière — priv.svlbh.com",
    context:
      "Lien externe vers la palette interactive complète sur priv.svlbh.com",
    source: "priv.svlbh.com/palette",
    kind: "external",
    external: true,
  },
  // (2) Article HTML descriptif sur la palette — recueil de référence
  // (origine, symbolique, mode d'emploi). Publié comme HTML standalone.
  {
    href: "/dettes-akakarm-docs/palette-de-lumiere-presentation.html",
    label:
      "La Palette de Lumière — présentation, symbolique & mode d'emploi",
    context:
      "Article de référence sur la palette portée depuis l'app SVLBH Routines Cercle Lum",
    source: "palette-de-lumiere-presentation.html",
    kind: "doc",
  },
];

export default function DettesAkaKarmArticlesPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-4 px-4 py-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">
          Dettes AkaKarm — Articles
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          Lectures, audits et outils en lien avec les dettes akakarmiques.
          Port progressif depuis l'app native SVLBH Routines Cercle Lum.
        </p>
      </header>

      <ul className="space-y-2">
        {ITEMS.map((item) => {
          const isExternal = item.external === true;
          const badge =
            item.kind === "external"
              ? { text: "EXT", bg: "bg-fuchsia-100", fg: "text-fuchsia-900" }
              : item.kind === "doc"
                ? { text: "HTML", bg: "bg-amber-100", fg: "text-amber-900" }
                : { text: "WEB", bg: "bg-blue-100", fg: "text-blue-900" };
          const icon =
            item.kind === "external"
              ? "↗"
              : item.kind === "doc"
                ? "📄"
                : "🎨";
          return (
            <li key={item.href}>
              <a
                href={item.href}
                target={isExternal || item.kind === "doc" ? "_blank" : undefined}
                rel={
                  isExternal || item.kind === "doc"
                    ? "noopener noreferrer"
                    : undefined
                }
                className="flex items-center justify-between gap-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:border-fuchsia-300 hover:bg-fuchsia-50/40 active:scale-[0.99]"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span aria-hidden className="text-fuchsia-700">
                      {icon}
                    </span>
                    <span className="font-semibold text-neutral-900">
                      {item.label}
                    </span>
                  </div>
                  {item.context ? (
                    <p className="text-xs text-neutral-600">{item.context}</p>
                  ) : null}
                  {item.source ? (
                    <p className="truncate text-[11px] text-neutral-400">
                      {item.source}
                    </p>
                  ) : null}
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${badge.bg} ${badge.fg}`}
                >
                  {badge.text}
                </span>
              </a>
            </li>
          );
        })}
      </ul>

      <p className="rounded-md border border-dashed border-neutral-300 bg-neutral-50 p-3 text-xs text-neutral-500">
        Port natif <code>PDLPaletteView.swift</code> → React (cockpit
        natif, sans dépendre de priv.svlbh.com) : prévu — voir
        <code> /dettes-akakarm-articles/palette </code> (à venir).
      </p>
    </main>
  );
}
