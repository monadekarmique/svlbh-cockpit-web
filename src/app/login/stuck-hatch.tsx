"use client";
// Issue de secours documentée dans le menu de connexion (DEC Patrick 2026-07-08,
// enquête Apple Sign-In). Quand la connexion « patine » (retour login après la
// fenêtre Apple/Google), un clic purge les cookies sb-* obsolètes de TOUS les
// périmètres (/api/clear-cookies, réécrit en multi-Set-Cookie fonctionnel) et
// recharge — la boucle permanente redevient une panne d'une seconde.
import { useState } from "react";

export function StuckHatch() {
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);

  async function clearAndReload() {
    setBusy(true);
    try {
      await fetch("/api/clear-cookies", { cache: "no-store" });
    } catch {
      /* best-effort */
    }
    // Recharge propre vers le login (sans le ?error qui a pu s'accumuler).
    window.location.replace("/login");
  }

  return (
    <details
      open={open}
      onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
      className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-500"
    >
      <summary className="cursor-pointer text-center font-medium text-neutral-600">
        La connexion tourne en rond ?
      </summary>
      <p className="mt-2 leading-relaxed">
        Si tu reviens sur cette page après t&rsquo;être connectée, un ancien
        cookie est peut-être resté coincé. Un clic nettoie et tu peux réessayer :
      </p>
      <button
        onClick={() => void clearAndReload()}
        disabled={busy}
        className="mt-2 w-full rounded-lg bg-neutral-900 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
      >
        {busy ? "Nettoyage…" : "🧹 Nettoyer et réessayer"}
      </button>
      <p className="mt-2 text-[11px] text-neutral-400">
        Toujours bloquée ? Écris-nous sur WhatsApp — on t&rsquo;envoie un lien
        d&rsquo;accès direct, sans mot de passe.
      </p>
    </details>
  );
}
