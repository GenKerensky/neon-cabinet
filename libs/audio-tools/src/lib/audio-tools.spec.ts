import { describe, expect, it, vi } from "vitest";
import {
  createLoopingPatch,
  playPatchOnce,
  parsePatch,
  serializePatch,
  validatePatch,
} from "./audio-tools";
import { BATTLE_TANKS_AUDIO_PATCHES } from "./battle-tanks-presets";
import { SoundPatch } from "./types";

class MockAudioParam {
  value = 0;
  setValueAtTime = vi.fn((value: number) => {
    this.value = value;
  });
  linearRampToValueAtTime = vi.fn((value: number) => {
    this.value = value;
  });
  exponentialRampToValueAtTime = vi.fn((value: number) => {
    this.value = value;
  });
  setTargetAtTime = vi.fn((value: number) => {
    this.value = value;
  });
  cancelScheduledValues = vi.fn();
}

class MockNode {
  connect = vi.fn();
  disconnect = vi.fn();
}

class MockOscillatorNode extends MockNode {
  type: OscillatorType = "sine";
  frequency = new MockAudioParam();
  detune = new MockAudioParam();
  start = vi.fn();
  stop = vi.fn();
}

class MockGainNode extends MockNode {
  gain = new MockAudioParam();
}

class MockStereoPannerNode extends MockNode {
  pan = new MockAudioParam();
}

class MockBiquadFilterNode extends MockNode {
  type: BiquadFilterType = "lowpass";
  frequency = new MockAudioParam();
  Q = new MockAudioParam();
}

class MockAudioBuffer {
  private data: Float32Array;

  constructor(length: number) {
    this.data = new Float32Array(length);
  }

  getChannelData(): Float32Array {
    return this.data;
  }
}

class MockBufferSourceNode extends MockNode {
  buffer: MockAudioBuffer | null = null;
  start = vi.fn();
  stop = vi.fn();
}

class MockAudioContext {
  currentTime = 10;
  sampleRate = 48000;
  destination = new MockNode();
  createOscillator = vi.fn(() => new MockOscillatorNode());
  createGain = vi.fn(() => new MockGainNode());
  createStereoPanner = vi.fn(() => new MockStereoPannerNode());
  createBiquadFilter = vi.fn(() => new MockBiquadFilterNode());
  createBuffer = vi.fn(
    (_channels: number, length: number) => new MockAudioBuffer(length),
  );
  createBufferSource = vi.fn(() => new MockBufferSourceNode());
}

describe("audio-tools", () => {
  it("validates the Battle Tanks presets", () => {
    for (const patch of BATTLE_TANKS_AUDIO_PATCHES) {
      expect(validatePatch(patch)).toEqual({ valid: true, errors: [] });
    }
  });

  it("rejects broken connections", () => {
    const patch: SoundPatch = {
      ...BATTLE_TANKS_AUDIO_PATCHES[0],
      connections: [{ from: "missing", to: "output" }],
    };

    expect(validatePatch(patch)).toEqual({
      valid: false,
      errors: ['Connection 0 references missing from node "missing".'],
    });
  });

  it("round-trips patch JSON without changing values", () => {
    const source = BATTLE_TANKS_AUDIO_PATCHES[1];
    const parsed = parsePatch(serializePatch(source));

    expect(parsed).toEqual(source);
  });

  it("creates and stops a looping patch", () => {
    const context = new MockAudioContext();
    const instance = createLoopingPatch(
      context as unknown as AudioContext,
      BATTLE_TANKS_AUDIO_PATCHES[0],
      { intensity: 0.75, pan: -0.25, distance: 250 },
    );

    instance.updateContext({ intensity: 0.25, pan: 0.5, distance: 500 });
    instance.stop();

    expect(context.createOscillator).toHaveBeenCalled();
    expect(context.createGain).toHaveBeenCalled();
  });

  it("plays a one-shot patch and resolves after its duration", async () => {
    vi.useFakeTimers();
    const context = new MockAudioContext();
    const played = playPatchOnce(
      context as unknown as AudioContext,
      BATTLE_TANKS_AUDIO_PATCHES[1],
    );

    vi.runAllTimers();
    await expect(played).resolves.toBeUndefined();
    vi.useRealTimers();
  });
});
