"use client";

// ReceiverClient — côté Owner/Admin. Reçoit l'offer via Supabase Realtime,
// crée PeerConnection, ajoute remote stream dans un <video>.
// DEC Patrick 2026-05-21 (brief v3 Phase 3).

import { useEffect, useRef, useState } from "react";
import {
  openSignaling,
  createPeerConnection,
  type SignalingHandle,
} from "@/lib/support/webrtc-signaling";
import { useSupportSessionStatus } from "@/lib/support/use-session-realtime";

type Phase = "waiting" | "connecting" | "live" | "masked-by-sender" | "ended" | "error";

export function OwnerReceiverClient({
  sessionId,
  roomId,
  isEnded,
}: {
  sessionId: string;
  roomId: string;
  isEnded: boolean;
}) {
  const [phase, setPhase] = useState<Phase>(isEnded ? "ended" : "waiting");
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{ bitrate_kbps: number; fps: number } | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const sigRef = useRef<SignalingHandle | null>(null);

  // Realtime : sync 2 côtés. Si la praticienne ferme, on bascule en ended.
  const remoteStatus = useSupportSessionStatus({
    sessionId,
    initialStatus: isEnded ? "ENDED" : "ACTIVE",
  });
  useEffect(() => {
    if ((remoteStatus === "ENDED" || remoteStatus === "EXPIRED") && phase !== "ended") {
      pcRef.current?.close();
      sigRef.current?.close();
      if (videoRef.current) videoRef.current.srcObject = null;
      setPhase("ended");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remoteStatus]);

  useEffect(() => {
    if (isEnded) return;
    let cancelled = false;

    (async () => {
      try {
        const pc = createPeerConnection();
        pcRef.current = pc;

        pc.ontrack = (e) => {
          if (cancelled) return;
          if (videoRef.current && e.streams[0]) {
            videoRef.current.srcObject = e.streams[0];
          }
        };

        pc.onconnectionstatechange = () => {
          if (cancelled) return;
          const st = pc.connectionState;
          if (st === "connected") setPhase("live");
          else if (st === "failed" || st === "disconnected") {
            setPhase("error");
            setError(`P2P ${st}`);
          }
        };

        const signaling = await openSignaling(roomId, async (sig) => {
          if (sig.kind === "offer") {
            setPhase("connecting");
            await pc.setRemoteDescription({ type: "offer", sdp: sig.sdp });
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            await signaling.send({ kind: "answer", sdp: answer.sdp! });
          } else if (sig.kind === "ice") {
            try {
              await pc.addIceCandidate(sig.candidate);
            } catch { /* empty */ }
          }
        });
        sigRef.current = signaling;

        pc.onicecandidate = (e) => {
          if (e.candidate) {
            void signaling.send({ kind: "ice", candidate: e.candidate.toJSON() });
          }
        };
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : String(e);
        setError(`Receiver init : ${msg}`);
        setPhase("error");
      }
    })();

    return () => {
      cancelled = true;
      try { pcRef.current?.close(); } catch { /* empty */ }
      try { sigRef.current?.close(); } catch { /* empty */ }
    };
  }, [roomId, isEnded]);

  // Stats live : bitrate + fps (toutes les 2s) — utile diagnostic
  useEffect(() => {
    if (phase !== "live") return;
    let prev = { bytes: 0, frames: 0, ts: Date.now() };
    const id = window.setInterval(async () => {
      try {
        const pc = pcRef.current;
        if (!pc) return;
        const stats = await pc.getStats();
        let bytesReceived = 0;
        let framesReceived = 0;
        stats.forEach((report: RTCStats) => {
          if (report.type === "inbound-rtp") {
            const r = report as unknown as {
              kind?: string;
              bytesReceived?: number;
              framesDecoded?: number;
            };
            if (r.kind === "video") {
              bytesReceived = r.bytesReceived ?? 0;
              framesReceived = r.framesDecoded ?? 0;
            }
          }
        });
        const now = Date.now();
        const dtS = (now - prev.ts) / 1000;
        const bitrateKbps = ((bytesReceived - prev.bytes) * 8) / 1000 / dtS;
        const fps = (framesReceived - prev.frames) / dtS;
        setStats({
          bitrate_kbps: Math.round(bitrateKbps),
          fps: Math.round(fps * 10) / 10,
        });
        prev = { bytes: bytesReceived, frames: framesReceived, ts: now };
      } catch { /* empty */ }
    }, 2000);
    return () => window.clearInterval(id);
  }, [phase]);

  if (phase === "ended") {
    return (
      <section className="rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 p-8 text-center text-sm text-neutral-600">
        Session terminée. Aucune capture conservée.
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-baseline gap-3">
        <h3 className="text-base font-bold text-blue-950">📺 Rendu live praticienne</h3>
        {phase === "waiting" && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">
            🟡 En attente du partage praticienne
          </span>
        )}
        {phase === "connecting" && (
          <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-900">
            ⏳ Connexion P2P…
          </span>
        )}
        {phase === "live" && (
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
            🟢 LIVE {stats && `· ${stats.bitrate_kbps} kbps · ${stats.fps} fps`}
          </span>
        )}
      </div>

      <div className="overflow-hidden rounded-lg border-2 border-neutral-300 bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="block max-h-[70vh] w-full object-contain"
        />
        {phase === "waiting" && (
          <div className="flex h-64 flex-col items-center justify-center gap-2 bg-neutral-900 text-white">
            <p className="text-5xl">⏳</p>
            <p className="text-sm">
              En attente que la praticienne click « Partager mon onglet »…
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">
          {error}
        </div>
      )}

      <p className="text-[10px] italic text-neutral-500">
        Flux P2P direct praticienne → Patrick · STUN Google public · pas de TURN
        · aucun enregistrement.
      </p>
    </section>
  );
}
