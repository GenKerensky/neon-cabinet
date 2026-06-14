import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getAudioStudioGameById } from "@neon-cabinet/audio-tools";
import App from "./App";
import {
  cloneHistory,
  createInitialHistory,
  createSnapshot,
  createDebouncedWriter,
  normalizeHistory,
} from "./hooks/use-studio-history";
import { createStarterPatchForGame } from "./lib/patch-utils";
import { createComposeTransform } from "./components/compose/use-compose-transform";
import {
  gameHistoryStatePath,
  getAudioStudioRxState,
  readPersistedSelectedGameId,
  readPersistedStudioHistory,
  resetAudioStudioDatabaseForTests,
  writePersistedSelectedGameId,
  writePersistedStudioHistory,
} from "./storage/audio-studio-rxdb";

const auditionOscillators: MockAuditionOscillator[] = [];

class MockAuditionOscillator {
  connect = vi.fn();
  detune = new MockAuditionAudioParam();
  frequency = { value: 0 };
  start = vi.fn();
  stop = vi.fn();
  type = "sine";
}

class MockAuditionAudioParam {
  value = 0;
  cancelScheduledValues = vi.fn();
  exponentialRampToValueAtTime = vi.fn((value: number) => {
    this.value = value;
  });
  linearRampToValueAtTime = vi.fn((value: number) => {
    this.value = value;
  });
  setValueAtTime = vi.fn((value: number) => {
    this.value = value;
  });
}

class MockAuditionGain {
  connect = vi.fn();
  gain = new MockAuditionAudioParam();
}

class MockAuditionAudioContext {
  createGain = vi.fn(() => new MockAuditionGain());
  createOscillator = vi.fn(() => {
    const oscillator = new MockAuditionOscillator();
    auditionOscillators.push(oscillator);
    return oscillator;
  });
  currentTime = 1;
  destination = {};
  resume = vi.fn();
}

