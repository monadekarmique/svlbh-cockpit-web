// Pas de home publique — cockpit réservé T4/T5 + T3 whitelist.
// / → /login (Apple Sign-In). Si déjà auth → /dashboard via le layout.
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/login");
}
