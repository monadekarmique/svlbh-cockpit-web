"use client";

// Helpers WebRTC signaling via Supabase Realtime broadcast channels.
// DEC Patrick 2026-05-21 (brief v3 Phase 3).
//
// Architecture :
//   - Un channel "support:<room_id>" partagé sender ↔ receiver.
//   - 3 events broadcast : 'offer', 'answer', 'ice'.
//   - STUN public Google (pas de data sortante, juste découverte NAT).
//   - Pas de TURN en V1 (fallback message si NAT symmetric).

import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export const STUN_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
] as const;

export type SignalEvent =
  | { kind: "offer"; sdp: string }
  | { kind: "answer"; sdp: string }
  | { kind: "ice"; candidate: RTCIceCandidateInit };

export type SignalingHandle = {
  channel: RealtimeChannel;
  send: (event: SignalEvent) => Promise<void>;
  close: () => Promise<void>;
};

/** Ouvre un channel Realtime pour le signaling P2P. */
export async function openSignaling(
  roomId: string,
  onSignal: (e: SignalEvent) => void,
): Promise<SignalingHandle> {
  const sb = createClient();
  const channel = sb.channel(`support:${roomId}`, {
    config: { broadcast: { self: false } },
  });

  channel.on("broadcast", { event: "signal" }, ({ payload }) => {
    onSignal(payload as SignalEvent);
  });

  await new Promise<void>((resolve, reject) => {
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") resolve();
      else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        reject(new Error(`signaling channel ${status}`));
      }
    });
  });

  return {
    channel,
    send: async (event: SignalEvent) => {
      await channel.send({ type: "broadcast", event: "signal", payload: event });
    },
    close: async () => {
      await channel.unsubscribe();
    },
  };
}

/** Crée une PeerConnection avec STUN public + handlers basiques. */
export function createPeerConnection(): RTCPeerConnection {
  return new RTCPeerConnection({
    iceServers: STUN_SERVERS as unknown as RTCIceServer[],
    iceCandidatePoolSize: 4,
  });
}
