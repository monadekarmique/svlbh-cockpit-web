"use client";

import { useState, useTransition } from "react";
import { toggleChakraAction } from "@/app/(app)/chakras/actions";

export function ChakraToggle({
  chakraKey,
  initialCleaned,
}: {
  chakraKey: string;
  initialCleaned: boolean;
}) {
  const [cleaned, setCleaned] = useState(initialCleaned);
  const [pending, startTransition] = useTransition();

  const onClick = () => {
    const next = !cleaned;
    setCleaned(next);
    startTransition(async () => {
      const res = await toggleChakraAction(chakraKey, next);
      if (!res.ok) setCleaned(!next);
    });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold transition disabled:opacity-50 ${
        cleaned
          ? "bg-emerald-500 text-white shadow-sm"
          : "border border-neutral-300 bg-white text-neutral-500 hover:bg-neutral-50"
      }`}
      title={cleaned ? "Cliquer pour marquer comme bloqué" : "Cliquer pour marquer comme nettoyé"}
    >
      {cleaned ? "✓ Nettoyé" : "○ Bloqué"}
    </button>
  );
}
