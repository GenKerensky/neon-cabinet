export const SOUND_PATCH_SCHEMA_VERSION = 1;

export type SoundPatchCategory =
  | "Rumble"
  | "Weapon"
  | "Impact"
  | "Explosion"
  | "Music Cue";

export type AudioNodeType =
  | "oscillator"
  | "lfo"
  | "gainEnvelope"
  | "noiseBurst"
  | "filter"
  | "stereoPanner"
  | "spatialAttenuation"
  | "output";

export type WaveformType = OscillatorType;

export interface NodePosition {
  x: number;
  y: number;
}

export interface BaseAudioNodeConfig {
  id: string;
  type: AudioNodeType;
  label: string;
  position: NodePosition;
}

export interface OscillatorConfig extends BaseAudioNodeConfig {
  type: "oscillator";
  waveform: WaveformType;
  frequency: number;
  detune?: number;
  gain?: number;
  startTime?: number;
  duration?: number;
}

export interface LfoConfig extends BaseAudioNodeConfig {
  type: "lfo";
  waveform: WaveformType;
  frequency: number;
  depth: number;
  target: string;
  targetParam: "frequency" | "gain" | "pan" | "detune" | "filterFrequency";
}

export interface GainEnvelopeConfig extends BaseAudioNodeConfig {
  type: "gainEnvelope";
  gain: number;
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  startTime?: number;
  duration?: number;
}

export interface NoiseBurstConfig extends BaseAudioNodeConfig {
  type: "noiseBurst";
  gain: number;
  duration: number;
  filterFrequency?: number;
  startTime?: number;
}

export interface FilterConfig extends BaseAudioNodeConfig {
  type: "filter";
  filterType: BiquadFilterType;
  frequency: number;
  q: number;
}

export interface StereoPannerConfig extends BaseAudioNodeConfig {
  type: "stereoPanner";
  pan: number;
}

export interface SpatialAttenuationConfig extends BaseAudioNodeConfig {
  type: "spatialAttenuation";
  maxDistance: number;
  minGain: number;
  maxGain: number;
}

export interface OutputConfig extends BaseAudioNodeConfig {
  type: "output";
}

export type AudioNodeConfig =
  | OscillatorConfig
  | LfoConfig
  | GainEnvelopeConfig
  | NoiseBurstConfig
  | FilterConfig
  | StereoPannerConfig
  | SpatialAttenuationConfig
  | OutputConfig;

export interface PatchConnection {
  from: string;
  to: string;
}

export interface PatchPreviewContext {
  intensity?: number;
  distance?: number;
  pan?: number;
}

export interface SoundPatch {
  schemaVersion: typeof SOUND_PATCH_SCHEMA_VERSION;
  id: string;
  name: string;
  category: SoundPatchCategory;
  duration: number;
  nodes: AudioNodeConfig[];
  connections: PatchConnection[];
  preview: PatchPreviewContext;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface PatchInstance {
  patch: SoundPatch;
  updateContext(context: PatchPreviewContext): void;
  stop(): void;
}
