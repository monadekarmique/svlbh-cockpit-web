import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPublicOrigin } from "@/lib/origin";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const origin = await getPublicOrigin(request);

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Rang 6 (enquête Apple Sign-In 2026-07-08) : préserver la destination sur échec.
  const nextParam = next && next !== "/dashboard" ? `&next=${encodeURIComponent(next)}` : "";
  return NextResponse.redirect(`${origin}/login?error=auth_callback${nextParam}`);
}
