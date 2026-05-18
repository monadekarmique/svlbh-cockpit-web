// Thérapeutes SVLBH du Cercle — liste avec rôle + badges count + filtre visibilité.
// DEC Patrick 2026-05-18 : renommé « Shamanes » → « Thérapeutes SVLBH du Cercle » ;
// compteurs ST1/ST2 actives éditables par les membres du Cercle (felt_count)
// avec like ; lien WhatsApp z3 (Cercle de Lumière) en bas.

import Link from "next/link";
import {
  fetchShamanesPending,
  fetchPendingCounts,
  ROLE_LABEL,
  ROLE_COLOR,
  APPRENANTES,
  TIER_LABEL,
  TIER_COLOR,
} from "@/lib/cercle/shamanes";
import { createClient } from "@/lib/supabase/server";
import { setFeltCount, toggleFeltLike } from "./felt-actions";

// Lien WhatsApp z3 (Cercle de Lumière SVLBH) — +41 79 930 28 00.
// DEC Patrick 2026-05-18.
const WHATSAPP_CERCLE_HREF = "https://wa.me/41799302800";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function isSuperviseurUser(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: profile } = await supabase
    .from("praticienne_profile")
    .select("certification_level, pro_status")
    .eq("supabase_user_id", user.id)
    .maybeSingle();
  return (
    profile?.pro_status === "ACTIVE" &&
    (profile.certification_level === "MYSHAMAN" ||
      profile.certification_level === "MYSHAMANFAMILY")
  );
}

