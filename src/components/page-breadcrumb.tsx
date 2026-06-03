"use client";

// Doctrine cockpit — fil d'Ariane avec charte topnav Palette de Lumière
// (DEC Patrick 2026-06-03 v4 « structure du fil d'Ariane + charte topnav »).
//
// Structure : SVLBH Cockpit › <Module> › <Article> (chaque segment cliquable
// sauf le current) + build version + commit court à droite.
//
// Charte graphique (reprise de palette-de-lumiere-presentation.html .topnav) :
//   - Sticky top, fond crème translucide #F5EDE4 / blur 10px / sat 180%
//   - Border-bottom plum à 15%
//   - DM Sans 0.88rem pour les segments réguliers (var --font-dm-sans)
//   - Crimson Pro 700 1.05rem pour le root (segment SVLBH Cockpit)
//   - Liens couleur plum #8B3A62 bold 600, hover opacity .75
//
// Source des labels : COCKPIT_NAV (src/lib/cockpit-nav.ts).
// Pendant vanilla pour articles HTML statiques : public/article-chrome.js.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { COCKPIT_NAV } from "@/lib/cockpit-nav";

// Teinte bordeaux profond (DEC Patrick 2026-06-03 v6) — vrai vin rouge saturé,
// pas le plum #8B3A62 qui tirait vers le rose/violet.
const TOK = {
  cream: "rgba(245,237,228,.94)",
  bordeaux: "#7A0F26",
  bordeauxBorder: "rgba(122,15,38,.18)",
  inkSoft: "#5b4a6b",
} as const;

export function PageBreadcrumb({
  buildVersion,
  buildCommit,
}: {
  buildVersion: string;
  buildCommit: string;
}) {
  const pathname = usePathname() ?? "";
  const segments = pathname.split("/").filter(Boolean);

  type Item = {
    href: string;
    label: string;
    isCurrent: boolean;
    isRoot: boolean;
  };
  const items: Item[] = [];

  if (segments.length === 0 || segments[0] === "dashboard") {
    items.push({
      href: "/",
      label: "Cockpit",
      isCurrent: true,
      isRoot: true,
    });
  } else {
    items.push({
      href: "/",
      label: "Cockpit",
      isCurrent: false,
      isRoot: true,
    });
    let accumulated = "";
    segments.forEach((seg, i) => {
      accumulated += "/" + seg;
      const navMatch = COCKPIT_NAV.find((n) => n.href === accumulated);
      const label = navMatch?.label ?? humanize(seg);
      items.push({
        href: accumulated,
        label,
        isCurrent: i === segments.length - 1,
        isRoot: false,
      });
    });
  }

  const shortCommit =
    buildCommit && buildCommit !== "n/a" ? buildCommit.slice(0, 7) : "dev";

  return (
    <div
      className="flex items-center justify-between gap-4"
      style={{
        background: TOK.cream,
        WebkitBackdropFilter: "saturate(180%) blur(10px)",
        backdropFilter: "saturate(180%) blur(10px)",
        borderBottom: `1px solid ${TOK.bordeauxBorder}`,
        padding:
          "10px max(20px,env(safe-area-inset-right)) 10px max(20px,env(safe-area-inset-left))",
        fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
        fontSize: ".88rem",
      }}
    >
      <nav
        aria-label="Audit trail"
        className="flex min-w-0 flex-1 items-center gap-[.55em] overflow-x-auto"
      >
        {items.map((it, i) => (
          <span key={it.href} className="flex shrink-0 items-center gap-[.55em]">
            {i > 0 && (
              <span
                aria-hidden
                style={{ color: TOK.bordeauxBorder, fontSize: "1.1em" }}
                className="shrink-0"
              >
                ›
              </span>
            )}
            {it.isCurrent ? (
              <span
                aria-current="page"
                style={{
                  color: TOK.bordeaux,
                  ...(it.isRoot
                    ? {
                        fontFamily:
                          "var(--font-crimson-pro), Georgia, serif",
                        fontWeight: 700,
                        fontSize: "1.05rem",
                        letterSpacing: ".01em",
                      }
                    : { fontWeight: 600 }),
                }}
                className="shrink-0"
              >
                {it.label}
              </span>
            ) : (
              <Link
                href={it.href}
                style={{
                  color: TOK.bordeaux,
                  textDecoration: "none",
                  ...(it.isRoot
                    ? {
                        fontFamily:
                          "var(--font-crimson-pro), Georgia, serif",
                        fontWeight: 700,
                        fontSize: "1.05rem",
                        letterSpacing: ".01em",
                      }
                    : { fontWeight: 600 }),
                }}
                className="shrink-0 whitespace-nowrap transition-opacity hover:opacity-75"
              >
                {it.label}
              </Link>
            )}
          </span>
        ))}
      </nav>
      <span
        className="shrink-0 whitespace-nowrap font-mono"
        style={{
          fontSize: ".68rem",
          color: TOK.inkSoft,
          opacity: 0.7,
        }}
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
