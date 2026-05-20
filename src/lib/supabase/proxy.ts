import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// DEC Patrick 2026-05-12 — SSO entre sous-domaines svlbh.com (cf. client.ts).
const COOKIE_DOMAIN = process.env.NEXT_PUBLIC_COOKIE_DOMAIN;

/**
 * Valide un Bearer reader token via RPC validate_reader_token (Supabase).
 * Permet aux Claude Code distants d'accéder aux pages whitelistées.
 * DEC Patrick 2026-05-20 — port depuis svlbh-pro-web.
 */
async function validateBearerReader(
  request: NextRequest,
  pathname: string,
): Promise<string | null> {
  const auth = request.headers.get("authorization") || "";
  const match = auth.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  const token = match[1].trim();
  if (!token || token.length < 20) return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;

  try {
    const res = await fetch(`${url}/rest/v1/rpc/validate_reader_token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: anon,
        Authorization: `Bearer ${anon}`,
      },
      body: JSON.stringify({ p_token: token, p_path: pathname }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (typeof data === "string" && data.length > 0) return data;
    return null;
  } catch {
    return null;
  }
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, {
              ...options,
              ...(COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : {}),
            }),
          );
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublic =
    pathname.startsWith("/login") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/access-denied") ||
    pathname.startsWith("/offline") ||
    pathname.startsWith("/claim") || // Universal Link target Pro 1 — ne pas auth-gate
    pathname.startsWith("/.well-known/") || // AASA Universal Links
    pathname === "/";

  if (!user && !isPublic) {
    // Bearer reader bypass — multi-instances IA (DEC Patrick 2026-05-20)
    const readerSvlbhId = await validateBearerReader(request, pathname);
    if (readerSvlbhId) {
      const fwd = new Headers(request.headers);
      fwd.set("x-svlbh-bearer-reader", readerSvlbhId);
      const bearerResponse = NextResponse.next({ request: { headers: fwd } });
      bearerResponse.headers.set("x-svlbh-bearer-reader", readerSvlbhId);
      return bearerResponse;
    }

    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return response;
}
