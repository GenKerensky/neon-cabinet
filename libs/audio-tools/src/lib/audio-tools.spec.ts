import { describe, expect, it, vi } from "vitest";
import {
  beatsToTicks,
  createLoopingPatch,
  deleteClipNotes,
  duplicateClipNotes,
  findNeighborNote,
  frequencyToPitch,
  getConstraintWarnings,
  midiToPitch,
  migratePatchToCurrentSchema,
  moveClipNotes,
  noteToFrequency,
  pitchToMidi,
  playPatchOnce,
  parsePatch,
  quantizeBeat,
  quantizeClipNotes,
  quantizeTick,
  quantizeUnitTicks,
  resizeClipNote,
  secondsToTicks,
  selectNotesInRange,
  serializePatch,
  sortClipNotes,
  ticksToBeats,
  ticksToSeconds,
  transposeClipNotes,
  validatePatch,
} from "./audio-tools";
import { BATTLE_TANKS_AUDIO_PATCHES } from "./battle-tanks-presets";
import {
  DEFAULT_AUDIO_STUDIO_GAME_ID,
  getAudioStudioGameById,
  getAudioStudioGames,
} from "./game-registry";
import { MARS_LANDER_AUDIO_PATCHES } from "./mars-lander-presets";
import { SPACE_DEFENDER_AUDIO_PATCHES } from "./space-defender-presets";
import { AudioClip, ClipNote, ClipNotePitch, SoundPatch } from "./types";

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

const c4: ClipNotePitch = { note: "C", accidental: "natural", octave: 4 };
const d4: ClipNotePitch = { note: "D", accidental: "natural", octave: 4 };
const e4: ClipNotePitch = { note: "E", accidental: "natural", octave: 4 };
const g5: ClipNotePitch = { note: "G", accidental: "natural", octave: 5 };

function createTestClip(
  notes: Array<Partial<ClipNote> & { id: string }>,
): AudioClip {
  return {
    id: "test-clip",
    bpm: 120,
    channels: [{ id: "pulse-1", engine: "pulse", name: "Pulse 1" }],
    name: "Test Clip",
    notes: notes.map((note) => ({
      channelId: "pulse-1",
      durationBeats: 1,
      instrumentId: "lead",
      pitch: c4,
      startBeat: 0,
      velocity: 0.75,
      ...note,
    })),
    timeSignature: [4, 4],
    type: "music",
  };
}