describe("Audio Studio", () => {
  beforeEach(async () => {
    auditionOscillators.length = 0;
    vi.stubGlobal("AudioContext", MockAuditionAudioContext);
    vi.stubGlobal("webkitAudioContext", MockAuditionAudioContext);
    await resetAudioStudioDatabaseForTests();
  });

  afterEach(async () => {
    cleanup();
    vi.unstubAllGlobals();
    await resetAudioStudioDatabaseForTests();
  });

  it("edits selected node values and updates the exported JSON", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /low bang/i }));
    const frequency = screen.getByLabelText("Frequency");
    fireEvent.change(frequency, { target: { value: "72" } });

    const exported = JSON.parse(
      screen.getByLabelText("Patch JSON").textContent ?? "{}",
    );
    const node = exported.nodes.find(
      (candidate: { id: string }) => candidate.id === "thump",
    );

    expect(node.frequency).toBe(72);
  });

  it("renders four authoring modes and keeps active mode local to the window", async () => {
    render(<App />);

    expect(screen.getByRole("tab", { name: "Compose" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Tracker" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Instrument" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Patch Graph" })).toBeTruthy();
    expect(screen.getByRole("tabpanel", { name: "Patch Graph" })).toBeTruthy();

    fireEvent.click(screen.getByRole("tab", { name: "Compose" }));
    expect(screen.getByRole("tabpanel", { name: "Compose" })).toBeTruthy();
    expect(screen.getAllByText("C4").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Add note" })).toBeTruthy();

    cleanup();
    await resetAudioStudioDatabaseForTests({ remove: false });
    render(<App />);

    expect(screen.getByRole("tabpanel", { name: "Patch Graph" })).toBeTruthy();
  });

  it("renders Compose through the extracted compose module", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("tab", { name: "Compose" }));

    expect(
      screen.getByRole("grid", { name: "Piano roll note grid" }),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Add note" })).toBeTruthy();
  });

  it("maps beats and pitch rows through the compose transform", () => {
    const transform = createComposeTransform({
      beatWidth: 64,
      labelWidth: 88,
      maxMidi: 84,
      noteHeight: 22,
      rowHeight: 30,
    });

    expect(transform.beatToX(2)).toBe(216);
    expect(transform.xToBeat(216)).toBe(2);
    expect(
      transform.pitchToY({
        accidental: "natural",
        note: "C",
        octave: 4,
      }),
    ).toBe(24 * 30 + 4);
  });

  it("edits shared clip notes through Compose and Tracker modes", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("tab", { name: "Compose" }));
    fireEvent.click(screen.getByRole("button", { name: "Add note" }));

    expect(screen.getAllByText("C4").length).toBeGreaterThan(0);
    expect(readPatch().clips?.[0]?.notes).toHaveLength(1);

    fireEvent.click(screen.getByRole("tab", { name: "Tracker" }));
    fireEvent.change(screen.getByLabelText("Tracker note 1 pitch"), {
      target: { value: "D#4" },
    });

    expect(readPatch().clips?.[0]?.notes[0]?.pitch).toEqual({
      note: "D",
      accidental: "#",
      octave: 4,
    });

    fireEvent.click(screen.getByRole("tab", { name: "Compose" }));
    expect(screen.getAllByText("D#4").length).toBeGreaterThan(0);
  });

  it("shows migrated preset note data in Compose for music cues", () => {
    render(<App />);

    fireEvent.click(
      screen.getByRole("button", { name: /battle tanks digital taps/i }),
    );
    fireEvent.click(screen.getByRole("tab", { name: "Compose" }));

    expect(readPatch().clips?.[0]?.notes).toHaveLength(9);
    expect(screen.getAllByText("G4").length).toBeGreaterThan(0);
    expect(screen.getAllByText("C5").length).toBeGreaterThan(0);
    expect(screen.getAllByText("E5").length).toBeGreaterThan(0);
  });

  it("creates and auditions a note when clicking an empty piano-roll cell", () => {
    const { container } = render(<App />);

    fireEvent.click(screen.getByRole("tab", { name: "Compose" }));
    const grid = pianoGrid(container);
    mockRect(grid, { left: 0, top: 0 });
    const beforeCount = readPatch().clips?.[0]?.notes?.length ?? 0;

    fireEvent.pointerDown(grid, {
      button: 0,
      buttons: 1,
      clientX: 88 + 2.25 * 64,
      clientY: 24 * 30 + 15,
      pointerId: 21,
    });

    expect(readPatch().clips?.[0]?.notes?.length ?? 0).toBe(beforeCount);

    fireEvent.pointerUp(grid, {
      button: 0,
      buttons: 0,
      clientX: 88 + 2.25 * 64,
      clientY: 24 * 30 + 15,
      pointerId: 21,
    });

    const notes = readPatch().clips?.[0]?.notes ?? [];
    expect(notes).toHaveLength(beforeCount + 1);
    expect(notes.at(-1)).toMatchObject({
      durationBeats: 1,
      pitch: { accidental: "natural", note: "C", octave: 4 },
      startBeat: 2.25,
    });
    expect(auditionOscillators.at(-1)?.frequency.value).toBeCloseTo(261.63, 1);
    expect(auditionOscillators.at(-1)?.start).toHaveBeenCalled();
  });

  it("renders compose rows without a background grid overlay", () => {
    const { container } = render(<App />);

    fireEvent.click(screen.getByRole("tab", { name: "Compose" }));

    expect(container.querySelector(".piano-note-lanes")).toBeNull();
    expect(container.querySelector(".piano-row-guide")).toBeTruthy();
    expect(container.querySelector(".piano-beat-column")).toBeTruthy();
  });

  it("auditions an existing note when clicked", () => {
    render(<App />);

    fireEvent.click(
      screen.getByRole("button", { name: /battle tanks digital taps/i }),
    );
    fireEvent.click(screen.getByRole("tab", { name: "Compose" }));
    fireEvent.pointerDown(
      screen.getAllByRole("button", { name: "Audition G4 note" })[0],
      {
        button: 0,
        buttons: 1,
        clientX: 92,
        clientY: 18 * 30 + 10,
        pointerId: 24,
      },
    );

    expect(auditionOscillators.at(-1)?.frequency.value).toBeCloseTo(392, 0);
    expect(auditionOscillators.at(-1)?.start).toHaveBeenCalled();
  });

  it("deletes notes from a themed context menu and keeps undo support", async () => {
    render(<App />);

    fireEvent.click(
      screen.getByRole("button", { name: /battle tanks digital taps/i }),
    );
    fireEvent.click(screen.getByRole("tab", { name: "Compose" }));
    const beforeCount = readPatch().clips?.[0]?.notes?.length ?? 0;

    fireEvent.contextMenu(
      screen.getAllByRole("button", { name: "Audition G4 note" })[0],
    );
    fireEvent.click(
      await screen.findByRole("menuitem", { name: "Delete note" }),
    );

    expect(readPatch().clips?.[0]?.notes).toHaveLength(beforeCount - 1);

    fireEvent.click(screen.getByRole("button", { name: "Undo" }));

    expect(readPatch().clips?.[0]?.notes).toHaveLength(beforeCount);
  });

  it("shows a playhead on Compose while the tune is playing", async () => {
    render(<App />);

    fireEvent.click(
      screen.getByRole("button", { name: /battle tanks digital taps/i }),
    );
    fireEvent.click(screen.getByRole("tab", { name: "Compose" }));
    fireEvent.click(screen.getByRole("button", { name: "Play" }));

    expect(await screen.findByTestId("compose-playhead")).toBeTruthy();
  });

  it("moves and resizes notes as draft edits until pointer up", () => {
    const { container } = render(<App />);

    fireEvent.click(
      screen.getByRole("button", { name: /battle tanks digital taps/i }),
    );
    fireEvent.click(screen.getByRole("tab", { name: "Compose" }));
    const grid = pianoGrid(container);
    mockRect(grid, { left: 0, top: 0 });
    const originalNote = readPatch().clips?.[0]?.notes[0];
    expect(originalNote).toBeTruthy();

    const noteButton = screen.getAllByRole("button", {
      name: "Audition G4 note",
    })[0];
    fireEvent.pointerDown(noteButton, {
      button: 0,
      buttons: 1,
      clientX: 92,
      clientY: 18 * 30 + 10,
      pointerId: 22,
    });
    fireEvent.pointerMove(grid, {
      button: 0,
      buttons: 1,
      clientX: 88 + 2 * 64,
      clientY: 280,
      pointerId: 22,
    });

    expect(readPatch().clips?.[0]?.notes[0]).toEqual(originalNote);
    expect(noteButton.style.left).toBe(`${88 + 2 * 64}px`);

    fireEvent.pointerUp(grid, {
      button: 0,
      buttons: 0,
      clientX: 88 + 2 * 64,
      clientY: 280,
      pointerId: 22,
    });

    expect(readPatch().clips?.[0]?.notes[0]).toMatchObject({
      pitch: { accidental: "natural", note: "E", octave: 5 },
      startBeat: 2,
    });

    const resizeHandle = screen.getAllByLabelText("Resize E5 note")[0];
    const beforeResize = readPatch().clips?.[0]?.notes[0];
    fireEvent.pointerDown(resizeHandle, {
      button: 0,
      buttons: 1,
      clientX: 88 + 2 * 64 + 34,
      clientY: 8 * 30 + 15,
      pointerId: 23,
    });
    fireEvent.pointerMove(grid, {
      button: 0,
      buttons: 1,
      clientX: 88 + 4 * 64,
      clientY: 8 * 30 + 15,
      pointerId: 23,
    });

    expect(readPatch().clips?.[0]?.notes[0]).toEqual(beforeResize);

    fireEvent.pointerUp(grid, {
      button: 0,
      buttons: 0,
      clientX: 88 + 4 * 64,
      clientY: 8 * 30 + 15,
      pointerId: 23,
    });

    expect(readPatch().clips?.[0]?.notes[0]?.durationBeats).toBe(2);
  });

  it("renders an instrument mode with waveform graphics and precise controls", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("tab", { name: "Instrument" }));

    expect(screen.getByLabelText("square waveform preview")).toBeTruthy();
    expect(screen.getByRole("slider", { name: "Gain knob" })).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Gain value"), {
      target: { value: "0.42" },
    });

    expect(readPatch().instruments?.[0]?.gain).toBe(0.42);
  });

  it("changes instrument gain by dragging the knob face", () => {
    const { container } = render(<App />);

    fireEvent.click(screen.getByRole("tab", { name: "Instrument" }));

    const knobFace = container.querySelector(".audio-knob-face");
    expect(knobFace).toBeTruthy();
    fireEvent.pointerDown(knobFace as Element, {
      clientY: 160,
      pointerId: 11,
    });
    fireEvent.pointerMove(knobFace as Element, {
      clientY: 110,
      pointerId: 11,
    });
    fireEvent.pointerUp(knobFace as Element, {
      clientY: 110,
      pointerId: 11,
    });

    expect(readPatch().instruments?.[0]?.gain).toBeGreaterThan(0.75);
  });

  it("renders gain knob as a centered dial with scale markings", () => {
    const { container } = render(<App />);

    fireEvent.click(screen.getByRole("tab", { name: "Instrument" }));

    expect(container.querySelector(".audio-knob-scale")).toBeTruthy();
    expect(container.querySelectorAll(".audio-knob-tick")).toHaveLength(11);
    expect(container.querySelector(".audio-knob-pointer")).toBeTruthy();
    expect(
      container.querySelector(".audio-knob-pointer")?.getAttribute("x1"),
    ).toBe("50");
    expect(
      container.querySelector(".audio-knob-pointer")?.getAttribute("y1"),
    ).toBe("50");
    expect(container.querySelector(".audio-knob-cap")?.getAttribute("cx")).toBe(
      "50",
    );
    expect(container.querySelector(".audio-knob-cap")?.getAttribute("cy")).toBe(
      "50",
    );
    expect(
      screen
        .getByRole("slider", { name: "Gain knob" })
        .classList.contains("audio-knob-slider"),
    ).toBe(true);
    expect(screen.getByText("-20dB")).toBeTruthy();
    expect(screen.getByText("+40dB")).toBeTruthy();
  });

  it("debounces persisted history writes while inputs update immediately", async () => {
    vi.useFakeTimers();
    try {
      const write = vi.fn(() => Promise.resolve());
      const reportError = vi.fn();
      const writer = createDebouncedWriter(write, 160, reportError);

      writer("first", "battle-tanks");
      writer("second", "battle-tanks");
      writer("third", "space-defender");

      expect(write).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(159);
      expect(write).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(1);

      expect(write).toHaveBeenCalledTimes(2);
      expect(write).toHaveBeenCalledWith("second", "battle-tanks");
      expect(write).toHaveBeenCalledWith("third", "space-defender");
      expect(reportError).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it("uses a resizable tree sidebar without the game description block", () => {
    const { container } = render(<App />);

    expect(screen.queryByText(/Wireframe 3D tank combat/i)).toBeNull();
    expect(
      screen.getByRole("tree", { name: "Sound preset tree" }),
    ).toBeTruthy();

    const rumble = screen.getByRole("treeitem", { name: /rumble/i });
    expect(rumble.getAttribute("aria-expanded")).toBe("true");
    fireEvent.click(rumble);
    expect(
      screen.queryByRole("button", { name: /battle tanks player rumble/i }),
    ).toBeNull();

    const resizeHandle = screen.getByRole("separator", {
      name: "Resize preset sidebar",
    });
    fireEvent.pointerDown(resizeHandle, {
      button: 0,
      clientX: 260,
      pointerId: 10,
    });
    fireEvent.pointerMove(resizeHandle, {
      button: 0,
      clientX: 330,
      pointerId: 10,
    });

    expect(
      (container.querySelector(".audio-studio") as HTMLElement).style
        .gridTemplateColumns,
    ).toContain("330px");
  });

  it("renders the game selector and switches to an empty game's starter patch", async () => {
    render(<App />);

    expect(screen.getByRole("combobox", { name: "Select game" })).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /battle tanks player rumble/i }),
    ).toBeTruthy();

    await selectGame("Maze Runner");

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /maze runner starter effect/i }),
      ).toBeTruthy();
    });
    expect(
      screen.queryByRole("button", { name: /battle tanks player rumble/i }),
    ).toBeNull();
    expect(readPatch().id).toBe("maze-runner-starter-effect");
  });

  it("renders the game dropdown with the active audio studio theme", async () => {
    render(<App />);

    const trigger = screen.getByRole("combobox", { name: "Select game" });
    fireEvent.pointerDown(trigger, {
      button: 0,
      buttons: 1,
      clientX: 10,
      clientY: 10,
      pointerId: 19,
      pointerType: "mouse",
    });

    const option = await screen.findByRole("option", {
      name: "Space Defender",
    });
    expect(option.closest(".game-select-content")).toBeTruthy();
  });

  it("switches to Mars Lander registered presets instead of a starter patch", async () => {
    render(<App />);

    await selectGame("Mars Lander");

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /mars lander thrust loop/i }),
      ).toBeTruthy();
    });
    expect(readPatch().id).toBe("mars-lander-thrust-loop");
    expect(
      screen.getByRole("button", { name: /mars lander touchdown/i }),
    ).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: /mars lander starter effect/i }),
    ).toBeNull();
  });

  it("migrates stale Mars Lander starter history to registered presets", async () => {
    const marsLander = getAudioStudioGameById("mars-lander");
    expect(marsLander).toBeTruthy();
    if (!marsLander) return;

    const staleHistory = {
      future: [],
      past: [],
      present: createSnapshot(createStarterPatchForGame(marsLander)),
    };
    await writePersistedSelectedGameId("mars-lander");
    await writePersistedStudioHistory(staleHistory, "mars-lander");

    render(<App />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /mars lander thrust loop/i }),
      ).toBeTruthy();
    });
    expect(readPatch().id).toBe("mars-lander-thrust-loop");
    expect(
      screen.queryByRole("button", { name: /mars lander starter effect/i }),
    ).toBeNull();
  });

  it("keeps separate patch history for each selected game", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /low bang/i }));
    fireEvent.change(screen.getByLabelText("Frequency"), {
      target: { value: "72" },
    });
    expect(readNode("thump").frequency).toBe(72);

    await selectGame("Maze Runner");
    await waitFor(() => {
      expect(readPatch().id).toBe("maze-runner-starter-effect");
    });

    fireEvent.click(screen.getByRole("button", { name: "Oscillator" }));
    await waitFor(() => {
      expect(readNode("oscillator-1")).toBeTruthy();
    });

    await selectGame("Battle Tanks");
    await waitFor(() => {
      expect(readNode("thump").frequency).toBe(72);
    });

    await selectGame("Maze Runner");
    await waitFor(() => {
      expect(readNode("oscillator-1")).toBeTruthy();
    });
  });

  it("imports exported JSON back into the graph", () => {
    render(<App />);

    fireEvent.click(
      screen.getByRole("button", { name: /battle tanks explosion/i }),
    );
    const exported = screen.getByLabelText("Patch JSON").textContent ?? "";

    fireEvent.click(
      screen.getByRole("button", { name: /battle tanks player rumble/i }),
    );
    fireEvent.click(screen.getByRole("button", { name: /expand import/i }));
    fireEvent.change(screen.getByLabelText("Import JSON"), {
      target: { value: exported },
    });
    fireEvent.click(screen.getByRole("button", { name: "Import" }));

    expect(
      screen.getByRole("heading", { name: /battle tanks explosion/i }),
    ).toBeTruthy();
  });

  it("supports undo, redo, and reset for patch edits", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /low bang/i }));
    fireEvent.change(screen.getByLabelText("Frequency"), {
      target: { value: "72" },
    });

    expect(readNode("thump").frequency).toBe(72);

    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(readNode("thump").frequency).not.toBe(72);

    fireEvent.click(screen.getByRole("button", { name: "Redo" }));
    expect(readNode("thump").frequency).toBe(72);

    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(readNode("thump").frequency).not.toBe(72);
  });

  it("auto arranges graph nodes as a single undoable edit", () => {
    render(<App />);

    const originalPosition = readNode("thump").position;

    fireEvent.click(screen.getByRole("button", { name: "Auto arrange nodes" }));

    expect(readNode("thump").position).not.toEqual(originalPosition);
    expect(hasMinimumNodeGap(readPatch().nodes)).toBe(true);
    expect(verticalPositionSpan(readPatch().nodes)).toBeLessThanOrEqual(220);

    fireEvent.click(screen.getByRole("button", { name: "Undo" }));

    expect(readNode("thump").position).toEqual(originalPosition);
  });

  it("keeps drag movement transient until pointer up", () => {
    render(<App />);

    const originalPosition = readNode("thump").position;
    const node = screen.getByRole("button", { name: /low bang oscillator/i });

    fireEvent.pointerDown(node, { clientX: 100, clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(node, { clientX: 160, clientY: 150, pointerId: 1 });
    fireEvent.pointerMove(node, { clientX: 220, clientY: 190, pointerId: 1 });

    expect(readNode("thump").position).toEqual(originalPosition);

    fireEvent.pointerUp(node, { clientX: 220, clientY: 190, pointerId: 1 });

    expect(readNode("thump").position).toEqual({ x: 190, y: 180 });

    fireEvent.click(screen.getByRole("button", { name: "Undo" }));

    expect(readNode("thump").position).toEqual(originalPosition);
  });

  it("pans the graph view with middle mouse without editing nodes", () => {
    const { container } = render(<App />);

    const graph = container.querySelector(".graph-canvas");
    const content = container.querySelector(".graph-content");
    const node = screen.getByRole("button", { name: /low bang oscillator/i });
    const originalPosition = readNode("thump").position;

    expect(graph).toBeTruthy();
    expect(content).toBeTruthy();

    fireEvent.pointerDown(node, {
      button: 1,
      buttons: 4,
      clientX: 100,
      clientY: 100,
      pointerId: 2,
    });
    fireEvent.pointerMove(graph as Element, {
      button: 1,
      buttons: 4,
      clientX: 135,
      clientY: 122,
      pointerId: 2,
    });

    expect((content as HTMLElement).style.transform).toBe(
      "translate(35px, 22px)",
    );
    expect(readNode("thump").position).toEqual(originalPosition);

    fireEvent.pointerUp(graph as Element, {
      button: 1,
      buttons: 0,
      clientX: 135,
      clientY: 122,
      pointerId: 2,
    });

    expect(readNode("thump").position).toEqual(originalPosition);
  });

  it("pans the graph view by left dragging empty canvas space", () => {
    const { container } = render(<App />);

    const graph = container.querySelector(".graph-canvas");
    const content = container.querySelector(".graph-content");
    const originalPosition = readNode("thump").position;

    expect(graph).toBeTruthy();
    expect(content).toBeTruthy();

    fireEvent.pointerDown(content as Element, {
      button: 0,
      buttons: 1,
      clientX: 220,
      clientY: 210,
      pointerId: 3,
    });
    fireEvent.pointerMove(graph as Element, {
      button: 0,
      buttons: 1,
      clientX: 182,
      clientY: 244,
      pointerId: 3,
    });

    expect((content as HTMLElement).style.transform).toBe(
      "translate(-38px, 34px)",
    );
    expect(readNode("thump").position).toEqual(originalPosition);

    fireEvent.pointerUp(graph as Element, {
      button: 0,
      buttons: 0,
      clientX: 182,
      clientY: 244,
      pointerId: 3,
    });

    expect(readNode("thump").position).toEqual(originalPosition);
  });

  it("collapses export and import panels", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /collapse export/i }));
    expect(screen.queryByLabelText("Patch JSON")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /expand export/i }));
    expect(screen.getByLabelText("Patch JSON")).toBeTruthy();

    expect(screen.queryByLabelText("Import JSON")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /expand import/i }));
    expect(screen.getByLabelText("Import JSON")).toBeTruthy();
  });

  it("restores committed edits after recreating the RxDB state instance", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /low bang/i }));
    fireEvent.change(screen.getByLabelText("Frequency"), {
      target: { value: "72" },
    });

    await waitFor(async () => {
      const state = await getAudioStudioRxState();
      const persisted = normalizeHistory(readPersistedStudioHistory(state));
      const node = persisted?.present.patch.nodes.find(
        (candidate) => candidate.id === "thump",
      );
      expect(node).toMatchObject({ frequency: 72 });
    });

    cleanup();
    await resetAudioStudioDatabaseForTests({ remove: false });

    render(<App />);

    await waitFor(() => {
      expect(readNode("thump").frequency).toBe(72);
    });
  });

  it("restores the selected game after recreating the RxDB state instance", async () => {
    render(<App />);

    await selectGame("Mars Lander");

    await waitFor(async () => {
      const state = await getAudioStudioRxState();
      expect(readPersistedSelectedGameId(state)).toBe("mars-lander");
    });

    cleanup();
    await resetAudioStudioDatabaseForTests({ remove: false });

    render(<App />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /mars lander thrust loop/i }),
      ).toBeTruthy();
    });
  });

  it("restores Mars Lander history from its per-game state path", async () => {
    render(<App />);

    await selectGame("Mars Lander");
    await waitFor(() => {
      expect(readPatch().id).toBe("mars-lander-thrust-loop");
    });

    fireEvent.click(screen.getByRole("button", { name: /thruster tone/i }));
    fireEvent.change(screen.getByLabelText("Frequency"), {
      target: { value: "138" },
    });

    await waitFor(async () => {
      const state = await getAudioStudioRxState();
      const persisted = normalizeHistory(
        readPersistedStudioHistory(state, "mars-lander"),
      );
      const node = persisted?.present.patch.nodes.find(
        (candidate) => candidate.id === "thrust-tone",
      );
      expect(node).toMatchObject({ frequency: 138 });
    });

    cleanup();
    await resetAudioStudioDatabaseForTests({ remove: false });

    render(<App />);

    await waitFor(() => {
      expect(readNode("thrust-tone").frequency).toBe(138);
    });
  });

  it("syncs external RxState updates into React state with undo history intact", async () => {
    render(<App />);

    await waitFor(async () => {
      const state = await getAudioStudioRxState();
      expect(normalizeHistory(readPersistedStudioHistory(state))).toBeTruthy();
    });

    const nextHistory = cloneHistory(createInitialHistory());
    nextHistory.past = [cloneHistory(nextHistory).present];
    nextHistory.present.patch.nodes = nextHistory.present.patch.nodes.map(
      (node) => (node.id === "thump" ? { ...node, frequency: 88 } : node),
    );
    nextHistory.present.selectedNodeId = "thump";

    await act(async () => {
      await writePersistedStudioHistory(nextHistory);
    });

    await waitFor(() => {
      expect(readNode("thump").frequency).toBe(88);
    });

    fireEvent.click(screen.getByRole("button", { name: "Undo" }));

    await waitFor(() => {
      expect(readNode("thump").frequency).not.toBe(88);
    });
  });

  it("ignores malformed persisted state and loads the default patch", async () => {
    const state = await getAudioStudioRxState();
    await state.set(gameHistoryStatePath("battle-tanks"), () => ({
      malformed: true,
    }));
    cleanup();
    await resetAudioStudioDatabaseForTests({ remove: false });

    render(<App />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", {
          name: /battle tanks harsh cannon bang/i,
        }),
      ).toBeTruthy();
    });
  });

  it("falls back to Battle Tanks when the persisted game id is invalid", async () => {
    await writePersistedSelectedGameId("not-a-game");
    cleanup();
    await resetAudioStudioDatabaseForTests({ remove: false });

    render(<App />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", {
          name: /battle tanks harsh cannon bang/i,
        }),
      ).toBeTruthy();
    });
  });
});

