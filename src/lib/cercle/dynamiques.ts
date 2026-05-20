// Dynamiques SVLBH — schémas énergétiques nommés attribués aux praticiennes.
// Source : table svlbh_dynamique + jonction praticienne_dynamique (Supabase).
// DEC Patrick 2026-05-20.
//
// Distinct des cercles akashiques dhātu (lib/cercle/akashiques.ts) — ces
// dernières sont statiques (membership par incarnation) ; les dynamiques sont
// dynamiques (activées/désactivées par Owner ST6).

import type { SupabaseClient } from "@supabase/supabase-js";

export type DynamiqueAxis = "BOIS" | "FEU" | "TERRE" | "METAL" | "EAU" | "MULTI" | null;

export type DynamiqueChip = {
  id: string;
  slug: string;
  short_code: string;
  name: string;
  axis_mtc: DynamiqueAxis;
  icon: string | null;
  activated_at: string;
};

export type DynamiquesByPraticienne = Record<string, DynamiqueChip[]>;

/** Style par axe MTC : couleur des chips dynamique. */
export const DYNAMIQUE_AXIS_TONE: Record<NonNullable<DynamiqueAxis>, { bg: string; text: string; ring: string }> = {
  BOIS:  { bg: "bg-emerald-50",  text: "text-emerald-900", ring: "ring-emerald-300" },
  FEU:   { bg: "bg-rose-50",     text: "text-rose-900",    ring: "ring-rose-300" },
  TERRE: { bg: "bg-amber-50",    text: "text-amber-900",   ring: "ring-amber-300" },
  METAL: { bg: "bg-slate-50",    text: "text-slate-900",   ring: "ring-slate-300" },
  EAU:   { bg: "bg-blue-50",     text: "text-blue-900",    ring: "ring-blue-300" },
  MULTI: { bg: "bg-violet-50",   text: "text-violet-900",  ring: "ring-violet-300" },
};

/**
 * Fetch toutes les attributions dynamique → praticienne, retourné en map
 * indexée par svlbh_id (UUID). Une praticienne peut avoir 0..N dynamiques.
 *
 * RLS : SELECT autorisé si is_st4_plus() OU svlbh_id = auth_svlbh_id()
 * (i.e. ST4+ voient toutes les attributions, sinon on ne voit que les
 * siennes — ici on est gated cockpit ST6 donc on voit tout).
 */
export async function fetchDynamiquesByPraticienne(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
): Promise<DynamiquesByPraticienne> {
  const { data, error } = await supabase
    .from("praticienne_dynamique")
    .select(`
      svlbh_id,
      activated_at,
      svlbh_dynamique:dynamique_id (
        id, slug, short_code, name, axis_mtc, icon
      )
    `)
    .order("activated_at", { ascending: true });

  if (error || !data) return {};

  // Supabase typage : l'embedded peut être inféré comme objet OU array selon
  // la relation. On normalise via unknown puis manipulation manuelle.
  type EmbeddedDyn = {
    id: string;
    slug: string;
    short_code: string;
    name: string;
    axis_mtc: DynamiqueAxis;
    icon: string | null;
  };
  type Row = {
    svlbh_id: string;
    activated_at: string;
    svlbh_dynamique: EmbeddedDyn | EmbeddedDyn[] | null;
  };

  const map: DynamiquesByPraticienne = {};
  for (const row of data as unknown as Row[]) {
    const dyn = Array.isArray(row.svlbh_dynamique)
      ? row.svlbh_dynamique[0]
      : row.svlbh_dynamique;
    if (!dyn) continue;
    const chip: DynamiqueChip = {
      id: dyn.id,
      slug: dyn.slug,
      short_code: dyn.short_code,
      name: dyn.name,
      axis_mtc: dyn.axis_mtc,
      icon: dyn.icon,
      activated_at: row.activated_at,
    };
    if (!map[row.svlbh_id]) map[row.svlbh_id] = [];
    map[row.svlbh_id].push(chip);
  }
  return map;
}
