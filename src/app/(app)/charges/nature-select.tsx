"use client";

import { useTransition, useState } from "react";
import { qualifier } from "./actions";

const NATURES = [
  { value: "charge", label: "Charge — TVA récupérable" },
  { value: "charge_sans_tva", label: "Charge — TVA NON récupérable" },
  { value: "hors_activite", label: "Hors activité (privé)" },
  { value: "frais_bancaires", label: "Frais bancaires — hors champ TVA" },
  { value: "interne", label: "Mouvement interne" },
  { value: "prestation", label: "Prestation encaissée" },
  { value: "don", label: "Don" },
  { value: "abonnement", label: "Abonnement" },
  { value: "a_qualifier", label: "À qualifier" },
];

export function NatureSelect({
  ligneId, valeur, suggestion,
}: { ligneId: string; valeur: string | null; suggestion: string }) {
  const [pending, start] = useTransition();
  // `valeur` = ce qui est ÉCRIT en base. `suggestion` = ce que la règle propose.
  // On distingue les deux à l'écran : une suggestion non validée reste en gris,
  // sinon on ne saurait plus ce que Patrick a réellement tranché.
  const [choix, setChoix] = useState(valeur ?? suggestion);
  const valide = valeur !== null;

  return (
    <select
      value={choix}
      disabled={pending}
      onChange={(e) => {
        const v = e.target.value;
        setChoix(v);
        const fd = new FormData();
        fd.set("ligne_id", ligneId);
        fd.set("nature", v);
        start(() => { void qualifier(fd); });
      }}
      className={
        "w-full rounded-md border px-2 py-1 text-sm " +
        (pending ? "opacity-50 " : "") +
        (valide
          ? "border-emerald-300 bg-emerald-50 text-emerald-900"
          : "border-neutral-300 bg-white text-neutral-500 italic")
      }
    >
      {NATURES.map((n) => (
        <option key={n.value} value={n.value}>{n.label}</option>
      ))}
    </select>
  );
}
