// GET /hdom/panel.js — sert le moteur du panneau hDOM.
//
// Pourquoi une route et non `public/` : le fichier porte le vocabulaire gaté
// (les 15 Gui, les 33 chakras, les scores, la CIM-11 croisée MTC). Tout ce qui
// vit dans `public/` est servi sans authentification — inacceptable ici. La
// route applique donc le MÊME gate ST5+ que la page.

import { readFile } from "node:fs/promises";
import path from "node:path";
import { requireSt5Plus } from "@/lib/owner-gate";

export const dynamic = "force-dynamic";

export async function GET() {
  await requireSt5Plus();

  const src = path.join(process.cwd(), "src/app/(app)/hdom/_panel.source.js");
  const js = await readFile(src, "utf8");

  return new Response(js, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      // Jamais de cache partagé : la réponse dépend de l'identité.
      "Cache-Control": "private, no-store",
    },
  });
}
