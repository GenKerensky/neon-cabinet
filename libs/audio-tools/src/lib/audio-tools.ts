import {
  AudioNodeConfig,
  GainEnvelopeConfig,
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
  "oscillator",
  "lfo",
  "gainEnvelope",
  "noiseBurst",
  "filter",
  "stereoPanner",
  "spatialAttenuation",
  "output",
]);

export function validatePatch(patch: unknown): ValidationResult {
  const errors: string[] = [];

  if (!isRecord(patch)) {
    return { valid: false, errors: ["Patch must be an object."] };
  }

  if (patch.schemaVersion !== SOUND_PATCH_SCHEMA_VERSION) {
    errors.push(`schemaVersion must be ${SOUND_PATCH_SCHEMA_VERSION}.`);
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
  }

  return { valid: errors.length === 0, errors };
}

export function parsePatch(json: string): SoundPatch {
  const patch = JSON.parse(json) as unknown;
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
    runtimeNodes.set(node.id, createRuntimeNode(audioContext, node, context));
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
  node: AudioNodeConfig,
  context: Required<PatchPreviewContext>,
): RuntimeNode {
  switch (node.type) {
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
