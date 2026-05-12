import type { Metadata } from "next";
import { requireOwner } from "@/lib/owner-gate";
import { createClient } from "@/lib/supabase/server";
import { KanbanBoard, type Program, type Referent, type Praticienne } from "./kanban-board";

export const metadata: Metadata = { title: "Admin · Programmes ST1" };
export const dynamic = "force-dynamic";

export default async function St1ReferentsAdminPage() {
  await requireOwner();
  const supabase = await createClient();

  const { data: progRows } = await supabase
    .from("st1_program")
    .select("code, label, phase, sort_order")
    .order("phase")
    .order("sort_order");

  const { data: praticiennes } = await supabase
    .from("praticienne_profile")
    .select("svlbh_id, first_name, last_name, stx, cercle_lumiere_sr")
    .eq("pro_status", "ACTIVE")
    .eq("cercle_lumiere_sr", true)
    .order("first_name");

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

  const referentsByTheme: Record<string, Referent[]> = {};
  for (const r of ((referents ?? []) as unknown as ReferentRow[])) {
    const profile = Array.isArray(r.praticienne_profile)
      ? r.praticienne_profile[0]
      : r.praticienne_profile;
    if (!profile) continue;
    const name = `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim();
    if (!referentsByTheme[r.theme]) referentsByTheme[r.theme] = [];
    referentsByTheme[r.theme].push({ svlbh_id: profile.svlbh_id, name, stx: profile.stx });
  }

  const programs = (progRows ?? []) as Program[];
  const pratList = (praticiennes ?? []) as Praticienne[];

  return (
    <main className="mx-auto max-w-7xl space-y-4 px-4 py-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
          ST6 · Owner
        </p>
        <h1 className="text-2xl font-bold tracking-tight">Programmes ST1 — Kanban agile</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Glisse-dépose un programme entre <strong>Backlog</strong> →{" "}
          <strong>Pre-sprint</strong> → <strong>Sprint actif</strong>. Sur chaque carte, assigne
          ou retire les référentes (ST3+ Cercle SR). Une référente voit dans{" "}
          <code>/admin/st1-pending</code> uniquement les inscriptions{" "}
          <strong>vibe_check=APPROVED</strong> de ses programmes.
        </p>
      </header>

      <KanbanBoard
        programs={programs}
        referentsByTheme={referentsByTheme}
        praticiennes={pratList}
      />
    </main>
  );
}
