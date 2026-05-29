"use client";

// Wrapper client qui orchestre TherapeutesDnDZones + TherapeuteCardClient.
// Page server passe les données brutes, le wrapper s'occupe du rendu DnD.
// DEC Patrick 2026-05-18.
// DEC Patrick 2026-05-20 — propagation dynamiquesByPraticienne pour chips.

import { TherapeutesDnDZones } from "./therapeutes-dnd-zones";
import type { DnDTherapeute } from "./therapeutes-dnd-zones";
import { TherapeuteCardClient } from "./therapeute-card-client";
import type { DynamiquesByPraticienne } from "@/lib/cercle/dynamiques";
import type { AkashiqueMembership, Dhatu, DhatuMeta } from "@/lib/cercle/akashiques";
import type { DesaAtom, DesaCapacities } from "@/lib/cercle/desa";

export function TherapeutesDnDZonesWrapper({
  therapeutes,
  mySvlbhId,
  isOwner,
  dynamiquesByPraticienne,
  dhatuByPraticienne,
  dhatuMeta,
  desaCatalog,
  desaByPraticienne,
}: {
  therapeutes: DnDTherapeute[];
  mySvlbhId?: string;
  isOwner: boolean;
  dynamiquesByPraticienne?: DynamiquesByPraticienne;
  dhatuByPraticienne?: Record<string, AkashiqueMembership>;
  dhatuMeta: Record<Dhatu, DhatuMeta>;
  desaCatalog: Record<string, DesaAtom>;
  desaByPraticienne: Record<string, DesaCapacities>;
}) {
  return (
    <TherapeutesDnDZones
      initial={therapeutes}
      mySvlbhId={mySvlbhId}
      isOwner={isOwner}
      renderCard={(t, { isMe, bumpGL }) => (
        <TherapeuteCardClient
          t={t}
          isMe={isMe}
          isOwner={isOwner}
          dynamiques={dynamiquesByPraticienne?.[t.svlbh_id] ?? []}
          membership={dhatuByPraticienne?.[t.svlbh_id] ?? null}
          dhatuMeta={dhatuMeta}
          desaCatalog={desaCatalog}
          desaCapacities={desaByPraticienne[t.svlbh_id] ?? []}
          bumpGL={bumpGL}
        />
      )}
    />
  );
}
