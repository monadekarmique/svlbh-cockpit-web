import { headers } from "next/headers";
import type { NextRequest } from "next/server";

/**
 * Resolve the public origin behind a reverse proxy (Render, Cloudflare).
 * `request.url` reflects the upstream URL (e.g. http://localhost:10000) and
 * cannot be used to build user-facing redirects.
 */
export async function getPublicOrigin(request: NextRequest): Promise<string> {
  const h = await headers();
  const forwardedHost = h.get("x-forwarded-host") ?? h.get("host");
  const forwardedProto = h.get("x-forwarded-proto") ?? "https";
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }
  return new URL(request.url).origin;
}
