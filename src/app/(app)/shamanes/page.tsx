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
import { createClient } from "@/lib/supabase/server";
import { setFeltCount, toggleFeltLike } from "./felt-actions";
import { setMyDailyStatus, setAttentionSticker, clearAttentionSticker } from "./daily-status-actions";

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

      {/* Section 1 : Thérapeutes actives */}
      <SectionTherapeutes
        title={`✨ Thérapeutes actives (${activesTherapeutes.length})`}
        therapeutes={activesTherapeutes}
        mySvlbhId={mySvlbhId}
        isOwner={isOwner}
        targetStatus="hidden"
        toggleLabel="Me cacher aujourd'hui"
      />

      {/* Section 2 : Thérapeutes cachées */}
      <SectionTherapeutes
        title={`🌙 Thérapeutes cachées (${hiddenTherapeutes.length})`}
        therapeutes={hiddenTherapeutes}
        mySvlbhId={mySvlbhId}
        isOwner={isOwner}
        targetStatus="active"
        toggleLabel="Redevenir active"
        emptyHint="Aucune cachée aujourd'hui."
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
    { tier: "parcours-passif", emoji: "💤", title: "Apprenantes en parcours passives" },
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
              {items.map((a) => (
                <li
                  key={a.name}
                  className="flex items-center gap-3 rounded-xl border bg-white p-4 shadow-sm"
                  style={{ borderLeftColor: c, borderLeftWidth: 4 }}
                >
                  <span className="text-2xl">{a.emoji ?? "·"}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-neutral-900">{a.name}</p>
                    <p className="mt-0.5 text-[11px] font-semibold" style={{ color: c }}>
                      {TIER_LABEL[a.tier]}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function SectionTherapeutes({
  title, therapeutes, mySvlbhId, isOwner, targetStatus, toggleLabel, emptyHint,
}: {
  title: string;
  therapeutes: Therapeute[];
  mySvlbhId: string | undefined;
  isOwner: boolean;
  targetStatus: "active" | "hidden";
  toggleLabel: string;
  emptyHint?: string;
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-semibold text-blue-900">{title}</h2>
      {therapeutes.length === 0 ? (
        <p className="text-xs italic text-neutral-500">{emptyHint ?? "—"}</p>
      ) : (
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {therapeutes.map((t) => (
            <TherapeuteCard
              key={t.svlbh_id}
              t={t}
              isMe={mySvlbhId === t.svlbh_id}
              isOwner={isOwner}
              targetStatusOnToggle={targetStatus}
              toggleLabel={toggleLabel}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function TherapeuteCard({
  t, isMe, isOwner, targetStatusOnToggle, toggleLabel,
}: {
  t: Therapeute;
  isMe: boolean;
  isOwner: boolean;
  targetStatusOnToggle: "active" | "hidden";
  toggleLabel: string;
}) {
  const stickerStyle: React.CSSProperties = t.attention_color
    ? { borderLeftColor: t.attention_color, borderLeftWidth: 6 }
    : { borderLeftColor: "#cbd5e1", borderLeftWidth: 4 };

  const displayName = `${t.first_name ?? ""} ${t.last_name ?? ""}`.trim() || "—";

  return (
    <li
      className="flex flex-col gap-2 rounded-xl border bg-white p-4 shadow-sm"
      style={stickerStyle}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-start gap-2">
          {/* Badges Tx · Cx · ST à gauche du nom */}
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
          </div>
        </div>

        {/* Sticker attention — N étapes à libérer */}
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

      {/* Toggle quotidien : visible uniquement à la praticienne elle-même OU à Patrick */}
      {(isMe || isOwner) ? (
        <form action={setMyDailyStatus}>
          <input type="hidden" name="status" value={targetStatusOnToggle} />
          {/* Si ST6 et c'est PAS soi, il faut un autre payload mais notre policy
              upsert_own gère ST6 → on triche pas, le form pose le status pour MOI
              uniquement. Patrick utilise le toggle dans son propre profil. */}
          {isMe ? (
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
          ) : null}
        </form>
      ) : null}

      {/* Sticker color picker : visible uniquement à Patrick (ST6) */}
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
    </li>
  );
}
