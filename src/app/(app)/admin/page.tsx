import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { setPraticienneStx, setPraticienneProStatus } from "./actions";

export const metadata: Metadata = { title: "Admin" };
export const dynamic = "force-dynamic";

// DEC Patrick 2026-05-20 — Cockpit Admin disponible pour ST5 (Anne) et ST6.
// ST5 ne peut pas toucher au stx/statut des ST5/ST6 (gardé côté actions).
async function requireAdminStx(): Promise<"ST5" | "ST6"> {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");
  const { data: me } = await sb
    .from("praticienne_profile")
    .select("stx")
    .eq("supabase_user_id", user.id)
    .maybeSingle();
  if (me?.stx !== "ST5" && me?.stx !== "ST6") redirect("/dashboard");
  return me.stx as "ST5" | "ST6";
}

type Praticienne = {
  svlbh_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  code_praticien: number | null;
  stx: string | null;
  tx: string | null;
  pro_status: string | null;
  cercle_lumiere_sr: boolean | null;
  certification_level: string | null;
};

const STAGES = ["ST0", "ST1", "ST2", "ST3", "ST4", "ST5", "ST6"] as const;
type Stage = (typeof STAGES)[number];

const STAGE_META: Record<Stage, { label: string; bg: string; ring: string; emoji: string }> = {
  ST0: { label: "Lead · découverte", bg: "bg-neutral-50", ring: "ring-neutral-300", emoji: "✨" },
  ST1: { label: "Cohorte initiation", bg: "bg-sky-50", ring: "ring-sky-300", emoji: "🌱" },
  ST2: { label: "Formation pédagogique", bg: "bg-emerald-50", ring: "ring-emerald-300", emoji: "🌿" },
  ST3: { label: "ST3 en certification", bg: "bg-amber-50", ring: "ring-amber-300", emoji: "🌾" },
  ST4: { label: "Praticienne MyShamanFamily", bg: "bg-fuchsia-50", ring: "ring-fuchsia-300", emoji: "🌸" },
  ST5: { label: "Superviseure ST5", bg: "bg-violet-50", ring: "ring-violet-300", emoji: "🔮" },
  ST6: { label: "Owner", bg: "bg-blue-50", ring: "ring-blue-400", emoji: "👑" },
};

const PRO_STATUS_TONE: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-800",
  INACTIVE: "bg-neutral-200 text-neutral-700",
  REVOKED: "bg-rose-100 text-rose-800",
};

