"use client";

// Section "Soins en commun" — affichage + ajout de contributors ST4+.
// DEC Patrick 2026-05-18.

import { useState } from "react";
import { addContributorsToSoin } from "./soin-contribs-actions";

export type SoinCommun = {
  kind: "relation" | "energie";
  ref_id: string;                  // relation_id ou energie_offensive_tiers.id
  purpose?: "relation" | "soul_mission";  // pour kind=relation
  owner_svlbh_id: string;
  title: string;
  relation_type: string | null;    // pour kind=relation
  relation_state: string | null;   // pour kind=relation
  source_description?: string | null;  // pour kind=energie
  intensity?: number | null;            // pour kind=energie
  contributors: Array<{ svlbh_id: string; first_name: string | null; last_name: string | null; code_praticien: number | null }>;
};

const PWA_PRO_URL = "https://pwa.app.svlbh.com";

function relationDetailLink(item: SoinCommun): string | null {
  if (item.kind !== "relation") return null;
  const path = item.purpose === "soul_mission" ? "/soul-mission" : "/relations";
  return `${PWA_PRO_URL}${path}#rel-${item.ref_id}`;
}

export function SoinsCommunsList({
  items, allTherapeutes, dissipationMap, canEdit,
}: {
  items: SoinCommun[];
  allTherapeutes: Array<{ svlbh_id: string; first_name: string | null; last_name: string | null; code_praticien: number | null }>;
  dissipationMap?: Record<string, "massif" | "moyen" | "minimal" | null>;
  canEdit: boolean;
}) {
  if (items.length === 0) {
    return (
      <p className="px-2 py-3 text-center text-xs italic text-neutral-500">
        Aucun soin partagé entre 2 thérapeutes ou plus actuellement.
      </p>
    );
  }
  return (
    <ul className="space-y-1.5">
      {items.map((s) => (
        <SoinItem
          key={`${s.kind}-${s.ref_id}`}
          item={s}
          available={allTherapeutes.filter((t) => !s.contributors.some((c) => c.svlbh_id === t.svlbh_id))}
          dissipation={dissipationMap?.[`${s.kind}:${s.ref_id}`] ?? null}
          canEdit={canEdit}
        />
      ))}
    </ul>
  );
}

const DISSIP_BADGE: Record<"massif" | "moyen" | "minimal", { n: number; label: string; color: string }> = {
  massif:  { n: 3, label: "Massif",  color: "#dc2626" },
  moyen:   { n: 2, label: "Moyen",   color: "#ea580c" },
  minimal: { n: 1, label: "Minimal", color: "#ca8a04" },
};

function SoinItem({
  item, available, dissipation, canEdit,
}: {
  item: SoinCommun;
  available: Array<{ svlbh_id: string; first_name: string | null; last_name: string | null; code_praticien: number | null }>;
  dissipation: "massif" | "moyen" | "minimal" | null;
  canEdit: boolean;
}) {
  const [adding, setAdding] = useState(false);
  return (
    <li className="space-y-1 rounded-lg border border-emerald-100 bg-white px-3 py-2 text-sm shadow-sm">
      <div className="flex flex-wrap items-start gap-x-3 gap-y-1">
        {(() => {
          const href = relationDetailLink(item);
          if (href) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-neutral-900 hover:text-emerald-700 hover:underline"
                title="Ouvrir le lien entre les thérapeutes (PWA pro-web)"
              >
                {item.kind === "energie" ? "⚡ " : "🪢 "}{item.title}
              </a>
            );
          }
          return (
            <span className="font-semibold text-neutral-900">
              {item.kind === "energie" ? "⚡ " : "🪢 "}{item.title}
            </span>
          );
        })()}
        {item.kind === "relation" && item.relation_state ? (
          <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-medium text-rose-700">
            {item.relation_state}
          </span>
        ) : null}
        {item.kind === "energie" && item.intensity != null ? (
          <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
            intensité {item.intensity}/100
          </span>
        ) : null}
        {dissipation ? (
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
            style={{ backgroundColor: DISSIP_BADGE[dissipation].color }}
            title="Mode de dissipation à observer (réglable depuis le Backlog)"
          >
            Dissip. {DISSIP_BADGE[dissipation].n} · {DISSIP_BADGE[dissipation].label}
          </span>
        ) : null}
        <span className="ml-auto flex flex-wrap items-center gap-1">
          {item.contributors.map((c) => (
            <span
              key={c.svlbh_id}
              className={
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium " +
                (c.svlbh_id === item.owner_svlbh_id
                  ? "border-emerald-300 bg-emerald-100 text-emerald-900"
                  : "border-neutral-300 bg-neutral-50 text-neutral-700")
              }
              title={c.svlbh_id === item.owner_svlbh_id ? "Créatrice du soin" : "Co-contributrice"}
            >
              {c.first_name ?? "?"} {c.last_name ?? ""}
              {c.code_praticien != null ? (
                <span className="font-mono opacity-60">#{String(c.code_praticien).padStart(5, "0")}</span>
              ) : null}
            </span>
          ))}
          {canEdit ? (
            <button
              type="button"
              onClick={() => setAdding((v) => !v)}
              className="rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-900 hover:bg-emerald-100"
              title="Ajouter une ou plusieurs ST4+ comme contributrices"
            >
              + ST4+
            </button>
          ) : null}
        </span>
      </div>
      {canEdit && adding ? (
        <form
          action={async (fd) => {
            await addContributorsToSoin(fd);
            setAdding(false);
          }}
          className="flex flex-wrap items-end gap-2 rounded-md border border-emerald-200 bg-emerald-50/30 p-2"
        >
          <input type="hidden" name="ref_id" value={item.ref_id} />
          <input type="hidden" name="kind" value={item.kind} />
          <label className="flex flex-col gap-1 text-[10px] font-semibold text-emerald-900">
            ST4+ à ajouter (Cmd/Ctrl-clic pour multi)
            <select
              name="contributor_svlbh_id"
              multiple
              required
              size={Math.min(6, Math.max(2, available.length))}
              className="min-w-[200px] rounded border border-neutral-300 bg-white px-1 py-1 text-xs"
            >
              {available.length === 0 ? (
                <option disabled>Toutes les ST4+ sont déjà contributrices</option>
              ) : (
                available.map((p) => (
                  <option key={p.svlbh_id} value={p.svlbh_id}>
                    {p.first_name ?? "?"} {p.last_name ?? ""}
                    {p.code_praticien != null ? ` #${String(p.code_praticien).padStart(5, "0")}` : ""}
                  </option>
                ))
              )}
            </select>
          </label>
          <button
            type="submit"
            disabled={available.length === 0}
            className="rounded bg-emerald-700 px-2 py-1 text-[11px] font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
          >
            Ajouter
          </button>
          <button
            type="button"
            onClick={() => setAdding(false)}
            className="rounded border border-neutral-300 bg-white px-2 py-1 text-[11px] text-neutral-600 hover:bg-neutral-100"
          >
            Annuler
          </button>
        </form>
      ) : null}
    </li>
  );
}
