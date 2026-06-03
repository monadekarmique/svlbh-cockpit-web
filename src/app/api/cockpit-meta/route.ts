// Endpoint meta consommé par /article-chrome.js (snippet injecté dans les
// articles HTML statiques). Retourne version + commit + nav.
//
// La nav est exposée allégée (href + label) — le snippet l'utilise pour
// résoudre les segments d'URL en labels humains équivalents au composant
// React PageBreadcrumb (src/components/page-breadcrumb.tsx).
//
// DEC Patrick 2026-06-03 — doctrine articles HTML.

import { NextResponse } from "next/server";
import { COCKPIT_NAV } from "@/lib/cockpit-nav";
import { version } from "../../../../package.json";

export const dynamic = "force-static";
export const revalidate = 300; // 5 min

export async function GET() {
  return NextResponse.json(
    {
      version,
      commit: process.env.RENDER_GIT_COMMIT?.slice(0, 7) ?? "dev",
      nav: COCKPIT_NAV.map((n) => ({ href: n.href, label: n.label })),
    },
    {
      headers: {
        "Cache-Control": "public, max-age=300, s-maxage=300",
      },
    },
  );
}
