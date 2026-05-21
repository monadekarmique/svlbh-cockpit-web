// Endpoint /api/diagnostic/log — POST des résultats du diagnostic dans
// audit_log via RPC log_audit_event (alias-proof acteur).
// DEC Patrick 2026-05-21 (brief v2 diagnostic).

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Metrics = {
  rtt_ms?: number | null;
  upload_mbps?: number | null;
  download_mbps?: number | null;
  nat_type?: string | null;
  browser?: string | null;
  h264_hw?: boolean | null;
  session_id?: string | null; // si lancé pendant une session active
  level_overall?: "GREEN" | "AMBER" | "RED";
};

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Metrics;

  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { error } = await sb.rpc("log_audit_event", {
    p_action: "DIAGNOSTIC",
    p_target_table: "support_session",
    p_target_row_id: body.session_id ?? null,
    p_payload: {
      metrics: {
        rtt_ms: body.rtt_ms ?? null,
        upload_mbps: body.upload_mbps ?? null,
        download_mbps: body.download_mbps ?? null,
        nat_type: body.nat_type ?? null,
        browser: body.browser ?? null,
        h264_hw: body.h264_hw ?? null,
      },
      level_overall: body.level_overall ?? null,
    },
    p_via: "cockpit-diagnostic",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
