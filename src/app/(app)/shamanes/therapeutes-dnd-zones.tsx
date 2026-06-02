"use client";

// Zones Thérapeutes actives ↔ Thérapeutes cachées.
// DEC Patrick 2026-05-29 : drag-and-drop retiré sur toute la page /shamanes
// (rendait le survol mobile impraticable). Pour changer son propre statut,
// utiliser le bouton "Me cacher / Me réactiver" en bas de la carte (form
// setMyDailyStatus). État local conservé pour les ± du compteur GL.
// DEC Patrick 2026-05-18 (legacy).

import { useState, useTransition, useEffect } from "react";
import { updateGuidesLumiere } from "./gl-action";

export type DnDTherapeute = {
  svlbh_id: string;
  first_name: string | null;
  last_name: string | null;
  code_praticien: number | null;
  stx: string | null;
  tx: string | null;
  capacity_anchor: string | null;
  cercle_lumiere_sr: boolean | null;
  desa_active: boolean;
  status: "active" | "hidden" | "formation" | "parcours-passif" | "cercle-akashique";
  attention_color: string | null;
  attention_steps: number | null;
  guides_lumiere: number;
  /** Timestamp version pour OCC (saisie absolue GL). DEC Patrick 2026-05-29. */
  guides_lumiere_updated_at: string;
  /** Signature radiesthésique cyclique (charte VLBH v0.1.0 §X). */
  rad_signature: "aube" | "nuit" | "fin-jour" | null;
  /** Timestamp version pour OCC NSB thérapeute (praticienne_daily_status). */
  daily_status_updated_at: string | null;
};

export function TherapeutesDnDZones({
  initial,
  mySvlbhId,
  renderCard,
}: {
  initial: DnDTherapeute[];
  mySvlbhId?: string;
  isOwner: boolean;
  renderCard: (
    t: DnDTherapeute,
    ctx: { isMe: boolean; isDragging: boolean; bumpGL: (svlbhId: string, delta: 1 | -1) => void },
  ) => React.ReactNode;
}) {
  const [items, setItems] = useState<DnDTherapeute[]>(initial);
  const [, startTransition] = useTransition();

  // Resync local state with server props after revalidatePath (form actions
  // update DB + revalidate, mais le state local resterait stale).
  const initialSig = initial.map((t) => `${t.svlbh_id}:${t.status}:${t.guides_lumiere}`).join("|");
  useEffect(() => {
    setItems(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSig]);

  // bumpGL — update optimiste du compteur GL (collaboratif Cercle).
  // Met à jour items localement → le total se recalcule instantanément.
  function bumpGL(svlbhId: string, delta: 1 | -1) {
    const before = items.find((t) => t.svlbh_id === svlbhId);
    if (!before) return;
    const next = Math.max(0, (before.guides_lumiere ?? 0) + delta);
    if (next === (before.guides_lumiere ?? 0)) return;
    setItems((prev) =>
      prev.map((t) => (t.svlbh_id === svlbhId ? { ...t, guides_lumiere: next } : t)),
    );
    const fd = new FormData();
    fd.set("svlbh_id", svlbhId);
    fd.set("delta", String(delta));
    startTransition(() => {
      updateGuidesLumiere(fd).catch((err) => {
        console.error("[gl] rollback", err);
        setItems((prev) =>
          prev.map((t) =>
            t.svlbh_id === svlbhId
              ? { ...t, guides_lumiere: before.guides_lumiere ?? 0 }
              : t,
          ),
        );
      });
    });
  }

  const actives = items.filter((t) => t.status === "active");
  const hidden = items.filter((t) => t.status === "hidden");

  return (
    <>
      <Zone
        title={`✨ Thérapeutes SVLBH — Membres actives du Cercle (${actives.length})`}
        emptyHint="Aucune active aujourd'hui."
      >
        {actives.map((t) => (
          <li key={t.svlbh_id}>
            {renderCard(t, { isMe: t.svlbh_id === mySvlbhId, isDragging: false, bumpGL })}
          </li>
        ))}
      </Zone>

      {/* Total GL des Membres actives — recalculé sur le state local courant. */}
      <div className="rounded-2xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 px-5 py-3 text-center shadow-sm">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-700">
          ✨ Total des Guides de Lumière 300% qui soutiennent le Cercle de Lumière Suisse Romande
        </p>
        <p className="mt-1 font-mono text-3xl font-bold tabular-nums text-amber-900">
          {actives.reduce((sum, t) => sum + (t.guides_lumiere ?? 0), 0).toLocaleString("fr-CH")}
        </p>
      </div>

      <Zone
        title={`🌙 Apprenantes cachées (${hidden.length})`}
        emptyHint="Aucune cachée aujourd'hui. Utilise le bouton « Me cacher » sur ta carte."
      >
        {hidden.map((t) => (
          <li key={t.svlbh_id}>
            {renderCard(t, { isMe: t.svlbh_id === mySvlbhId, isDragging: false, bumpGL })}
          </li>
        ))}
      </Zone>
    </>
  );
}

function Zone({
  title, emptyHint, children,
}: {
  title: string;
  emptyHint: string;
  children: React.ReactNode;
}) {
  const childArray = Array.isArray(children) ? children : [children];
  const empty = childArray.filter(Boolean).length === 0;
  return (
    <section className="space-y-2">
      <h2 className="text-base font-semibold text-blue-900">{title}</h2>
      <div className="rounded-xl p-2">
        {empty ? (
          <p className="px-2 py-4 text-center text-xs italic text-neutral-500">{emptyHint}</p>
        ) : (
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">{children}</ul>
        )}
      </div>
    </section>
  );
}
