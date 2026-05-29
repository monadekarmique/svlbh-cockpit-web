"use client";

// Auto-refresh des données serveur toutes les 15s pour limiter les
// conflits multi-utilisateur sur /shamanes. router.refresh() re-fetch
// les RSC sans wipe le state local (modales ouvertes, inputs en cours
// d'édition restent intacts). DEC Patrick 2026-05-29.

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function ShamanesAutoRefresh({ intervalMs = 15000 }: { intervalMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    let stopped = false;
    const id = window.setInterval(() => {
      if (stopped) return;
      // Ne refresh que si l'onglet est visible — économie de bande passante.
      if (document.visibilityState !== "visible") return;
      router.refresh();
    }, intervalMs);
    return () => {
      stopped = true;
      window.clearInterval(id);
    };
  }, [router, intervalMs]);
  return null;
}
