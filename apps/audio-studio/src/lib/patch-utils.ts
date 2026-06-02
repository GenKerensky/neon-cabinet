import {
  AudioNodeConfig,
  BATTLE_TANKS_AUDIO_PATCHES,
  SoundPatch,
} from "@neon-cabinet/audio-tools";

export const NODE_TYPES: AudioNodeConfig["type"][] = [
  "oscillator",
  "lfo",
  "gainEnvelope",
  "noiseBurst",
  "filter",
  "stereoPanner",
  "spatialAttenuation",
  "output",
];

export const DEFAULT_PATCH = BATTLE_TANKS_AUDIO_PATCHES[2];

export const clonePatch = (patch: SoundPatch): SoundPatch =>
  JSON.parse(JSON.stringify(patch)) as SoundPatch;

export function createDefaultNode(
  type: AudioNodeConfig["type"],
  index: number,
): AudioNodeConfig {
  const id = `${type}-${index}`;
  const position = { x: 120 + (index % 3) * 180, y: 120 + index * 24 };

  switch (type) {
    case "oscillator":
      return {
        id,
        type,
        label: "Oscillator",
        position,
        waveform: "sawtooth",
        frequency: 110,
      };
    case "lfo":
      return {
        id,
        type,
        label: "LFO",
        position,
        waveform: "sine",
        frequency: 5,
        depth: 2,
        target: "output",
        targetParam: "gain",
      };
    case "gainEnvelope":
      return {
        id,
        type,
        label: "Gain Envelope",
        position,
        gain: 0.2,
        attack: 0.01,
        decay: 0.08,
        sustain: 0.5,
        release: 0.14,
        duration: 0.28,
      };
    case "noiseBurst":
      return {
        id,
        type,
        label: "Noise Burst",
        position,
        gain: 0.25,
        duration: 0.18,
        filterFrequency: 1200,
      };
    case "filter":
      return {
        id,
        type,
        label: "Filter",
        position,
        filterType: "lowpass",
        frequency: 900,
        q: 1,
      };
    case "stereoPanner":
      return { id, type, label: "Stereo Panner", position, pan: 0 };
    case "spatialAttenuation":
      return {
        id,
        type,
        label: "Spatial Attenuation",
        position,
        maxDistance: 1200,
        minGain: 0,
        maxGain: 0.12,
      };
    case "output":
      return { id, type, label: "Output", position };
  }
}

export function labelForType(type: AudioNodeConfig["type"]): string {
  return type
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (letter) => letter.toUpperCase());
}
