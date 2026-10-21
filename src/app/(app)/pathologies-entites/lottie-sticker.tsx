"use client";

// Un sticker ANIMÉ de WhatsApp est rangé par le ramassage en Lottie (`<id>.json`, depuis le 27.09.2026) ; une balise
// <img> n'en montre rien — c'est pour ça que 28 des 50 stickers du 21.10 n'apparaissaient pas « comme stickers ».
// lottie-web se charge au premier rendu côté client (jamais au rendu serveur) et joue le fichier signé en boucle.

import { useEffect, useRef } from "react";

export function LottieSticker({ url, className = "" }: { url: string; className?: string }) {
  const boite = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = boite.current;
    if (!el) return;
    let anim: { destroy: () => void } | null = null;
    let vivant = true;
    void import("lottie-web").then((m) => {
      if (!vivant || !el) return;
      anim = m.default.loadAnimation({ container: el, renderer: "svg", loop: true, autoplay: true, path: url });
    });
    return () => { vivant = false; anim?.destroy(); };
  }, [url]);
  return <div ref={boite} className={className} aria-label="sticker animé" />;
}
