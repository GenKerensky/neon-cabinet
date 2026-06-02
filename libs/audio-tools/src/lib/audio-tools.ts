import {
  AudioClip,
  AudioNodeConfig,
  ChipConstraintProfile,
  ClipInstrument,
  ClipNotePitch,
  ConstraintWarning,
  GainEnvelopeConfig,
  LEGACY_SOUND_PATCH_SCHEMA_VERSION,
  LfoConfig,
  NoiseBurstConfig,
  PatchInstance,
  PatchPreviewContext,
  SOUND_PATCH_SCHEMA_VERSION,
  SoundPatch,
  ValidationResult,
} from "./types";

interface RuntimeNode {
  input?: AudioNode;
  output: AudioNode;
  start?(): void;
  stop?(): void;
  updateContext?(context: Required<PatchPreviewContext>): void;
  params?: Record<string, AudioParam>;
}

const DEFAULT_CONTEXT: Required<PatchPreviewContext> = {
  intensity: 1,
  distance: 0,
  pan: 0,
};

const VALID_NODE_TYPES = new Set<AudioNodeConfig["type"]>([
  "clipSource",
  "oscillator",
  "lfo",
  "gainEnvelope",
  "noiseBurst",
  "filter",
  "stereoPanner",
  "spatialAttenuation",
  "output",
]);

export const CHIP_CONSTRAINT_PROFILES: ChipConstraintProfile[] = [
  {
    id: "arcade-psg",
    name: "Arcade PSG",
    channels: [
      { id: "tone", name: "Tone", engine: "pulse", count: 3 },
      { id: "noise", name: "Noise", engine: "noise", count: 1 },
    ],
  },
  {
    id: "nes",
    name: "NES",
    channels: [
      { id: "pulse", name: "Pulse", engine: "pulse", count: 2 },
      { id: "triangle", name: "Triangle", engine: "triangle", count: 1 },
      { id: "noise", name: "Noise", engine: "noise", count: 1 },
      { id: "sample", name: "DMC", engine: "sample", count: 1 },
    ],
  },
  {
    id: "game-boy",
    name: "Game Boy",
    channels: [
      { id: "pulse", name: "Pulse", engine: "pulse", count: 2 },
      { id: "wavetable", name: "Wave", engine: "wavetable", count: 1 },
      { id: "noise", name: "Noise", engine: "noise", count: 1 },
    ],
  },
  {
    id: "c64-sid",
    name: "C64 SID",
    channels: [{ id: "voice", name: "Voice", engine: "pulse", count: 3 }],
  },
  {
    id: "genesis",
    name: "Genesis FM+PSG",
    channels: [
      { id: "fm", name: "FM", engine: "fm4op", count: 6 },
      { id: "psg", name: "PSG", engine: "pulse", count: 3 },
      { id: "noise", name: "Noise", engine: "noise", count: 1 },
    ],
  },
  {
    id: "snes",
    name: "SNES Sample Voices",
    channels: [{ id: "sample", name: "Sample", engine: "sample", count: 8 }],
  },
  {
    id: "fantasy",
    name: "Fantasy Chip",
    channels: [
      { id: "pulse", name: "Pulse", engine: "pulse", count: 16 },
      { id: "triangle", name: "Triangle", engine: "triangle", count: 16 },
      { id: "noise", name: "Noise", engine: "noise", count: 16 },
      { id: "fm", name: "FM", engine: "fm4op", count: 16 },
      { id: "wavetable", name: "Wavetable", engine: "wavetable", count: 16 },
      { id: "sample", name: "Sample", engine: "sample", count: 16 },
    ],
  },
];

