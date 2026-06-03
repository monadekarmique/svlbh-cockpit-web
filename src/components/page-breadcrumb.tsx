"use client";

// Doctrine cockpit — fil d'Ariane posé dans le flow du contenu (DEC Patrick
// 2026-06-03, v2 « fil d'Ariane posé dans le contenu »).
//
// Style fil d'Ariane Notion/Linear : pas de bande séparée, pas de fond, pas de
// border. Le breadcrumb se pose sur le gradient bleuté de la page, comme s'il
// faisait partie du contenu. Le build flotte top-right.
//
//   - GAUCHE : audit trail actionnable depuis usePathname(). Labels résolus
//     via COCKPIT_NAV quand l'URL matche un module, sinon humanisation du slug.
//   - DROITE : build version + commit court.
//
// Pendant vanilla pour les articles HTML statiques : public/article-chrome.js.

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

  const shortCommit =
    buildCommit && buildCommit !== "n/a" ? buildCommit.slice(0, 7) : "dev";

  return (
    <div
      className="mx-auto flex max-w-6xl items-center justify-between gap-4 pt-4 pb-1 text-xs"
      style={{
        paddingLeft: "max(1rem, env(safe-area-inset-left))",
        paddingRight: "max(1rem, env(safe-area-inset-right))",
      }}
    >
      <nav
        aria-label="Audit trail"
        className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto text-neutral-500"
      >
        {items.map((it, i) => (
          <span key={it.href} className="flex shrink-0 items-center gap-1.5">
            {i > 0 && (
              <span className="text-neutral-400/70" aria-hidden>
                ›
              </span>
            )}
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
                className="-mx-1 rounded px-1 hover:bg-white/50 hover:text-neutral-900"
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
  );
}

/** Slug → label humain : strip `.html`, strip suffixe `-vX.Y.Z`, tirets → espaces, capitalize. */
function humanize(slug: string): string {
  let s = slug.replace(/\.html?$/i, "");
  s = s.replace(/-v\d+(\.\d+)*$/i, "");
  s = s.replace(/[-_]/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}
