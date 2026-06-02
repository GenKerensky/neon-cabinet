import { SoundPatch } from "./types";

const outputNode = {
  id: "output",
  type: "output" as const,
  label: "Output",
  position: { x: 760, y: 180 },
};

function tonePatch(
  id: string,
  name: string,
  category: SoundPatch["category"],
  options: {
    frequency: number;
    waveform?: OscillatorType;
    duration: number;
    gain: number;
    attack?: number;
    decay?: number;
    sustain?: number;
    release?: number;
    noiseGain?: number;
    noiseDuration?: number;
    noiseFrequency?: number;
    startTime?: number;
  },
): SoundPatch {
  const nodes: SoundPatch["nodes"] = [
    {
      id: "tone",
      type: "oscillator",
      label: "Tone",
      position: { x: 80, y: 120 },
      waveform: options.waveform ?? "square",
      frequency: options.frequency,
      duration: options.duration,
      startTime: options.startTime,
    },
    {
      id: "envelope",
      type: "gainEnvelope",
      label: "Envelope",
      position: { x: 330, y: 120 },
      gain: options.gain,
      attack: options.attack ?? 0.006,
      decay: options.decay ?? 0.04,
      sustain: options.sustain ?? 0.35,
      release: options.release ?? 0.08,
      duration: options.duration,
      startTime: options.startTime,
    },
    {
      id: "pan",
      type: "stereoPanner",
      label: "Screen Pan",
      position: { x: 560, y: 120 },
      pan: 0,
    },
    outputNode,
  ];
  const connections: SoundPatch["connections"] = [
    { from: "tone", to: "envelope" },
    { from: "envelope", to: "pan" },
    { from: "pan", to: "output" },
  ];

  if (options.noiseGain && options.noiseDuration) {
    nodes.splice(2, 0, {
      id: "noise",
      type: "noiseBurst",
      label: "Transient",
      position: { x: 80, y: 290 },
      gain: options.noiseGain,
      duration: options.noiseDuration,
      filterFrequency: options.noiseFrequency ?? 1800,
    });
    connections.splice(2, 0, { from: "noise", to: "pan" });
  }

  return {
    schemaVersion: 1,
    id,
    name,
    category,
    duration: options.duration,
    preview: { intensity: 1, distance: 0, pan: 0 },
    nodes,
    connections,
  };
}

function chordPatch(
  id: string,
  name: string,
  category: SoundPatch["category"],
  notes: Array<[number, number, number]>,
  gain: number,
): SoundPatch {
  return {
    schemaVersion: 1,
    id,
    name,
    category,
    duration: Math.max(...notes.map(([, start, duration]) => start + duration)),
    preview: { intensity: 1, distance: 0, pan: 0 },
    nodes: [
      ...notes.flatMap(([frequency, startTime, duration], index) => [
        {
          id: `note-${index}`,
          type: "oscillator" as const,
          label: `Note ${index + 1}`,
          position: { x: 80, y: 70 + index * 56 },
          waveform: "triangle" as const,
          frequency,
          startTime,
          duration,
        },
        {
          id: `env-${index}`,
          type: "gainEnvelope" as const,
          label: `Envelope ${index + 1}`,
          position: { x: 330, y: 70 + index * 56 },
          gain,
          attack: 0.01,
          decay: 0.05,
          sustain: 0.55,
          release: 0.12,
          startTime,
          duration,
        },
      ]),
      outputNode,
    ],
    connections: [
      ...notes.flatMap((_, index) => [
        { from: `note-${index}`, to: `env-${index}` },
        { from: `env-${index}`, to: "output" },
      ]),
    ],
  };
}

