"use client";

// Backlog Cercle SR — sidebar droite du cockpit shamanes.
// 2 types d'items : relation compliquée ou énergie offensive de tiers.
// Lecture ST4+, écriture Owner/ST5 (canEdit prop).
// DEC Patrick 2026-05-18.

import { useState } from "react";
import { addBacklogFromRelation, addBacklogWithEnergie, setBacklogAutonomy, archiveBacklog } from "./backlog-actions";

const AUTONOMY_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
  patrick_anime: { label: "Patrick anime", emoji: "🟢", color: "#16a34a" },
  patrick_suit: { label: "Patrick suit · ST4+ contribue", emoji: "🟡", color: "#eab308" },
  st4_pilote: { label: "ST4+ pilote · Patrick valide", emoji: "🔵", color: "#2563eb" },
  st4_autonome: { label: "ST4+ autonome", emoji: "✅", color: "#7c3aed" },
};

export type BacklogItem = {
  id: string;
  title: string;
  notes: string | null;
  autonomy_level: string;
  ref_relation_id: string | null;
  ref_energie_id: string | null;
  created_at: string;
  energie: { source_description: string; intensity: number | null; target_name: string | null } | null;
  relation: { relation_type: string | null; target_name: string | null } | null;
};

const WHATSAPP_CERCLE_HREF = "https://wa.me/41799302800";

function waLink(item: BacklogItem): string {
  const lines: string[] = [];
  lines.push(`📋 Backlog Cercle SR — ${item.title}`);
  if (item.relation) {
    lines.push(`🪢 Relation : ${item.relation.relation_type ?? "?"} avec ${item.relation.target_name ?? "?"}`);
  }
  if (item.energie) {
    lines.push(`⚡ Énergie offensive : ${item.energie.source_description}`);
    if (item.energie.intensity != null) lines.push(`Intensité : ${item.energie.intensity}/100`);
    if (item.energie.target_name) lines.push(`Cible : ${item.energie.target_name}`);
  }
  if (item.notes) lines.push(`\n${item.notes}`);
  lines.push(`\nStatut : ${AUTONOMY_LABELS[item.autonomy_level]?.label ?? item.autonomy_level}`);
  return `${WHATSAPP_CERCLE_HREF}?text=${encodeURIComponent(lines.join("\n"))}`;
}

