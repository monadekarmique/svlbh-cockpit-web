"use client";

// Hook subscribe sur UPDATE postgres_changes de support_session.
// Sender + Receiver l'utilisent pour détecter qu'un côté a fermé la session
// et se mettre à jour eux-mêmes (sync 2 côtés).
// DEC Patrick 2026-05-21 — fix désynchro.

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type SessionStatus = "PENDING" | "ACTIVE" | "ENDED" | "EXPIRED";

export function useSupportSessionStatus({
  sessionId,
  initialStatus,
}: {
  sessionId: string;
  initialStatus: SessionStatus | string;
}): SessionStatus {
  const [status, setStatus] = useState<SessionStatus>(initialStatus as SessionStatus);

  useEffect(() => {
    if (!sessionId) return;
    const sb = createClient();
    const channel = sb
      .channel(`support-session-status-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "support_session",
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          const newStatus = (payload.new as { status?: string })?.status;
          if (newStatus) setStatus(newStatus as SessionStatus);
        },
      )
      .subscribe();

    return () => {
      void sb.removeChannel(channel);
    };
  }, [sessionId]);

  return status;
}
