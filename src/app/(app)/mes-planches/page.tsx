import { redirect } from "next/navigation";

// Patrick, 21.10.2026 : « tu peux envoyer le lien à Anne vers cockpit / pathologies-entités » — une seule page pour tout le
// monde, le périmètre tenu par la base. Le lien /mes-planches envoyé à Anne à 19h07 continue de marcher : il mène là.
export const dynamic = "force-dynamic";

export default async function MesPlanchesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const q = await searchParams;
  const jour = typeof q.jour === "string" ? `?jour=${encodeURIComponent(q.jour)}` : "";
  redirect(`/pathologies-entites${jour}`);
}