export default async function ShamanesPage() {
  const isSuperviseur = await isSuperviseurUser();
  const [badges, counts] = await Promise.all([
    fetchShamanesPending(isSuperviseur),
    fetchPendingCounts(),
  ]);

  // Compteurs « ressentis » ST1/ST2 actives + statut like courant
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  const { data: me } = user
    ? await sb
        .from("praticienne_profile")
        .select("svlbh_id, cercle_lumiere_sr, stx")
        .eq("supabase_user_id", user.id)
        .maybeSingle()
    : { data: null };
  const mySvlbhId = me?.svlbh_id as string | undefined;
  const canEditFelt = (me?.cercle_lumiere_sr === true) || me?.stx === "ST6";

  const { data: feltRows } = await sb
    .from("cercle_felt_count")
    .select("type, felt_value, likes_count, updated_at")
    .order("type");
  const felt = Object.fromEntries(
    ((feltRows ?? []) as Array<{ type: string; felt_value: number; likes_count: number; updated_at: string }>).map((r) => [r.type, r]),
  );

  const { data: myLikes } = mySvlbhId
    ? await sb
        .from("cercle_felt_count_like")
        .select("felt_count_type")
        .eq("liker_svlbh_id", mySvlbhId)
    : { data: [] };
  const likedByMe = new Set(((myLikes ?? []) as Array<{ felt_count_type: string }>).map((l) => l.felt_count_type));

  // Tri : Cercle numérotées d'abord (1→4), puis cercle-t2, puis superviseurs
  const order: Record<string, number> = {
    cercle: 0,
    "cercle-t2": 1,
    "t3-en-attente": 2,
    superviseur: 3,
  };
  const sortedShamanes = [...badges].sort((a, b) => {
    const ra = order[a.role] ?? 99;
    const rb = order[b.role] ?? 99;
    if (ra !== rb) return ra - rb;
    return (a.cercleNumber ?? 999) - (b.cercleNumber ?? 999);
  });

  return (
    <div className="space-y-5">
      <Link
        href="/dashboard"
        className="text-sm text-neutral-500 hover:text-neutral-900"
      >
        ← Cockpit
      </Link>

      <header className="space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-blue-950">
              👥 Thérapeutes SVLBH du Cercle
            </h1>
            <p className="mt-1 text-sm text-neutral-700">
              {isSuperviseur
                ? `Vue superviseur · ${badges.length} actives + ${APPRENANTES.length} apprenantes`
                : `Cercle de Lumière · ${badges.length} thérapeutes actives`}
            </p>
          </div>
        </div>

        {/* Compteurs ressentis ST1 + ST2 actives — éditables par membres du Cercle */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {(["ST1", "ST2"] as const).map((type) => {
            const f = felt[type];
            const val = f?.felt_value ?? 0;
            const likes = f?.likes_count ?? 0;
            const isLiked = likedByMe.has(type);
            return (
              <div
                key={type}
                className="rounded-xl border border-blue-200 bg-blue-50/50 p-3"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-blue-900">
                    {type} actives
                  </p>
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
                  <p className="mt-1 font-mono text-2xl font-extrabold tabular-nums text-blue-900">
                    {val}
                  </p>
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

        {/* Lien WhatsApp Cercle de Lumière (z3) */}
        <a
          href={WHATSAPP_CERCLE_HREF}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-xl border-2 border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900 transition-colors hover:bg-emerald-100"
        >
          💬 WhatsApp · Cercle de Lumière SVLBH
          <span className="font-mono text-xs text-emerald-700">+41 79 930 28 00</span>
        </a>
      </header>

      {/* Thérapeutes SVLBH du Cercle actives */}
      <section className="space-y-2">
        <h2 className="text-base font-semibold text-blue-900">
          ✨ Thérapeutes actives
        </h2>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {sortedShamanes.map((s) => {
            const color = ROLE_COLOR[s.role];
            return (
              <li
                key={s.code}
                className="flex items-center gap-3 rounded-xl border bg-white p-4 shadow-sm"
                style={{ borderLeftColor: color, borderLeftWidth: 4 }}
              >
                <span className="text-2xl">{s.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    {s.cercleNumber !== undefined ? (
                      <span
                        className="inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-extrabold text-white"
                        style={{ backgroundColor: color }}
                      >
                        {s.cercleNumber}
                      </span>
                    ) : null}
                    <p className="font-semibold text-neutral-900">{s.name}</p>
                    {s.hiddenForParticipantes ? (
                      <span
                        className="text-[9px] font-bold uppercase text-neutral-400"
                        title="Non visible pour les participantes ST2/ST3"
                      >
                        🙈 caché
                      </span>
                    ) : null}
                  </div>
                  <p
                    className="mt-0.5 text-[11px] font-semibold"
                    style={{ color }}
                  >
                    {ROLE_LABEL[s.role]}
                  </p>
                  <p className="font-mono text-[10px] text-neutral-400">
                    Code {s.code}
                  </p>
                </div>
                {s.count > 0 ? (
                  <span
                    className="inline-flex h-8 min-w-[32px] items-center justify-center rounded-full bg-rose-500 px-2 text-sm font-extrabold text-white shadow-sm"
                    title={`${s.count} en attente`}
                  >
                    {s.count}
                  </span>
                ) : (
                  <span className="text-[10px] text-neutral-400">—</span>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <p className="text-center text-[10px] text-neutral-400">
        Source : webhook Make.com SHAMANES-PENDING · pull en temps réel à
        chaque visite
      </p>

      {/* Apprenantes en parcours — VISIBLES UNIQUEMENT AUX SUPERVISEURS */}
      {isSuperviseur ? (
        <section className="space-y-3 pt-4">
          <header>
            <h2 className="text-lg font-bold tracking-tight text-blue-950">
              🌱 Apprenantes en parcours
              <span className="ml-2 text-[10px] font-normal text-neutral-500">
                🔒 Vue superviseur — non visible aux participantes
              </span>
            </h2>
            <p className="mt-0.5 text-xs text-neutral-600">
              Personnes en parcours VLBH non encore certifiées du Cercle.
            </p>
          </header>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {APPRENANTES.map((a) => {
              const c = TIER_COLOR[a.tier];
              const count = a.code ? counts[a.code] ?? 0 : 0;
              return (
                <li
                  key={a.name}
                  className="flex items-center gap-3 rounded-xl border bg-white p-4 shadow-sm"
                  style={{ borderLeftColor: c, borderLeftWidth: 4 }}
                >
                  <span className="text-2xl">{a.emoji ?? "·"}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-neutral-900">{a.name}</p>
                    <p
                      className="mt-0.5 text-[11px] font-semibold"
                      style={{ color: c }}
                    >
                      {TIER_LABEL[a.tier]}
                    </p>
                    {a.code ? (
                      <p className="font-mono text-[10px] text-neutral-400">
                        Code {a.code}
                      </p>
                    ) : null}
                  </div>
                  {count > 0 ? (
                    <span
                      className="inline-flex h-8 min-w-[32px] items-center justify-center rounded-full bg-rose-500 px-2 text-sm font-extrabold text-white shadow-sm"
                      title={`${count} en attente`}
                    >
                      {count}
                    </span>
                  ) : a.code ? (
                    <span className="text-[10px] text-neutral-400">—</span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
