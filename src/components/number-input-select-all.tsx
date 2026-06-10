"use client";

// Standard VLBH (DEC Patrick 2026-06-10) : sur tous nos sites, cliquer/focus
// un champ nombre sélectionne tout le nombre → on tape pour le remplacer.
// Monté une fois dans le layout racine ; couvre tous les <input type="number">
// existants ET futurs via un écouteur global focusin (pas de prop par champ).

import { useEffect } from "react";

export function NumberInputSelectAll() {
  useEffect(() => {
    const handler = (e: FocusEvent) => {
      const t = e.target as HTMLElement | null;
      if (t instanceof HTMLInputElement && t.type === "number") {
        // setTimeout 0 : laisse le focus s'établir avant de sélectionner.
        setTimeout(() => {
          try {
            t.select();
          } catch {
            /* certains navigateurs refusent select() sur number — ignoré */
          }
        }, 0);
      }
    };
    document.addEventListener("focusin", handler);
    return () => document.removeEventListener("focusin", handler);
  }, []);
  return null;
}
