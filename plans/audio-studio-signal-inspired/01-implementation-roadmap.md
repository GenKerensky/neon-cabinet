# Signal-Inspired Audio Studio Composer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild Audio Studio's music authoring surface into a Signal-inspired, game-audio-native composer workbench without importing Signal wholesale.

**Architecture:** Keep `SoundPatch` and RxDB as the app source of truth, but extract music math and edit commands into framework-free modules. Refactor the Compose UI into small components and hooks, then add editing workflow, control lanes, scheduling, MIDI interop, and optional Canvas rendering in measured phases.

**Tech Stack:** React, Vite, Nx, Bun, TypeScript, RxDB/RxState, Web Audio, shadcn/Radix UI, lucide icons, Vitest, Testing Library, optional Canvas/WebGL after performance measurement.

---

## File Structure Target

### `libs/audio-tools`

Create:

- `libs/audio-tools/src/lib/music/pitch.ts`
- `libs/audio-tools/src/lib/music/timebase.ts`
- `libs/audio-tools/src/lib/music/quantize.ts`
- `libs/audio-tools/src/lib/music/clip-commands.ts`
- `libs/audio-tools/src/lib/music/clip-selection.ts`
- `libs/audio-tools/src/lib/music/clipboard.ts`
- `libs/audio-tools/src/lib/music/scheduler.ts`
- `libs/audio-tools/src/lib/music/midi-adapter.ts`
- `libs/audio-tools/src/lib/music/control-lanes.ts`
- `libs/audio-tools/src/lib/music/index.ts`
- `libs/audio-tools/src/lib/runtime/patch-runtime.ts`
- `libs/audio-tools/src/lib/runtime/runtime-nodes.ts`
- `libs/audio-tools/src/lib/validation/patch-validation.ts`
- `libs/audio-tools/src/lib/migration/patch-migration.ts`

Modify:

- `libs/audio-tools/src/lib/audio-tools.ts`
- `libs/audio-tools/src/lib/types.ts`
- `libs/audio-tools/src/index.ts`
- `libs/audio-tools/src/lib/audio-tools.spec.ts`

Responsibility split:

- `music/*`: pure domain logic for notes, timing, quantize, selection, commands, control lanes, scheduler, and MIDI adapters.
- `runtime/*`: Web Audio graph/runtime behavior.
- `validation/*`: patch and authored data validation.
- `migration/*`: schema migration.
- `audio-tools.ts`: compatibility export barrel until consumers move to narrower imports.

### `apps/audio-studio`

Create:

- `apps/audio-studio/src/components/compose/ComposeMode.tsx`
- `apps/audio-studio/src/components/compose/ComposeToolbar.tsx`
- `apps/audio-studio/src/components/compose/PianoRollViewport.tsx`
- `apps/audio-studio/src/components/compose/PianoRollGrid.tsx`
- `apps/audio-studio/src/components/compose/PianoRollRuler.tsx`
- `apps/audio-studio/src/components/compose/PianoRollKeys.tsx`
- `apps/audio-studio/src/components/compose/NoteLayer.tsx`
- `apps/audio-studio/src/components/compose/PlayheadLayer.tsx`
- `apps/audio-studio/src/components/compose/SelectionLayer.tsx`
- `apps/audio-studio/src/components/compose/ControlLanePanel.tsx`
- `apps/audio-studio/src/components/compose/EventTablePanel.tsx`
- `apps/audio-studio/src/components/compose/use-compose-transform.ts`
- `apps/audio-studio/src/components/compose/use-compose-gestures.ts`
- `apps/audio-studio/src/components/compose/use-compose-selection.ts`
- `apps/audio-studio/src/components/compose/use-compose-clipboard.ts`
- `apps/audio-studio/src/components/compose/use-compose-keyboard.ts`
- `apps/audio-studio/src/components/compose/use-compose-playback.ts`
- `apps/audio-studio/src/components/compose/compose-types.ts`
- `apps/audio-studio/src/components/compose/index.ts`
- `apps/audio-studio/src/hooks/use-studio-clip-commands.ts`
- `apps/audio-studio/src/hooks/use-studio-graph-commands.ts`
- `apps/audio-studio/src/hooks/use-studio-persistence.ts`
- `apps/audio-studio/src/hooks/use-studio-project.ts`
- `apps/audio-studio/src/styles/compose.css`
- `apps/audio-studio/src/styles/patch-graph.css`

Modify:

- `apps/audio-studio/src/components/AuthoringModes.tsx`
- `apps/audio-studio/src/hooks/use-studio-history.ts`
- `apps/audio-studio/src/hooks/use-patch-preview.ts`
- `apps/audio-studio/src/App.tsx`
- `apps/audio-studio/src/styles.css`
- `apps/audio-studio/src/App.test.tsx`

Responsibility split:

- `components/compose/*`: UI and interaction code for music editing.
- `hooks/use-studio-clip-commands.ts`: app-level clip mutations that call audio-tools pure commands and commit history.
- `hooks/use-studio-graph-commands.ts`: graph-only mutations.
- `hooks/use-studio-persistence.ts`: RxDB read/write/subscription plumbing.
- `hooks/use-studio-project.ts`: combined orchestration hook replacing most of `use-studio-history`.

### `libs/ui`

Create:

- `libs/ui/src/components/transport-button.tsx`
- `libs/ui/src/components/quantize-selector.tsx`
- `libs/ui/src/components/mini-ruler.tsx`
- `libs/ui/src/components/event-table.tsx`
- `libs/ui/src/components/control-lane.tsx`