export function validatePatch(patch: unknown): ValidationResult {
  const errors: string[] = [];

  if (!isRecord(patch)) {
    return { valid: false, errors: ["Patch must be an object."] };
  }

  if (
    patch.schemaVersion !== SOUND_PATCH_SCHEMA_VERSION &&
    patch.schemaVersion !== LEGACY_SOUND_PATCH_SCHEMA_VERSION
  ) {
    errors.push(
      `schemaVersion must be ${LEGACY_SOUND_PATCH_SCHEMA_VERSION} or ${SOUND_PATCH_SCHEMA_VERSION}.`,
    );
  }

  if (typeof patch.id !== "string" || patch.id.length === 0) {
    errors.push("Patch id is required.");
  }

  if (!Array.isArray(patch.nodes)) {
    errors.push("Patch nodes must be an array.");
  }

  if (!Array.isArray(patch.connections)) {
    errors.push("Patch connections must be an array.");
  }

  if (errors.length > 0) return { valid: false, errors };

  const nodes = patch.nodes as AudioNodeConfig[];
  const ids = new Set<string>();
  nodes.forEach((node, index) => {
    if (!node.id) errors.push(`Node ${index} is missing an id.`);
    if (ids.has(node.id)) errors.push(`Duplicate node id "${node.id}".`);
    ids.add(node.id);

    if (!VALID_NODE_TYPES.has(node.type)) {
      errors.push(`Node "${node.id}" has unsupported type "${node.type}".`);
    }

    validateNodeRange(node, errors);
  });

  (patch.connections as Array<{ from?: unknown; to?: unknown }>).forEach(
    (connection, index) => {
      if (typeof connection.from !== "string" || !ids.has(connection.from)) {
        errors.push(
          `Connection ${index} references missing from node "${String(
            connection.from,
          )}".`,
        );
      }
      if (typeof connection.to !== "string" || !ids.has(connection.to)) {
        errors.push(
          `Connection ${index} references missing to node "${String(
            connection.to,
          )}".`,
        );
      }
    },
  );

  for (const node of nodes) {
    if (node.type === "lfo" && !ids.has(node.target)) {
      errors.push(
        `LFO "${node.id}" references missing target "${node.target}".`,
      );
    }
    if (
      node.type === "clipSource" &&
      !((patch.clips as AudioClip[] | undefined) ?? []).some(
        (clip) => clip.id === node.clipId,
      )
    ) {
      errors.push(
        `Clip source "${node.id}" references missing clip "${node.clipId}".`,
      );
    }
  }

  validateClipReferences(patch as Partial<SoundPatch>, errors);

  return { valid: errors.length === 0, errors };
}

export function parsePatch(json: string): SoundPatch {
  const patch = migratePatchToCurrentSchema(JSON.parse(json) as unknown);
  const result = validatePatch(patch);
  if (!result.valid) {
    throw new Error(result.errors.join("\n"));
  }
  return patch as SoundPatch;
}

export function serializePatch(patch: SoundPatch): string {
  const result = validatePatch(patch);
  if (!result.valid) {
    throw new Error(result.errors.join("\n"));
  }
  return JSON.stringify(patch, null, 2);
}

export function migratePatchToCurrentSchema(patch: unknown): SoundPatch {
  if (!isRecord(patch)) {
    throw new Error("Patch must be an object.");
  }

  if (patch.schemaVersion === SOUND_PATCH_SCHEMA_VERSION) {
    return patch as unknown as SoundPatch;
  }

  if (patch.schemaVersion !== LEGACY_SOUND_PATCH_SCHEMA_VERSION) {
    return patch as unknown as SoundPatch;
  }

  const legacyPatch = patch as unknown as SoundPatch;
  const authoringData = createAuthoringDataFromTimedOscillators(legacyPatch);

  return {
    ...legacyPatch,
    schemaVersion: SOUND_PATCH_SCHEMA_VERSION,
    clips: authoringData?.clips ?? [],
    constraintProfileId: "fantasy",
    instruments: authoringData?.instruments ?? [],
  };
}

export function noteToFrequency(pitch: ClipNotePitch): number {
  const semitoneByNote: Record<ClipNotePitch["note"], number> = {
    C: 0,
    D: 2,
    E: 4,
    F: 5,
    G: 7,
    A: 9,
    B: 11,
  };
  const accidental =
    pitch.accidental === "#" ? 1 : pitch.accidental === "b" ? -1 : 0;
  const midi =
    (pitch.octave + 1) * 12 + semitoneByNote[pitch.note] + accidental;
  return 440 * 2 ** ((midi - 69) / 12);
}

