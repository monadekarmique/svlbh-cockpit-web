// GET /api/clear-cookies — issue de secours Apple Sign-In (DEC Patrick 2026-07-08).
// Purge les cookies sb-* de TOUS les périmètres possibles (host-only, .svlbh.com,
// apex, host courant). Multi-Set-Cookie via headers.append : ResponseCookies est
// name-keyed, un set en boucle n export quun scope par nom (leçon handoff #18).
import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const host = req.headers.get("host") ?? req.nextUrl.host;
  const domainsToExpire: (string | undefined)[] = [undefined, ".svlbh.com", "svlbh.com", host];
  const cleared: string[] = [];
  const setCookies: string[] = [];
  for (const c of req.cookies.getAll()) {
    if (!c.name.startsWith("sb-")) continue;
    cleared.push(c.name);
    for (const domain of domainsToExpire) {
      setCookies.push(
        `${c.name}=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT${domain ? `; Domain=${domain}` : ""}`,
      );
    }
  }
  const res = NextResponse.json({ ok: true, cleared });
  for (const h of setCookies) res.headers.append("Set-Cookie", h);
  return res;
}