Modify:

- `libs/ui/src/index.ts`
- `libs/ui/src/components/audio-knob.tsx`
- `libs/ui/src/components/gradient-slider.tsx`

Responsibility split:

- Keep generic audio UI controls in `libs/ui`.
- Keep game-specific styling and behavior in `apps/audio-studio`.

---

## Phase 1: Composer Core Extraction

**Payoff:** High. This gives us reliable tests and shared logic before bigger UI changes.

**Complexity:** Low to medium.

### Task 1.1: Add Pitch And Timebase Helpers

**Files:**

- Create: `libs/audio-tools/src/lib/music/pitch.ts`
- Create: `libs/audio-tools/src/lib/music/timebase.ts`
- Create: `libs/audio-tools/src/lib/music/index.ts`
- Modify: `libs/audio-tools/src/index.ts`
- Modify: `libs/audio-tools/src/lib/audio-tools.ts`
- Test: `libs/audio-tools/src/lib/audio-tools.spec.ts`

- [ ] **Step 1: Write failing tests for pitch helpers**

Add tests that prove pitch conversion is stable:

```ts
it("converts between pitch names, midi notes, and frequencies", () => {
  expect(pitchToMidi({ note: "A", accidental: "natural", octave: 4 })).toBe(69);
  expect(midiToPitch(60)).toEqual({
    note: "C",
    accidental: "natural",
    octave: 4,
  });
  expect(
    noteToFrequency({ note: "A", accidental: "natural", octave: 4 }),
  ).toBeCloseTo(440, 3);
});
```

- [ ] **Step 2: Write failing tests for timebase helpers**

```ts
it("converts clip beats to integer ticks and seconds", () => {
  const timebase = 480;
  expect(beatsToTicks(1.5, timebase)).toBe(720);
  expect(ticksToBeats(720, timebase)).toBe(1.5);
  expect(ticksToSeconds(960, 120, timebase)).toBe(1);
  expect(secondsToTicks(0.5, 120, timebase)).toBe(480);
});
```

- [ ] **Step 3: Run tests to verify failure**

Run:

```bash
bun nx test audio-tools
```

Expected: fails because `pitchToMidi`, `midiToPitch`, `beatsToTicks`, `ticksToBeats`, `ticksToSeconds`, and `secondsToTicks` do not exist.

- [ ] **Step 4: Implement pitch helpers**

`pitch.ts` should export:

```ts
import type { ClipNotePitch } from "../types";

export function pitchToMidi(pitch: ClipNotePitch): number;
export function midiToPitch(midi: number): ClipNotePitch;
export function noteToFrequency(pitch: ClipNotePitch): number;
export function frequencyToPitch(frequency: number): ClipNotePitch;
```

Move the current `noteToFrequency` and `frequencyToPitch` logic from `audio-tools.ts` into this file.

- [ ] **Step 5: Implement timebase helpers**

`timebase.ts` should export:

```ts
export const DEFAULT_TIMEBASE = 480;

export function beatsToTicks(
  beats: number,
  timebase = DEFAULT_TIMEBASE,
): number {
  return Math.round(beats * timebase);
}

export function ticksToBeats(
  ticks: number,
  timebase = DEFAULT_TIMEBASE,
): number {
  return ticks / timebase;
}

export function ticksToSeconds(
  ticks: number,
  bpm: number,
  timebase = DEFAULT_TIMEBASE,
): number {
  return (ticks / timebase) * (60 / bpm);
}

export function secondsToTicks(
  seconds: number,
  bpm: number,
  timebase = DEFAULT_TIMEBASE,
): number {
  return Math.round((seconds / (60 / bpm)) * timebase);
}
```

- [ ] **Step 6: Preserve public exports**

Re-export helpers through `music/index.ts`, `audio-tools.ts`, and `index.ts` so existing imports keep working.

- [ ] **Step 7: Run verification**

Run:

```bash
bun nx test audio-tools
bun nx build audio-tools
```

Expected: all tests pass and the library builds.

### Task 1.2: Add Quantize Helpers

**Files:**

- Create: `libs/audio-tools/src/lib/music/quantize.ts`
- Modify: `libs/audio-tools/src/lib/music/index.ts`
- Test: `libs/audio-tools/src/lib/audio-tools.spec.ts`

- [ ] **Step 1: Write failing tests**

```ts
it("quantizes ticks to straight, dotted, and triplet grids", () => {
  expect(
    quantizeTick(250, {
      denominator: 4,
      mode: "straight",
      timebase: 480,
      rounding: "round",
    }),
  ).toBe(480);
  expect(
    quantizeTick(700, {
      denominator: 8,
      mode: "straight",
      timebase: 480,
      rounding: "floor",
    }),
  ).toBe(480);
  expect(
    quantizeTick(700, {
      denominator: 8,
      mode: "straight",
      timebase: 480,
      rounding: "ceil",
    }),
  ).toBe(720);
  expect(
    quantizeUnitTicks({ denominator: 8, mode: "triplet", timebase: 480 }),
  ).toBe(160);
  expect(
    quantizeUnitTicks({ denominator: 8, mode: "dotted", timebase: 480 }),
  ).toBe(360);
});
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
bun nx test audio-tools
```

Expected: fails because quantize helpers do not exist.

- [ ] **Step 3: Implement quantize helpers**

`quantize.ts` should export:

```ts
export type QuantizeMode = "straight" | "dotted" | "triplet";
export type QuantizeRounding = "round" | "floor" | "ceil";

export interface QuantizeSettings {
  denominator: 1 | 2 | 4 | 8 | 16 | 32 | 64;
  mode: QuantizeMode;
  rounding?: QuantizeRounding;
  timebase?: number;
}

export function quantizeUnitTicks(settings: QuantizeSettings): number;
export function quantizeTick(tick: number, settings: QuantizeSettings): number;
export function quantizeBeat(beat: number, settings: QuantizeSettings): number;
```

Use Signal's dotted/triplet idea but keep our API explicit.

- [ ] **Step 4: Run verification**

Run:

```bash
bun nx test audio-tools
bun nx build audio-tools
```

Expected: all tests pass and the library builds.

### Task 1.3: Add Clip Command Helpers

**Files:**

- Create: `libs/audio-tools/src/lib/music/clip-commands.ts`
- Create: `libs/audio-tools/src/lib/music/clip-selection.ts`
- Modify: `libs/audio-tools/src/lib/music/index.ts`
- Test: `libs/audio-tools/src/lib/audio-tools.spec.ts`

- [ ] **Step 1: Write failing tests for commands**

```ts
it("moves, resizes, transposes, duplicates, and deletes notes immutably", () => {
  const clip = createTestClip([
    { id: "a", startBeat: 1, durationBeats: 1, pitch: c4 },
    { id: "b", startBeat: 2, durationBeats: 0.5, pitch: e4 },
  ]);

  expect(
    moveClipNotes(clip, ["a"], { beatDelta: 1, semitoneDelta: 2 }).notes[0],
  ).toMatchObject({
    startBeat: 2,
    pitch: { note: "D", accidental: "natural", octave: 4 },
  });
  expect(resizeClipNote(clip, "a", "end", 2).notes[0].durationBeats).toBe(2);
  expect(deleteClipNotes(clip, ["b"]).notes.map((note) => note.id)).toEqual([
    "a",
  ]);
  expect(duplicateClipNotes(clip, ["a"], 4).notes).toHaveLength(3);
});
```

- [ ] **Step 2: Write failing tests for selection**

```ts
it("finds notes inside a beat and pitch rectangle", () => {
  const clip = createTestClip([
    { id: "low", startBeat: 0, durationBeats: 1, pitch: c4 },
    { id: "high", startBeat: 2, durationBeats: 1, pitch: g5 },
  ]);

  expect(
    selectNotesInRange(clip, {
      startBeat: 0,
      endBeat: 1.5,
      lowMidi: 48,
      highMidi: 72,
    }),
  ).toEqual(["low"]);
});
```

- [ ] **Step 3: Run tests to verify failure**

Run:

```bash
bun nx test audio-tools
```

Expected: fails because command helpers do not exist.

- [ ] **Step 4: Implement immutable helpers**

`clip-commands.ts` should export:

```ts
export function moveClipNotes(
  clip: AudioClip,
  noteIds: string[],
  delta: { beatDelta: number; semitoneDelta: number },
): AudioClip;
export function resizeClipNote(
  clip: AudioClip,
  noteId: string,
  edge: "start" | "end",
  nextBeat: number,
  minDurationBeats?: number,
): AudioClip;
export function transposeClipNotes(
  clip: AudioClip,
  noteIds: string[],
  semitoneDelta: number,
): AudioClip;
export function duplicateClipNotes(
  clip: AudioClip,
  noteIds: string[],
  beatDelta: number,
): AudioClip;
export function deleteClipNotes(clip: AudioClip, noteIds: string[]): AudioClip;
export function quantizeClipNotes(
  clip: AudioClip,
  noteIds: string[],
  settings: QuantizeSettings,
): AudioClip;
```

- [ ] **Step 5: Implement selection helpers**

`clip-selection.ts` should export:

```ts
export interface ClipNoteSelectionRange {
  startBeat: number;
  endBeat: number;
  lowMidi: number;
  highMidi: number;
}

export function selectNotesInRange(
  clip: AudioClip,
  range: ClipNoteSelectionRange,
): string[];
export function sortClipNotes(notes: ClipNote[]): ClipNote[];
export function findNeighborNote(
  clip: AudioClip,
  selectedNoteId: string,
  direction: -1 | 1,
): ClipNote | undefined;
```

- [ ] **Step 6: Run verification**

Run:

```bash
bun nx test audio-tools
bun nx build audio-tools
```

Expected: all tests pass and the library builds.

---

## Phase 2: Compose View Refactor

**Payoff:** Very high. This makes future work cheaper and makes note editing easier to reason about.

**Complexity:** Medium.

### Task 2.1: Split Compose Out Of `AuthoringModes.tsx`

**Files:**

- Create: `apps/audio-studio/src/components/compose/ComposeMode.tsx`
- Create: `apps/audio-studio/src/components/compose/compose-types.ts`
- Create: `apps/audio-studio/src/components/compose/index.ts`
- Modify: `apps/audio-studio/src/components/AuthoringModes.tsx`
- Modify: `apps/audio-studio/src/App.tsx`
- Test: `apps/audio-studio/src/App.test.tsx`

- [ ] **Step 1: Write a structural regression test**

Add assertions that Compose renders the same accessible controls after extraction:

```ts
it("renders Compose through the extracted compose module", () => {
  render(<App />);
  fireEvent.click(screen.getByRole("tab", { name: "Compose" }));
  expect(screen.getByRole("grid", { name: "Piano roll note grid" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Add note" })).toBeTruthy();
});
```