async function selectGame(gameName: string): Promise<void> {
  const trigger = screen.getByRole("combobox", { name: "Select game" });
  fireEvent.pointerDown(trigger, {
    button: 0,
    buttons: 1,
    clientX: 10,
    clientY: 10,
    ctrlKey: false,
    pointerId: 9,
    pointerType: "mouse",
  });
  fireEvent.keyDown(trigger, { code: "ArrowDown", key: "ArrowDown" });
  const option = await screen.findByRole("option", { name: gameName });
  fireEvent.click(option);
}

function readNode(nodeId: string): {
  frequency?: number;
  id: string;
  position?: { x: number; y: number };
} {
  const exported = readPatch();
  return exported.nodes.find(
    (candidate: { id: string }) => candidate.id === nodeId,
  );
}

function readPatch(): {
  id: string;
  clips?: Array<{
    notes: Array<{
      durationBeats: number;
      pitch: { accidental: string; note: string; octave: number };
      startBeat: number;
    }>;
  }>;
  nodes: Array<{
    frequency?: number;
    id: string;
    position?: { x: number; y: number };
  }>;
} {
  return JSON.parse(screen.getByLabelText("Patch JSON").textContent ?? "{}");
}

function pianoGrid(container: HTMLElement): HTMLElement {
  const grid = container.querySelector(".piano-grid");
  expect(grid).toBeTruthy();
  return grid as HTMLElement;
}

