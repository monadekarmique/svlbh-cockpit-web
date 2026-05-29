"use client";

// Mini-card "Apprenante cachée sur {host}" — sub-card éditable hébergée
// par une carte thérapeute. DESA + BDEC + rôle éditable. Visible aux
// membres du Cercle SR et à l'Owner. DEC Patrick 2026-05-29.

import { useState } from "react";
import type { DesaAtom } from "@/lib/cercle/desa";
import { DesaEditModal } from "./desa-edit-modal";
import { BdecGisantsModal } from "./bdec-gisants-modal";
import { removeApprenanteCachee, setApprenanteCacheeRole } from "./apprenante-cachee-action";

export type CacheeData = {
  id: string;
  svlbh_id: string;
  role: string | null;
  desa_granted: string[];
  desa_karmic: string[];
};

export function ApprenanteCacheeCard({
  cachee,
  hostName,
  desaCatalog,
  canWrite,
}: {
  cachee: CacheeData;
  hostName: string;
  desaCatalog: Record<string, DesaAtom>;
  canWrite: boolean;
}) {
  const [desaOpen, setDesaOpen] = useState(false);
  const [bdecOpen, setBdecOpen] = useState(false);

  const bdecCodes = new Set(
    Object.values(desaCatalog).filter((c) => c.system === "BDEC").map((c) => c.code),
  );
  const desaKarmic = cachee.desa_karmic.filter((c) => !bdecCodes.has(c));
  const bdecKarmic = cachee.desa_karmic.filter((c) => bdecCodes.has(c));

  return (
    <div className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50/60 p-2 text-[11px]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="break-words font-semibold text-neutral-700">
            🫥 Apprenante cachée sur {hostName}
          </p>
          {canWrite ? (
            <form
              action={setApprenanteCacheeRole}
              className="mt-1 flex items-center gap-1"
            >
              <input type="hidden" name="id" value={cachee.id} />
              <input
                type="text"
                name="role"
                defaultValue={cachee.role ?? ""}
                onFocus={(e) => e.currentTarget.select()}
                onBlur={(e) => {
                  // Sauve uniquement si la valeur a changé pour éviter les
                  // submits inutiles à chaque blur.
                  if (e.currentTarget.value !== (cachee.role ?? "")) {
                    e.currentTarget.form?.requestSubmit();
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    e.currentTarget.form?.requestSubmit();
                  }
                }}
                className="w-full min-w-0 rounded border border-neutral-300 bg-white px-1.5 py-0.5 text-[10px] text-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="✏️ Rôle (Enter pour sauver)"
              />
              <button type="submit" className="sr-only" tabIndex={-1}>
                Sauver
              </button>
            </form>
          ) : (
            <p className="mt-0.5 break-words text-[10px] text-neutral-700">
              {cachee.role ?? <span className="italic text-neutral-400">rôle non défini</span>}
            </p>
          )}
        </div>
        <div className="flex flex-shrink-0 flex-col items-end gap-1">
          {/* BDEC row */}
          <div className="flex items-center gap-1">
            {bdecKarmic.map((code) => (
              <span
                key={code}
                className="rounded border border-emerald-500 bg-emerald-50 px-1 py-0.5 font-mono text-[9px] font-bold text-emerald-700"
              >
                {code}
              </span>
            ))}
            <button
              type="button"
              disabled={!canWrite}
              onClick={() => canWrite && setBdecOpen(true)}
              className="rounded bg-emerald-100 px-1.5 py-0.5 font-mono text-[9px] font-bold text-emerald-900 transition hover:ring-2 hover:ring-emerald-300 disabled:opacity-50"
              title="BDEC — Consciences gisantes"
            >
              BDEC
            </button>
          </div>
          {/* DESA row */}
          <div className="flex items-center gap-1">
            {desaKarmic.map((code) => (
              <span
                key={code}
                className="rounded border border-red-500 bg-red-50 px-1 py-0.5 font-mono text-[9px] font-bold text-red-600"
              >
                {code}
              </span>
            ))}
            <button
              type="button"
              disabled={!canWrite}
              onClick={() => canWrite && setDesaOpen(true)}
              className="rounded bg-indigo-100 px-1.5 py-0.5 font-mono text-[9px] font-bold text-indigo-900 transition hover:ring-2 hover:ring-indigo-300 disabled:opacity-50"
              title="DESA — Dark Entities & Spirit Attachments"
            >
              DESA
            </button>
          </div>
          {/* Retrait (Owner ou Cercle SR) */}
          {canWrite ? (
            <form action={removeApprenanteCachee}>
              <input type="hidden" name="id" value={cachee.id} />
              <button
                type="submit"
                className="text-[9px] text-neutral-400 hover:text-rose-600"
                title="Retirer cette apprenante cachée"
              >
                × retirer
              </button>
            </form>
          ) : null}
        </div>
      </div>

      <DesaEditModal
        open={desaOpen}
        onClose={() => setDesaOpen(false)}
        svlbhId={cachee.svlbh_id}
        praticienneName={`Apprenante cachée sur ${hostName}`}
        initialGranted={cachee.desa_granted}
        initialKarmic={cachee.desa_karmic}
        catalog={desaCatalog}
      />
      <BdecGisantsModal
        open={bdecOpen}
        onClose={() => setBdecOpen(false)}
        svlbhId={cachee.svlbh_id}
        praticienneName={`Apprenante cachée sur ${hostName}`}
        initialGranted={cachee.desa_granted}
        initialKarmic={cachee.desa_karmic}
        catalog={desaCatalog}
      />
    </div>
  );
}
