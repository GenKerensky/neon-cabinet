# Signal Research Inventory

## Source Snapshot

Repository: `https://github.com/ryohey/signal`

Local inspection snapshot:

- Commit: `632de9685990c90d0be127994908cc43692ff82a`
- Short commit: `632de96`
- Commit date: `2026-05-22`
- License: MIT

Signal is a cross-platform music sequencer focused on quick MIDI composition. The repository contains:

- A Vite React app under `app/`.
- Electron packaging under `electron/`.
- Firebase/cloud/community support under `functions/`, `packages/api`, and `packages/community`.
- A MIDI-first domain package under `packages/core`.
- A SoundFont/MIDI playback package under `packages/player`.

This makes it a useful reference, not a good direct dependency for Audio Studio.

## Signal Concepts Worth Translating

### 1. Tick-Based Music Domain

Signal stores musical notes as timed track events:

- `tick`
- `duration`
- `noteNumber`
- `velocity`
- track/channel ownership

Relevant files:

- `/tmp/ryohey-signal/packages/core/src/entities/track/TrackEvent.ts`
- `/tmp/ryohey-signal/packages/core/src/entities/track/Track.ts`
- `/tmp/ryohey-signal/packages/core/src/entities/song/Song.ts`
- `/tmp/ryohey-signal/packages/core/src/entities/beat/Beat.ts`

Translation for Audio Studio:

- Keep our friendly `ClipNote` shape for JSON exports.
- Add framework-free helpers for converting `startBeat`/`durationBeats` to integer ticks.
- Add `midiNote`, `noteName`, frequency, and pitch conversion helpers.
- Use ticks internally for quantize, selection, resizing, MIDI import/export, and playback scheduling.

Why it matters:

Integer ticks make editing predictable. Beat floats are convenient for JSON, but they are a weak foundation for quantize, triplets, dotted rhythms, tempo changes, and MIDI interop.

### 2. Coordinate Transforms

Signal keeps note math outside React components:

- `TickTransform`
- `KeyTransform`
- `NoteCoordTransform`
- `NotePoint`

Relevant files:

- `/tmp/ryohey-signal/app/src/entities/transform/TickTransform.ts`
- `/tmp/ryohey-signal/app/src/entities/transform/KeyTransform.ts`
- `/tmp/ryohey-signal/app/src/entities/transform/NoteCoordTransform.ts`
- `/tmp/ryohey-signal/app/src/entities/transform/NotePoint.ts`

Translation for Audio Studio:

- Create `apps/audio-studio/src/components/compose/compose-transform.ts`.
- Convert pointer positions to beat/pitch through a dedicated transform object.
- Convert notes to rectangles through the same transform.
- Keep scroll and zoom math out of JSX.

Why it matters:

Our Compose view currently keeps too much pointer and coordinate math inside `AuthoringModes.tsx`. Signal shows a cleaner boundary that will make drag, resize, scroll, zoom, selection, and ruler behavior easier to test.

### 3. Gesture Objects

Signal separates mouse modes and gestures:

- create note
- select note
- move selection
- drag note center
- drag note left/right edge
- drag-scroll
- tool switching

Relevant files:

- `/tmp/ryohey-signal/app/src/components/PianoRoll/MouseHandler/useNoteMouseGesture.ts`
- `/tmp/ryohey-signal/app/src/components/PianoRoll/MouseHandler/usePencilGesture.ts`
- `/tmp/ryohey-signal/app/src/components/PianoRoll/MouseHandler/gestures/useCreateNoteGesture.ts`
- `/tmp/ryohey-signal/app/src/components/PianoRoll/MouseHandler/gestures/useDragNoteEdgeGesture.ts`
- `/tmp/ryohey-signal/app/src/components/PianoRoll/MouseHandler/gestures/useMoveDraggableGesture.ts`

Translation for Audio Studio:

- Add `useComposeGestures`.
- Add small gesture modules for create, move, resize-start, resize-end, select, marquee, and delete.
- Keep draft state local during pointer movement.
- Commit to RxDB/history only on pointer up.

Why it matters:

This directly matches our performance concern: no RxDB write on every pointer move.

### 4. Draggable Constraints

