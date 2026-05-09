// Shamanes du Cercle — liste avec rôle + badges count + filtre visibilité.

import Link from "next/link";
import {
  fetchShamanesPending,
  ROLE_LABEL,
  ROLE_COLOR,
  APPRENANTES,
  TIER_LABEL,
  TIER_COLOR,
} from "@/lib/cercle/shamanes";
import { createClient } from "@/lib/supabase/server";

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
  const badges = await fetchShamanesPending(isSuperviseur);
  const totalPending = badges.reduce((s, b) => s + b.count, 0);

  // Tri : Cercle numérotées d'abord (1→4), puis cercle-t2, puis t3 attente, puis superviseurs
  const order: Record<string, number> = {
    cercle: 0,
    "cercle-t2": 1,
    "t3-en-attente": 2,
    superviseur: 3,
  };
  const sorted = [...badges].sort((a, b) => {
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

      <header className="flex items-baseline justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-blue-950">
            👥 Shamanes du Cercle
          </h1>
          <p className="mt-1 text-sm text-neutral-700">
            {isSuperviseur
              ? "Vue superviseur · 8 shamanes (incluant Patrick + Patrick P.)"
              : "Cercle de Lumière · 6 shamanes visibles"}
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-3xl font-extrabold text-blue-900 tabular-nums">
            {totalPending}
          </p>
          <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">
            En attente
          </p>
        </div>
      </header>

      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {sorted.map((s) => {
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
                      title="Non visible pour les participantes T2/T3"
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

      <p className="text-center text-[10px] text-neutral-400">
        Source : webhook Make.com SHAMANES-PENDING · pull en temps réel à
        chaque visite
      </p>

      {/* Apprenantes en parcours — sans code praticien actif */}
      <section className="space-y-3 pt-4">
        <header>
          <h2 className="text-lg font-bold tracking-tight text-blue-950">
            🌱 Apprenantes en parcours
          </h2>
          <p className="mt-0.5 text-xs text-neutral-600">
            Personnes en parcours VLBH sans code praticien actif (pas de
            badge sessions pending).
          </p>
        </header>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {APPRENANTES.map((a) => {
            const c = TIER_COLOR[a.tier];
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
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