export function frequencyToPitch(frequency: number): ClipNotePitch {
  const midi = Math.round(69 + 12 * Math.log2(frequency / 440));
  const octave = Math.floor(midi / 12) - 1;
  const semitone = ((midi % 12) + 12) % 12;
  const notes: ClipNotePitch[] = [
    { note: "C", accidental: "natural", octave },
    { note: "C", accidental: "#", octave },
    { note: "D", accidental: "natural", octave },
    { note: "D", accidental: "#", octave },
    { note: "E", accidental: "natural", octave },
    { note: "F", accidental: "natural", octave },
    { note: "F", accidental: "#", octave },
    { note: "G", accidental: "natural", octave },
    { note: "G", accidental: "#", octave },
    { note: "A", accidental: "natural", octave },
    { note: "A", accidental: "#", octave },
    { note: "B", accidental: "natural", octave },
  ];
  return notes[semitone];
}

export function getConstraintWarnings(patch: SoundPatch): ConstraintWarning[] {
  const profile =
    CHIP_CONSTRAINT_PROFILES.find(
      (candidate) => candidate.id === patch.constraintProfileId,
    ) ??
    CHIP_CONSTRAINT_PROFILES.find((candidate) => candidate.id === "fantasy");
  if (!profile) return [];

  const warnings: ConstraintWarning[] = [];
  for (const clip of patch.clips ?? []) {
    for (const channel of clip.channels) {
      const allowed = profile.channels
        .filter((definition) => definition.engine === channel.engine)
        .reduce((total, definition) => total + definition.count, 0);
      const used = clip.channels.filter(
        (candidate) => candidate.engine === channel.engine,
      ).length;
      if (used > allowed) {
        warnings.push({
          code: "channel-budget",
          clipId: clip.id,
          message: `${clip.name} uses ${used} ${channel.engine} channels, but ${profile.name} allows ${allowed}.`,
          profileId: profile.id,
        });
        break;
      }
    }
  }

  return warnings;
}

function createAuthoringDataFromTimedOscillators(
  patch: SoundPatch,
): { clips: AudioClip[]; instruments: ClipInstrument[] } | null {
  const timedOscillators = patch.nodes
    .filter(
      (node): node is Extract<AudioNodeConfig, { type: "oscillator" }> =>
        node.type === "oscillator" &&
        Number.isFinite(node.startTime) &&
        Number.isFinite(node.duration),
    )
    .sort((a, b) => (a.startTime ?? 0) - (b.startTime ?? 0));
  if (timedOscillators.length === 0) return null;

  const firstEnvelope = findEnvelopeForOscillator(
    patch,
    timedOscillators[0].id,
  );
  const instrument: ClipInstrument = {
    id: `${patch.id}-instrument`,
    engine: "pulse",
    envelope: {
      attack: firstEnvelope?.attack ?? 0.005,
      decay: firstEnvelope?.decay ?? 0.04,
      release: firstEnvelope?.release ?? 0.06,
      sustain: firstEnvelope?.sustain ?? 0.7,
    },
    gain: firstEnvelope?.gain ?? 0.75,
    name: `${patch.name} Instrument`,
    waveform: timedOscillators[0].waveform,
  };
  const beatSeconds = 0.5;
  const clip: AudioClip = {
    id: `${patch.id}-clip`,
    bpm: 120,
    channels: [{ id: "pulse-1", engine: "pulse", name: "Pulse 1" }],
    name: `${patch.name} Clip`,
    notes: timedOscillators.map((node, index) => ({
      id: node.id || `note-${index}`,
      channelId: "pulse-1",
      durationBeats: roundToBeats((node.duration ?? beatSeconds) / beatSeconds),
      instrumentId: instrument.id,
      pitch: frequencyToPitch(node.frequency),
      startBeat: roundToBeats((node.startTime ?? 0) / beatSeconds),
      velocity: Math.max(0.01, Math.min(1, node.gain ?? 1)),
    })),
    timeSignature: [4, 4],
    type: patch.category === "Music Cue" ? "music" : "sfx",
  };

  return { clips: [clip], instruments: [instrument] };
}

function findEnvelopeForOscillator(
  patch: SoundPatch,
  oscillatorId: string,
): GainEnvelopeConfig | undefined {
  const envelopeId = patch.connections.find(
    (connection) => connection.from === oscillatorId,
  )?.to;
  const envelope = patch.nodes.find(
    (node): node is GainEnvelopeConfig =>
      node.type === "gainEnvelope" && node.id === envelopeId,
  );
  return envelope;
}

function roundToBeats(value: number): number {
  return Number(value.toFixed(2));
}

