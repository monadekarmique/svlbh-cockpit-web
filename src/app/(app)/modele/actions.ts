"use server";

import { requireSt6 } from "@/lib/owner-gate";
import { createClient } from "@/lib/supabase/server";

// Enregistrer la simulation du point de bascule (Patrick, 25.09 : « mes simulations
// sont persistantes ? »). Une ligne par scénario dans modele_simulation ; la base
// n'accepte que le propriétaire ST6 (RLS), cette garde-ci ne fait que le dire plus tôt.
//
// ⚠️ Ce n'est pas une version du modèle : modele_version reste figée.
export type EtatSimulation = {
  quantites: Record<string, number>;
  paiements: Record<string, number>;
  formatrices: number;
  apprenantesForcees: number | null;
};

export async function enregistrerSimulation(scenario: string, etat: EtatSimulation): Promise<string> {
  await requireSt6();
  if (!scenario) throw new Error("scénario obligatoire");
  const supabase = await createClient();
  const majLe = new Date().toISOString();
  const { error } = await supabase
    .from("modele_simulation")
    .upsert({ scenario, etat, maj_le: majLe }, { onConflict: "scenario" });
  if (error) throw new Error(`simulation non enregistrée : ${error.message}`);
  return majLe;
}
