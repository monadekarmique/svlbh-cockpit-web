// DESA — Dark Entities & Spirit Attachments — capacités de libération
// accordées dynamiquement par l'Owner aux participantes au Cercle. Affiché
// top-right sur les cartes /shamanes (cockpit). DEC Patrick 2026-05-29.
//
// Source canonique : tables Supabase `desa_capacity_atom` (catalogue 8 codes
// + label + description) et `praticienne_desa_capacity` (join dynamique).

import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Système de capacités. DESA = Dark Entities & Spirit Attachments (rouge,
 *  7 codes DC/TFEC/ES/SEI/ILSS/DR/RI). BDEC = clone parallèle pour les
 *  consciences gisantes (vert, 4 codes DEII/EP/Des/Dra). DEC Patrick 2026-05-29. */
export type CapacitySystem = "DESA" | "BDEC";

export type DesaAtom = {
  code: string;
  label: string;
  description: string | null;
  sortOrder: number;
  /** Système d'appartenance (DESA ou BDEC). */
  system: CapacitySystem;
};

/** Capacités DESA accordées à une praticienne (par code). */
export type DesaCapacities = string[];

/** État DESA d'une praticienne : codes accordés + codes karmiques à libérer. */
export type DesaState = {
  granted: string[];
  karmic: string[];
};

/**
 * Catalogue des 8 codes DESA (label/description/ordre). Dédupliqué par
 * render via React `cache()`.
 */
export const getDesaCatalog = cache(
  async (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sb: SupabaseClient<any, any, any>,
  ): Promise<Record<string, DesaAtom>> => {
    const { data, error } = await sb
      .from("desa_capacity_atom")
      .select("code, label, description, sort_order, system")
      .order("sort_order");
    if (error || !data) return {};
    const out: Record<string, DesaAtom> = {};
    for (const row of data as Array<{
      code: string;
      label: string;
      description: string | null;
      sort_order: number;
      system: string;
    }>) {
      const sys: CapacitySystem = row.system === "BDEC" ? "BDEC" : "DESA";
      out[row.code] = {
        code: row.code,
        label: row.label,
        description: row.description,
        sortOrder: row.sort_order,
        system: sys,
      };
    }
    return out;
  },
);

/**
 * État DESA par praticienne (svlbh_id → { granted, karmic } triés par
 * sort_order du catalogue). Une ligne avec granted=false ET karmic=false
 * est nettoyée côté server action — donc toute ligne ici a au moins un
 * des deux axes à true.
 */
export async function fetchDesaState(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sb: SupabaseClient<any, any, any>,
): Promise<Record<string, DesaState>> {
  const { data, error } = await sb
    .from("praticienne_desa_capacity")
    .select(
      "svlbh_id, capacity_code, granted, karmic_to_liberate, desa_capacity_atom:capacity_code ( sort_order )",
    );
  if (error || !data) return {};

  type Row = {
    svlbh_id: string;
    capacity_code: string;
    granted: boolean | null;
    karmic_to_liberate: boolean | null;
    desa_capacity_atom:
      | { sort_order: number }
      | { sort_order: number }[]
      | null;
  };

  type Entry = { code: string; order: number; granted: boolean; karmic: boolean };
  const map: Record<string, Entry[]> = {};
  for (const row of data as unknown as Row[]) {
    const atom = Array.isArray(row.desa_capacity_atom)
      ? row.desa_capacity_atom[0]
      : row.desa_capacity_atom;
    if (!row.svlbh_id || !row.capacity_code) continue;
    if (!map[row.svlbh_id]) map[row.svlbh_id] = [];
    map[row.svlbh_id].push({
      code: row.capacity_code,
      order: atom?.sort_order ?? 999,
      granted: row.granted ?? false,
      karmic: row.karmic_to_liberate ?? false,
    });
  }

  const out: Record<string, DesaState> = {};
  for (const k of Object.keys(map)) {
    const sorted = map[k].sort((a, b) => a.order - b.order);
    out[k] = {
      granted: sorted.filter((x) => x.granted).map((x) => x.code),
      karmic: sorted.filter((x) => x.karmic).map((x) => x.code),
    };
  }
  return out;
}

/** Compatibilité — codes accordés uniquement, sans l'axe karmique. */
export async function fetchDesaCapacities(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sb: SupabaseClient<any, any, any>,
): Promise<Record<string, DesaCapacities>> {
  const state = await fetchDesaState(sb);
  const out: Record<string, DesaCapacities> = {};
  for (const k of Object.keys(state)) out[k] = state[k].granted;
  return out;
}
