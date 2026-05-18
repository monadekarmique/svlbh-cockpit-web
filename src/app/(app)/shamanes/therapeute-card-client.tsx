"use client";

// Carte thérapeute (extraite de page.tsx en client component pour le DnD).
// DEC Patrick 2026-05-18.

import { setMyDailyStatus, setAttentionSticker, clearAttentionSticker } from "./daily-status-actions";
import { lookupMembership, DHATU_META } from "@/lib/cercle/akashiques";
import type { AkashiqueMembership } from "@/lib/cercle/akashiques";
import type { DnDTherapeute } from "./therapeutes-dnd-zones";

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

export function TherapeuteCardClient({
  t, isMe, isOwner,
}: {
  t: DnDTherapeute;
  isMe: boolean;
  isOwner: boolean;
}) {
  const membership = lookupMembership(t.svlbh_id);
  const targetStatusOnToggle = t.status === "active" ? "hidden" : "active";
  const toggleLabel = t.status === "active" ? "Me cacher aujourd'hui" : "Redevenir active";

  const stickerStyle: React.CSSProperties = t.attention_color
    ? { borderLeftColor: t.attention_color, borderLeftWidth: 6 }
    : { borderLeftColor: "#cbd5e1", borderLeftWidth: 4 };

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
              {t.capacity_anchor ?? "C?"}
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
          </div>
        </div>

        {t.attention_steps != null ? (
          <span
            className="inline-flex h-8 min-w-[32px] items-center justify-center rounded-full px-2 text-sm font-extrabold text-white shadow-sm"
            style={{ backgroundColor: t.attention_color ?? "#64748b" }}
            title={`${t.attention_steps} étape${t.attention_steps > 1 ? "s" : ""} en attente de libération`}
          >
            {t.attention_steps}
          </span>
        ) : null}
      </div>

      {isMe ? (
        <form action={setMyDailyStatus}>
          <input type="hidden" name="status" value={targetStatusOnToggle} />
          <button
            type="submit"
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

      {isOwner && !isMe ? (
        <form action={setAttentionSticker} className="flex items-center gap-1.5 border-t border-neutral-100 pt-2">
          <input type="hidden" name="target_svlbh_id" value={t.svlbh_id} />
          <label className="flex items-center gap-1 text-[10px] text-neutral-600">
            🎨
            <input
              name="attention_color"
              type="color"
              defaultValue={t.attention_color ?? "#ef4444"}
              className="h-6 w-8 cursor-pointer rounded border border-neutral-300 bg-white"
              title="Couleur du sticker"
            />
          </label>
          <input
            name="attention_steps"
            type="number"
            min={0}
            max={9999}
            defaultValue={t.attention_steps ?? ""}
            placeholder="N"
            className="h-6 w-14 rounded border border-neutral-300 px-1 text-center font-mono text-[11px]"
            title="Nombre d'étapes à libérer"
          />
          <button
            type="submit"
            className="h-6 rounded bg-neutral-900 px-2 text-[10px] font-semibold text-white hover:bg-neutral-700"
          >
            Poser
          </button>
          {t.attention_color || t.attention_steps != null ? (
            <button
              type="submit"
              formAction={clearAttentionSticker}
              className="h-6 rounded border border-neutral-300 bg-white px-2 text-[10px] text-neutral-700 hover:bg-neutral-50"
              title="Retirer le sticker"
            >
              ✕
            </button>
          ) : null}
        </form>
      ) : null}
    </div>
  );
}