- [ ] **Step 2: Move Compose code without behavior changes**

Move only the Compose component and its private helpers from `AuthoringModes.tsx` into `components/compose/ComposeMode.tsx`.

Keep exported API:

```ts
export interface ComposeModeProps {
  patch: SoundPatch;
  playhead?: ComposePlayhead | null;
  onUpdatePatch(
    updater: (patch: SoundPatch) => SoundPatch,
    status?: string,
  ): void;
}
```

- [ ] **Step 3: Re-export Compose**

`components/compose/index.ts` should export:

```ts
export * from "./ComposeMode";
export * from "./compose-types";
```

- [ ] **Step 4: Update imports**

`AuthoringModes.tsx` should no longer contain Compose internals. It should either export only `TrackerMode` and `InstrumentMode`, or become a compatibility barrel.

- [ ] **Step 5: Run verification**

Run:

```bash
bun nx test audio-studio
bun nx build audio-studio
```

Expected: all tests pass and the app builds.

### Task 2.2: Extract Compose Transform And Layers

**Files:**

- Create: `apps/audio-studio/src/components/compose/use-compose-transform.ts`
- Create: `apps/audio-studio/src/components/compose/PianoRollViewport.tsx`
- Create: `apps/audio-studio/src/components/compose/PianoRollGrid.tsx`
- Create: `apps/audio-studio/src/components/compose/PianoRollRuler.tsx`
- Create: `apps/audio-studio/src/components/compose/PianoRollKeys.tsx`
- Create: `apps/audio-studio/src/components/compose/NoteLayer.tsx`
- Create: `apps/audio-studio/src/components/compose/PlayheadLayer.tsx`
- Modify: `apps/audio-studio/src/components/compose/ComposeMode.tsx`
- Test: `apps/audio-studio/src/App.test.tsx`

- [ ] **Step 1: Write transform tests**

Use a direct unit test or component test for pointer math:

```ts
it("maps beats and pitch rows through the compose transform", () => {
  const transform = createComposeTransform({
    beatWidth: 64,
    labelWidth: 88,
    noteHeight: 22,
    rowHeight: 30,
    maxMidi: 84,
  });

  expect(transform.beatToX(2)).toBe(216);
  expect(transform.xToBeat(216)).toBe(2);
  expect(
    transform.pitchToY({ note: "C", accidental: "natural", octave: 4 }),
  ).toBe(24 * 30 + 4);
});
```

- [ ] **Step 2: Implement `createComposeTransform`**

The transform should expose:

```ts
export interface ComposeTransform {
  beatToX(beat: number): number;
  xToBeat(x: number): number;
  pitchToY(pitch: ClipNotePitch): number;
  yToPitch(y: number): ClipNotePitch;
  noteToRect(note: ClipNote): {
    left: number;
    top: number;
    width: number;
    height: number;
  };
}
```

- [ ] **Step 3: Extract visual layers**

Move static visual pieces into layer components:

- `PianoRollRuler`: bar and beat labels.
- `PianoRollKeys`: pitch labels.
- `PianoRollGrid`: row and beat guide lines.
- `NoteLayer`: note buttons and note context menus.
- `PlayheadLayer`: playhead line.

- [ ] **Step 4: Keep draft edits local**

`ComposeMode` should still pass draft notes into `NoteLayer`, but history commits must remain in `handlePointerUp`.

- [ ] **Step 5: Run verification**

Run:

```bash
bun nx test audio-studio
bun nx build audio-studio
```

Expected: all tests pass and the app builds.

### Task 2.3: Move Mode CSS Into Compose CSS

**Files:**

- Create: `apps/audio-studio/src/styles/compose.css`
- Modify: `apps/audio-studio/src/styles.css`
- Modify: `apps/audio-studio/src/main.tsx`
- Test: `apps/audio-studio/src/App.test.tsx`

- [ ] **Step 1: Move only Compose-specific CSS**

Move these selectors to `compose.css`:

- `.piano-roll`
- `.beat-ruler`
- `.piano-grid`
- `.piano-key-column`
- `.piano-row-guides`
- `.piano-row-guide`
- `.piano-beat-guides`
- `.piano-beat-column`
- `.compose-playhead`
- `.piano-note`
- `.piano-note-resize`

- [ ] **Step 2: Import CSS**

Import `compose.css` from `main.tsx` after shared/global CSS and before or after `styles.css` based on current cascade needs.

- [ ] **Step 3: Run visual and test verification**

Run:

```bash
bun nx test audio-studio
bun nx build audio-studio
```

Expected: all tests pass and styles remain unchanged in the browser.

---

## Phase 3: Composer Editing Workflow

**Payoff:** High. This makes Compose feel like an editor, not a demo.

**Complexity:** Medium.

### Task 3.1: Add Selection And Marquee Editing

**Files:**

- Create: `apps/audio-studio/src/components/compose/use-compose-selection.ts`
- Create: `apps/audio-studio/src/components/compose/SelectionLayer.tsx`
- Modify: `apps/audio-studio/src/components/compose/use-compose-gestures.ts`
- Modify: `apps/audio-studio/src/components/compose/ComposeMode.tsx`
- Test: `apps/audio-studio/src/App.test.tsx`

- [ ] **Step 1: Write failing tests**

```ts
it("selects a note, shift-toggles selection, and marquee-selects a range", () => {
  render(<App />);
  loadDigitalTapsAndOpenCompose();
  fireEvent.pointerDown(screen.getAllByRole("button", { name: "Audition G4 note" })[0], { button: 0, buttons: 1 });
  expect(screen.getAllByRole("button", { selected: true }).length).toBe(1);
});
```

