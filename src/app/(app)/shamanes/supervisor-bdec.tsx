"use client";

// Bouton BDEC cliquable + sa rangée de codes karmiques, embarqué sur les
// cartes virtuelles superviseurs. Owner ou Cercle SR peuvent ouvrir le
// modal BdecGisantsModal. État DB lu via svlbh_id synthétique propre au
// rôle superviseur (UUIDv5). DEC Patrick 2026-05-29.

import { useState } from "react";
import type { DesaAtom } from "@/lib/cercle/desa";
import { BdecGisantsModal } from "./bdec-gisants-modal";

export function SupervisorBdec({
  svlbhId,
  praticienneName,
  granted,
  karmic,
  desaCatalog,
  canEdit,
}: {
  svlbhId: string;
  praticienneName: string;
  granted: string[];
  karmic: string[];
  desaCatalog: Record<string, DesaAtom>;
  canEdit: boolean;
}) {
  const [open, setOpen] = useState(false);
  const bdecCodes = new Set(
    Object.values(desaCatalog).filter((c) => c.system === "BDEC").map((c) => c.code),
  );
  const karmicBdec = karmic.filter((c) => bdecCodes.has(c));

  return (
    <div className="flex flex-shrink-0 flex-col items-end gap-1">
      <div className="flex items-center gap-1">
        {karmicBdec.map((code) => (
          <span
            key={code}
            className="rounded-md border-2 border-emerald-500 bg-emerald-50 px-1 py-0.5 font-mono text-[10px] font-bold text-emerald-700"
            title={`${code} — conscience gisante BDEC karmique`}
          >
            {code}
          </span>
        ))}
        <button
          type="button"
          disabled={!canEdit}
          onClick={() => canEdit && setOpen(true)}
          className="rounded-md bg-emerald-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-900 transition hover:ring-2 hover:ring-emerald-300 disabled:opacity-50"
          title={canEdit ? "Cliquer pour éditer BDEC — Consciences gisantes" : "BDEC — Consciences gisantes"}
        >
          BDEC
        </button>
      </div>
      <BdecGisantsModal
        open={open}
        onClose={() => setOpen(false)}
        svlbhId={svlbhId}
        praticienneName={praticienneName}
        initialGranted={granted}
        initialKarmic={karmic}
        catalog={desaCatalog}
      />
    </div>
  );
}
