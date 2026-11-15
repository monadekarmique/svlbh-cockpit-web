"use client";

import { useTransition, useState } from "react";
import { qualifier } from "./actions";
import { CLASSES_ETAT, etatLigne } from "@/lib/charges-etat";

// Toutes les natures que la base accepte (contrainte de rapprochement.nature) : une nature absente du menu s'affichait
// comme la première de la liste (15.11.2026, carte 44551562 — « rémunération praticienne » et « charge d'exploitation »).
// scripts/test-charges-etat.mjs compare cette liste à celle de la base.
const NATURES = [
  { value: "charge", label: "Charge — TVA récupérable" },
  { value: "charge_sans_tva", label: "Charge — TVA NON récupérable" },
  { value: "charge_exploitation", label: "Charge d'exploitation" },
  { value: "remuneration_praticienne", label: "Rémunération praticienne" },
  { value: "hors_activite", label: "Hors activité (privé)" },
  { value: "frais_bancaires", label: "Frais bancaires — hors champ TVA" },
  { value: "interne", label: "Mouvement interne" },
  { value: "prestation", label: "Prestation encaissée" },
  { value: "don", label: "Don" },
  { value: "abonnement", label: "Abonnement" },
  { value: "a_qualifier", label: "À qualifier" },
];

export function NatureSelect({
  ligneId, valeur, suggestion, appris = false,
}: { ligneId: string; valeur: string | null; suggestion: string; appris?: boolean }) {
  const [pending, start] = useTransition();
  // `valeur` = ce qui est ÉCRIT en base. `suggestion` = ce que la règle propose.
  // On distingue les deux à l'écran : une suggestion non validée reste en gris,
  // sinon on ne saurait plus ce que Patrick a réellement tranché.
  const [choix, setChoix] = useState(valeur ?? suggestion);
  // `appris` = l'annotation est signée « fable-appris » (apprise de ses validations) : ni proposée, ni validée par lui.
  // Dès qu'il choisit une nature, l'écriture est à son nom : la ligne quitte le bleu.
  const [signeFable, setSigneFable] = useState(appris);

  return (
    <select
      value={choix}
      disabled={pending}
      onChange={(e) => {
        const v = e.target.value;
        setChoix(v);
        setSigneFable(false);
        const fd = new FormData();
        fd.set("ligne_id", ligneId);
        fd.set("nature", v);
        start(() => { void qualifier(fd); });
      }}
      className={
        "w-full rounded-md border px-2 py-1 text-sm " +
        (pending ? "opacity-50 " : "") +
        CLASSES_ETAT[etatLigne(valeur, signeFable)]
      }
      title={valeur !== null && signeFable ? "Appris de tes validations (écrit par fable) — choisis une nature pour la reprendre à ton nom" : undefined}
    >
      {NATURES.map((n) => (
        <option key={n.value} value={n.value}>{n.label}</option>
      ))}
    </select>
  );
}
