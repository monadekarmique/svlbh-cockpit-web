"use client";

// Bouton "Démarrer une session de support" + modal de consentement RGPD/nLPD.
// DEC Patrick 2026-05-21. Audience : praticienne (Anne ST5+, etc.).

import { useState } from "react";
import { startSupportSession } from "./actions";

const CONSENT_TEXT =
  "Je consens à partager le rendu de mon onglet navigateur actif avec un Owner SVLBH (Patrick) ou un Admin (Anne) pendant 60 minutes maximum, à des fins d'accompagnement et de support technique. Aucune capture de mon écran complet, aucun enregistrement persistant n'est effectué. Je peux interrompre la session à tout moment. Conforme LPD suisse (Art. 6 - consentement) et RGPD UE (Art. 6 §1 a).";

export function SupportStartButton({
  variant = "primary",
}: {
  variant?: "primary" | "compact";
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          variant === "primary"
            ? "rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
            : "rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-900 hover:bg-blue-100"
        }
        title="Démarrer une session de support avec Patrick / Admin"
      >
        💬 Démarrer session de support
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <header>
              <h2 className="text-lg font-bold text-blue-950">
                💬 Démarrer une session de support
              </h2>
              <p className="mt-1 text-xs text-neutral-500">
                Patrick ou Anne pourra voir le rendu live de votre onglet
                actif pour vous accompagner pas-à-pas.
              </p>
            </header>

            <section className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-xs leading-relaxed text-amber-900">
              <p className="font-bold uppercase tracking-wide">
                ✋ Avant de démarrer
              </p>
              <ul className="ml-4 mt-1 list-disc space-y-0.5">
                <li>Vous gardez la maîtrise — bouton STOP toujours accessible.</li>
                <li>
                  Seul votre <strong>onglet actif</strong> est partagé, pas votre
                  écran complet.
                </li>
                <li>
                  Session limitée à <strong>60 minutes</strong>, expire automatiquement.
                </li>
                <li>
                  Toutes les actions sont consignées dans le journal Compliance.
                </li>
              </ul>
            </section>

            <section className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-xs leading-relaxed text-neutral-700">
              <p className="font-bold uppercase tracking-wide text-neutral-500">
                Texte du consentement (LPD/RGPD)
              </p>
              <p className="mt-1 italic">{CONSENT_TEXT}</p>
            </section>

            <form action={startSupportSession} className="space-y-3">
              <input type="hidden" name="consent_text" value={CONSENT_TEXT} />
              <label className="block text-xs">
                <span className="font-semibold text-neutral-700">
                  Note (contexte de la session, optionnel)
                </span>
                <input
                  type="text"
                  name="note"
                  placeholder="ex: Onboarding sandbox V3 PostFinance"
                  className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm"
                />
              </label>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-blue-700 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-800"
                >
                  ✓ J&apos;accepte et démarre la session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
