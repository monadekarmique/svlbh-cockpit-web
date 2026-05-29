"use client";

// Modal d'attribution des 8 capacités DESA à une praticienne (Owner ST6
// uniquement, gating côté server action). Ouvert au clic sur le sigle DESA
// d'une carte shamane. Toggles optimistes + rollback on error.
// DEC Patrick 2026-05-29.

import { useState, useTransition, useEffect } from "react";
import type { DesaAtom, DesaCapacities } from "@/lib/cercle/desa";
import { setDesaCapacity } from "./desa-action";

export function DesaEditModal({
  open,
  onClose,
  svlbhId,
  praticienneName,
  initialCapacities,
  catalog,
}: {
  open: boolean;
  onClose: () => void;
  svlbhId: string;
  praticienneName: string;
  initialCapacities: DesaCapacities;
  catalog: Record<string, DesaAtom>;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(initialCapacities));
  const [busy, setBusy] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Resync si la prop change (le serveur a revalidé).
  useEffect(() => {
    setSelected(new Set(initialCapacities));
  }, [initialCapacities]);

  // Échap pour fermer.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const sortedCodes = Object.values(catalog)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((a) => a.code);

  function toggle(code: string) {
    const wasOn = selected.has(code);
    // Mutation optimiste.
    const next = new Set(selected);
    if (wasOn) next.delete(code);
    else next.add(code);
    setSelected(next);
    setError(null);
    setBusy((b) => new Set(b).add(code));

    startTransition(async () => {
      const res = await setDesaCapacity(svlbhId, code, !wasOn);
      setBusy((b) => {
        const n = new Set(b);
        n.delete(code);
        return n;
      });
      if (!res.ok) {
        // Rollback.
        setSelected((cur) => {
          const r = new Set(cur);
          if (wasOn) r.add(code);
          else r.delete(code);
          return r;
        });
        setError(res.error);
      }
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div
        className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-indigo-700">
              DESA — Dark Entities &amp; Spirit Attachments
            </p>
            <h2 className="mt-0.5 text-lg font-semibold text-neutral-900">
              {praticienneName}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-mr-2 -mt-1 rounded-md p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        <p className="mb-3 text-[12px] text-neutral-500">
          Coche les capacités de libération accordées. Sauvegarde automatique à chaque clic.
        </p>

        <ul className="space-y-1.5">
          {sortedCodes.map((code) => {
            const atom = catalog[code];
            const isOn = selected.has(code);
            const isBusy = busy.has(code);
            return (
              <li key={code}>
                <label
                  className={
                    "flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2 transition " +
                    (isOn
                      ? "border-indigo-300 bg-indigo-50"
                      : "border-neutral-200 bg-white hover:bg-neutral-50")
                  }
                >
                  <input
                    type="checkbox"
                    checked={isOn}
                    disabled={isBusy}
                    onChange={() => toggle(code)}
                    className="mt-0.5 h-4 w-4 accent-indigo-600"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono text-[12px] font-bold text-indigo-900">
                        {code}
                      </span>
                      {atom?.label && atom.label !== code ? (
                        <span className="text-[13px] text-neutral-800">
                          {atom.label}
                        </span>
                      ) : null}
                      {isBusy ? (
                        <span className="text-[10px] italic text-neutral-400">
                          en cours…
                        </span>
                      ) : null}
                    </div>
                    {atom?.description ? (
                      <p className="mt-0.5 text-[11px] text-neutral-500">
                        {atom.description}
                      </p>
                    ) : null}
                  </div>
                </label>
              </li>
            );
          })}
        </ul>

        {error ? (
          <p className="mt-3 rounded-md bg-rose-50 px-3 py-2 text-[12px] text-rose-900">
            {error}
          </p>
        ) : null}

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-neutral-900 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-neutral-700"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
