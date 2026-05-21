"use client";

// Notifier Realtime — toast + son quand une praticienne démarre une session
// de support. Visible pour ST5+ (Owner/Admin) monté dans layout cockpit.
// DEC Patrick 2026-05-21.
//
// - Realtime channel postgres_changes INSERT sur support_session
// - Toast top-right, persistent jusqu'à click ou auto-dismiss 60s
// - Beep court Web Audio API (AudioContext lazy init au 1er user click)

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Toast = {
  id: string;
  sessionId: string;
  praticienneName: string;
  startedAt: string;
  note: string | null;
};

type SupportSessionRow = {
  id: string;
  praticienne_svlbh_id: string;
  status: string;
  started_at: string;
  note: string | null;
};

export function SupportRealtimeNotifier({
  selfSvlbhId,
}: {
  selfSvlbhId: string | null;
}) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioReadyRef = useRef(false);

  // Init AudioContext au 1er user click (autoplay policy navigators)
  useEffect(() => {
    const initAudio = () => {
      if (audioReadyRef.current) return;
      try {
        const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtxRef.current = new AC();
        audioReadyRef.current = true;
      } catch { /* empty */ }
    };
    document.addEventListener("click", initAudio, { once: true });
    document.addEventListener("touchstart", initAudio, { once: true });
    return () => {
      document.removeEventListener("click", initAudio);
      document.removeEventListener("touchstart", initAudio);
    };
  }, []);

  function beep() {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    try {
      // 2 bips courts en montée (ding-ding)
      const playTone = (freq: number, startOffsetS: number, durationS: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        const t0 = ctx.currentTime + startOffsetS;
        gain.gain.setValueAtTime(0, t0);
        gain.gain.linearRampToValueAtTime(0.18, t0 + 0.01);
        gain.gain.linearRampToValueAtTime(0, t0 + durationS);
        osc.start(t0);
        osc.stop(t0 + durationS);
      };
      playTone(660, 0, 0.15);
      playTone(880, 0.18, 0.18);
    } catch { /* empty */ }
  }

  useEffect(() => {
    const sb = createClient();
    const channel = sb
      .channel("support-realtime-notifier")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "support_session" },
        async (payload) => {
          const row = payload.new as unknown as SupportSessionRow;
          if (!row || row.status !== "PENDING") return;
          // Skip si je suis la praticienne qui a démarré ma propre session
          if (selfSvlbhId && row.praticienne_svlbh_id === selfSvlbhId) return;

          // Fetch nom de la praticienne (auth via RLS)
          let praticienneName = "Praticienne";
          try {
            const { data: p } = await sb
              .from("praticienne_profile")
              .select("first_name, last_name")
              .eq("svlbh_id", row.praticienne_svlbh_id)
              .maybeSingle();
            if (p) {
              praticienneName = `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || "Praticienne";
            }
          } catch { /* empty */ }

          const toast: Toast = {
            id: row.id,
            sessionId: row.id,
            praticienneName,
            startedAt: row.started_at,
            note: row.note,
          };
          setToasts((prev) => [toast, ...prev].slice(0, 4)); // max 4 toasts simultanés
          beep();

          // Auto-dismiss après 60s
          window.setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== toast.id));
          }, 60_000);
        },
      )
      .subscribe();

    return () => {
      void sb.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selfSvlbhId]);

  function dismiss(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed right-4 top-20 z-50 flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="rounded-xl border-2 border-emerald-400 bg-white shadow-lg ring-4 ring-emerald-200/50"
        >
          <div className="flex items-start gap-2 p-3">
            <span className="text-2xl" aria-hidden>🔔</span>
            <div className="flex-1 text-sm">
              <p className="font-bold text-emerald-900">
                {t.praticienneName} démarre une session de support
              </p>
              {t.note && (
                <p className="mt-0.5 text-xs italic text-neutral-600">{t.note}</p>
              )}
              <p className="mt-0.5 text-[10px] text-neutral-500">
                {new Date(t.startedAt).toLocaleTimeString("fr-CH", { hour: "2-digit", minute: "2-digit" })}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <Link
                  href={`/support/session/${t.sessionId}`}
                  className="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                  onClick={() => dismiss(t.id)}
                >
                  Rejoindre →
                </Link>
                <button
                  type="button"
                  onClick={() => dismiss(t.id)}
                  className="text-[11px] text-neutral-500 hover:text-neutral-800"
                >
                  Ignorer
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