Signal has a reusable draggable abstraction that knows:

- current draggable position
- allowed range
- note minimum length
- selection boundaries
- quantized movement
- grouped note movement

Relevant files:

- `/tmp/ryohey-signal/app/src/hooks/usePianoRollDraggable.ts`
- `/tmp/ryohey-signal/app/src/components/PianoRoll/MouseHandler/gestures/useMoveDraggableGesture.ts`

Translation for Audio Studio:

- Add pure helpers in `audio-tools`:
  - `moveNotes`
  - `resizeNotes`
  - `clampNoteRange`
  - `duplicateNotes`
  - `transposeNotes`
- Add UI-level helpers for converting pointer deltas into note edits.

Why it matters:

This avoids one-off drag math for every interaction. It also gives us a path to multi-note selection and grouped editing.

### 5. Quantize With Dotted And Triplet Values

Signal supports quantize values beyond simple divisions:

- standard note divisions
- dotted values
- triplets
- enabled/disabled snap mode

Relevant files:

- `/tmp/ryohey-signal/app/src/hooks/useQuantizer.tsx`
- `/tmp/ryohey-signal/app/src/components/Toolbar/QuantizeSelector/QuantizeSelector.tsx`

Translation for Audio Studio:

- Add `SnapResolution` and `QuantizeSettings`.
- Support `1/4`, `1/8`, `1/16`, `1/32`, dotted, and triplet options.
- Show snap state in Compose toolbar.
- Hold `Shift` to temporarily bypass snap during drag.

Why it matters:

Chiptune composition needs triplets, short ornament notes, arpeggios, and precise rhythmic edits. Simple fixed quarter-beat snapping will feel crude quickly.

### 6. Ruler Density And Time Signatures

Signal calculates visible beats and omits labels when grid density is too high.

Relevant files:

- `/tmp/ryohey-signal/app/src/hooks/useRuler.ts`
- `/tmp/ryohey-signal/app/src/components/PianoRoll/CanvasPianoRuler.tsx`
- `/tmp/ryohey-signal/app/src/components/GLNodes/Beats.tsx`

Translation for Audio Studio:

- Generate ruler labels from clip BPM/time signature and zoom level.
- Hide some labels when columns are too dense.
- Mark bar lines more strongly than beats.
- Keep the playhead and ruler aligned through the same transform.

Why it matters:

The Compose view should feel musical, not like a generic spreadsheet.

### 7. Typed Clipboard Payloads

Signal writes domain-specific clipboard JSON:

- `piano_notes`
- `arrange_notes`
- `control_events`
- `tempo_events`

Relevant files:

- `/tmp/ryohey-signal/app/src/services/Clipboard.ts`
- `/tmp/ryohey-signal/packages/core/src/entities/clipboard/clipboardTypes.ts`
- `/tmp/ryohey-signal/app/src/actions/selection.ts`

Translation for Audio Studio:

- Add clipboard payload types:
  - `audio-studio-notes`
  - `audio-studio-control-events`
  - `audio-studio-clip`
  - `audio-studio-patch-subgraph`
- Validate pasted data before mutating patches.
- Paste notes relative to playhead or cursor beat.

Why it matters:

Clipboard support is a major workflow win and is much easier if the payloads are typed from the start.

### 8. Event List As Debuggable Editor

Signal exposes a virtualized event list with precise numeric editing.

Relevant files:

- `/tmp/ryohey-signal/app/src/components/EventEditor/EventList.tsx`
- `/tmp/ryohey-signal/app/src/components/EventEditor/EventListItem.tsx`
- `/tmp/ryohey-signal/app/src/components/EventEditor/EventListInput.tsx`

Translation for Audio Studio:

- Add a compact event table inside Tracker or as a collapsible precision panel.
- Show note start, duration, pitch, velocity, channel, instrument, and effect command.
- Use local input state and commit on blur/Enter.

Why it matters:

This gives power users precise control without forcing everyone to edit JSON.

### 9. Control Lanes And Painted Automation

Signal has a Control Pane for velocity, controller values, and curves.

Relevant files:

