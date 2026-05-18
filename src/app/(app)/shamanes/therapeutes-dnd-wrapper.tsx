"use client";

// Wrapper client qui orchestre TherapeutesDnDZones + TherapeuteCardClient.
// Page server passe les données brutes, le wrapper s'occupe du rendu DnD.
// DEC Patrick 2026-05-18.

import { TherapeutesDnDZones } from "./therapeutes-dnd-zones";
import type { DnDTherapeute } from "./therapeutes-dnd-zones";
import { TherapeuteCardClient } from "./therapeute-card-client";

export function TherapeutesDnDZonesWrapper({
  therapeutes,
  mySvlbhId,
  isOwner,
}: {
  therapeutes: DnDTherapeute[];
  mySvlbhId?: string;
  isOwner: boolean;
}) {
  return (
    <TherapeutesDnDZones
      initial={therapeutes}
      mySvlbhId={mySvlbhId}
      isOwner={isOwner}
      renderCard={(t, { isMe }) => (
        <TherapeuteCardClient t={t} isMe={isMe} isOwner={isOwner} />
      )}
    />
  );
}
