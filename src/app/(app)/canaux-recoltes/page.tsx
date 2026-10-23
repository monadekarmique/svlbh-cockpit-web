import type { Metadata } from "next";
import { requireSt6 } from "@/lib/owner-gate";
import { createClient } from "@/lib/supabase/server";
import type { Canal } from "./actions";
import { CanauxClient } from "./canaux-client";

export const metadata: Metadata = { title: "Canaux récoltés" };
export const dynamic = "force-dynamic";

// Patrick, 23.10.2026 : « ce serait déjà bien d'avoir une page sur cockpit où séelctionner les canaux », puis « oui » aux
// trois usages : récolté, transcrit, résumé du jour. Les groupes inscrits au ramassage (abo_groupe) et les fils
// (fil_source, un dossier par personne). Les groupes encore à inscrire restent sur /releve-hebdo.

export default async function CanauxRecoltesPage() {
  await requireSt6();
  const sb = await createClient();
  const { data, error } = await sb.rpc("canaux_recoltes");
  const tous = ((data ?? []) as Canal[]).sort((a, b) => (a.nom ?? a.cle).localeCompare(b.nom ?? b.cle, "fr"));
  const groupes = tous.filter((c) => c.genre === "groupe");
  const fils = tous.filter((c) => c.genre === "fil");

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-semibold">Canaux récoltés</h1>
      <p className="mt-1 text-sm text-gray-600">
        Pour chaque groupe et chaque fil : <strong>récolté</strong> (messages et médias ramassés), <strong>transcrit</strong>{" "}
        (vocaux passés à la chaîne de nuit), <strong>résumé du jour</strong> (brouillon « Ce que tu as manqué » à 18h30, groupes
        seulement). Un changement vaut dès le passage suivant. Couper la récolte d’un groupe ne le retire pas de Priv-1 : ses
        membres le voient toujours. Les groupes encore à inscrire sont sur{" "}
        <a className="underline" href="/releve-hebdo">
          le relevé du lundi
        </a>
        .
      </p>
      {error ? <p className="mt-3 text-sm text-red-700">Lecture refusée : {error.message}</p> : null}
      <CanauxClient groupes={groupes} fils={fils} />
    </div>
  );
}
