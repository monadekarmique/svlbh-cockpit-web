"use client";

// Wrapper client qui orchestre TherapeutesDnDZones + TherapeuteCardClient.
// Page server passe les données brutes, le wrapper s'occupe du rendu DnD.
// DEC Patrick 2026-05-18.
// DEC Patrick 2026-05-20 — propagation dynamiquesByPraticienne pour chips.

import { TherapeutesDnDZones } from "./therapeutes-dnd-zones";
import type { DnDTherapeute } from "./therapeutes-dnd-zones";
import { TherapeuteCardClient } from "./therapeute-card-client";
import type { DynamiquesByPraticienne } from "@/lib/cercle/dynamiques";

export function TherapeutesDnDZonesWrapper({
  therapeutes,
  mySvlbhId,
  isOwner,
  dynamiquesByPraticienne,
}: {
  therapeutes: DnDTherapeute[];
  mySvlbhId?: string;
  isOwner: boolean;
  dynamiquesByPraticienne?: DynamiquesByPraticienne;
}) {
  return (
    <TherapeutesDnDZones
      initial={therapeutes}
      mySvlbhId={mySvlbhId}
      isOwner={isOwner}
      renderCard={(t, { isMe }) => (
        <TherapeuteCardClient
          t={t}
          isMe={isMe}
          isOwner={isOwner}
          dynamiques={dynamiquesByPraticienne?.[t.svlbh_id] ?? []}
        />
      )}
    />
  );
}