export const SPACE_DEFENDER_AUDIO_PATCHES: SoundPatch[] = [
  {
    schemaVersion: 1,
    id: "space-defender-thrust-loop",
    name: "Space Defender Variable Thrust Loop",
    category: "Rumble",
    duration: 0,
    preview: { intensity: 0.7, distance: 0, pan: 0 },
    nodes: [
      {
        id: "drive",
        type: "oscillator",
        label: "Ion Drive",
        position: { x: 80, y: 130 },
        waveform: "sawtooth",
        frequency: 84,
        detune: -6,
      },
      {
        id: "flutter",
        type: "lfo",
        label: "Throttle Flutter",
        position: { x: 80, y: 300 },
        waveform: "triangle",
        frequency: 11,
        depth: 12,
        target: "drive",
        targetParam: "frequency",
      },
      {
        id: "nozzle",
        type: "filter",
        label: "Nozzle Filter",
        position: { x: 310, y: 130 },
        filterType: "lowpass",
        frequency: 1180,
        q: 0.9,
      },
      {
        id: "throttle",
        type: "gainEnvelope",
        label: "Throttle Gain",
        position: { x: 520, y: 130 },
        gain: 0.13,
        attack: 0.06,
        decay: 0.08,
        sustain: 1,
        release: 0.16,
      },
      {
        id: "pan",
        type: "stereoPanner",
        label: "Screen Pan",
        position: { x: 660, y: 130 },
        pan: 0,
      },
      outputNode,
    ],
    connections: [
      { from: "drive", to: "nozzle" },
      { from: "nozzle", to: "throttle" },
      { from: "throttle", to: "pan" },
      { from: "pan", to: "output" },
    ],
  },
  tonePatch(
    "space-defender-autocannon",
    "Space Defender Autocannon",
    "Weapon",
    {
      frequency: 760,
      waveform: "square",
      duration: 0.11,
      gain: 0.08,
      decay: 0.018,
      sustain: 0.18,
      release: 0.045,
      noiseGain: 0.12,
      noiseDuration: 0.045,
      noiseFrequency: 3600,
    },
  ),
  tonePatch("space-defender-laser", "Space Defender Laser", "Weapon", {
    frequency: 1040,
    waveform: "sawtooth",
    duration: 0.18,
    gain: 0.09,
    decay: 0.035,
    sustain: 0.42,
    release: 0.07,
    noiseGain: 0.045,
    noiseDuration: 0.08,
    noiseFrequency: 5200,
  }),
  tonePatch("space-defender-ray-gun", "Space Defender Ray Gun", "Weapon", {
    frequency: 1320,
    waveform: "triangle",
    duration: 0.26,
    gain: 0.095,
    attack: 0.012,
    decay: 0.06,
    sustain: 0.65,
    release: 0.1,
  }),
  tonePatch(
    "space-defender-missile-launch",
    "Space Defender Missile Launch",
    "Weapon",
    {
      frequency: 180,
      waveform: "sawtooth",
      duration: 0.36,
      gain: 0.12,
      attack: 0.02,
      decay: 0.08,
      sustain: 0.58,
      release: 0.16,
      noiseGain: 0.14,
      noiseDuration: 0.2,
      noiseFrequency: 1100,
    },
  ),
  {
    schemaVersion: 1,
    id: "space-defender-missile-detonation",
    name: "Space Defender Missile Detonation",
    category: "Explosion",
    duration: 0.74,
    preview: { intensity: 1.1, distance: 80, pan: -0.2 },
    nodes: [
      {
        id: "blast",
        type: "noiseBurst",
        label: "Blast Cloud",
        position: { x: 80, y: 90 },
        gain: 0.64,
        duration: 0.48,
        filterFrequency: 700,
      },
      {
        id: "core",
        type: "oscillator",
        label: "Low Core",
        position: { x: 80, y: 270 },
        waveform: "triangle",
        frequency: 62,
        duration: 0.52,
      },
      {
        id: "core-env",
        type: "gainEnvelope",
        label: "Core Envelope",
        position: { x: 330, y: 270 },
        gain: 0.18,
        attack: 0.008,
        decay: 0.12,
        sustain: 0.42,
        release: 0.28,
        duration: 0.52,
      },
      outputNode,
    ],
    connections: [
      { from: "blast", to: "output" },
      { from: "core", to: "core-env" },
      { from: "core-env", to: "output" },
    ],
  },
  tonePatch(
    "space-defender-asteroid-hit",
    "Space Defender Asteroid Hit",
    "Impact",
    {
      frequency: 220,
      waveform: "triangle",
      duration: 0.22,
      gain: 0.11,
      attack: 0.005,
      decay: 0.04,
      sustain: 0.25,
      release: 0.11,
      noiseGain: 0.18,
      noiseDuration: 0.13,
      noiseFrequency: 1200,
    },
  ),
  {
    schemaVersion: 1,
    id: "space-defender-asteroid-destruction",
    name: "Space Defender Asteroid Destruction",
    category: "Explosion",
    duration: 0.62,
    preview: { intensity: 0.95, distance: 120, pan: 0.15 },
    nodes: [
      {
        id: "crumble",
        type: "noiseBurst",
        label: "Rock Crumble",
        position: { x: 80, y: 110 },
        gain: 0.36,
        duration: 0.42,
        filterFrequency: 900,
      },
      {
        id: "sparkle",
        type: "noiseBurst",
        label: "Ore Sparks",
        position: { x: 320, y: 110 },
        gain: 0.16,
        duration: 0.18,
        filterFrequency: 3600,
      },
      outputNode,
    ],
    connections: [
      { from: "crumble", to: "output" },
      { from: "sparkle", to: "output" },
    ],
  },
  tonePatch(
    "space-defender-ship-collision",
    "Space Defender Ship Collision",
    "Impact",
    {
      frequency: 150,
      waveform: "sawtooth",
      duration: 0.28,
      gain: 0.16,
      attack: 0.006,
      decay: 0.08,
      sustain: 0.36,
      release: 0.14,
      noiseGain: 0.22,
      noiseDuration: 0.16,
      noiseFrequency: 1500,
    },
  ),
  {
    schemaVersion: 1,
    id: "space-defender-ship-destruction",
    name: "Space Defender Ship Destruction",
    category: "Explosion",
    duration: 0.9,
    preview: { intensity: 1.15, distance: 0, pan: 0 },
    nodes: [
      {
        id: "hull",
        type: "noiseBurst",
        label: "Hull Burst",
        position: { x: 80, y: 110 },
        gain: 0.72,
        duration: 0.54,
        filterFrequency: 820,
      },
      {
        id: "reactor",
        type: "oscillator",
        label: "Reactor Bloom",
        position: { x: 80, y: 290 },
        waveform: "sawtooth",
        frequency: 44,
        duration: 0.72,
      },
      {
        id: "reactor-env",
        type: "gainEnvelope",
        label: "Bloom Envelope",
        position: { x: 330, y: 290 },
        gain: 0.24,
        attack: 0.01,
        decay: 0.18,
        sustain: 0.44,
        release: 0.38,
        duration: 0.72,
      },
      outputNode,
    ],
    connections: [
      { from: "hull", to: "output" },
      { from: "reactor", to: "reactor-env" },
      { from: "reactor-env", to: "output" },
    ],
  },
  chordPatch(
    "space-defender-game-start",
    "Space Defender Game Start",
    "Music Cue",
    [
      [523.25, 0, 0.14],
      [659.25, 0.16, 0.14],
      [880, 0.32, 0.22],
    ],
    0.075,
  ),
  tonePatch("space-defender-pause", "Space Defender Pause", "Music Cue", {
    frequency: 440,
    waveform: "triangle",
    duration: 0.2,
    gain: 0.07,
    attack: 0.004,
    decay: 0.03,
    sustain: 0.4,
    release: 0.08,
  }),
  tonePatch(
    "space-defender-weapon-switch",
    "Space Defender Weapon Switch",
    "Music Cue",
    {
      frequency: 920,
      waveform: "square",
      duration: 0.16,
      gain: 0.065,
      attack: 0.003,
      decay: 0.025,
      sustain: 0.32,
      release: 0.06,
    },
  ),
  chordPatch(
    "space-defender-weapon-unlock",
    "Space Defender Weapon Unlock",
    "Music Cue",
    [
      [659.25, 0, 0.12],
      [987.77, 0.13, 0.16],
    ],
    0.07,
  ),
  chordPatch(
    "space-defender-wave-clear",
    "Space Defender Wave Clear",
    "Music Cue",
    [
      [392, 0, 0.16],
      [523.25, 0.18, 0.16],
      [783.99, 0.38, 0.28],
    ],
    0.075,
  ),
  chordPatch(
    "space-defender-game-over",
    "Space Defender Game Over",
    "Music Cue",
    [
      [293.66, 0, 0.24],
      [233.08, 0.3, 0.24],
      [174.61, 0.62, 0.42],
    ],
    0.085,
  ),
  chordPatch(
    "space-defender-title-placeholder",
    "Space Defender Title Placeholder",
    "Music Cue",
    [
      [261.63, 0, 0.38],
      [392, 0.48, 0.38],
      [523.25, 0.96, 0.46],
      [784, 1.52, 0.58],
    ],
    0.045,
  ),
];

export const SPACE_DEFENDER_AUDIO_PATCH_BY_ID = Object.fromEntries(
  SPACE_DEFENDER_AUDIO_PATCHES.map((patch) => [patch.id, patch]),
) as Record<string, SoundPatch>;
