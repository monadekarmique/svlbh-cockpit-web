// Endpoint /api/speedtest/up — mesure upload bandwidth.
// Le client envoie un blob de taille connue (≥ 1 MB), on retourne taille reçue.
// DEC Patrick 2026-05-21 (brief v2 diagnostic).

import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "edge";

export async function POST(req: NextRequest) {
  const startTs = Date.now();
  const buf = await req.arrayBuffer();
  const bytes = buf.byteLength;
  const elapsedMs = Date.now() - startTs;
  return NextResponse.json(
    { ok: true, bytes, elapsed_ms: elapsedMs },
    { headers: { "Cache-Control": "no-store, no-cache, max-age=0" } },
  );
}