export function createPatchInstance(
  audioContext: AudioContext,
  patch: SoundPatch,
  options: PatchPreviewContext = {},
): PatchInstance {
  const result = validatePatch(patch);
  if (!result.valid) {
    throw new Error(result.errors.join("\n"));
  }

  const context = normalizeContext(options);
  const runtimeNodes = new Map<string, RuntimeNode>();

  for (const node of patch.nodes) {
    runtimeNodes.set(
      node.id,
      createRuntimeNode(audioContext, patch, node, context),
    );
  }

  for (const connection of patch.connections) {
    const from = runtimeNodes.get(connection.from);
    const to = runtimeNodes.get(connection.to);
    if (!from || !to) continue;

    if (isOutputNode(patch, connection.to)) {
      from.output.connect(audioContext.destination);
    } else {
      from.output.connect(to.input ?? to.output);
    }
  }

  for (const node of patch.nodes) {
    if (node.type !== "lfo") continue;
    connectLfo(runtimeNodes, node);
  }

  for (const node of runtimeNodes.values()) {
    node.start?.();
  }

  return {
    patch,
    updateContext(nextContext) {
      const normalized = normalizeContext(nextContext);
      for (const node of runtimeNodes.values()) {
        node.updateContext?.(normalized);
      }
    },
    stop() {
      for (const node of runtimeNodes.values()) {
        node.stop?.();
        node.output.disconnect();
        node.input?.disconnect();
      }
    },
  };
}

export function createLoopingPatch(
  audioContext: AudioContext,
  patch: SoundPatch,
  options: PatchPreviewContext = {},
): PatchInstance {
  return createPatchInstance(audioContext, patch, options);
}

export function playPatchOnce(
  audioContext: AudioContext,
  patch: SoundPatch,
  options: PatchPreviewContext = {},
): Promise<void> {
  const instance = createPatchInstance(audioContext, patch, options);
  return new Promise((resolve) => {
    window.setTimeout(
      () => {
        instance.stop();
        resolve();
      },
      Math.max(1, patch.duration * 1000 + 80),
    );
  });
}

function createRuntimeNode(
  audioContext: AudioContext,
  patch: SoundPatch,
  node: AudioNodeConfig,
  context: Required<PatchPreviewContext>,
): RuntimeNode {
  switch (node.type) {
    case "clipSource":
      return createClipSourceNode(audioContext, patch, node, context);
    case "oscillator":
      return createOscillatorNode(audioContext, node);
    case "lfo":
      return createLfoNode(audioContext, node);
    case "gainEnvelope":
      return createGainEnvelopeNode(audioContext, node, context);
    case "noiseBurst":
      return createNoiseBurstNode(audioContext, node);
    case "filter":
      return createFilterNode(audioContext, node);
    case "stereoPanner":
      return createStereoPannerNode(audioContext, node, context);
    case "spatialAttenuation":
      return createSpatialAttenuationNode(audioContext, node, context);
    case "output":
      return { output: audioContext.destination };
  }
}

function createClipSourceNode(
  audioContext: AudioContext,
  patch: SoundPatch,
  node: Extract<AudioNodeConfig, { type: "clipSource" }>,
  context: Required<PatchPreviewContext>,
): RuntimeNode {
  const mix = audioContext.createGain();
  const sources: Array<{ stop: () => void }> = [];

  return {
    output: mix,
    start() {
      const clip = patch.clips?.find(
        (candidate) => candidate.id === node.clipId,
      );
      if (!clip) return;

      for (const note of clip.notes) {
        const instrument = patch.instruments?.find(
          (candidate) => candidate.id === note.instrumentId,
        );
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        const start =
          audioContext.currentTime + beatsToSeconds(note.startBeat, clip.bpm);
        const duration = beatsToSeconds(note.durationBeats, clip.bpm);

        oscillator.type = waveformForInstrument(instrument);
        oscillator.frequency.value = noteToFrequency(note.pitch);
        scheduleClipGain(
          gain.gain,
          instrument,
          note.velocity,
          context,
          start,
          duration,
        );
        oscillator.connect(gain);
        gain.connect(mix);
        oscillator.start(start);
        oscillator.stop(start + duration);
        sources.push(oscillator);
      }
    },
    stop() {
      for (const source of sources) {
        stopSource(source);
      }
    },
  };
}

