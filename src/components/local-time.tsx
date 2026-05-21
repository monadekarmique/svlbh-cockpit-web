"use client";

// Affiche un timestamp formaté dans le fuseau horaire DU BROWSER (utilisatrice).
// Évite que le formatage server-side rende tout en UTC (puisque Render = UTC).
// DEC Patrick 2026-05-21.
//
// Pattern : SSR rend l'ISO brut (suppressHydrationWarning), puis le client
// upgrade en local time après hydration. Pas de flash UTC visible.

import { useEffect, useState } from "react";

type Mode = "full" | "time" | "date";

const FORMATS: Record<Mode, Intl.DateTimeFormatOptions> = {
  full: {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  },
  time: {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  },
  date: {
    day: "2-digit",
    month: "short",
    year: "numeric",
  },
};

export function LocalTime({
  iso,
  mode = "full",
  locale = "fr-CH",
  showTz = false,
}: {
  iso: string;
  mode?: Mode;
  locale?: string;
  showTz?: boolean;
}) {
  // SSR : on rend une représentation fixe en UTC (évite le mismatch d'hydration)
  // Client : on bascule sur le TZ browser au mount.
  const [text, setText] = useState<string>(() =>
    new Date(iso).toLocaleString(locale, { ...FORMATS[mode], timeZone: "UTC" }),
  );
  const [tz, setTz] = useState<string | null>(null);

  useEffect(() => {
    const d = new Date(iso);
    setText(d.toLocaleString(locale, FORMATS[mode]));
    if (showTz) {
      try {
        setTz(Intl.DateTimeFormat().resolvedOptions().timeZone);
      } catch {
        /* empty */
      }
    }
  }, [iso, mode, locale, showTz]);

  return (
    <time dateTime={iso} suppressHydrationWarning>
      {text}
      {tz && showTz ? <span className="ml-1 text-[10px] text-neutral-400">({tz})</span> : null}
    </time>
  );
}