function mockRect(element: HTMLElement, rect: Partial<DOMRect> = {}): void {
  element.getBoundingClientRect = () =>
    ({
      bottom: rect.bottom ?? 1470,
      height: rect.height ?? 1470,
      left: rect.left ?? 0,
      right: rect.right ?? 1200,
      top: rect.top ?? 0,
      width: rect.width ?? 1200,
      x: rect.left ?? 0,
      y: rect.top ?? 0,
      toJSON: () => ({}),
    }) as DOMRect;
}

function hasMinimumNodeGap(
  nodes: Array<{ position?: { x: number; y: number } }>,
): boolean {
  const nodeWidth = 150;
  const nodeHeight = 68;
  const minGap = 8;

  for (let index = 0; index < nodes.length; index += 1) {
    const a = nodes[index].position;
    if (!a) continue;

    for (let nextIndex = index + 1; nextIndex < nodes.length; nextIndex += 1) {
      const b = nodes[nextIndex].position;
      if (!b) continue;

      const separated =
        a.x + nodeWidth + minGap <= b.x ||
        b.x + nodeWidth + minGap <= a.x ||
        a.y + nodeHeight + minGap <= b.y ||
        b.y + nodeHeight + minGap <= a.y;

      if (!separated) return false;
    }
  }

  return true;
}

function verticalPositionSpan(
  nodes: Array<{ position?: { x: number; y: number } }>,
): number {
  const yPositions = nodes
    .map((node) => node.position?.y)
    .filter((position): position is number => position !== undefined);

  return Math.max(...yPositions) - Math.min(...yPositions);
}
