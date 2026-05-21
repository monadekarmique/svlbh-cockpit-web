// Endpoint /api/ping — utilisé par le panneau diagnostic pour mesurer RTT.
// Retour minimal pour mesure pure réseau (pas de DB, pas d'auth).
// DEC Patrick 2026-05-21 (brief v2 diagnostic).

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "edge"; // edge pour minimiser le warm-up time

export async function GET() {
  return NextResponse.json(
    { ok: true, t: Date.now() },
    { headers: { "Cache-Control": "no-store, no-cache, max-age=0" } },
  );
}