function createOscillatorNode(
  audioContext: AudioContext,
  node: Extract<AudioNodeConfig, { type: "oscillator" }>,
): RuntimeNode {
  const oscillator = audioContext.createOscillator();
  oscillator.type = node.waveform;
  oscillator.frequency.value = node.frequency;
  oscillator.detune.value = node.detune ?? 0;

  return {
    output: oscillator,
    params: {
      frequency: oscillator.frequency,
      detune: oscillator.detune,
    },
    start() {
      oscillator.start(audioContext.currentTime + (node.startTime ?? 0));
      if (node.duration !== undefined) {
        oscillator.stop(
          audioContext.currentTime + (node.startTime ?? 0) + node.duration,
        );
      }
    },
    stop() {
      stopSource(oscillator);
    },
  };
}

function createLfoNode(
  audioContext: AudioContext,
  node: LfoConfig,
): RuntimeNode {
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = node.waveform;
  oscillator.frequency.value = node.frequency;
  gain.gain.value = node.depth;
  oscillator.connect(gain);

  return {
    input: gain,
    output: gain,
    params: {
      frequency: oscillator.frequency,
      gain: gain.gain,
    },
    start() {
      oscillator.start();
    },
    stop() {
      stopSource(oscillator);
    },
  };
}

function createGainEnvelopeNode(
  audioContext: AudioContext,
  node: GainEnvelopeConfig,
  context: Required<PatchPreviewContext>,
): RuntimeNode {
  const gain = audioContext.createGain();
  const start = audioContext.currentTime + (node.startTime ?? 0);
  const duration = node.duration ?? 0;

  scheduleGainEnvelope(gain.gain, node, context, start, duration);

  return {
    input: gain,
    output: gain,
    params: { gain: gain.gain },
    updateContext(nextContext) {
      gain.gain.setTargetAtTime(
        node.gain * nextContext.intensity,
        audioContext.currentTime,
        0.08,
      );
    },
  };
}

function createNoiseBurstNode(
  audioContext: AudioContext,
  node: NoiseBurstConfig,
): RuntimeNode {
  const source = audioContext.createBufferSource();
  const gain = audioContext.createGain();
  const sampleCount = Math.max(
    1,
    Math.floor(audioContext.sampleRate * node.duration),
  );
  const buffer = audioContext.createBuffer(
    1,
    sampleCount,
    audioContext.sampleRate,
  );
  const data = buffer.getChannelData(0);

  for (let i = 0; i < sampleCount; i++) {
    const envelope = 1 - i / sampleCount;
    data[i] = (Math.random() * 2 - 1) * envelope;
  }

  source.buffer = buffer;
  gain.gain.value = node.gain;

  let input: AudioNode = gain;
  if (node.filterFrequency) {
    const filter = audioContext.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = node.filterFrequency;
    source.connect(filter);
    filter.connect(gain);
    input = filter;
  } else {
    source.connect(gain);
  }

  return {
    input,
    output: gain,
    params: { gain: gain.gain },
    start() {
      source.start(audioContext.currentTime + (node.startTime ?? 0));
      source.stop(
        audioContext.currentTime + (node.startTime ?? 0) + node.duration,
      );
    },
    stop() {
      stopSource(source);
    },
  };
}

function createFilterNode(
  audioContext: AudioContext,
  node: Extract<AudioNodeConfig, { type: "filter" }>,
): RuntimeNode {
  const filter = audioContext.createBiquadFilter();
  filter.type = node.filterType;
  filter.frequency.value = node.frequency;
  filter.Q.value = node.q;

  return {
    input: filter,
    output: filter,
    params: {
      filterFrequency: filter.frequency,
      frequency: filter.frequency,
      q: filter.Q,
    },
  };
}

function createStereoPannerNode(
  audioContext: AudioContext,
  node: Extract<AudioNodeConfig, { type: "stereoPanner" }>,
  context: Required<PatchPreviewContext>,
): RuntimeNode {
  const panner = audioContext.createStereoPanner();
  panner.pan.value = clamp(context.pan + node.pan, -1, 1);

  return {
    input: panner,
    output: panner,
    params: { pan: panner.pan },
    updateContext(nextContext) {
      panner.pan.setTargetAtTime(
        clamp(nextContext.pan + node.pan, -1, 1),
        audioContext.currentTime,
        0.06,
      );
    },
  };
}