- [ ] **Step 2: Add selection state in React memory**

Selection is per-window UI state. Do not persist it in RxDB.

`use-compose-selection.ts` should expose:

```ts
export function useComposeSelection(): {
  selectedNoteIds: string[];
  setSelectedNoteIds(ids: string[]): void;
  toggleNote(noteId: string): void;
  clearSelection(): void;
  selectRange(noteIds: string[]): void;
};
```

- [ ] **Step 3: Add marquee layer**

Render the current marquee rectangle during drag and compute selected notes with `selectNotesInRange`.

- [ ] **Step 4: Run verification**

Run:

```bash
bun nx test audio-studio
bun nx build audio-studio
```

Expected: all tests pass and selection does not write to RxDB.

### Task 3.2: Add Keyboard Commands

**Files:**

- Create: `apps/audio-studio/src/components/compose/use-compose-keyboard.ts`
- Modify: `apps/audio-studio/src/components/compose/ComposeMode.tsx`
- Modify: `apps/audio-studio/src/hooks/use-studio-clip-commands.ts`
- Test: `apps/audio-studio/src/App.test.tsx`

- [ ] **Step 1: Write failing tests**

```ts
it("supports keyboard delete, duplicate, quantize, and semitone transpose", () => {
  render(<App />);
  loadDigitalTapsAndOpenCompose();
  selectFirstNote();
  fireEvent.keyDown(screen.getByRole("grid", { name: "Piano roll note grid" }), { key: "Delete" });
  expect(readPatch().clips?.[0]?.notes).toHaveLength(8);
});
```

- [ ] **Step 2: Implement keyboard hook**

Support:

- `Delete` and `Backspace`: delete selected notes.
- `Ctrl+D` or `Meta+D`: duplicate selected notes.
- `Q`: quantize selected notes.
- `ArrowUp`: transpose +1 semitone.
- `ArrowDown`: transpose -1 semitone.
- `Shift+ArrowUp`: transpose +12 semitones.
- `Shift+ArrowDown`: transpose -12 semitones.
- `Escape`: clear selection.

- [ ] **Step 3: Ensure commands commit once**

Each key command should create one history entry.

- [ ] **Step 4: Run verification**

Run:

```bash
bun nx test audio-studio
bun nx build audio-studio
```

Expected: keyboard commands pass tests and build succeeds.

### Task 3.3: Add Typed Clipboard

**Files:**

- Create: `apps/audio-studio/src/components/compose/use-compose-clipboard.ts`
- Modify: `libs/audio-tools/src/lib/music/clipboard.ts`
- Modify: `apps/audio-studio/src/components/compose/use-compose-keyboard.ts`
- Test: `apps/audio-studio/src/App.test.tsx`
- Test: `libs/audio-tools/src/lib/audio-tools.spec.ts`

- [ ] **Step 1: Write failing audio-tools tests**

```ts
it("serializes and parses typed note clipboard payloads", () => {
  const payload = createNotesClipboardPayload([sampleNote], 2);
  expect(parseNotesClipboardPayload(JSON.stringify(payload))).toEqual(payload);
  expect(
    parseNotesClipboardPayload(JSON.stringify({ type: "wrong" })),
  ).toBeNull();
});
```

- [ ] **Step 2: Write failing app tests**

```ts
it("copies and pastes selected notes relative to the cursor beat", async () => {
  render(<App />);
  loadDigitalTapsAndOpenCompose();
  selectFirstNote();
  await userEvent.keyboard("{Control>}c{/Control}");
  await userEvent.keyboard("{Control>}v{/Control}");
  expect(readPatch().clips?.[0]?.notes.length).toBe(10);
});
```

- [ ] **Step 3: Implement payload helpers**

`clipboard.ts` should export:

```ts
export interface NotesClipboardPayload {
  type: "audio-studio-notes";
  originBeat: number;
  notes: ClipNote[];
}

export function createNotesClipboardPayload(
  notes: ClipNote[],
  originBeat: number,
): NotesClipboardPayload;
export function parseNotesClipboardPayload(
  value: string,
): NotesClipboardPayload | null;
```

- [ ] **Step 4: Implement UI clipboard hook**

Use `navigator.clipboard.readText` and `navigator.clipboard.writeText` with a fallback path for paste event text.

- [ ] **Step 5: Run verification**

Run:

```bash
bun nx test audio-tools
bun nx test audio-studio
bun nx build audio-studio
```

Expected: all tests pass and copied notes paste relative to cursor/playhead.

### Task 3.4: Add Quantize Selector And Ruler Density

**Files:**

- Create: `libs/ui/src/components/quantize-selector.tsx`
- Modify: `libs/ui/src/index.ts`
- Modify: `apps/audio-studio/src/components/compose/ComposeToolbar.tsx`
- Modify: `apps/audio-studio/src/components/compose/PianoRollRuler.tsx`
- Test: `apps/audio-studio/src/App.test.tsx`

- [ ] **Step 1: Write failing tests**

```ts
it("changes snap resolution from the Compose toolbar", () => {
  render(<App />);
  openCompose();
  fireEvent.click(screen.getByRole("button", { name: "Snap 1/16" }));
  fireEvent.click(screen.getByRole("menuitemradio", { name: "1/32" }));
  expect(screen.getByRole("button", { name: "Snap 1/32" })).toBeTruthy();
});
```

