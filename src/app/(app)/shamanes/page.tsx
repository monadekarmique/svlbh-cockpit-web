// Thérapeutes SVLBH du Cercle — vue cockpit avec :
// - compteurs ressentis ST1/ST2 actives (felt_count)
// - 3 sections : Thérapeutes actives / Thérapeutes cachées / Apprenantes
// - chaque ST4+ peut toggle son statut quotidien (active ↔ cachée)
// - badges Tx · Cx · ST à gauche du nom
// - Patrick (ST6) peut poser un sticker de couleur + nb d'étapes à libérer
// - lien WhatsApp Cercle de Lumière (z3) en haut
//
// DEC Patrick 2026-05-18 : source = DB (plus de fetchShamanesPending Make).

import Link from "next/link";
import { APPRENANTES, TIER_LABEL, TIER_COLOR, SUPERVISORS_VIRTUAL } from "@/lib/cercle/shamanes";
import type { ParticipantTier } from "@/lib/cercle/shamanes";
import { lookupMembership, DHATU_META } from "@/lib/cercle/akashiques";
import type { AkashiqueMembership } from "@/lib/cercle/akashiques";
import { TherapeutesDnDZonesWrapper } from "./therapeutes-dnd-wrapper";
import { createClient } from "@/lib/supabase/server";
import { setFeltCount, toggleFeltLike } from "./felt-actions";

const WHATSAPP_CERCLE_HREF = "https://wa.me/41799302800";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Therapeute = {
  svlbh_id: string;
  first_name: string | null;
  last_name: string | null;
  code_praticien: number | null;
  stx: string | null;
  tx: string | null;
  capacity_anchor: string | null;
  cercle_lumiere_sr: boolean | null;
  status: "active" | "hidden"; // résolu pour aujourd'hui (default active)
  attention_color: string | null;
  attention_steps: number | null;
};

// Si updated_at < today (Europe/Zurich), on considère un reset implicite
// vers 'active'. Le serveur calcule ça au render.
function statusEffective(rawStatus: string | null, updatedAt: string | null): "active" | "hidden" {
  if (rawStatus !== "active" && rawStatus !== "hidden") return "active";
  if (!updatedAt) return rawStatus;
  // Compare en date Europe/Zurich
  const fmt = new Intl.DateTimeFormat("fr-CH", {
    timeZone: "Europe/Zurich",
    year: "numeric", month: "2-digit", day: "2-digit",
  });
  const todayZurich = fmt.format(new Date());
  const updatedZurich = fmt.format(new Date(updatedAt));
  if (updatedZurich !== todayZurich) return "active";
  return rawStatus;
}

