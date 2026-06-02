import {
  SoundPatch,
  createLoopingPatch,
  playPatchOnce,
  type PatchInstance,
} from "@neon-cabinet/audio-tools";
import { useRef } from "react";

export function usePatchPreview() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const loopRef = useRef<PatchInstance | null>(null);

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
    const context = getAudioContext();
    if (context.state !== "running") await context.resume();
    await playPatchOnce(context, patch, options);
  }

  async function toggleLoop(
    patch: SoundPatch,
    options: { distance: number; intensity: number; pan: number },
  ): Promise<boolean> {
    if (loopRef.current) {
      loopRef.current.stop();
      loopRef.current = null;
      return false;
    }

    const context = getAudioContext();
    if (context.state !== "running") await context.resume();
    loopRef.current = createLoopingPatch(context, patch, options);
    return true;
  }

  return {
    isLooping: Boolean(loopRef.current),
    playPreview,
    toggleLoop,
  };
}
