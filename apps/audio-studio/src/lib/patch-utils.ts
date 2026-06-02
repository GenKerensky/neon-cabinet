import {
  AudioNodeConfig,
  AudioStudioGameRegistration,
  DEFAULT_AUDIO_STUDIO_GAME_ID,
  getAudioStudioGameById,
  migratePatchToCurrentSchema,
  SOUND_PATCH_SCHEMA_VERSION,
  SoundPatch,
} from "@neon-cabinet/audio-tools";

export const NODE_TYPES: AudioNodeConfig["type"][] = [
  "clipSource",
  "oscillator",
  "lfo",
  "gainEnvelope",
  "noiseBurst",
  "filter",
  "stereoPanner",
  "spatialAttenuation",
  "output",
];

export const clonePatch = (patch: SoundPatch): SoundPatch =>
  JSON.parse(JSON.stringify(patch)) as SoundPatch;

export const DEFAULT_GAME =
  getAudioStudioGameById(DEFAULT_AUDIO_STUDIO_GAME_ID) ??
  ({
    effects: [],
    id: DEFAULT_AUDIO_STUDIO_GAME_ID,
    title: "Battle Tanks",
  } as AudioStudioGameRegistration);

export const DEFAULT_PATCH = defaultPatchForGame(DEFAULT_GAME);

export function defaultPatchForGame(
  game: AudioStudioGameRegistration,
): SoundPatch {
  const defaultEffect = game.defaultEffectId
    ? game.effects.find((effect) => effect.id === game.defaultEffectId)
    : undefined;
  return clonePatch(
    migratePatchToCurrentSchema(
      defaultEffect ?? game.effects[0] ?? createStarterPatchForGame(game),
    ),
  );
}

export function createStarterPatchForGame(
  game: Pick<AudioStudioGameRegistration, "id" | "title">,
): SoundPatch {
  return {
    schemaVersion: SOUND_PATCH_SCHEMA_VERSION,
    id: `${game.id}-starter-effect`,
    name: `${game.title} Starter Effect`,
    category: "Rumble",
    duration: 0.25,
    preview: { intensity: 1, distance: 0, pan: 0 },
    nodes: [
      {
        id: "output",
        type: "output",
        label: "Output",
        position: { x: 360, y: 180 },
      },
    ],
    connections: [],
    clips: [],
    constraintProfileId: "fantasy",
    instruments: [],
  };
}

export function createDefaultNode(
  type: AudioNodeConfig["type"],
  index: number,
): AudioNodeConfig {
  const id = `${type}-${index}`;
  const position = { x: 120 + (index % 3) * 180, y: 120 + index * 24 };

  switch (type) {
    case "clipSource":
      return {
        id,
        type,
        label: "Clip Source",
        position,
        clipId: "default-clip",
      };
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
