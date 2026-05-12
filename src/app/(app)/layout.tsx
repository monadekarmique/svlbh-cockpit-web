import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { groupedNav } from "@/lib/cockpit-nav";
import { CockpitNav } from "@/components/cockpit-nav";
import { autoRelinkProfile } from "@/lib/auto-relink-profile";
import { ExternalAppLink } from "@/components/external-app-link";

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

  if (!user) {
    redirect("/login");
  }

  // Hook post-login : relink praticienne_profile par email match si nécessaire.
  // DEC Patrick 2026-05-12.
  await autoRelinkProfile(supabase, user);

  const allowed = await isCockpitAllowed(supabase, user.id);
  if (!allowed) {
    redirect("/access-denied");
  }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
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
          <div className="flex items-center gap-2">
            {/* Priv link — convention iPad boussole jaune doré (DEC Patrick 2026-05-12) */}
            <ExternalAppLink
              href="https://priv.svlbh.com"
              label="Priv"
              color="#F2BF1A"
              title="Ouvrir priv.svlbh.com (PWA Priv-1)"
            />
            <Link
              href="/dashboard"
              className="font-semibold tracking-tight"
              style={{ color: "#000099" }}
            >
              🎯 SVLBH Cockpit
            </Link>
          </div>
          <nav className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-600">
            <CockpitNav groups={groupedNav()} />
            <span className="text-neutral-400">·</span>
            <span
              className="hidden font-mono text-[10px] text-neutral-400 sm:inline"
              title={`build ${process.env.NEXT_PUBLIC_BUILD_TIME ?? "n/a"}`}
            >
              build {process.env.NEXT_PUBLIC_BUILD_ID ?? "dev"}
            </span>
            <span className="hidden text-neutral-500 sm:inline">{user.email}</span>
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