function createSpatialAttenuationNode(
  audioContext: AudioContext,
  node: Extract<AudioNodeConfig, { type: "spatialAttenuation" }>,
  context: Required<PatchPreviewContext>,
): RuntimeNode {
  const gain = audioContext.createGain();
  gain.gain.value = spatialGain(node, context);

  return {
    input: gain,
    output: gain,
    params: { gain: gain.gain },
    updateContext(nextContext) {
      gain.gain.setTargetAtTime(
        spatialGain(node, nextContext),
        audioContext.currentTime,
        0.08,
      );
    },
  };
}

function connectLfo(
  runtimeNodes: Map<string, RuntimeNode>,
  node: LfoConfig,
): void {
  const lfo = runtimeNodes.get(node.id);
  const target = runtimeNodes.get(node.target);
  const targetParam = target?.params?.[node.targetParam];
  if (!lfo || !targetParam) return;
  lfo.output.connect(targetParam);
}

function scheduleGainEnvelope(
  param: AudioParam,
  node: GainEnvelopeConfig,
  context: Required<PatchPreviewContext>,
  start: number,
  duration: number,
): void {
  const peak = Math.max(0.0001, node.gain * context.intensity);
  const sustain = Math.max(0.0001, peak * node.sustain);
  const attackEnd = start + node.attack;
  const decayEnd = attackEnd + node.decay;
  const releaseStart =
    duration > 0 ? start + Math.max(0, duration - node.release) : decayEnd;
  const releaseEnd = releaseStart + node.release;

  param.setValueAtTime(0.0001, start);
  param.exponentialRampToValueAtTime(peak, Math.max(start + 0.001, attackEnd));
  param.exponentialRampToValueAtTime(
    sustain,
    Math.max(attackEnd + 0.001, decayEnd),
  );
  if (duration > 0) {
    param.setValueAtTime(sustain, releaseStart);
    param.exponentialRampToValueAtTime(
      0.0001,
      Math.max(releaseStart + 0.001, releaseEnd),
    );
  }
}

function scheduleClipGain(
  param: AudioParam,
  instrument: ClipInstrument | undefined,
  velocity: number,
  context: Required<PatchPreviewContext>,
  start: number,
  duration: number,
): void {
  const envelope = instrument?.envelope ?? {
    attack: 0.005,
    decay: 0.04,
    release: 0.04,
    sustain: 0.7,
  };
  const baseGain = instrument?.gain ?? 0.75;
  const peak = Math.max(0.0001, baseGain * velocity * context.intensity);
  const sustain = Math.max(0.0001, peak * envelope.sustain);
  const attackEnd = start + envelope.attack;
  const decayEnd = attackEnd + envelope.decay;
  const releaseStart = start + Math.max(0, duration - envelope.release);
  const releaseEnd = releaseStart + envelope.release;

  param.setValueAtTime(0.0001, start);
  param.exponentialRampToValueAtTime(peak, Math.max(start + 0.001, attackEnd));
  param.exponentialRampToValueAtTime(
    sustain,
    Math.max(attackEnd + 0.001, decayEnd),
  );
  param.setValueAtTime(sustain, releaseStart);
  param.exponentialRampToValueAtTime(
    0.0001,
    Math.max(releaseStart + 0.001, releaseEnd),
  );
}

function waveformForInstrument(
  instrument: ClipInstrument | undefined,
): OscillatorType {
  const waveform = instrument?.waveform ?? "square";
  if (
    waveform === "sine" ||
    waveform === "square" ||
    waveform === "sawtooth" ||
    waveform === "triangle"
  ) {
    return waveform;
  }
  if (instrument?.engine === "triangle") return "triangle";
  return "square";
}

function beatsToSeconds(beats: number, bpm: number): number {
  return beats * (60 / bpm);
}

