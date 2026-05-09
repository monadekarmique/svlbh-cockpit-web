import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/shamanes", label: "Shamanes" },
  { href: "/routines", label: "Routines" },
  { href: "/tores", label: "Tores" },
  { href: "/chakras", label: "Chakras" },
  { href: "/scores", label: "Scores" },
  { href: "/demandes", label: "Demandes" },
  { href: "/historique", label: "Historique" },
];

const PRO_LEVELS = ["MYSHAMANFAMILY", "MYSHAMAN"] as const;

/**
 * Cockpit access policy :
 *   - T4 (MyShamanFamily) ou T5 (MyShaman) actives : accès automatique
 *   - T3 (Certifiée Priv) : whitelist via table cockpit_access
 *     (sélectionnées pour vibrations proches du 300% quasi permanent)
 *   - Tout autre tier : redirect /access-denied
 */
async function isCockpitAllowed(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<boolean> {
  const { data: profile } = await supabase
    .from("praticienne_profile")
    .select("certification_level, pro_status")
    .eq("supabase_user_id", userId)
    .maybeSingle();
  if (
    profile?.pro_status === "ACTIVE" &&
    (PRO_LEVELS as readonly string[]).includes(profile.certification_level)
  ) {
    return true;
  }
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
          <Link
            href="/dashboard"
            className="font-semibold tracking-tight"
            style={{ color: "#000099" }}
          >
            🎯 SVLBH Cockpit
          </Link>
          <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-neutral-600">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="hover:text-neutral-900 active:text-neutral-900"
              >
                {item.label}
              </Link>
            ))}
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
