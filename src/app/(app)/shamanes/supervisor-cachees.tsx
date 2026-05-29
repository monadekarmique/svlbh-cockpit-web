"use client";

// Composant client embarqué sous une carte virtuelle superviseur : compteur
// "🫥 Cachées · N" click-to-edit + boutons +/- + liste de mini-cards.
// Même mécanique que sur les cartes thérapeute / apprenante, mais
// indépendant pour permettre l'héberger sur des cartes virtuelles
// (host_svlbh_id = UUIDv5 synthétique propre à chaque rôle superviseur).
// DEC Patrick 2026-05-29 : déplacement du mécanisme depuis la carte
// thérapeute Patrick vers la carte Superviseur méthodologique familial.

import { useState } from "react";
import type { DesaAtom } from "@/lib/cercle/desa";
import {
  addApprenanteCachee,
  removeApprenanteCachee,
  setApprenanteCacheeCount,
} from "./apprenante-cachee-action";
import { ApprenanteCacheeCard, type CacheeData } from "./apprenante-cachee-card";

export function SupervisorCachees({
  hostSvlbhId,
  hostLabel,
  cachees,
  canWrite,
  desaCatalog,
}: {
  hostSvlbhId: string;
  hostLabel: string;
  cachees: CacheeData[];
  canWrite: boolean;
  desaCatalog: Record<string, DesaAtom>;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="mt-2 w-full">
      <div className="flex items-center gap-1">
        {canWrite && cachees.length > 0 ? (
          <form action={removeApprenanteCachee}>
            <input type="hidden" name="id" value={cachees[cachees.length - 1].id} />
            <button
              type="submit"
              className="flex h-5 w-5 items-center justify-center rounded border border-neutral-300 bg-white text-neutral-600 transition hover:bg-rose-50 hover:text-rose-600"
              title="Retirer la dernière cachée"
            >
              −
            </button>
          </form>
        ) : null}
        {canWrite && editing ? (
          <form
            action={setApprenanteCacheeCount}
            onSubmit={() => setEditing(false)}
          >
            <input type="hidden" name="host_svlbh_id" value={hostSvlbhId} />
            <input
              type="number"
              name="count"
              defaultValue={cachees.length}
              min={0}
              autoFocus
              onFocus={(e) => e.currentTarget.select()}
              onBlur={(e) => e.currentTarget.form?.requestSubmit()}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  e.currentTarget.form?.requestSubmit();
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  setEditing(false);
                }
              }}
              className="w-16 rounded-full bg-neutral-100 px-2 py-0.5 text-center font-mono text-[11px] font-bold text-neutral-900 ring-1 ring-neutral-400 focus:outline-none focus:ring-2"
            />
            <button type="submit" className="sr-only" tabIndex={-1}>
              Sauver
            </button>
          </form>
        ) : canWrite ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-full bg-neutral-100 px-2 py-0.5 font-mono text-[11px] font-bold text-neutral-700 transition hover:ring-2 hover:ring-neutral-300"
            title="Cliquer pour saisir un nombre exact de cachées"
          >
            🫥 Cachées · {cachees.length}
          </button>
        ) : (
          <span className="rounded-full bg-neutral-100 px-2 py-0.5 font-mono text-[11px] font-bold text-neutral-700">
            🫥 Cachées · {cachees.length}
          </span>
        )}
        {canWrite ? (
          <form action={addApprenanteCachee}>
            <input type="hidden" name="host_svlbh_id" value={hostSvlbhId} />
            <button
              type="submit"
              className="flex h-5 w-5 items-center justify-center rounded border border-neutral-300 bg-white text-neutral-700 transition hover:bg-neutral-50"
              title="Ajouter une cachée"
            >
              +
            </button>
          </form>
        ) : null}
      </div>
      {cachees.length > 0 ? (
        <div className="mt-1 flex flex-col gap-1">
          {cachees.map((c) => (
            <ApprenanteCacheeCard
              key={c.id}
              cachee={c}
              hostName={hostLabel}
              desaCatalog={desaCatalog}
              canWrite={canWrite}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
