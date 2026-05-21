// Endpoint /api/speedtest/down — sert 5 MB pour mesure download bandwidth.
// Génère des octets non-compressibles (random-like) pour éviter compression CDN.
// DEC Patrick 2026-05-21 (brief v2 diagnostic).

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "edge";

const SIZE_MB = 5;
const SIZE_BYTES = SIZE_MB * 1024 * 1024;

// Bloc de 64 KB pseudo-aléatoire (généré au module load, donc stable per instance
// mais non-compressible côté CDN — entropie maximale).
const CHUNK_SIZE = 64 * 1024;
function makeChunk(): Uint8Array {
  const buf = new Uint8Array(CHUNK_SIZE);
  for (let i = 0; i < CHUNK_SIZE; i++) {
    buf[i] = Math.floor(Math.random() * 256);
  }
  return buf;
}

export async function GET() {
  const stream = new ReadableStream({
    start(controller) {
      let written = 0;
      const chunk = makeChunk();
      while (written < SIZE_BYTES) {
        const remaining = SIZE_BYTES - written;
        if (remaining < CHUNK_SIZE) {
          controller.enqueue(chunk.slice(0, remaining));
          written += remaining;
        } else {
          controller.enqueue(chunk);
          written += CHUNK_SIZE;
        }
      }
      controller.close();
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Length": String(SIZE_BYTES),
      "Cache-Control": "no-store, no-cache, max-age=0",
    },
  });
}