export default async function ShamanesPage() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();

  const { data: me } = user
    ? await sb
        .from("praticienne_profile")
        .select("svlbh_id, stx, cercle_lumiere_sr")
        .eq("supabase_user_id", user.id)
        .maybeSingle()
    : { data: null };
  const mySvlbhId = me?.svlbh_id as string | undefined;
  const myStx = me?.stx as string | null;
  const isOwner = myStx === "ST6";
  const canEditFelt = myStx === "ST4" || myStx === "ST5" || myStx === "ST6";

  // 1. Toutes les thérapeutes ST4+ ACTIVE depuis la DB (plus de Make)
  const { data: therapeutesRaw } = await sb
    .from("praticienne_profile")
    .select("svlbh_id, first_name, last_name, code_praticien, stx, tx, capacity_anchor, cercle_lumiere_sr")
    .eq("pro_status", "ACTIVE")
    .in("stx", ["ST4", "ST5", "ST6"])
    .order("code_praticien", { ascending: true, nullsFirst: false });

  // 2. Daily status pour chaque
  const { data: dailyRaw } = await sb
    .from("praticienne_daily_status")
    .select("svlbh_id, status, updated_at, attention_color, attention_steps");
  type DailyRow = {
    svlbh_id: string; status: string; updated_at: string;
    attention_color: string | null; attention_steps: number | null;
  };
  const dailyMap = new Map<string, DailyRow>(
    ((dailyRaw ?? []) as DailyRow[]).map((r) => [r.svlbh_id, r]),
  );

  const therapeutes: Therapeute[] = ((therapeutesRaw ?? []) as Array<{
    svlbh_id: string; first_name: string | null; last_name: string | null;
    code_praticien: number | null; stx: string | null; tx: string | null;
    capacity_anchor: string | null; cercle_lumiere_sr: boolean | null;
  }>).map((p) => {
    const d = dailyMap.get(p.svlbh_id);
    return {
      svlbh_id: p.svlbh_id,
      first_name: p.first_name,
      last_name: p.last_name,
      code_praticien: p.code_praticien,
      stx: p.stx,
      tx: p.tx,
      capacity_anchor: p.capacity_anchor,
      cercle_lumiere_sr: p.cercle_lumiere_sr,
      status: statusEffective(d?.status ?? null, d?.updated_at ?? null),
      attention_color: d?.attention_color ?? null,
      attention_steps: d?.attention_steps ?? null,
    };
  });

  const activesTherapeutes = therapeutes.filter((t) => t.status === "active");
  const hiddenTherapeutes = therapeutes.filter((t) => t.status === "hidden");

  // 3. Compteurs felt (ST1 / ST2 actives)
  const { data: feltRows } = await sb
    .from("cercle_felt_count")
    .select("type, felt_value, likes_count")
    .order("type");
  const felt = Object.fromEntries(
    ((feltRows ?? []) as Array<{ type: string; felt_value: number; likes_count: number }>).map((r) => [r.type, r]),
  );
  const { data: myLikes } = mySvlbhId
    ? await sb
        .from("cercle_felt_count_like")
        .select("felt_count_type")
        .eq("liker_svlbh_id", mySvlbhId)
    : { data: [] };
  const likedByMe = new Set(((myLikes ?? []) as Array<{ felt_count_type: string }>).map((l) => l.felt_count_type));

  return (
    <div className="space-y-5">
      <nav className="relative flex items-center">
        <Link href="/dashboard" className="text-sm text-neutral-500 hover:text-neutral-900">
          ← Cockpit
        </Link>
        <a
          href={WHATSAPP_CERCLE_HREF}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute left-1/2 -translate-x-1/2 text-sm font-semibold text-emerald-700 hover:text-emerald-900 hover:underline"
          title="WhatsApp Cercle de Lumière SVLBH (z3 · +41 79 930 28 00)"
        >
          💬 WhatsApp · Cercle de Lumière
        </a>
      </nav>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight text-blue-950">
            👥 Thérapeutes SVLBH du Cercle
          </h1>
          <p className="mt-1 text-sm text-neutral-700">
            {therapeutes.length} thérapeute{therapeutes.length > 1 ? "s" : ""} ST4+ ·{" "}
            {activesTherapeutes.length} active{activesTherapeutes.length > 1 ? "s" : ""},{" "}
            {hiddenTherapeutes.length} cachée{hiddenTherapeutes.length > 1 ? "s" : ""} aujourd&apos;hui
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:w-[22rem] sm:flex-shrink-0 sm:gap-3">
          {(["ST1", "ST2"] as const).map((type) => {
            const f = felt[type];
            const val = f?.felt_value ?? 0;
            const likes = f?.likes_count ?? 0;
            const isLiked = likedByMe.has(type);
            return (
              <div key={type} className="rounded-xl border border-blue-200 bg-blue-50/50 p-3">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-blue-900">{type} actives</p>
                  <span className="text-[9px] italic text-neutral-500">ressenti</span>
                </div>
                {canEditFelt ? (
                  <form action={setFeltCount} className="mt-1 flex items-center gap-1.5">
                    <input type="hidden" name="type" value={type} />
                    <input
                      name="value"
                      type="number"
                      min={0}
                      max={9999}
                      defaultValue={val}
                      className="h-9 w-16 rounded-lg border border-blue-300 bg-white px-2 font-mono text-xl font-extrabold tabular-nums text-blue-900"
                    />
                    <button
                      type="submit"
                      className="h-9 rounded-lg bg-blue-900 px-2 text-[11px] font-semibold text-white hover:bg-blue-800"
                    >
                      Sauver
                    </button>
                  </form>
                ) : (
                  <p className="mt-1 font-mono text-2xl font-extrabold tabular-nums text-blue-900">{val}</p>
                )}
                <form action={toggleFeltLike} className="mt-1.5 flex items-center justify-between">
                  <input type="hidden" name="type" value={type} />
                  <button
                    type="submit"
                    title={isLiked ? "Retirer mon like" : "Confirmer ce ressenti"}
                    className={
                      "rounded-full px-2 py-0.5 text-[11px] transition " +
                      (isLiked
                        ? "bg-rose-500 text-white shadow-sm hover:bg-rose-600"
                        : "border border-neutral-300 bg-white text-neutral-700 hover:bg-rose-50")
                    }
                  >
                    {isLiked ? "❤️ liké" : "🤍 j'aime"}
                  </button>
                  <span className="font-mono text-[10px] text-neutral-500">
                    {likes} like{likes > 1 ? "s" : ""}
                  </span>
                </form>
              </div>
            );
          })}
        </div>
      </header>

      {/* Cartes virtuelles Patrick × 2 (superviseurs) — toujours en tête actives */}
      <section className="space-y-2">
        <h2 className="text-base font-semibold text-blue-900">
          🔵 Superviseurs ({SUPERVISORS_VIRTUAL.length})
        </h2>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {SUPERVISORS_VIRTUAL.map((s) => (
            <li
              key={s.code}
              className="flex items-center gap-3 rounded-xl border bg-white p-4 shadow-sm"
              style={{ borderLeftColor: s.color, borderLeftWidth: 4 }}
            >
              {s.cercle_number != null ? (
                <span
                  className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-sm font-extrabold text-white"
                  style={{ backgroundColor: s.color }}
                  title={`n°${s.cercle_number} du Cercle`}
                >
                  {s.cercle_number}
                </span>
              ) : (
                <span className="text-xl">{s.emoji}</span>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-neutral-900">
                  Patrick Bays{" "}
                  <span className="font-mono text-[10px] text-neutral-500">
                    #{s.code}
                  </span>
                </p>
                <p className="mt-0.5 text-[11px] font-semibold" style={{ color: s.color }}>
                  {s.role_label}
                </p>
                <p className="mt-0.5 text-[9px] italic text-neutral-500">
                  Reconnaissance Shamane Cercle de Lumière SR · certifié T3
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Sections 1 & 2 : Thérapeutes actives / cachées avec drag-and-drop */}
      <TherapeutesDnDZonesWrapper
        therapeutes={therapeutes}
        mySvlbhId={mySvlbhId}
        isOwner={isOwner}
      />

      {/* Apprenantes — 3 sous-sections (visibles Owner uniquement) */}
      {isOwner ? (
        <ApprentantesGroupedSection />
      ) : null}
    </div>
  );
}

function ApprentantesGroupedSection() {
  const groups: Array<{ tier: ParticipantTier; emoji: string; title: string }> = [
    { tier: "formation", emoji: "🌱", title: "Apprenantes en formation" },
    { tier: "parcours-passif", emoji: "💤", title: "Shamanes passives de Cercles akashiques actifs" },
    { tier: "cercle-akashique", emoji: "🌌", title: "Shamanes du Cercle akashiques" },
  ];
  return (
    <div className="space-y-5 pt-2">
      <p className="text-[10px] font-normal text-neutral-500">
        🔒 Vue Owner — non visible aux thérapeutes
      </p>
      {groups.map((g) => {
        const items = APPRENANTES.filter((a) => a.tier === g.tier);
        if (items.length === 0) return null;
        const c = TIER_COLOR[g.tier];
        return (
          <section key={g.tier} className="space-y-2">
            <h2 className="text-base font-semibold" style={{ color: c }}>
              {g.emoji} {g.title} ({items.length})
            </h2>
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {items.map((a) => {
                const memb = lookupMembership(a.name);
                return (
                  <li
                    key={a.name}
                    className="flex items-start gap-3 rounded-xl border bg-white p-4 shadow-sm"
                    style={{ borderLeftColor: c, borderLeftWidth: 4 }}
                  >
                    <span className="text-2xl">{a.emoji ?? "·"}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-neutral-900">{a.name}</p>
                      <p className="mt-0.5 text-[11px] font-semibold" style={{ color: c }}>
                        {TIER_LABEL[a.tier]}
                      </p>
                      <CerclesAkashiquesChips membership={memb} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

/** Chips des cercles akashiques d'une personne (membres + formation).
 * Compact, 1 chip par cercle, emoji+label, couleur du dhātu principal.
 * DEC Patrick 2026-05-18. */
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

