"use client";

// Carte thérapeute (extraite de page.tsx en client component pour le DnD).
// DEC Patrick 2026-05-18.

import { setMyDailyStatus } from "./daily-status-actions";
import { lookupMembership, DHATU_META } from "@/lib/cercle/akashiques";
import type { AkashiqueMembership } from "@/lib/cercle/akashiques";
import type { DnDTherapeute } from "./therapeutes-dnd-zones";
import { DYNAMIQUE_AXIS_TONE, type DynamiqueChip } from "@/lib/cercle/dynamiques";

function CerclesAkashiquesChips({ membership }: { membership: AkashiqueMembership | null }) {
  if (!membership) return null;
  const all = [
    ...membership.membres.map((c) => ({ c, isFormation: false })),
    ...membership.formation.map((c) => ({ c, isFormation: true })),
  ];
  if (all.length === 0) return null;
  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {all.map(({ c, isFormation }) => {
        const primary = c.dhatus[0];
        const meta = DHATU_META[primary];
        return (
          <span
            key={c.name}
            className="inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[10px] font-medium"
            style={{
              borderColor: meta.color,
              color: meta.color,
              backgroundColor: isFormation ? "transparent" : `${meta.color}10`,
              opacity: isFormation ? 0.7 : 1,
              borderStyle: isFormation ? "dashed" : "solid",
            }}
            title={
              isFormation
                ? `Cercle ${c.name} — en formation (lignée actuelle)`
                : `Cercle ${c.name} — membre (incarnations passées)`
            }
          >
            {c.dhatus.map((d) => DHATU_META[d].emoji).join("")} {c.name}
          </span>
        );
      })}
    </div>
  );
}

function DynamiquesChips({ dynamiques }: { dynamiques: DynamiqueChip[] }) {
  if (!dynamiques || dynamiques.length === 0) return null;
  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {dynamiques.map((d) => {
        const tone = d.axis_mtc
          ? DYNAMIQUE_AXIS_TONE[d.axis_mtc]
          : DYNAMIQUE_AXIS_TONE.MULTI;
        return (
          <span
            key={d.id}
            className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ring-1 ${tone.bg} ${tone.text} ${tone.ring}`}
            title={`Dynamique : ${d.name}`}
          >
            {d.icon ? <span aria-hidden>{d.icon}</span> : null}
            <span>{d.short_code}</span>
          </span>
        );
      })}
    </div>
  );
}

export function TherapeuteCardClient({
  t, isMe, isOwner, dynamiques = [],
}: {
  t: DnDTherapeute;
  isMe: boolean;
  isOwner: boolean;
  dynamiques?: DynamiqueChip[];
}) {
  const membership = lookupMembership(t.svlbh_id);
  const targetStatusOnToggle = t.status === "active" ? "hidden" : "active";
  const toggleLabel = t.status === "active" ? "Me cacher aujourd'hui" : "Redevenir active";

  const stickerStyle: React.CSSProperties = {
    borderLeftColor: "#cbd5e1", borderLeftWidth: 4,
  };

  const displayName = `${t.first_name ?? ""} ${t.last_name ?? ""}`.trim() || "—";

  return (
    <div
      className="flex flex-col gap-2 rounded-xl border bg-white p-4 shadow-sm"
      style={stickerStyle}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-start gap-2">
          <div className="flex flex-col gap-0.5 font-mono text-[9px] font-bold">
            <span className="rounded bg-rose-100 px-1.5 py-0.5 text-rose-900" title="Tx — capacité à recevoir / risque">
              {t.tx ?? "T?"}
            </span>
            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-900" title="Cx — capacité à transmettre">
              {t.capacity_anchor ? t.capacity_anchor.replace(/^T/, "C") : "C?"}
            </span>
            <span className="rounded bg-violet-100 px-1.5 py-0.5 text-violet-900" title="ST — parcours / rôle">
              {t.stx ?? "ST?"}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-neutral-900">
              {displayName}
              {isMe ? <span className="ml-1 rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold text-blue-900">moi</span> : null}
              {t.cercle_lumiere_sr ? <span className="ml-1 text-[10px]" title="Cercle SR">◉</span> : null}
            </p>
            {t.code_praticien != null ? (
              <p className="font-mono text-[10px] text-neutral-400">
                #{String(t.code_praticien).padStart(5, "0")}
              </p>
            ) : null}
            <CerclesAkashiquesChips membership={membership} />
            <DynamiquesChips dynamiques={dynamiques} />
          </div>
        </div>

        {t.attention_steps != null ? (
          <span
            className="flex-shrink-0 rounded-full border border-rose-300 bg-rose-50 px-2 py-0.5 font-mono text-[11px] font-bold text-rose-900"
            title="NSB — Niveaux Shamaniques Bloqués (somme des relations bloquées ou override apprenante_tier)"
          >
            NSB {t.attention_steps}
          </span>
        ) : null}
      </div>

      {isMe ? (
        <form action={setMyDailyStatus} onPointerDown={(e) => e.stopPropagation()}>
          <input type="hidden" name="status" value={targetStatusOnToggle} />
          <button
            type="submit"
            onPointerDown={(e) => e.stopPropagation()}
            className={
              "w-full rounded-md px-2 py-1 text-[11px] font-semibold transition " +
              (targetStatusOnToggle === "hidden"
                ? "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                : "bg-emerald-100 text-emerald-900 hover:bg-emerald-200")
            }
          >
            {toggleLabel}
          </button>
        </form>
      ) : null}
    </div>
  );
}
