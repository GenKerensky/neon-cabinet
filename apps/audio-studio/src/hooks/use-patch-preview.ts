import {
  SoundPatch,
  createLoopingPatch,
  playPatchOnce,
  type PatchInstance,
} from "@neon-cabinet/audio-tools";
import { useRef, useState } from "react";

export type PreviewPlayback = {
  durationSeconds: number;
  mode: "loop" | "once";
  startedAtMs: number;
};

export function usePatchPreview() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const loopRef = useRef<PatchInstance | null>(null);
  const playTokenRef = useRef(0);
  const [playback, setPlayback] = useState<PreviewPlayback | null>(null);

  function getAudioContext(): AudioContext {
    if (!audioContextRef.current) {
      const AudioContextConstructor =
        window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      audioContextRef.current = new AudioContextConstructor();
    }
    return audioContextRef.current;
  }

  async function playPreview(
    patch: SoundPatch,
    options: { distance: number; intensity: number; pan: number },
  ): Promise<void> {
    loopRef.current?.stop();
    loopRef.current = null;
    const token = ++playTokenRef.current;
    setPlayback({
      durationSeconds: patch.duration,
      mode: "once",
      startedAtMs: performance.now(),
    });
    try {
      const context = getAudioContext();
      if (context.state !== "running") await context.resume();
      await playPatchOnce(context, patch, options);
    } finally {
      if (playTokenRef.current === token) {
        setPlayback(null);
      }
    }
  }

  async function toggleLoop(
    patch: SoundPatch,
    options: { distance: number; intensity: number; pan: number },
  ): Promise<boolean> {
    if (loopRef.current) {
      loopRef.current.stop();
      loopRef.current = null;
      ++playTokenRef.current;
      setPlayback(null);
      return false;
    }

    const context = getAudioContext();
    if (context.state !== "running") await context.resume();
    loopRef.current = createLoopingPatch(context, patch, options);
    setPlayback({
      durationSeconds: patch.duration,
      mode: "loop",
      startedAtMs: performance.now(),
    });
    return true;
  }

  return {
    playback,
    isLooping: Boolean(loopRef.current),
    playPreview,
    toggleLoop,
  };
}