- [ ] **Step 2: Implement `QuantizeSelector`**

Use shadcn/Radix menu or popover primitives. Values:

- Off
- 1/4
- 1/8
- 1/16
- 1/32
- 1/64
- Dotted variants
- Triplet variants

- [ ] **Step 3: Improve ruler generation**

Use clip time signature and transform zoom to:

- Mark bars strongly.
- Mark beats subtly.
- Omit text labels when label spacing is too tight.

- [ ] **Step 4: Run verification**

Run:

```bash
bun nx test audio-studio
bun nx build ui
bun nx build audio-studio
```

Expected: tests pass, UI builds, and ruler labels remain readable.

---

## Phase 4: Control Lanes And Lookahead Scheduler

**Payoff:** High for chip music and SFX.

**Complexity:** Medium to high.

### Task 4.1: Add Control Lane Data Types

**Files:**

- Modify: `libs/audio-tools/src/lib/types.ts`
- Create: `libs/audio-tools/src/lib/music/control-lanes.ts`
- Test: `libs/audio-tools/src/lib/audio-tools.spec.ts`

- [ ] **Step 1: Write failing tests**

```ts
it("stores and interpolates velocity and chip control lane events", () => {
  const lane = createControlLane("pitchBend", [
    { id: "a", beat: 0, value: 0 },
    { id: "b", beat: 1, value: 12 },
  ]);
  expect(sampleControlLane(lane, 0.5)).toBe(6);
});
```

- [ ] **Step 2: Add types**

Extend `AudioClip` with:

```ts
controlLanes?: ClipControlLane[];
```

Add:

```ts
export type ClipControlLaneType =
  | "velocity"
  | "pitchBend"
  | "duty"
  | "arpeggio"
  | "noisePeriod"
  | "filterCutoff"
  | "fmFeedback"
  | "sampleSlot";

export interface ClipControlEvent {
  id: string;
  beat: number;
  value: number;
  curve?: "step" | "linear" | "ease-in" | "ease-out";
}

export interface ClipControlLane {
  id: string;
  type: ClipControlLaneType;
  channelId?: string;
  instrumentId?: string;
  events: ClipControlEvent[];
}
```

- [ ] **Step 3: Implement lane helpers**

Export:

```ts
export function createControlLane(
  type: ClipControlLaneType,
  events?: ClipControlEvent[],
): ClipControlLane;
export function sampleControlLane(lane: ClipControlLane, beat: number): number;
export function paintControlLane(
  lane: ClipControlLane,
  startBeat: number,
  endBeat: number,
  startValue: number,
  endValue: number,
  stepBeat: number,
): ClipControlLane;
```

- [ ] **Step 4: Run verification**

Run:

```bash
bun nx test audio-tools
bun nx build audio-tools
```

Expected: tests pass and library builds.

### Task 4.2: Add Velocity Lane UI

**Files:**

- Create: `libs/ui/src/components/control-lane.tsx`
- Create: `apps/audio-studio/src/components/compose/ControlLanePanel.tsx`
- Modify: `apps/audio-studio/src/components/compose/ComposeMode.tsx`
- Test: `apps/audio-studio/src/App.test.tsx`

- [ ] **Step 1: Write failing tests**

```ts
it("edits note velocity from the velocity lane and commits once on pointer up", () => {
  render(<App />);
  loadDigitalTapsAndOpenCompose();
  const lane = screen.getByRole("slider", { name: "Velocity lane" });
  fireEvent.pointerDown(lane, { button: 0, buttons: 1, clientX: 120, clientY: 40 });
  fireEvent.pointerMove(lane, { buttons: 1, clientX: 180, clientY: 20 });
  expect(readPatch().clips?.[0]?.notes[0]?.velocity).toBe(0.8);
  fireEvent.pointerUp(lane, { buttons: 0, clientX: 180, clientY: 20 });
  expect(readPatch().clips?.[0]?.notes[0]?.velocity).not.toBe(0.8);
});
```

- [ ] **Step 2: Implement lane visual**

Use SVG or HTML bars first. Do not introduce Canvas for this first lane.

- [ ] **Step 3: Commit on pointer up**

Keep lane draft edits in React memory during pointer movement.

- [ ] **Step 4: Run verification**

Run:

```bash
bun nx test audio-studio
bun nx build audio-studio
```

Expected: velocity lane works and writes only once per gesture.

### Task 4.3: Add Lookahead Scheduler

**Files:**

- Create: `libs/audio-tools/src/lib/music/scheduler.ts`
- Modify: `libs/audio-tools/src/lib/runtime/patch-runtime.ts`
- Modify: `apps/audio-studio/src/hooks/use-patch-preview.ts`
- Test: `libs/audio-tools/src/lib/audio-tools.spec.ts`
- Test: `apps/audio-studio/src/App.test.tsx`

- [ ] **Step 1: Write failing scheduler tests**

```ts
it("reads events in a lookahead window and loops without dropping boundary events", () => {
  const scheduler = new PatchScheduler({
    durationTicks: 1920,
    getEvents: (start, end) =>
      [
        { tick: 480, id: "a" },
        { tick: 1900, id: "b" },
      ].filter((event) => event.tick >= start && event.tick < end),
    timebase: 480,
  });
  scheduler.loop = { beginTick: 0, endTick: 1920 };
  expect(
    scheduler.readNextEvents(120, 0, 100).map((event) => event.event.id),
  ).toContain("a");
});
```

