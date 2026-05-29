"use client";

// Modal d'attribution des 2 axes DESA pour une praticienne. Owner ST6 only.
// Ouvert au clic sur le sigle DESA d'une carte. 2 axes indépendants :
//  - GAUCHE : checkbox « accordée » (capacité détenue).
//  - DROITE : picker « karmique à libérer » (symbole + filet rouge).
// Toggles optimistes + rollback on error. DEC Patrick 2026-05-29.

import { useState, useTransition, useEffect } from "react";
import type { DesaAtom } from "@/lib/cercle/desa";
import { setDesaCapacity } from "./desa-action";

export function DesaEditModal({
  open,
  onClose,
  svlbhId,
  praticienneName,
  initialGranted,
  initialKarmic,
  catalog,
}: {
  open: boolean;
  onClose: () => void;
  svlbhId: string;
  praticienneName: string;
  initialGranted: string[];
  initialKarmic: string[];
  catalog: Record<string, DesaAtom>;
}) {
  const [granted, setGranted] = useState<Set<string>>(new Set(initialGranted));
  const [karmic, setKarmic] = useState<Set<string>>(new Set(initialKarmic));
  const [busy, setBusy] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Resync sur revalidation serveur.
  useEffect(() => {
    setGranted(new Set(initialGranted));
  }, [initialGranted]);
  useEffect(() => {
    setKarmic(new Set(initialKarmic));
  }, [initialKarmic]);

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

  function toggle(code: string, axis: "granted" | "karmic_to_liberate") {
    const set = axis === "granted" ? granted : karmic;
    const setSet = axis === "granted" ? setGranted : setKarmic;
    const wasOn = set.has(code);
    const next = new Set(set);
    if (wasOn) next.delete(code);
    else next.add(code);
    setSet(next);
    setError(null);
    const busyKey = code + ":" + axis;
    setBusy((b) => new Set(b).add(busyKey));

    startTransition(async () => {
      const res = await setDesaCapacity(svlbhId, code, axis, !wasOn);
      setBusy((b) => {
        const n = new Set(b);
        n.delete(busyKey);
        return n;
      });
      if (!res.ok) {
        // Rollback.
        setSet((cur) => {
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

        <p className="mb-3 text-[11px] text-neutral-500">
          Gauche : capacité <strong>accordée</strong>. Droite : marquage{" "}
          <strong className="text-red-600">karmique à libérer</strong> (apparaît
          en rouge sur la carte). Sauvegarde auto à chaque clic.
        </p>

        <ul className="space-y-1.5">
          {sortedCodes.map((code) => {
            const atom = catalog[code];
            const isGranted = granted.has(code);
            const isKarmic = karmic.has(code);
            const grantedBusy = busy.has(code + ":granted");
            const karmicBusy = busy.has(code + ":karmic_to_liberate");
            return (
              <li
                key={code}
                className={
                  "flex items-stretch gap-2 rounded-md border transition " +
                  (isGranted
                    ? "border-indigo-300 bg-indigo-50"
                    : "border-neutral-200 bg-white")
                }
              >
                {/* GAUCHE — checkbox accordée + label */}
                <label className="flex flex-1 cursor-pointer items-start gap-3 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={isGranted}
                    disabled={grantedBusy}
                    onChange={() => toggle(code, "granted")}
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
                      {grantedBusy ? (
                        <span className="text-[10px] italic text-neutral-400">
                          …
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

                {/* DROITE — picker karmique (symbole + filet rouge si actif) */}
                <button
                  type="button"
                  onClick={() => toggle(code, "karmic_to_liberate")}
                  disabled={karmicBusy}
                  className={
                    "flex w-12 flex-shrink-0 items-center justify-center rounded-r-md border-l-2 font-mono text-[14px] font-bold transition " +
                    (isKarmic
                      ? "border-red-500 bg-red-50 text-red-600 ring-2 ring-red-400"
                      : "border-neutral-200 bg-neutral-50 text-neutral-300 hover:bg-red-50 hover:text-red-400")
                  }
                  title={
                    isKarmic
                      ? "Karmique à libérer (visible en rouge sur la carte) — cliquer pour retirer"
                      : "Marquer comme karmique à libérer pour cette personne"
                  }
                >
                  {isKarmic ? "◉" : "○"}
                </button>
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
