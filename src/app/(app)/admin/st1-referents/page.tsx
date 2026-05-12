import type { Metadata } from "next";
import { requireOwner } from "@/lib/owner-gate";
import { createClient } from "@/lib/supabase/server";
import { addReferent, removeReferent } from "./actions";

export const metadata: Metadata = { title: "Admin · Référents ST1" };
export const dynamic = "force-dynamic";

const THEMES = [
  { key: "ENDO_REGLES", label: "Endométriose / Règles" },
  { key: "SCLEROSE", label: "Sclérose" },
  { key: "CANCER", label: "Cancer" },
  { key: "GLYCEMIE", label: "Glycémie / Diabète" },
  { key: "ALZHEIMER", label: "Alzheimer" },
  { key: "AUTRE", label: "Autre" },
] as const;

export default async function St1ReferentsAdminPage() {
  await requireOwner();
  const supabase = await createClient();

  // Tous les Cercle SR ACTIVE — candidats à devenir référents
  const { data: praticiennes } = await supabase
    .from("praticienne_profile")
    .select("svlbh_id, first_name, last_name, stx, cercle_lumiere_sr")
    .eq("pro_status", "ACTIVE")
    .eq("cercle_lumiere_sr", true)
    .order("first_name");

  // Tous les référents actuels avec jointure nom
  const { data: referents } = await supabase
    .from("st1_theme_referent")
    .select(
      "theme, referent_svlbh_id, praticienne_profile!referent_svlbh_id(svlbh_id, first_name, last_name, stx)",
    );

  type ReferentRow = {
    theme: string;
    referent_svlbh_id: string;
    praticienne_profile:
      | { svlbh_id: string; first_name: string | null; last_name: string | null; stx: string | null }
      | { svlbh_id: string; first_name: string | null; last_name: string | null; stx: string | null }[]
      | null;
  };

  const byTheme = new Map<string, Array<{ svlbh_id: string; name: string; stx: string | null }>>();
  for (const r of ((referents ?? []) as unknown as ReferentRow[])) {
    const profile = Array.isArray(r.praticienne_profile)
      ? r.praticienne_profile[0]
      : r.praticienne_profile;
    if (!profile) continue;
    const name = `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim();
    const list = byTheme.get(r.theme) ?? [];
    list.push({ svlbh_id: profile.svlbh_id, name, stx: profile.stx });
    byTheme.set(r.theme, list);
  }

  type Praticienne = { svlbh_id: string; first_name: string | null; last_name: string | null; stx: string | null };

  return (
    <main className="mx-auto max-w-4xl space-y-4 px-4 py-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
          ST6 · Owner
        </p>
        <h1 className="text-2xl font-bold tracking-tight">Référents ST1 par thème</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Anne, Cornelia, et autres ST3+ Cercle SR peuvent être assignées à un ou
          plusieurs thèmes ST1. Une référente voit dans <code>/admin/st1-pending</code>
          uniquement les inscriptions de ses thèmes. ST6 voit tout.
        </p>
      </header>

      <div className="space-y-3">
        {THEMES.map((t) => {
          const assigned = byTheme.get(t.key) ?? [];
          const assignedIds = new Set(assigned.map((a) => a.svlbh_id));
          const available = ((praticiennes ?? []) as Praticienne[]).filter(
            (p) => !assignedIds.has(p.svlbh_id),
          );
          return (
            <section
              key={t.key}
              className="space-y-2 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm"
            >
              <header className="flex items-baseline justify-between">
                <h2 className="text-base font-semibold">
                  {t.label}{" "}
                  <code className="font-mono text-[10px] text-neutral-400">{t.key}</code>
                </h2>
                <span className="text-xs text-neutral-500">
                  {assigned.length} référent{assigned.length !== 1 ? "s" : ""}
                </span>
              </header>

              {assigned.length === 0 ? (
                <p className="text-xs italic text-neutral-500">
                  Aucune référente assignée — seul ST6 voit les inscriptions de ce thème.
                </p>
              ) : (
                <ul className="divide-y divide-neutral-100">
                  {assigned.map((a) => (
                    <li key={a.svlbh_id} className="flex items-center justify-between py-1.5">
                      <span className="text-sm">
                        {a.name}{" "}
                        {a.stx && (
                          <span className="font-mono text-[10px] text-neutral-500">
                            · {a.stx}
                          </span>
                        )}
                      </span>
                      <form action={removeReferent}>
                        <input type="hidden" name="theme" value={t.key} />
                        <input type="hidden" name="svlbh_id" value={a.svlbh_id} />
                        <button
                          type="submit"
                          className="text-xs text-red-600 hover:underline"
                        >
                          Retirer
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              )}

              {available.length > 0 && (
                <form action={addReferent} className="flex items-center gap-2 pt-2">
                  <input type="hidden" name="theme" value={t.key} />
                  <select
                    name="svlbh_id"
                    required
                    defaultValue=""
                    className="h-8 flex-1 rounded border border-neutral-200 bg-white px-2 text-xs"
                  >
                    <option value="" disabled>
                      Choisir une référente à ajouter…
                    </option>
                    {available.map((p) => (
                      <option key={p.svlbh_id} value={p.svlbh_id}>
                        {p.first_name} {p.last_name} ({p.stx ?? "—"})
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="rounded bg-blue-600 px-2 py-1 text-xs font-semibold text-white hover:bg-blue-700"
                  >
                    + Ajouter
                  </button>
                </form>
              )}
            </section>
          );
        })}
      </div>
    </main>
  );
}
