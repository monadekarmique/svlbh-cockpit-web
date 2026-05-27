"use client";

import { useEffect, useRef, useState } from "react";

/** Email cliquable → menu déroulant avec Déconnexion.
 *  Remplace le bouton Déconnexion permanent dans la nav. */
export function UserMenu({ email }: { email?: string | null }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Compte"
        className="max-w-[12rem] truncate text-neutral-500 hover:text-neutral-900"
      >
        {email ?? "Compte"}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-1 min-w-[10rem] rounded-md border border-neutral-200 bg-white py-1 shadow-lg"
        >
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              role="menuitem"
              className="block w-full px-3 py-1.5 text-left text-sm text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900"
            >
              Déconnexion
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