- `/tmp/ryohey-signal/app/src/components/ControlPane/ControlPane.tsx`
- `/tmp/ryohey-signal/app/src/components/ControlPane/VelocityControl/VelocityControlCanvas.tsx`
- `/tmp/ryohey-signal/app/src/components/ControlPane/LineGraph/LineGraphCanvas.tsx`
- `/tmp/ryohey-signal/packages/core/src/commands/TrackCommandService.ts`

Translation for Audio Studio:

- Start with velocity lane.
- Add chip macro lanes:
  - pitch bend
  - duty cycle
  - arpeggio step
  - noise period
  - filter cutoff
  - FM feedback
  - sample slot
- Support line and curve drawing for lanes.

Why it matters:

Game audio often relies on tiny modulation gestures. A note grid alone cannot express classic chip effects well.

### 10. Lookahead Scheduler

Signal schedules events ahead of the current playback time.

Relevant files:

- `/tmp/ryohey-signal/packages/player/src/EventScheduler.ts`
- `/tmp/ryohey-signal/packages/player/src/Player.ts`
- `/tmp/ryohey-signal/packages/player/src/tick.ts`

Translation for Audio Studio:

- Add a small `PatchScheduler` in `audio-tools`.
- Schedule clip notes with Web Audio timestamps.
- Use the scheduler to drive playhead progress, looping, and control-lane playback.

Why it matters:

React state and browser timers are not reliable enough for musical timing. Web Audio scheduling should own timing.

## Signal Concepts To Avoid

### 1. Whole App Import

Avoid pulling Signal into the repo as an app or library. It would bring too many unrelated concerns:

- Firebase/cloud/community features.
- Electron packaging.
- SoundFont playback stack.
- MobX plus Jotai state model.
- Emotion styling.
- WebGL rendering dependency.

### 2. WebGL First

Signal's WebGL piano roll is appropriate for dense MIDI sequences. Audio Studio should not jump directly to WebGL.

Use DOM/SVG first because:

- Our clips are expected to be short game audio assets.
- Accessibility and testing are easier.
- shadcn/Radix styling stays consistent.
- The code remains more approachable.

Add Canvas/WebGL only after measured DOM performance problems.

### 3. MIDI As Source Of Truth

Signal is MIDI-first. Audio Studio should remain patch/clip-first.

MIDI import/export should be an adapter:

- Import MIDI into clips and instruments.
- Export clips to MIDI when useful.
- Keep `SoundPatch` and authored game-audio data as source of truth.

## Current Neon Cabinet Findings

Important existing files:

- `libs/audio-tools/src/lib/types.ts`: schema v2 clips, notes, instruments, constraints, patch graph types.
- `libs/audio-tools/src/lib/audio-tools.ts`: validation, migration, pitch conversion, runtime nodes, clip scheduling.
- `apps/audio-studio/src/components/AuthoringModes.tsx`: Compose, Tracker, Instrument, and related helpers in one large file.
- `apps/audio-studio/src/hooks/use-studio-history.ts`: history, RxDB persistence, game switching, patch commands, graph commands.
- `apps/audio-studio/src/components/NodeGraph.tsx`: graph rendering, drag, panning, auto-arrange.
- `apps/audio-studio/src/storage/audio-studio-rxdb.ts`: RxDB/RxState integration.
- `libs/ui/src/components/audio-knob.tsx`: audio-specific UI primitive.
- `libs/ui/src/components/gradient-slider.tsx`: themed slider primitive.

Current pressure points:

- `AuthoringModes.tsx` is large enough that Compose work should extract files before adding features.
- `audio-tools.ts` should split into domain helpers, validation, migration, and runtime modules.
- `use-studio-history.ts` should eventually split into persisted project state, history reducer, graph commands, and clip commands.
- `styles.css` should move mode-specific styles into smaller files when Vite/CSS setup allows it.

## Strategic Conclusion

Signal is worth spending time with as an architectural reference. It is not worth adopting wholesale. The highest-value path is:

1. Extract a tested music-domain core.
2. Refactor Compose into focused components and gestures.
3. Add editing workflow features.
4. Add control lanes and reliable scheduling.
5. Add MIDI/file interop as adapters.
6. Upgrade rendering only if measured density demands it.
