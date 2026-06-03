// Racine cockpit.svlbh.com → /dashboard.
// Le layout (app)/layout.tsx redirige vers /login si pas d'auth.
// Cette racine est aussi la cible du fil d'Ariane « Cockpit » (DEC Patrick 2026-06-03).
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/dashboard");
}