function validateClipReferences(
  patch: Partial<SoundPatch>,
  errors: string[],
): void {
  const clips = patch.clips ?? [];
  const instruments = patch.instruments ?? [];
  const instrumentIds = new Set(instruments.map((instrument) => instrument.id));

  for (const instrument of instruments) {
    if (!instrument.id) errors.push("Instrument is missing an id.");
    if (!instrument.name)
      errors.push(`Instrument "${instrument.id}" is missing a name.`);
    if ((instrument.gain ?? 0.75) < 0 || (instrument.gain ?? 0.75) > 1) {
      errors.push(`Instrument "${instrument.id}" has invalid gain.`);
    }
  }

  for (const clip of clips) {
    if (!clip.id) errors.push("Clip is missing an id.");
    if (!Number.isFinite(clip.bpm) || clip.bpm <= 0) {
      errors.push(`Clip "${clip.id}" has invalid bpm.`);
    }
    if (
      !Array.isArray(clip.timeSignature) ||
      clip.timeSignature.length !== 2 ||
      clip.timeSignature.some((value) => value <= 0)
    ) {
      errors.push(`Clip "${clip.id}" has invalid time signature.`);
    }

    const channelIds = new Set(clip.channels.map((channel) => channel.id));
    for (const channel of clip.channels) {
      if (!channel.id)
        errors.push(`Clip "${clip.id}" has a channel missing an id.`);
    }

    for (const note of clip.notes) {
      if (!instrumentIds.has(note.instrumentId)) {
        errors.push(
          `Clip "${clip.id}" note "${note.id}" references missing instrument "${note.instrumentId}".`,
        );
      }
      if (!channelIds.has(note.channelId)) {
        errors.push(
          `Clip "${clip.id}" note "${note.id}" references missing channel "${note.channelId}".`,
        );
      }
      if (!Number.isFinite(note.startBeat) || note.startBeat < 0) {
        errors.push(
          `Clip "${clip.id}" note "${note.id}" has invalid start beat.`,
        );
      }
      if (!Number.isFinite(note.durationBeats) || note.durationBeats <= 0) {
        errors.push(
          `Clip "${clip.id}" note "${note.id}" has invalid duration.`,
        );
      }
      if (note.velocity < 0 || note.velocity > 1) {
        errors.push(
          `Clip "${clip.id}" note "${note.id}" has invalid velocity.`,
        );
      }
    }
  }
}

function validateNodeRange(node: AudioNodeConfig, errors: string[]): void {
  const requirePositive = (label: string, value: number) => {
    if (!Number.isFinite(value) || value < 0) {
      errors.push(`Node "${node.id}" has invalid ${label}.`);
    }
  };

  if (node.type === "oscillator" || node.type === "lfo") {
    requirePositive("frequency", node.frequency);
  }
  if (node.type === "gainEnvelope") {
    requirePositive("gain", node.gain);
    requirePositive("attack", node.attack);
    requirePositive("decay", node.decay);
    requirePositive("release", node.release);
    if (node.sustain < 0 || node.sustain > 1) {
      errors.push(`Node "${node.id}" has invalid sustain.`);
    }
  }
  if (node.type === "noiseBurst") {
    requirePositive("duration", node.duration);
  }
  if (node.type === "stereoPanner" && (node.pan < -1 || node.pan > 1)) {
    errors.push(`Node "${node.id}" has invalid pan.`);
  }
  if (node.type === "spatialAttenuation") {
    requirePositive("maxDistance", node.maxDistance);
    requirePositive("minGain", node.minGain);
    requirePositive("maxGain", node.maxGain);
  }
}

function spatialGain(
  node: Extract<AudioNodeConfig, { type: "spatialAttenuation" }>,
  context: Required<PatchPreviewContext>,
): number {
  const proximity = Math.max(0, 1 - context.distance / node.maxDistance);
  return (
    node.minGain + (node.maxGain - node.minGain) * proximity * context.intensity
  );
}

function isOutputNode(patch: SoundPatch, id: string): boolean {
  return patch.nodes.some((node) => node.id === id && node.type === "output");
}

function normalizeContext(
  context: PatchPreviewContext,
): Required<PatchPreviewContext> {
  return {
    intensity: context.intensity ?? DEFAULT_CONTEXT.intensity,
    distance: context.distance ?? DEFAULT_CONTEXT.distance,
    pan: context.pan ?? DEFAULT_CONTEXT.pan,
  };
}

function stopSource(source: { stop: () => void }): void {
  try {
    source.stop();
  } catch {
    // Web Audio sources throw when stopped twice.
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