export default async function AdminPage() {
  const actorStx = await requireAdminStx();
  const isOwner = actorStx === "ST6";

  const sb = await createClient();
  const { data, error } = await sb
    .from("praticienne_profile")
    .select(
      "svlbh_id, first_name, last_name, email, code_praticien, stx, tx, pro_status, cercle_lumiere_sr, certification_level",
    )
    .order("stx", { ascending: false })
    .order("code_praticien", { ascending: true, nullsFirst: false });

  const praticiennes = (data ?? []) as Praticienne[];

  // Group par stx
  const byStage = new Map<Stage, Praticienne[]>();
  for (const s of STAGES) byStage.set(s, []);
  const sansStage: Praticienne[] = [];
  for (const p of praticiennes) {
    if (p.stx && (STAGES as readonly string[]).includes(p.stx)) {
      byStage.get(p.stx as Stage)!.push(p);
    } else {
      sansStage.push(p);
    }
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
          {isOwner ? "ST6 · Owner" : "ST5 · Admin"}
        </p>
        <h1 className="text-2xl font-bold tracking-tight">🛠️ Admin · Attribution de stage</h1>
        <p className="mt-1 text-sm text-neutral-600">
          {praticiennes.length} praticienne{praticiennes.length > 1 ? "s" : ""} au total ·
          {" "}
          {praticiennes.filter((p) => p.pro_status === "ACTIVE").length} ACTIVE,{" "}
          {praticiennes.filter((p) => p.pro_status === "REVOKED").length} REVOKED.{" "}
          Chaque changement est tracé dans <Link href="/compliance/audit-log" className="underline">audit_log</Link>.
        </p>
        {!isOwner && (
          <p className="mt-2 inline-block rounded-lg bg-amber-50 px-3 py-1 text-[11px] text-amber-900 ring-1 ring-amber-200">
            👁 ST5 · tu peux gérer ST0-ST4 mais pas toucher aux ST5/ST6 (réservé Owner).
          </p>
        )}
      </header>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
          Erreur fetch : {error.message}
        </div>
      )}

      {/* Stages en ordre décroissant (ST6 d'abord, ST0 en bas) */}
      {[...STAGES].reverse().map((s) => {
        const meta = STAGE_META[s];
        const list = byStage.get(s) ?? [];
        return (
          <section
            key={s}
            className={`rounded-xl border-2 p-4 ${meta.bg} ring-1 ${meta.ring}`}
          >
            <header className="mb-3 flex items-baseline justify-between gap-2">
              <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight">
                <span aria-hidden>{meta.emoji}</span>
                <span>{s}</span>
                <span className="text-sm font-normal text-neutral-600">
                  · {meta.label}
                </span>
              </h2>
              <span className="text-xs font-mono text-neutral-500">{list.length}</span>
            </header>
            {list.length === 0 ? (
              <p className="text-xs italic text-neutral-400">Aucune praticienne</p>
            ) : (
              <ul className="space-y-2">
                {list.map((p) => (
                  <PraticienneRow key={p.svlbh_id} p={p} isOwner={isOwner} />
                ))}
              </ul>
            )}
          </section>
        );
      })}

      {sansStage.length > 0 && (
        <section className="rounded-xl border-2 border-dashed border-rose-300 bg-rose-50/50 p-4">
          <h2 className="text-base font-bold text-rose-900">
            ⚠ Sans stage attribué ({sansStage.length})
          </h2>
          <p className="mb-3 text-xs text-rose-800">
            Ces praticiennes n&apos;ont pas de <code>stx</code> défini — à attribuer en priorité.
          </p>
          <ul className="space-y-2">
            {sansStage.map((p) => (
              <PraticienneRow key={p.svlbh_id} p={p} isOwner={isOwner} />
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}

function PraticienneRow({ p, isOwner }: { p: Praticienne; isOwner: boolean }) {
  // ST5 ne peut pas modifier une ST5/ST6 — on rend la row en lecture seule.
  const locked = !isOwner && (p.stx === "ST5" || p.stx === "ST6");
  const displayName = `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || "—";
  const statusClass = p.pro_status
    ? PRO_STATUS_TONE[p.pro_status] ?? "bg-neutral-100 text-neutral-700"
    : "bg-neutral-100 text-neutral-500";

  return (
    <li className="rounded-lg border border-white bg-white/80 p-3 backdrop-blur">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-semibold text-neutral-900">{displayName}</span>
        {p.code_praticien != null && (
          <span className="font-mono text-[10px] text-neutral-400">
            #{String(p.code_praticien).padStart(5, "0")}
          </span>
        )}
        {p.tx && (
          <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-900">
            {p.tx}
          </span>
        )}
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusClass}`}
        >
          {p.pro_status ?? "?"}
        </span>
        {p.cercle_lumiere_sr && (
          <span className="text-[11px]" title="Cercle de Lumière SR">
            ◉
          </span>
        )}
        {p.email && (
          <span className="ml-auto text-[10px] text-neutral-400">{p.email}</span>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {locked ? (
          <span className="text-[10px] italic text-neutral-500">
            🔒 Réservé Owner ST6 (modification ST5/ST6 désactivée pour Admin ST5)
          </span>
        ) : (
          <>
            {/* Form 1 : changer stx */}
            <form action={setPraticienneStx} className="flex items-center gap-1">
              <input type="hidden" name="svlbh_id" value={p.svlbh_id} />
              <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                Stage :
              </label>
              <select
                name="new_stx"
                defaultValue={p.stx ?? ""}
                className="rounded border border-neutral-300 bg-white px-1.5 py-0.5 text-xs"
              >
                <option value="" disabled>—</option>
                {STAGES.map((s) => {
                  // Si ST5 admin, on bloque ST5/ST6 dans le dropdown aussi.
                  const stageDisabled = !isOwner && (s === "ST5" || s === "ST6");
                  return (
                    <option key={s} value={s} disabled={stageDisabled}>
                      {s}{stageDisabled ? " 🔒" : ""}
                    </option>
                  );
                })}
              </select>
              <button
                type="submit"
                className="rounded bg-blue-600 px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-blue-700"
              >
                Appliquer
              </button>
            </form>

            {/* Form 2 : changer pro_status */}
            <form action={setPraticienneProStatus} className="flex items-center gap-1">
              <input type="hidden" name="svlbh_id" value={p.svlbh_id} />
              <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                Statut :
              </label>
              <select
                name="new_pro_status"
                defaultValue={p.pro_status ?? "ACTIVE"}
                className="rounded border border-neutral-300 bg-white px-1.5 py-0.5 text-xs"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="REVOKED">REVOKED</option>
              </select>
              <button
                type="submit"
                className="rounded bg-neutral-700 px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-neutral-900"
              >
                Appliquer
              </button>
            </form>
          </>
        )}
      </div>
    </li>
  );
}
