import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  // ⏱ [lenteur] chronométrage PROVISOIRE de /shamanes (28.10.2026), à retirer dès la mesure faite.
  const t0 = Date.now();
  const r = await updateSession(request);
  if (request.nextUrl.pathname.startsWith("/shamanes")) {
    console.log(`[lenteur /shamanes] proxy debut=${t0} ${request.method} session=${Date.now() - t0}`);
  }
  return r;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icons|robots.txt|llms.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