- [ ] **Step 2: Implement scheduler**

Model after Signal's `EventScheduler`, but keep it framework-free and Web Audio friendly:

```ts
export interface ScheduledPatchEvent<T> {
  event: T;
  audioTime: number;
}

export class PatchScheduler<T extends { tick: number }> {
  readNextEvents(
    bpm: number,
    audioCurrentTime: number,
    lookAheadSeconds: number,
  ): ScheduledPatchEvent<T>[];
  seek(tick: number): void;
}
```

- [ ] **Step 3: Use scheduler for clip notes**

`createClipSourceNode` should schedule notes from the scheduler instead of starting every note in one pass for long clips.

- [ ] **Step 4: Drive playhead from scheduler state**

`use-patch-preview.ts` should expose playback position from scheduled audio time, not just React timer approximations.

- [ ] **Step 5: Run verification**

Run:

```bash
bun nx test audio-tools
bun nx test audio-studio
bun nx build audio-studio
```

Expected: tests pass and playhead behavior remains stable.

---

## Phase 5: Patch Graph Clip Routing

**Payoff:** Medium to high. This connects Compose to the node graph in a way users can understand.

**Complexity:** Medium.

### Task 5.1: Make Clip Source Nodes Friendly

**Files:**

- Modify: `apps/audio-studio/src/components/NodeInspector.tsx`
- Modify: `apps/audio-studio/src/components/NodeGraph.tsx`
- Modify: `apps/audio-studio/src/lib/patch-utils.ts`
- Test: `apps/audio-studio/src/App.test.tsx`

- [ ] **Step 1: Write failing tests**

```ts
it("lets a clip source node choose an authored clip by name", () => {
  render(<App />);
  loadDigitalTapsAndOpenPatchGraph();
  fireEvent.click(screen.getByRole("button", { name: "Clip Source" }));
  expect(screen.getByRole("combobox", { name: "Clip" })).toBeTruthy();
});
```

- [ ] **Step 2: Update default clip source creation**

When adding a `clipSource` node, pick the first available clip ID instead of `default-clip`.

- [ ] **Step 3: Add clip selector inspector**

`NodeInspector` should render a themed select for `clipSource.clipId`.

- [ ] **Step 4: Run verification**

Run:

```bash
bun nx test audio-studio
bun nx build audio-studio
```

Expected: clip source node selection works.

### Task 5.2: Route Clips Through Effects With Clear Graph Presets

**Files:**

- Modify: `libs/audio-tools/src/lib/battle-tanks-presets.ts`
- Modify: `libs/audio-tools/src/lib/space-defender-presets.ts`
- Modify: `libs/audio-tools/src/lib/mars-lander-presets.ts`
- Test: `libs/audio-tools/src/lib/audio-tools.spec.ts`

- [ ] **Step 1: Write failing preset tests**

```ts
it("routes music cue clips through clipSource nodes instead of timed oscillator note nodes", () => {
  const taps = BATTLE_TANKS_AUDIO_PATCHES.find(
    (patch) => patch.id === "battle-tanks-digital-taps",
  );
  expect(taps?.nodes.some((node) => node.type === "clipSource")).toBe(true);
  expect(
    taps?.connections.some((connection) => connection.from.includes("clip")),
  ).toBe(true);
});
```

- [ ] **Step 2: Update music cue presets**

Music cues should use:

- one `clipSource`
- optional gain/filter/pan nodes
- output
- authored `clips` and `instruments`

- [ ] **Step 3: Keep SFX patches graph-friendly**

SFX can still use oscillators/noise nodes directly, but patches with notes should use clip sources.

- [ ] **Step 4: Run verification**

Run:

```bash
bun nx test audio-tools
bun nx build audio-tools
bun nx test audio-studio
```

Expected: presets validate and Audio Studio still loads every game.

---

## Phase 6: MIDI And File Interop

**Payoff:** Medium. Useful for composition workflow and external tools.

**Complexity:** High.

### Task 6.1: Add MIDI Adapter In Audio Tools

**Files:**

- Create: `libs/audio-tools/src/lib/music/midi-adapter.ts`
- Modify: `libs/audio-tools/package.json`
- Modify: `libs/audio-tools/src/lib/music/index.ts`
- Test: `libs/audio-tools/src/lib/audio-tools.spec.ts`

- [ ] **Step 1: Add dependency**

Use the package manager workspace command:

```bash
bun add midifile-ts --cwd libs/audio-tools
```

- [ ] **Step 2: Write failing tests**

```ts
it("exports and imports a simple clip as MIDI without losing notes", () => {
  const clip = createTestClip([
    { id: "a", startBeat: 0, durationBeats: 1, pitch: c4 },
    { id: "b", startBeat: 1, durationBeats: 1, pitch: e4 },
  ]);
  const bytes = clipToMidi(clip, [defaultInstrument()]);
  const imported = midiToClip(bytes, { clipId: "imported", name: "Imported" });
  expect(imported.notes.map((note) => note.pitch)).toEqual([c4, e4]);
});
```

- [ ] **Step 3: Implement adapter**

Export:

```ts
export function clipToMidi(
  clip: AudioClip,
  instruments: ClipInstrument[],
): Uint8Array;
export function midiToClip(
  bytes: Uint8Array,
  options: { clipId: string; name: string },
): AudioClip;
```

Use our schema as the source of truth. MIDI is an interchange format.

- [ ] **Step 4: Run verification**

Run:

```bash
bun nx test audio-tools
bun nx build audio-tools
```