describe("audio-tools", () => {
  it("registers the current repo games in stable order", () => {
    expect(getAudioStudioGames().map((game) => game.id)).toEqual([
      "battle-tanks",
      "space-defender",
      "mars-lander",
      "maze-runner",
    ]);
    expect(DEFAULT_AUDIO_STUDIO_GAME_ID).toBe("battle-tanks");
  });

  it("exposes Battle Tanks presets through the game registry", () => {
    const battleTanks = getAudioStudioGameById("battle-tanks");

    expect(battleTanks?.effects.map((effect) => effect.id)).toEqual(
      BATTLE_TANKS_AUDIO_PATCHES.map((effect) => effect.id),
    );
  });

  it("exposes Mars Lander presets through the game registry", () => {
    const marsLander = getAudioStudioGameById("mars-lander");

    expect(marsLander?.defaultEffectId).toBe("mars-lander-thrust-loop");
    expect(marsLander?.effects.map((effect) => effect.id)).toEqual(
      MARS_LANDER_AUDIO_PATCHES.map((effect) => effect.id),
    );
  });

  it("exposes Space Defender presets through the game registry", () => {
    const spaceDefender = getAudioStudioGameById("space-defender");

    expect(spaceDefender?.defaultEffectId).toBe("space-defender-thrust-loop");
    expect(spaceDefender?.effects.map((effect) => effect.id)).toEqual(
      SPACE_DEFENDER_AUDIO_PATCHES.map((effect) => effect.id),
    );
  });

  it("allows games with no registered effects yet", () => {
    for (const gameId of ["maze-runner"]) {
      expect(getAudioStudioGameById(gameId)?.effects).toEqual([]);
    }
  });

  it("registers icon paths and theme values for every game", () => {
    for (const game of getAudioStudioGames()) {
      expect(game.icon.svgPath).toBe(
        `apps/${game.id}/public/assets/favicon.svg`,
      );
      expect(game.icon.pngPaths[16]).toBe(
        `apps/${game.id}/public/assets/favicon-16.png`,
      );
      expect(game.icon.pngPaths[32]).toBe(
        `apps/${game.id}/public/assets/favicon-32.png`,
      );
      expect(game.icon.pngPaths[48]).toBe(
        `apps/${game.id}/public/assets/favicon-48.png`,
      );
      expect(game.icon.svgDataUri).toMatch(/^data:image\/svg\+xml,/);
      expect(game.theme.primary).toBeTruthy();
      expect(game.theme.accent).toBeTruthy();
      expect(game.theme.audioGrid).toBeTruthy();
      expect(game.theme.audioPanel).toBeTruthy();
      expect(game.theme.audioLine).toBeTruthy();
    }
  });

  it("validates the Battle Tanks presets", () => {
    for (const patch of BATTLE_TANKS_AUDIO_PATCHES) {
      expect(validatePatch(patch)).toEqual({ valid: true, errors: [] });
    }
  });

  it("validates v2 clips, instruments, constraints, and clip source nodes", () => {
    const patch: SoundPatch = {
      schemaVersion: 2,
      id: "clip-test",
      name: "Clip Test",
      category: "Music Cue",
      duration: 2,
      preview: { intensity: 1, distance: 0, pan: 0 },
      constraintProfileId: "nes",
      instruments: [
        {
          id: "lead-pulse",
          name: "Lead Pulse",
          engine: "pulse",
          waveform: "square",
          duty: 0.5,
          envelope: { attack: 0.01, decay: 0.05, sustain: 0.65, release: 0.12 },
        },
      ],
      clips: [
        {
          id: "taps",
          type: "music",
          name: "Digital Taps Clip",
          bpm: 120,
          timeSignature: [4, 4],
          channels: [{ id: "pulse-1", name: "Pulse 1", engine: "pulse" }],
          notes: [
            {
              id: "note-1",
              pitch: { note: "G", accidental: "natural", octave: 4 },
              startBeat: 0,
              durationBeats: 1,
              velocity: 0.8,
              channelId: "pulse-1",
              instrumentId: "lead-pulse",
            },
          ],
        },
      ],
      nodes: [
        {
          id: "clip",
          type: "clipSource",
          label: "Digital Taps Clip",
          position: { x: 80, y: 120 },
          clipId: "taps",
        },
        {
          id: "output",
          type: "output",
          label: "Output",
          position: { x: 320, y: 120 },
        },
      ],
      connections: [{ from: "clip", to: "output" }],
    };

    expect(validatePatch(patch)).toEqual({ valid: true, errors: [] });
    expect(parsePatch(serializePatch(patch))).toEqual(patch);
  });

  it("migrates v1 graph-only patches to the current v2 schema", () => {
    const migrated = migratePatchToCurrentSchema(BATTLE_TANKS_AUDIO_PATCHES[0]);

    expect(migrated.schemaVersion).toBe(2);
    expect(migrated.clips).toEqual([]);
    expect(migrated.instruments).toEqual([]);
    expect(migrated.constraintProfileId).toBe("fantasy");
    expect(parsePatch(JSON.stringify(BATTLE_TANKS_AUDIO_PATCHES[0]))).toEqual(
      migrated,
    );
  });

  it("migrates timed v1 music cue oscillators into editable clip notes", () => {
    const migrated = migratePatchToCurrentSchema(
      BATTLE_TANKS_AUDIO_PATCHES.find(
        (patch) => patch.id === "battle-tanks-digital-taps",
      ),
    );

    expect(migrated.schemaVersion).toBe(2);
    expect(migrated.instruments).toHaveLength(1);
    expect(migrated.clips).toHaveLength(1);
    expect(migrated.clips?.[0]?.notes).toHaveLength(9);
    expect(migrated.clips?.[0]?.notes[0]).toMatchObject({
      durationBeats: 0.52,
      pitch: { accidental: "natural", note: "G", octave: 4 },
      startBeat: 0,
    });
    expect(migrated.clips?.[0]?.notes[2]).toMatchObject({
      durationBeats: 1.04,
      pitch: { accidental: "natural", note: "C", octave: 5 },
      startBeat: 1.36,
    });
    expect(migrated.clips?.[0]?.notes[5]).toMatchObject({
      pitch: { accidental: "natural", note: "E", octave: 5 },
      startBeat: 4,
    });
  });

  it("converts note names, accidentals, and octaves to frequency", () => {
    expect(
      noteToFrequency({ note: "A", accidental: "natural", octave: 4 }),
    ).toBeCloseTo(440);
    expect(
      noteToFrequency({ note: "C", accidental: "#", octave: 4 }),
    ).toBeCloseTo(277.18, 1);
    expect(
      noteToFrequency({ note: "D", accidental: "b", octave: 4 }),
    ).toBeCloseTo(277.18, 1);
  });

  it("converts between pitch names, midi notes, and frequencies", () => {
    expect(pitchToMidi({ note: "A", accidental: "natural", octave: 4 })).toBe(
      69,
    );
    expect(pitchToMidi({ note: "D", accidental: "b", octave: 4 })).toBe(61);
    expect(midiToPitch(60)).toEqual({
      note: "C",
      accidental: "natural",
      octave: 4,
    });
    expect(midiToPitch(61)).toEqual({ note: "C", accidental: "#", octave: 4 });
    expect(frequencyToPitch(277.18)).toEqual({
      note: "C",
      accidental: "#",
      octave: 4,
    });
    expect(
      noteToFrequency({ note: "A", accidental: "natural", octave: 4 }),
    ).toBeCloseTo(440, 3);
  });

  it("converts clip beats to ticks and seconds", () => {
    expect(beatsToTicks(1.5)).toBe(720);
    expect(beatsToTicks(1.5, 960)).toBe(1440);
    expect(ticksToBeats(720)).toBe(1.5);
    expect(ticksToSeconds(960, 120)).toBe(1);
    expect(secondsToTicks(0.5, 120)).toBe(480);
  });

  it("quantizes ticks to straight, dotted, and triplet grids", () => {
    expect(
      quantizeTick(250, {
        denominator: 4,
        mode: "straight",
        rounding: "round",
      }),
    ).toBe(480);
    expect(
      quantizeTick(700, {
        denominator: 8,
        mode: "straight",
        rounding: "floor",
      }),
    ).toBe(480);
    expect(
      quantizeTick(700, {
        denominator: 8,
        mode: "straight",
        rounding: "ceil",
      }),
    ).toBe(720);
    expect(quantizeUnitTicks({ denominator: 8, mode: "triplet" })).toBe(160);
    expect(quantizeUnitTicks({ denominator: 8, mode: "dotted" })).toBe(360);
    expect(quantizeBeat(0.63, { denominator: 16, mode: "straight" })).toBe(
      0.75,
    );
  });

  it("moves, resizes, transposes, duplicates, deletes, and quantizes notes immutably", () => {
    const clip = createTestClip([
      { id: "a", durationBeats: 1, pitch: c4, startBeat: 1 },
      { id: "b", durationBeats: 0.5, pitch: e4, startBeat: 2 },
    ]);

    const moved = moveClipNotes(clip, ["a"], {
      beatDelta: 1,
      semitoneDelta: 2,
    });
    expect(moved.notes[0]).toMatchObject({ pitch: d4, startBeat: 2 });
    expect(clip.notes[0]).toMatchObject({ pitch: c4, startBeat: 1 });

    const clampedMove = moveClipNotes(clip, ["a"], {
      beatDelta: -5,
      semitoneDelta: -100,
    });
    expect(clampedMove.notes[0].startBeat).toBe(0);
    expect(pitchToMidi(clampedMove.notes[0].pitch)).toBe(0);

    const resizedEnd = resizeClipNote(clip, "a", "end", 3);
    expect(resizedEnd.notes[0]).toMatchObject({
      durationBeats: 2,
      startBeat: 1,
    });

    const resizedStart = resizeClipNote(clip, "a", "start", 1.9);
    expect(resizedStart.notes[0]).toMatchObject({
      durationBeats: 0.25,
      startBeat: 1.75,
    });

    const transposed = transposeClipNotes(clip, ["b"], 3);
    expect(transposed.notes[1].pitch).toEqual({
      note: "G",
      accidental: "natural",
      octave: 4,
    });

    const duplicated = duplicateClipNotes(clip, ["a"], 4);
    expect(duplicated.notes.map((note) => note.id)).toEqual([
      "a",
      "b",
      "a-copy",
    ]);
    expect(duplicated.notes[2]).toMatchObject({
      durationBeats: 1,
      pitch: c4,
      startBeat: 5,
    });

    expect(deleteClipNotes(clip, ["b"]).notes.map((note) => note.id)).toEqual([
      "a",
    ]);

    const quantized = quantizeClipNotes(
      createTestClip([
        { id: "a", durationBeats: 0.6, pitch: c4, startBeat: 0.6 },
      ]),
      ["a"],
      { denominator: 4, mode: "straight" },
    );
    expect(quantized.notes[0]).toMatchObject({
      durationBeats: 1,
      startBeat: 1,
    });
  });

  it("selects and sorts notes by beat and pitch", () => {
    const clip = createTestClip([
      { id: "later-high", durationBeats: 1, pitch: g5, startBeat: 2 },
      { id: "early-low", durationBeats: 1, pitch: c4, startBeat: 0 },
      { id: "middle", durationBeats: 1, pitch: e4, startBeat: 1 },
    ]);

    expect(
      selectNotesInRange(clip, {
        endBeat: 1.5,
        highMidi: 72,
        lowMidi: 48,
        startBeat: 0,
      }),
    ).toEqual(["early-low", "middle"]);
    expect(sortClipNotes(clip.notes).map((note) => note.id)).toEqual([
      "early-low",
      "middle",
      "later-high",
    ]);
    expect(findNeighborNote(clip, "middle", -1)?.id).toBe("early-low");
    expect(findNeighborNote(clip, "middle", 1)?.id).toBe("later-high");
  });

  it("emits advisory constraint warnings without rejecting mixed-chip patches", () => {
    const patch: SoundPatch = {
      ...migratePatchToCurrentSchema(BATTLE_TANKS_AUDIO_PATCHES[0]),
      constraintProfileId: "nes",
      clips: [
        {
          id: "too-many-pulses",
          type: "music",
          name: "Too Many Pulses",
          bpm: 120,
          timeSignature: [4, 4],
          channels: [
            { id: "p1", name: "Pulse 1", engine: "pulse" },
            { id: "p2", name: "Pulse 2", engine: "pulse" },
            { id: "p3", name: "Pulse 3", engine: "pulse" },
          ],
          notes: [],
        },
      ],
    };

    expect(validatePatch(patch).valid).toBe(true);
    expect(getConstraintWarnings(patch)).toEqual([
      expect.objectContaining({
        code: "channel-budget",
        profileId: "nes",
      }),
    ]);
  });

  it("validates the Mars Lander presets", () => {
    expect(MARS_LANDER_AUDIO_PATCHES.map((patch) => patch.id)).toEqual([
      "mars-lander-thrust-loop",
      "mars-lander-gear-deploy",
      "mars-lander-touchdown",
      "mars-lander-level-cleared",
      "mars-lander-crash-explosion",
      "mars-lander-game-over",
      "mars-lander-start",
      "mars-lander-pause",
      "mars-lander-resume",
      "mars-lander-low-fuel",
      "mars-lander-title-placeholder",
    ]);

    for (const patch of MARS_LANDER_AUDIO_PATCHES) {
      expect(validatePatch(patch)).toEqual({ valid: true, errors: [] });
    }
  });

  it("validates the Space Defender presets", () => {
    expect(SPACE_DEFENDER_AUDIO_PATCHES.map((patch) => patch.id)).toEqual([
      "space-defender-thrust-loop",
      "space-defender-autocannon",
      "space-defender-laser",
      "space-defender-ray-gun",
      "space-defender-missile-launch",
      "space-defender-missile-detonation",
      "space-defender-asteroid-hit",
      "space-defender-asteroid-destruction",
      "space-defender-ship-collision",
      "space-defender-ship-destruction",
      "space-defender-game-start",
      "space-defender-pause",
      "space-defender-weapon-switch",
      "space-defender-weapon-unlock",
      "space-defender-wave-clear",
      "space-defender-game-over",
      "space-defender-title-placeholder",
    ]);

    for (const patch of SPACE_DEFENDER_AUDIO_PATCHES) {
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
    const source = migratePatchToCurrentSchema(BATTLE_TANKS_AUDIO_PATCHES[1]);
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

  it("schedules clip source notes into runtime oscillators", () => {
    const context = new MockAudioContext();
    const patch: SoundPatch = {
      schemaVersion: 2,
      id: "clip-runtime",
      name: "Clip Runtime",
      category: "Music Cue",
      duration: 1,
      preview: { intensity: 1, distance: 0, pan: 0 },
      constraintProfileId: "fantasy",
      instruments: [
        {
          id: "pulse",
          name: "Pulse",
          engine: "pulse",
          waveform: "square",
          duty: 0.5,
          envelope: { attack: 0.01, decay: 0.05, sustain: 0.5, release: 0.1 },
        },
      ],
      clips: [
        {
          id: "clip",
          type: "music",
          name: "Clip",
          bpm: 120,
          timeSignature: [4, 4],
          channels: [{ id: "pulse-1", name: "Pulse 1", engine: "pulse" }],
          notes: [
            {
              id: "c4",
              pitch: { note: "C", accidental: "natural", octave: 4 },
              startBeat: 0.5,
              durationBeats: 1,
              velocity: 0.75,
              channelId: "pulse-1",
              instrumentId: "pulse",
            },
          ],
        },
      ],
      nodes: [
        {
          id: "clip-source",
          type: "clipSource",
          label: "Clip Source",
          position: { x: 80, y: 80 },
          clipId: "clip",
        },
        {
          id: "output",
          type: "output",
          label: "Output",
          position: { x: 320, y: 80 },
        },
      ],
      connections: [{ from: "clip-source", to: "output" }],
    };

    const instance = createLoopingPatch(
      context as unknown as AudioContext,
      patch,
    );
    instance.stop();

    const oscillator = context.createOscillator.mock.results[0]?.value;
    expect(context.createOscillator).toHaveBeenCalledTimes(1);
    expect(oscillator.type).toBe("square");
    expect(oscillator.frequency.value).toBeCloseTo(261.63, 1);
    expect(oscillator.start).toHaveBeenCalledWith(10.25);
    expect(oscillator.stop).toHaveBeenCalledWith(10.75);
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
