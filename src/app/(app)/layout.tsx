import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { groupedNav } from "@/lib/cockpit-nav";
import { CockpitNav } from "@/components/cockpit-nav";
import { SupportRealtimeNotifier } from "@/components/support-realtime-notifier";
import { autoRelinkProfile } from "@/lib/auto-relink-profile";
import { ExternalAppLink } from "@/components/external-app-link";
import { version as appVersion } from "../../../package.json";

// DEC Patrick 2026-05-12 — doctrine ST. Cockpit accessible à ST3+ (Certifiée
// Priv, Thérapeute PRO, Superviseur, Owner). Les modules Admin / Compliance /
// Facturation sont gated ST6 (Owner) au niveau page individuelle. Cercle SR
// reste un signal indépendant (utilisé par la nav, pas par le gate).
const ALLOWED_STX = ["ST3", "ST4", "ST5", "ST6"] as const;

async function isCockpitAllowed(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<boolean> {
  const { data: profile } = await supabase
    .from("praticienne_profile")
    .select("stx, pro_status, cercle_lumiere_sr")
    .eq("supabase_user_id", userId)
    .maybeSingle();
  // Cercle de Lumière SR : accès gardé (sécurité indépendante)
  if (profile?.cercle_lumiere_sr === true) {
    return true;
  }
  // Praticienne ACTIVE avec stx ST3+
  if (
    profile?.pro_status === "ACTIVE" &&
    !!profile.stx &&
    (ALLOWED_STX as readonly string[]).includes(profile.stx)
  ) {
    return true;
  }
  // Whitelist via cockpit_access (cas d'ajout ad-hoc hors stage)
  const { data: access } = await supabase
    .from("cockpit_access")
    .select("user_id, revoked_at")
    .eq("user_id", userId)
    .is("revoked_at", null)
    .maybeSingle();
  return !!access;
}

export default async function CockpitLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Bearer reader bypass — multi-instances IA (DEC Patrick 2026-05-20).
  // Si le middleware a validé un Bearer reader, on bypass les redirects et
  // on rend la page sans session. Le scope est déjà filtré par allowed_paths.
  const reqHeaders = await headers();
  const bearerReaderSvlbhId = reqHeaders.get("x-svlbh-bearer-reader");

  if (!user && !bearerReaderSvlbhId) {
    redirect("/login");
  }

  // Hook post-login : relink praticienne_profile par email match si nécessaire.
  // DEC Patrick 2026-05-12. Skip si Bearer reader (pas de session à relink).
  if (user) await autoRelinkProfile(supabase, user);

  if (!bearerReaderSvlbhId) {
    const allowed = await isCockpitAllowed(supabase, user!.id);
    if (!allowed) {
      redirect("/access-denied");
    }
  }

  // Profil pour la nav : Owner (ST6) ou Cercle SR voient les modules
  // Admin / Compliance / Facturation directement dans la nav (DEC Patrick 2026-05-12).
  // Si Bearer reader : on charge le profile via svlbh_id (pas de session user).
  const { data: navProfile } = user
    ? await supabase
        .from("praticienne_profile")
        .select("svlbh_id, stx, cercle_lumiere_sr, email")
        .eq("supabase_user_id", user.id)
        .maybeSingle()
    : { data: null as { svlbh_id: string | null; stx: string | null; cercle_lumiere_sr: boolean | null; email: string | null } | null };
  const isOwner = navProfile?.stx === "ST6" || navProfile?.cercle_lumiere_sr === true;
  // ST5+ reçoit le toast notifier Realtime quand une praticienne démarre une session.
  const showSupportNotifier = navProfile?.stx === "ST5" || navProfile?.stx === "ST6";
  // Privilégie l'email DB praticienne_profile (vrai email) sur user.email
  // (qui peut être un alias privaterelay.appleid.com avec Hide My Email).
  const displayEmail = navProfile?.email ?? user?.email ?? "reader";

  return (
    <div className="min-h-dvh bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {showSupportNotifier && (
        <SupportRealtimeNotifier selfSvlbhId={navProfile?.svlbh_id ?? null} />
      )}
      <header
        className="sticky top-0 z-10 border-b border-neutral-200 bg-white/90 backdrop-blur"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div
          className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3"
          style={{
            paddingLeft: "max(1rem, env(safe-area-inset-left))",
            paddingRight: "max(1rem, env(safe-area-inset-right))",
          }}
        >
          <Link
            href="/dashboard"
            className="font-semibold tracking-tight"
            style={{ color: "#000099" }}
          >
            SVLBH Cockpit
          </Link>
          <nav className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-600">
            {/* Priv link — convention iPad boussole jaune doré (DEC Patrick 2026-05-12).
                À gauche de Dashboard (premier item de la nav). */}
            <ExternalAppLink
              href="https://priv.svlbh.com"
              label="Priv"
              color="#F2BF1A"
              title="Ouvrir priv.svlbh.com (PWA Priv-1)"
            />
            <CockpitNav groups={groupedNav({ includeOwner: isOwner })} />
            <span className="text-neutral-400">·</span>
            <span
              className="hidden font-mono text-[10px] text-neutral-400 sm:inline"
              title={`build ${process.env.NEXT_PUBLIC_BUILD_TIME ?? "n/a"}`}
            >
              build {appVersion}
            </span>
            <span className="hidden text-neutral-500 sm:inline">{displayEmail}</span>
            {/* Commit court (à droite de l'email) — pour vérifier la version
                déployée. RENDER_GIT_COMMIT est injecté par Render au build. */}
            <span className="hidden text-neutral-400 sm:inline">·</span>
            <span
              className="hidden font-mono text-[10px] text-neutral-400 sm:inline"
              title={`commit ${process.env.RENDER_GIT_COMMIT ?? "n/a"} · v${appVersion}`}
            >
              {process.env.RENDER_GIT_COMMIT?.slice(0, 7) ?? "dev"}
            </span>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="text-neutral-500 hover:text-neutral-900"
              >
                Déconnexion
              </button>
            </form>
            {/* Pro link — convention iPad boussole magenta (DEC Patrick 2026-05-12) */}
            <ExternalAppLink
              href="https://pwa.app.svlbh.com"
              label="Pro"
              color="#DB338C"
              title="Ouvrir pwa.app.svlbh.com (PWA Pro 1)"
            />
          </nav>
        </div>
      </header>
      <main
        className="mx-auto max-w-6xl py-6"
        style={{
          paddingLeft: "max(1rem, env(safe-area-inset-left))",
          paddingRight: "max(1rem, env(safe-area-inset-right))",
          paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
        }}
      >
        {children}
      </main>
    </div>
  );
}
