import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/sessions", label: "Séances" },
  { href: "/consultantes", label: "Consultantes" },
  { href: "/invoices", label: "Factures" },
  { href: "/palettes", label: "Palettes" },
  { href: "/vifa", label: "VIFA" },
  { href: "/soin-matinal", label: "Soin matinal" },
  { href: "/auto-soin", label: "Auto-soin" },
  { href: "/anatomie", label: "Anatomie" },
  { href: "/check-in", label: "Check-in" },
  { href: "/outils", label: "Outils" },
];

const PRO_LEVELS = ["MYSHAMANFAMILY", "MYSHAMAN"] as const;

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Tier gate — Pro 1 PWA réservée aux praticiennes T4 MYSHAMANFAMILY / T5 MYSHAMAN.
  const { data: profile } = await supabase
    .from("praticienne_profile")
    .select("certification_level, pro_status")
    .eq("supabase_user_id", user.id)
    .maybeSingle();

  const isPro =
    profile &&
    profile.pro_status === "ACTIVE" &&
    (PRO_LEVELS as readonly string[]).includes(profile.certification_level);

  if (!isPro) {
    redirect("/access-denied");
  }

  return (
    <div className="min-h-dvh bg-neutral-50">
      <header
        className="sticky top-0 z-10 border-b border-neutral-200 bg-white/90 backdrop-blur"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div
          className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3"
          style={{
            paddingLeft: "max(1rem, env(safe-area-inset-left))",
            paddingRight: "max(1rem, env(safe-area-inset-right))",
          }}
        >
          <Link href="/dashboard" className="font-semibold tracking-tight">
            SVLBH Pro 1
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
        className="mx-auto max-w-5xl py-6"
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
