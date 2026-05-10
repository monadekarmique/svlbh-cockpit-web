"use client";

// Checkbox client avec optimistic update — DEC Patrick 2026-05-10.
// Le tick visuel apparait immédiatement au clic (state local), la sync DB se
// fait en background via la server action toggleAttachment. Si l'action
// échoue, on revert le state.

import { useState, useTransition } from "react";
import { toggleAttachment } from "./parcours-actions";

export function AttachCheckbox({
  parcoursCleId,
  certifieeId,
  initialAttached,
}: {
  parcoursCleId: string;
  certifieeId: string;
  initialAttached: boolean;
}) {
  const [attached, setAttached] = useState(initialAttached);
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      aria-label={attached ? "Détacher" : "Attacher"}
      disabled={pending}
      onClick={() => {
        const next = !attached;
        setAttached(next); // optimistic update — tick visuel instantané
        startTransition(async () => {
          const fd = new FormData();
          fd.append("parcoursCleId", parcoursCleId);
          fd.append("certifieeId", certifieeId);
          try {
            await toggleAttachment(fd);
          } catch {
            setAttached(!next); // revert sur erreur
          }
        });
      }}
      className="flex h-5 w-5 items-center justify-center rounded border-2 transition-colors disabled:opacity-60"
      style={{
        borderColor: attached ? "#2B5EA7" : "#D4D4D4",
        backgroundColor: attached ? "#2B5EA7" : "transparent",
      }}
    >
      {attached ? (
        <span className="text-[10px] font-bold text-white">✓</span>
      ) : null}
    </button>
  );
}
