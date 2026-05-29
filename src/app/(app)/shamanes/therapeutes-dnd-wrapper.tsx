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
import type { DesaAtom, DesaState } from "@/lib/cercle/desa";
import type { CacheeData } from "./apprenante-cachee-card";

export function TherapeutesDnDZonesWrapper({
  therapeutes,
  mySvlbhId,
  isOwner,
  dynamiquesByPraticienne,
  dhatuByPraticienne,
  dhatuMeta,
  desaCatalog,
  desaStateByPraticienne,
  nsbFollowersByName,
  cacheesByHost,
  canWriteCachees,
}: {
  therapeutes: DnDTherapeute[];
  mySvlbhId?: string;
  isOwner: boolean;
  dynamiquesByPraticienne?: DynamiquesByPraticienne;
  dhatuByPraticienne?: Record<string, AkashiqueMembership>;
  dhatuMeta: Record<Dhatu, DhatuMeta>;
  desaCatalog: Record<string, DesaAtom>;
  desaStateByPraticienne: Record<string, DesaState>;
  nsbFollowersByName: Record<string, Array<{ name: string; cercle?: string }>>;
  cacheesByHost: Record<string, CacheeData[]>;
  canWriteCachees: boolean;
}) {
  return (
    <TherapeutesDnDZones
      initial={therapeutes}
      mySvlbhId={mySvlbhId}
      isOwner={isOwner}
      renderCard={(t, { isMe, bumpGL }) => {
        const state = desaStateByPraticienne[t.svlbh_id];
        const fullName = `${t.first_name ?? ""} ${t.last_name ?? ""}`.trim();
        return (
          <TherapeuteCardClient
            t={t}
            isMe={isMe}
            isOwner={isOwner}
            dynamiques={dynamiquesByPraticienne?.[t.svlbh_id] ?? []}
            membership={dhatuByPraticienne?.[t.svlbh_id] ?? null}
            dhatuMeta={dhatuMeta}
            desaCatalog={desaCatalog}
            desaGranted={state?.granted ?? []}
            desaKarmic={state?.karmic ?? []}
            nsbFollowers={nsbFollowersByName[fullName] ?? []}
            bumpGL={bumpGL}
            cachees={cacheesByHost[t.svlbh_id] ?? []}
            canWriteCachees={canWriteCachees}
          />
        );
      }}
    />
  );
}