Expected: MIDI round-trip tests pass.

### Task 6.2: Add Import And Export UI

**Files:**

- Modify: `apps/audio-studio/src/components/JsonPanel.tsx`
- Modify: `apps/audio-studio/src/components/compose/ComposeToolbar.tsx`
- Modify: `apps/audio-studio/src/hooks/use-studio-clip-commands.ts`
- Test: `apps/audio-studio/src/App.test.tsx`

- [ ] **Step 1: Write failing tests**

```ts
it("exports the selected clip as MIDI from Compose toolbar", () => {
  render(<App />);
  loadDigitalTapsAndOpenCompose();
  expect(screen.getByRole("button", { name: "Export MIDI" })).toBeTruthy();
});
```

- [ ] **Step 2: Add buttons**

Add:

- `Import MIDI`
- `Export MIDI`

Use lucide upload/download icons and accessible labels.

- [ ] **Step 3: Add import path**

Import should create or replace an authored clip, then commit one history entry.

- [ ] **Step 4: Add export path**

Export should download a `.mid` file named from the selected game and clip.

- [ ] **Step 5: Run verification**

Run:

```bash
bun nx test audio-studio
bun nx build audio-studio
```

Expected: UI tests pass and build succeeds.

---

## Phase 7: Canvas Rendering Upgrade

**Payoff:** High for dense clips. Low for small SFX clips.

**Complexity:** Highest.

### Task 7.1: Add Performance Fixtures Before Rendering Rewrite

**Files:**

- Create: `apps/audio-studio/src/components/compose/compose-performance.fixtures.ts`
- Create: `apps/audio-studio/src/components/compose/compose-performance.spec.tsx`
- Modify: `apps/audio-studio/src/components/compose/NoteLayer.tsx`

- [ ] **Step 1: Add dense clip fixture**

Create fixtures for:

- 100 notes
- 500 notes
- 1000 notes

- [ ] **Step 2: Add render budget test**

The test should verify that dense note rendering does not crash and note count is represented. Do not assert exact timing in CI.

- [ ] **Step 3: Add browser QA script**

Add a documented manual browser QA command in this plan's notes:

```bash
bun nx serve audio-studio
```

Then use Chrome DevTools Performance or Playwright tracing to compare DOM and Canvas implementations.

### Task 7.2: Implement Canvas Note Layer Behind A Feature Flag

**Files:**

- Create: `apps/audio-studio/src/components/compose/CanvasNoteLayer.tsx`
- Modify: `apps/audio-studio/src/components/compose/NoteLayer.tsx`
- Modify: `apps/audio-studio/src/components/compose/compose-types.ts`
- Test: `apps/audio-studio/src/App.test.tsx`

- [ ] **Step 1: Write behavior parity tests**

Tests should prove:

- notes render in DOM mode
- notes render in Canvas mode with accessible hit regions
- click auditions note
- drag move works
- resize works
- context menu delete works

- [ ] **Step 2: Draw notes on canvas**

Canvas is visual only. Keep accessible hit areas as positioned HTML elements or SVG overlays.

- [ ] **Step 3: Compare browser performance**

Use the dense fixtures and browser performance recording.

- [ ] **Step 4: Decide default renderer**

Use DOM as default unless Canvas clearly improves dense clips without hurting accessibility.

---

## Cross-Phase Rules

1. **No RxDB writes during pointer movement**

Draft edits stay in refs/React state. Commit on pointer up, key command, menu command, import, or explicit control change completion.

2. **No hidden UI state in RxDB**

Persist sound/project data only:

- clips
- notes
- instruments
- control lanes
- graph nodes/connections
- constraint profile
- undo/redo sound history

Keep these in React memory:

- active tab
- selected notes
- selected node
- sidebar width
- graph pan/zoom
- piano-roll scroll/zoom
- open menus/panels

3. **Preserve JSON exports**

Patch exports should remain authored audio data, not editor view state.

4. **Prefer pure helpers before UI behavior**

Every music operation should first land in `@neon-cabinet/audio-tools` with tests, then be wired into Audio Studio.

5. **Keep Signal as reference only**

Signal is MIT licensed, but direct copying should be minimal and attribution should be kept if any substantial implementation is adapted.

## Verification Matrix

Run these after each phase:

```bash
bun nx test audio-tools
bun nx test audio-studio
bun nx build audio-tools
bun nx build ui
bun nx build audio-studio
```

Browser QA after UI phases:

- Open `http://localhost:4310/`.
- Switch games.
- Open Battle Tanks Digital Taps.
- Add a note by clicking the grid.
- Click a note and hear audition.
- Drag a note.
- Resize a note.
- Right-click delete a note.
- Undo and redo.
- Press Play and watch the playhead.
- Switch to Patch Graph and verify clip source routing.
- Reload and confirm persisted sound data returns without active mode/state fighting other windows.

## Phase Completion Criteria

Phase 1 is complete when music helpers are extracted, tested, and exported.

Phase 2 is complete when Compose is split into focused files with no behavior regression.

Phase 3 is complete when selection, keyboard commands, clipboard, quantize, and ruler density work without RxDB writes during pointer moves.

Phase 4 is complete when velocity lane and scheduler are integrated with stable playback/playhead behavior.

Phase 5 is complete when clip source nodes are understandable and music clips route through effects.

Phase 6 is complete when simple MIDI import/export round trips a clip.

Phase 7 is complete when Canvas rendering is measured and either adopted behind a flag or explicitly deferred based on evidence.
