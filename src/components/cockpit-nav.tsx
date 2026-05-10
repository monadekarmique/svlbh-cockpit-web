"use client";

// NAV header cockpit avec dropdowns par groupe.
// Tap-to-toggle universel (fonctionne mobile + desktop). Click-outside ferme.

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { CockpitNavGroupRendered } from "@/lib/cockpit-nav";

export function CockpitNav({ groups }: { groups: CockpitNavGroupRendered[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  // Click outside ferme le dropdown
  useEffect(() => {
    if (!openId) return;
    const onClick = (e: MouseEvent) => {
      if (
        navRef.current &&
        !navRef.current.contains(e.target as Node)
      ) {
        setOpenId(null);
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [openId]);

  // Échap ferme aussi
  useEffect(() => {
    if (!openId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenId(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [openId]);

  return (
    <div
      ref={navRef}
      className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-600"
    >
      <Link
        href="/dashboard"
        className="hover:text-neutral-900 active:text-neutral-900"
        onClick={() => setOpenId(null)}
      >
        Dashboard
      </Link>

      {groups.map((g) => {
        // Si 1 seul item, affiche en lien direct (pas de dropdown)
        if (g.items.length === 1) {
          const item = g.items[0];
          return (
            <Link
              key={g.id}
              href={item.href}
              className="hover:text-neutral-900 active:text-neutral-900"
              onClick={() => setOpenId(null)}
            >
              {item.navLabel ?? item.label}
            </Link>
          );
        }

        const isOpen = openId === g.id;
        return (
          <div key={g.id} className="relative">
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : g.id)}
              className={`inline-flex items-center gap-1 hover:text-neutral-900 active:text-neutral-900 ${
                isOpen ? "text-neutral-900" : ""
              }`}
              aria-expanded={isOpen}
              aria-haspopup="menu"
            >
              {g.label}
              <span
                aria-hidden
                className={`text-[8px] transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
              >
                ▾
              </span>
            </button>
            {isOpen ? (
              <div
                role="menu"
                className="absolute left-0 top-full z-20 mt-1 min-w-[200px] overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg"
              >
                <ul className="py-1">
                  {g.items.map((item) => (
                    <li key={item.href} role="none">
                      <Link
                        href={item.href}
                        role="menuitem"
                        onClick={() => setOpenId(null)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 active:bg-neutral-100"
                      >
                        <span aria-hidden style={{ color: item.color }}>
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
