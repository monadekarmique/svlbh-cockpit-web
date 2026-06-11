import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { groupedNav } from "@/lib/cockpit-nav";
import { CockpitNav } from "@/components/cockpit-nav";
import { UserMenu } from "@/components/user-menu";
import { SupportRealtimeNotifier } from "@/components/support-realtime-notifier";
import { autoRelinkProfile } from "@/lib/auto-relink-profile";
import { resolveProfile } from "@/lib/resolve-profile";
import { ExternalAppLink } from "@/components/external-app-link";
import { PageBreadcrumb } from "@/components/page-breadcrumb";
import { IdInspectorToggle } from "@/components/id-inspector";
import { NumberInputSelectAll } from "@/components/number-input-select-all";
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
  const profile = await resolveProfile<{
    stx: string | null;
    pro_status: string | null;
    cercle_lumiere_sr: boolean | null;
  }>(supabase, userId, "stx, pro_status, cercle_lumiere_sr");
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
  const navProfile = user
    ? await resolveProfile<{ svlbh_id: string | null; stx: string | null; cercle_lumiere_sr: boolean | null; email: string | null }>(
        supabase, user.id, "svlbh_id, stx, cercle_lumiere_sr, email")
    : null;
  const isOwner = navProfile?.stx === "ST6" || navProfile?.cercle_lumiere_sr === true;
  // ST5+ reçoit le toast notifier Realtime quand une praticienne démarre une session.
  const showSupportNotifier = navProfile?.stx === "ST5" || navProfile?.stx === "ST6";
  // Privilégie l'email DB praticienne_profile (vrai email) sur user.email
  // (qui peut être un alias privaterelay.appleid.com avec Hide My Email).
  const displayEmail = navProfile?.email ?? user?.email ?? "reader";

  return (
    <div className="min-h-dvh bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <NumberInputSelectAll />
      {showSupportNotifier && (
        <SupportRealtimeNotifier selfSvlbhId={navProfile?.svlbh_id ?? null} />
      )}
      {/* Shell sticky : header (titre + Priv/email/Pro) + fil d'Ariane (doctrine)
          restent collés en haut au scroll, empilés dans un même conteneur sticky. */}
      <div className="sticky top-0 z-40">
      <header
        className="relative z-20 border-b border-neutral-200 bg-white/90 backdrop-blur"
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
            href="/"
            className="font-semibold tracking-tight"
            style={{ color: "#000099" }}
          >
            SVLBH Cockpit
          </Link>
          {/* Menu nav restauré (DEC Patrick 2026-06-03 v6) — comme c'était :
              Priv | dropdowns modules | build · commit | email | Pro. */}
          <nav className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-600">
            <ExternalAppLink
              href="https://priv.svlbh.com"
              label="Priv"
              color="#F2BF1A"
              title="Ouvrir priv.svlbh.com (PWA Priv-1)"
            />
            <CockpitNav groups={groupedNav({ includeOwner: isOwner })} />
            {isOwner && <IdInspectorToggle />}
            <span className="text-neutral-400">·</span>
            <span
              className="hidden font-mono text-[10px] text-neutral-400 sm:inline"
              title={`build ${process.env.NEXT_PUBLIC_BUILD_TIME ?? "n/a"}`}
            >
              build {appVersion}
            </span>
            <span className="hidden text-neutral-400 sm:inline">·</span>
            <span
              className="hidden font-mono text-[10px] text-neutral-400 sm:inline"
              title={`commit ${process.env.RENDER_GIT_COMMIT ?? "n/a"} · v${appVersion}`}
            >
              {process.env.RENDER_GIT_COMMIT?.slice(0, 7) ?? "dev"}
            </span>
            <UserMenu email={displayEmail} />
            <ExternalAppLink
              href="https://pwa.app.svlbh.com"
              label="Pro"
              color="#DB338C"
              title="Ouvrir pwa.app.svlbh.com (PWA Pro 1)"
            />
          </nav>
        </div>
      </header>
      {/* Doctrine cockpit (DEC Patrick 2026-06-03) : sous la nav, sur TOUTE page,
          audit trail actionnable à gauche + build à droite. Voir page-breadcrumb.tsx. */}
      <PageBreadcrumb
        buildVersion={appVersion}
        buildCommit={process.env.RENDER_GIT_COMMIT ?? ""}
      />
      </div>
      <main
        className="mx-auto max-w-6xl pb-6"
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
