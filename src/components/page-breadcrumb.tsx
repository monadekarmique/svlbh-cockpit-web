"use client";

// Doctrine cockpit — unité de chrome de page (DEC Patrick 2026-06-03).
// Toutes les pages sous le menu nav cockpit affichent en haut :
//   - GAUCHE : audit trail (breadcrumb) actionnable — chaque niveau cliquable
//     pour remonter d'un cran. Permet à Patrick de visualiser d'un coup d'œil
//     où il se trouve et de remonter au niveau supérieur.
//   - DROITE : numéro du build (version + commit court) — pour vérifier la
//     version déployée sans avoir à fouiller le menu nav.
//
// Limitation connue : les articles HTML statiques (public/*.html) ne passent
// PAS par ce composant. À traiter séparément (conversion en route Next ou
// snippet JS injecté dans chaque article).
//
// Source des labels : COCKPIT_NAV (source unique de vérité de la nav).
// Pour les segments hors nav (sous-pages d'un module), on humanise le slug.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { COCKPIT_NAV } from "@/lib/cockpit-nav";

export function PageBreadcrumb({
  buildVersion,
  buildCommit,
}: {
  buildVersion: string;
  buildCommit: string;
}) {
  const pathname = usePathname() ?? "";
  const segments = pathname.split("/").filter(Boolean);

  // Dashboard est toujours la racine cliquable du breadcrumb.
  const items: { href: string; label: string; isCurrent: boolean }[] = [];

  if (segments.length === 0 || segments[0] === "dashboard") {
    items.push({ href: "/dashboard", label: "Dashboard", isCurrent: true });
  } else {
    items.push({ href: "/dashboard", label: "Dashboard", isCurrent: false });
    let accumulated = "";
    segments.forEach((seg, i) => {
      accumulated += "/" + seg;
      const navMatch = COCKPIT_NAV.find((n) => n.href === accumulated);
      const label = navMatch?.label ?? humanize(seg);
      items.push({
        href: accumulated,
        label,
        isCurrent: i === segments.length - 1,
      });
    });
  }

  const shortCommit = buildCommit && buildCommit !== "n/a"
    ? buildCommit.slice(0, 7)
    : "dev";

  return (
    <div
      className="border-b border-neutral-200/70 bg-white/60 backdrop-blur"
      style={{
        paddingLeft: "max(1rem, env(safe-area-inset-left))",
        paddingRight: "max(1rem, env(safe-area-inset-right))",
      }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 py-2 text-xs">
        <nav
          aria-label="Audit trail"
          className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto text-neutral-500"
        >
          {items.map((it, i) => (
            <span key={it.href} className="flex shrink-0 items-center gap-1.5">
              {i > 0 && <span className="text-neutral-300">›</span>}
              {it.isCurrent ? (
                <span
                  aria-current="page"
                  className="font-semibold text-neutral-800"
                >
                  {it.label}
                </span>
              ) : (
                <Link
                  href={it.href}
                  className="rounded px-1 -mx-1 hover:bg-neutral-100 hover:text-neutral-900"
                >
                  {it.label}
                </Link>
              )}
            </span>
          ))}
        </nav>
        <span
          className="shrink-0 font-mono text-[10px] text-neutral-400"
          title={`build ${buildVersion} · commit ${buildCommit || "n/a"}`}
        >
          build {buildVersion} · {shortCommit}
        </span>
      </div>
    </div>
  );
}

/** Slug → label humain : strip `.html`, strip suffixe `-vX.Y.Z`, tirets → espaces, capitalize. */
function humanize(slug: string): string {
  let s = slug.replace(/\.html?$/i, "");
  s = s.replace(/-v\d+(\.\d+)*$/i, "");
  s = s.replace(/[-_]/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}
