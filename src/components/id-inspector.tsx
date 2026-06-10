"use client";

// Toggle ST6 « 🔢 IDs » dans le header du cockpit. Active/désactive l'affichage
// inline des id Supabase (via body[data-show-ids] + persistance localStorage).
// Gated ST6 au niveau du layout (rendu seulement si isOwner).

import { useEffect, useState } from "react";

export function IdInspectorToggle() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("svlbh_show_ids") === "1";
    setOn(saved);
    if (saved) document.body.dataset.showIds = "1";
  }, []);

  function toggle() {
    const next = !on;
    setOn(next);
    if (next) {
      document.body.dataset.showIds = "1";
      localStorage.setItem("svlbh_show_ids", "1");
    } else {
      delete document.body.dataset.showIds;
      localStorage.setItem("svlbh_show_ids", "0");
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={
        "rounded px-1.5 py-0.5 font-mono text-[10px] transition " +
        (on ? "bg-indigo-600 text-white" : "text-neutral-500 hover:bg-neutral-100")
      }
      title="ST6 — afficher les id Supabase des objets affichés"
      aria-pressed={on}
    >
      🔢 IDs
    </button>
  );
}
