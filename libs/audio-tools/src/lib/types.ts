export const SOUND_PATCH_SCHEMA_VERSION = 2;
export const LEGACY_SOUND_PATCH_SCHEMA_VERSION = 1;

export type SoundPatchCategory =
  | "Rumble"
  | "Weapon"
  | "Impact"
  | "Explosion"
  | "Music Cue";

export type AudioNodeType =
  | "clipSource"
  | "oscillator"
  | "lfo"
  | "gainEnvelope"
  | "noiseBurst"
  | "filter"
  | "stereoPanner"
  | "spatialAttenuation"
  | "output";

export type WaveformType = OscillatorType;
export type ChiptuneEngineType =
  | "pulse"
  | "triangle"
  | "noise"
  | "wavetable"
  | "sample"
  | "fm2op"
  | "fm4op";
export type NoteName = "A" | "B" | "C" | "D" | "E" | "F" | "G";
export type NoteAccidental = "natural" | "#" | "b";

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

export interface ClipSourceConfig extends BaseAudioNodeConfig {
  type: "clipSource";
  clipId: string;
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
  | ClipSourceConfig
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

export interface ClipNotePitch {
  note: NoteName;
  accidental: NoteAccidental;
  octave: number;
}

export interface ClipNoteEffect {
  command: string;
  value: string;
}

export interface ClipNote {
  id: string;
  pitch: ClipNotePitch;
  startBeat: number;
  durationBeats: number;
  velocity: number;
  channelId: string;
  instrumentId: string;
  effects?: ClipNoteEffect[];
}

export interface ClipChannel {
  id: string;
  name: string;
  engine: ChiptuneEngineType;
}

export interface BaseAudioClip {
  id: string;
  type: "music" | "sfx";
  name: string;
  bpm: number;
  timeSignature: [number, number];
  channels: ClipChannel[];
  notes: ClipNote[];
}

export interface MusicClip extends BaseAudioClip {
  type: "music";
}

export interface SfxClip extends BaseAudioClip {
  type: "sfx";
}

export type AudioClip = MusicClip | SfxClip;

export interface ClipInstrumentEnvelope {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
}

export interface ClipInstrument {
  id: string;
  name: string;
  engine: ChiptuneEngineType;
  waveform: WaveformType | "pulse" | "noise" | "sample" | "wavetable";
  duty?: number;
  gain?: number;
  envelope: ClipInstrumentEnvelope;
}

export interface ChipChannelDefinition {
  id: string;
  name: string;
  engine: ChiptuneEngineType;
  count: number;
}

export interface ChipConstraintProfile {
  id: string;
  name: string;
  channels: ChipChannelDefinition[];
}

export interface ConstraintWarning {
  code: "channel-budget" | "missing-instrument" | "missing-channel";
  message: string;
  profileId?: string;
  clipId?: string;
}

export interface SoundPatch {
  schemaVersion:
    | typeof LEGACY_SOUND_PATCH_SCHEMA_VERSION
    | typeof SOUND_PATCH_SCHEMA_VERSION;
  id: string;
  name: string;
  category: SoundPatchCategory;
  duration: number;
  nodes: AudioNodeConfig[];
  connections: PatchConnection[];
  preview: PatchPreviewContext;
  clips?: AudioClip[];
  constraintProfileId?: string;
  instruments?: ClipInstrument[];
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

export interface AudioStudioGameIcon {
  label: string;
  svgDataUri: string;
  svgPath: string;
  pngPaths: {
    16: string;
    32: string;
    48: string;
  };
}

export interface AudioStudioGameMetadata {
  description: string;
  href: string;
  status?: "available" | "coming-soon";
}

export interface AudioStudioGameTheme {
  accent: string;
  accentForeground: string;
  audioGrid: string;
  audioLine: string;
  audioPanel: string;
  audioPanelStrong: string;
  background: string;
  border: string;
  foreground: string;
  input: string;
  primary: string;
  primaryForeground: string;
  ring: string;
  secondary: string;
  secondaryForeground: string;
}

export interface AudioStudioGameRegistration {
  id: string;
  title: string;
  icon: AudioStudioGameIcon;
  metadata: AudioStudioGameMetadata;
  effects: SoundPatch[];
  theme: AudioStudioGameTheme;
  defaultEffectId?: string;
}
