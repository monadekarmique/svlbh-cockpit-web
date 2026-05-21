"use server";

// Audit log MASK_START / MASK_END pour le bouton « Masquer temporairement »
// (Addendum v3 brief cobrowsing). DEC Patrick 2026-05-21.

import { createClient } from "@/lib/supabase/server";

export async function logMaskStart({ sessionId }: { sessionId: string }) {
  const sb = await createClient();
  await sb.rpc("log_audit_event", {
    p_action: "MASK_START",
    p_target_table: "support_session",
    p_target_row_id: sessionId,
    p_payload: { event: "screen_masked_started" },
    p_via: "cockpit-support-mask",
  });
}

export async function logMaskEnd({
  sessionId,
  durationSeconds,
}: {
  sessionId: string;
  durationSeconds: number;
}) {
  const sb = await createClient();
  await sb.rpc("log_audit_event", {
    p_action: "MASK_END",
    p_target_table: "support_session",
    p_target_row_id: sessionId,
    p_payload: {
      event: "screen_masked_ended",
      duration_seconds: durationSeconds,
    },
    p_via: "cockpit-support-mask",
  });
}