export function BacklogSidebar({
  items, canEdit, relationsForPicker, praticiennesForPicker, consultantesForPicker,
}: {
  items: BacklogItem[];
  canEdit: boolean;
  relationsForPicker: Array<{ relation_id: string; label: string }>;
  praticiennesForPicker: Array<{ svlbh_id: string; label: string }>;
  consultantesForPicker: Array<{ consultante_id: string; label: string }>;
}) {
  const [openForm, setOpenForm] = useState<"none" | "relation" | "energie">("none");

  return (
    <aside className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/40 p-3">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-amber-900">
          📋 Backlog Cercle SR ({items.length})
        </h2>
        {canEdit ? (
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setOpenForm(openForm === "relation" ? "none" : "relation")}
              className="rounded border border-amber-300 bg-white px-2 py-0.5 text-[11px] font-semibold text-amber-900 hover:bg-amber-100"
            >
              🪢 + Relation
            </button>
            <button
              type="button"
              onClick={() => setOpenForm(openForm === "energie" ? "none" : "energie")}
              className="rounded border border-amber-300 bg-white px-2 py-0.5 text-[11px] font-semibold text-amber-900 hover:bg-amber-100"
            >
              ⚡ + Énergie
            </button>
          </div>
        ) : null}
      </header>

      {canEdit && openForm === "relation" ? (
        <form action={async (fd) => { await addBacklogFromRelation(fd); setOpenForm("none"); }} className="space-y-1.5 rounded-md border border-amber-200 bg-white p-2 text-xs">
          <input name="title" required placeholder="Titre de l'item (court)" className="h-7 w-full rounded border border-neutral-300 px-2 text-xs" />
          <select name="relation_id" required defaultValue="" className="h-7 w-full rounded border border-neutral-300 px-2 text-xs">
            <option value="" disabled>Choisir une relation…</option>
            {relationsForPicker.map((r) => (
              <option key={r.relation_id} value={r.relation_id}>{r.label}</option>
            ))}
          </select>
          <label className="block text-[10px] font-semibold text-neutral-700">
            ST4+ co-contributors à attribuer (Cmd/Ctrl-clic) :
          </label>
          <select
            name="contributor_svlbh_id"
            multiple
            size={Math.min(6, Math.max(3, praticiennesForPicker.length))}
            className="w-full rounded border border-neutral-300 bg-white px-1 py-1 text-xs"
          >
            {praticiennesForPicker.map((p) => (
              <option key={p.svlbh_id} value={p.svlbh_id}>{p.label}</option>
            ))}
          </select>
          <textarea name="notes" rows={2} placeholder="Notes (optionnel)" className="w-full rounded border border-neutral-300 px-2 py-1 text-xs" />
          <button type="submit" className="w-full rounded bg-amber-700 px-2 py-1 text-[11px] font-semibold text-white hover:bg-amber-800">Ajouter</button>
        </form>
      ) : null}

      {canEdit && openForm === "energie" ? (
        <form action={async (fd) => { await addBacklogWithEnergie(fd); setOpenForm("none"); }} className="space-y-1.5 rounded-md border border-amber-200 bg-white p-2 text-xs">
          <input name="title" required placeholder="Titre de l'item" className="h-7 w-full rounded border border-neutral-300 px-2 text-xs" />
          <input name="source_description" required placeholder="Source perçue (ex: ancien associé, climat institutionnel)" className="h-7 w-full rounded border border-neutral-300 px-2 text-xs" />
          <div className="grid grid-cols-2 gap-1.5">
            <select name="target_praticienne_svlbh_id" defaultValue="" className="h-7 rounded border border-neutral-300 px-2 text-xs">
              <option value="">Cible : ST4+ (optionnel)</option>
              {praticiennesForPicker.map((p) => (
                <option key={p.svlbh_id} value={p.svlbh_id}>{p.label}</option>
              ))}
            </select>
            <select name="target_consultante_id" defaultValue="" className="h-7 rounded border border-neutral-300 px-2 text-xs">
              <option value="">Cible : consultante (opt)</option>
              {consultantesForPicker.map((c) => (
                <option key={c.consultante_id} value={c.consultante_id}>{c.label}</option>
              ))}
            </select>
          </div>
          <input name="intensity" type="number" min={0} max={100} placeholder="Intensité 0-100" className="h-7 w-full rounded border border-neutral-300 px-2 text-xs" />
          <textarea name="notes" rows={2} placeholder="Notes" className="w-full rounded border border-neutral-300 px-2 py-1 text-xs" />
          <button type="submit" className="w-full rounded bg-amber-700 px-2 py-1 text-[11px] font-semibold text-white hover:bg-amber-800">Ajouter</button>
        </form>
      ) : null}

      {items.length === 0 ? (
        <p className="px-2 py-3 text-center text-xs italic text-neutral-500">Backlog vide.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((it) => (
            <li key={it.id} className="space-y-1 rounded-md border border-amber-100 bg-white p-2 text-xs shadow-sm">
              <div className="flex items-start justify-between gap-1">
                <span className="font-semibold text-neutral-900">
                  {it.ref_relation_id ? "🪢 " : "⚡ "}{it.title}
                </span>
                <span
                  className="rounded px-1.5 py-0.5 text-[10px] font-bold text-white"
                  style={{ backgroundColor: AUTONOMY_LABELS[it.autonomy_level]?.color ?? "#6b7280" }}
                  title={AUTONOMY_LABELS[it.autonomy_level]?.label}
                >
                  {AUTONOMY_LABELS[it.autonomy_level]?.emoji}
                </span>
              </div>
              {it.relation ? (
                <p className="text-[10px] italic text-neutral-600">
                  {it.relation.relation_type ?? "?"} · {it.relation.target_name ?? "?"}
                </p>
              ) : null}
              {it.energie ? (
                <p className="text-[10px] italic text-neutral-600">
                  Source : {it.energie.source_description}
                  {it.energie.intensity != null ? ` · ${it.energie.intensity}/100` : ""}
                  {it.energie.target_name ? ` → ${it.energie.target_name}` : ""}
                </p>
              ) : null}
              {it.notes ? <p className="text-[10px] text-neutral-700">{it.notes}</p> : null}
              <div className="flex flex-wrap items-center gap-1 pt-1">
                <a
                  href={waLink(it)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-900 hover:bg-emerald-200"
                  title="Animer sur WhatsApp Cercle SR (z3)"
                >
                  📢 WA
                </a>
                {canEdit ? (
                  <>
                    <form action={setBacklogAutonomy} className="inline-flex">
                      <input type="hidden" name="id" value={it.id} />
                      <select
                        name="autonomy_level"
                        defaultValue={it.autonomy_level}
                        onChange={(e) => e.currentTarget.form?.requestSubmit()}
                        className="h-6 rounded border border-neutral-300 bg-white px-1 text-[10px]"
                      >
                        {Object.entries(AUTONOMY_LABELS).map(([k, v]) => (
                          <option key={k} value={k}>{v.emoji} {v.label}</option>
                        ))}
                      </select>
                    </form>
                    <form action={archiveBacklog} className="inline-flex">
                      <input type="hidden" name="id" value={it.id} />
                      <button type="submit" className="rounded border border-neutral-300 bg-white px-1.5 py-0.5 text-[10px] text-neutral-600 hover:bg-neutral-100" title="Archiver">
                        🗄
                      </button>
                    </form>
                  </>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
