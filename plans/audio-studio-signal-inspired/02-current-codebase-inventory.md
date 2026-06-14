# Current Neon Cabinet Codebase Inventory

This document captures local repo findings that should shape the Signal-inspired Audio Studio plan. It focuses on usable pieces already present in Neon Cabinet and the code pressure points that should be handled before adding deeper composer features.

## Workspace Shape

Nx projects relevant to this plan:

- `@neon-cabinet/audio-studio`: React/Vite app-like project with `build`, `dev`, `lint`, `serve`, `test`, and `typecheck` targets.
- `@neon-cabinet/audio-tools`: shared procedural audio schema, presets, game registry bridge, runtime, validation, and tests.
- `@neon-cabinet/ui`: shared shadcn/Radix themed UI library plus local audio controls.
- `@neon-cabinet/studio-registry`: shared game metadata, icon, and theme registry used by Audio Studio.

Current package facts:

- `apps/audio-studio/package.json` already depends on `@neon-cabinet/audio-tools`, `@neon-cabinet/ui`, `lucide-react`, `rxdb`, and `rxjs`.
- `libs/audio-tools/package.json` currently depends only on `@neon-cabinet/studio-registry` and `tslib`, so Phase 1 music helpers can stay dependency-free.
- `libs/ui/package.json` already has Radix, shadcn, Tailwind, lucide, and utility dependencies. Generic audio editor controls belong there.

## Local Gems To Reuse

### Schema V2 Is Already Started

File: `libs/audio-tools/src/lib/types.ts`

Existing useful types:

- `SoundPatch` with `schemaVersion`, `nodes`, `connections`, `preview`, `clips`, `constraintProfileId`, and `instruments`.
- `AudioClip`, `MusicClip`, `SfxClip`, `ClipNote`, `ClipNotePitch`, `ClipInstrument`, and `ClipChannel`.
- Chip-era engine types: `pulse`, `triangle`, `noise`, `wavetable`, `sample`, `fm2op`, and `fm4op`.
- Constraint profile types: `ChipConstraintProfile`, `ChipChannelDefinition`, and `ConstraintWarning`.
- Patch graph node type `clipSource`.

Planning implication:

The next work does not need a schema reset. It should add timing precision, control lanes, clipboard payloads, and scheduler types around the existing v2 authoring model.

### Runtime Can Already Play Authored Clips

File: `libs/audio-tools/src/lib/audio-tools.ts`

Existing useful behavior:

- `migratePatchToCurrentSchema` can derive authored clip data from timed oscillator presets.
- `noteToFrequency` and `frequencyToPitch` already exist, though they should move into a music-domain module.
- `createClipSourceNode` schedules authored `ClipNote` data into Web Audio.
- `validateClipReferences` catches missing instruments and bad note data.
- `getConstraintWarnings` already creates advisory warnings rather than blocking mixed-chip patches.

Planning implication:

The scheduler phase should improve timing and long-clip behavior instead of replacing the whole runtime. Extract runtime code into smaller files after pure music helpers land.

### Presets Are Good Authoring Fixtures

Files:

- `libs/audio-tools/src/lib/battle-tanks-presets.ts`
- `libs/audio-tools/src/lib/space-defender-presets.ts`
- `libs/audio-tools/src/lib/mars-lander-presets.ts`

Existing useful behavior:

- Battle Tanks includes music cue material that the migration path turns into editable notes.
- Space Defender and Mars Lander have broader effect vocabularies, including thrust loops, weapon tones, impacts, explosions, and music cues.
- Some music cues are still graph-only oscillator/envelope chains, which makes them useful fixtures for migrating more presets to `clipSource`.

Planning implication:

Do not create fake sample data for composer tests when these game presets already exercise the important cases. Use them as acceptance fixtures for Compose, Tracker, Instrument, and Patch Graph behavior.

### Multi-Game Registration Is Already In Place

File: `libs/audio-tools/src/lib/game-registry.ts`

Existing useful behavior:

- Bridges `@neon-cabinet/studio-registry` game metadata into Audio Studio registrations.
- Supplies per-game effects and default effect IDs.
- Keeps registered game data clone-safe.

Planning implication:

Future sound-project persistence should extend the current game-scoped model instead of creating a separate project registry. The game selector and theme model are already valuable enough to preserve.

### RxDB State Is Isolated Behind A Small Module

File: `apps/audio-studio/src/storage/audio-studio-rxdb.ts`

Existing useful behavior:

- `createAudioStudioStorage()` wraps Dexie storage creation.
- `getAudioStudioRxState()` centralizes RxState creation.
- State paths are already game-scoped with `studio.gamesById.<gameId>.history`.
- `multiInstance: true` is enabled, which supports cross-window state propagation.
- Test reset helpers exist.

Planning implication:

Keep this storage boundary. The roadmap should move sound/project data into smaller persisted shapes over time, but it should not scatter RxDB imports into components.

### UI State Is Already Local Where It Matters

File: `apps/audio-studio/src/App.tsx`

Existing useful behavior:

- `activeMode` is local React state.
- JSON panel open state is local React state.
- Sidebar width is local React state.
- Game theme CSS variables are applied from the selected game's registration.

Planning implication:

This matches the user requirement that multiple windows can show different modes at the same time. Future work should keep selected notes, selected node, scroll, zoom, graph pan, sidebar width, and open menus local to each window.

### Compose Tests Encode The Most Recent UX Contracts

File: `apps/audio-studio/src/App.test.tsx`

Existing tests already protect:

- Four authoring modes render and `activeMode` stays local across reload.
- Compose and Tracker edit the same shared clip data.
- Migrated music cue presets show note data in Compose.
- Clicking an empty piano-roll cell creates and auditions a note.
- Pointer down does not immediately write to persisted patch state; pointer up commits.
- Existing notes audition when clicked.
- Right-click note context menu deletes notes and works with undo.
- Compose playhead appears during playback.
- Instrument controls render waveform graphics and precise controls.
- Audio knob drag changes gain.
- RxDB restores selected game and per-game histories.
- External RxState updates sync into React state without losing undo history.
- Patch graph auto-arrange keeps minimum node gaps.

Planning implication:

Any implementation phase that touches Compose, persistence, preview playback, or patch graph must run `bun nx test audio-studio` before being considered complete. These tests are not incidental; they are the product requirements from recent UI feedback.

### Shared UI Has The Right Primitive Direction

Files:

- `libs/ui/src/components/audio-knob.tsx`
- `libs/ui/src/components/gradient-slider.tsx`
- `libs/ui/src/components/waveform-preview.tsx`
- `libs/ui/src/components/ui/*`

Existing useful behavior:

- `AudioKnob` is already a reusable skeuomorphic audio control.
- `GradientSlider` exists for themed sliders.
- `WaveformPreview` gives waveform selection a visual representation.
- shadcn/Radix primitives exist for buttons, selects, sliders, context menus, tabs, cards, scroll areas, tooltips, and collapsibles.

Planning implication:

Do not build bespoke buttons, menus, or sliders inside Audio Studio. Put reusable audio-specific controls in `libs/ui`, and leave app-specific editor state in `apps/audio-studio`.

## Pressure Points To Reduce

### `AuthoringModes.tsx`

Current role:

- Compose, Tracker, Instrument, note audition, gesture state, note creation, note movement, note resize, deletion, migration helpers, pitch parsing, and instrument defaults.

Risk:

- Every authoring improvement increases the chance of regressions because unrelated modes share one file.

Plan response:

- Phase 2 extracts Compose first because it is the highest-change surface.
- Tracker and Instrument can be split after Compose stabilizes.
- Shared helpers move to `audio-tools` or app-level hooks depending on whether they are domain logic or UI behavior.

### `use-studio-history.ts`

Current role:

- RxDB restore, RxDB subscription, debounced persistence, undo/redo, reset, game switching, patch import, node add/update/delete/connect, graph auto-arrange, preview values, and history normalization.

Risk:

- It mixes persisted sound data with UI-adjacent behavior and graph commands.

Plan response:

- Add `use-studio-persistence.ts`, `use-studio-project.ts`, `use-studio-clip-commands.ts`, and `use-studio-graph-commands.ts`.
- Preserve the public app ergonomics during the split.
- Keep RxDB writes debounced and gesture commits explicit.

### `audio-tools.ts`

Current role:

- Public API, migration, serialization, parsing, pitch conversion, validation, runtime node creation, clip scheduling, LFO connections, envelope scheduling, constraint warnings, and utility clamps.

Risk:

- Pure music logic and Web Audio runtime code are hard to test independently.

Plan response:

- Extract `music/*` first because those helpers are dependency-free.
- Extract runtime, validation, and migration after behavior is covered by tests.
- Keep `audio-tools.ts` as a compatibility barrel until app imports are migrated.

### `styles.css`

Current role:

- Global app layout, sidebars, graph, compose, tracker, instrument, inspector, transport, responsive behavior, and theme variants.

Risk:

- Mode-specific visual changes can affect unrelated surfaces.

Plan response:

- Split `styles/compose.css` and `styles/patch-graph.css` during Phase 2.
- Keep theme variable definitions centralized.
- Keep shadcn/global styles in `@neon-cabinet/ui`.

## Signal-Inspired Patterns That Fit This Codebase

### Best Fit: Pure Commands Before UI

Signal's `TrackCommandService` maps well to `@neon-cabinet/audio-tools` music helpers. The Neon version should be immutable functions instead of class methods, because React/RxDB history already works with immutable patch snapshots.

Use for:

- move notes
- resize notes
- delete notes
- duplicate notes
- transpose notes
- quantize notes
- edit velocity
- paint control events

### Best Fit: Transform Object For Pointer Math

Signal's transform classes map well to a local `createComposeTransform()` helper.

Use for:

- beat to x
- x to beat
- pitch to y
- y to pitch
- note to rect
- visible ruler beats
- marquee selection ranges

### Best Fit: Gesture Modules With Draft State

Signal's gesture hooks map directly to the recent Audio Studio requirement: update draft visuals during drag, commit to RxDB/history only on pointer up.

Use for:

- create note
- move note
- resize note start
- resize note end
- marquee select
- middle-button or empty-space pan
- right-click context menu

### Best Fit: Control Lanes

Signal's velocity and controller lanes are the clearest path to chip-era expressiveness.

Use for:

- velocity
- pitch bend
- duty cycle
- noise period
- arpeggio steps
- filter cutoff
- FM feedback/mod index
- sample or wavetable slot

### Conditional Fit: Canvas/WebGL Rendering

Signal's WebGL renderer is impressive but heavy for our current scope.

Use only after:

- Compose has dense fixtures.
- DOM note rendering shows measurable lag.
- Accessible hit regions remain reliable.

## Implementation Order Rationale

1. **Extract music helpers first**
   The helpers are the cheapest work and unblock every later phase.

2. **Split Compose before adding features**
   This reduces risk before selection, clipboard, quantize, and lanes add more moving parts.

3. **Keep editing workflow ahead of renderer work**
   Users need selection, keyboard, clipboard, quantize, and reliable gestures more than Canvas.

4. **Add scheduler before complex playback views**
   A better playhead and loop UI needs audio-clock truth.

5. **Move graph clip routing after clips are solid**
   Patch Graph should route authored clips after the clip editor has a stable domain model.

6. **Add MIDI/file interop as an adapter**
   MIDI should support import/export workflows but never replace `SoundPatch` as the source of truth.

7. **Upgrade rendering last**
   Rendering architecture should be driven by evidence from dense real clips, not by attraction to Signal's renderer.

## Guardrails For Future Agents

- Do not persist active mode, selected note, graph pan, piano scroll, or open panels in RxDB.
- Do not write to RxDB during pointer movement.
- Do not import MobX, Jotai, Emotion, Firebase, SoundFont, or Signal's WebGL renderer for early phases.
- Do not fork Signal into this workspace.
- Do not treat MIDI as the canonical data model.
- Keep copied code from Signal to a minimum; if substantial implementation is adapted, preserve MIT attribution.
- Keep Battle Tanks, Space Defender, and Mars Lander presets as regression fixtures.
- Use Nx commands for verification: `bun nx test audio-tools`, `bun nx test audio-studio`, `bun nx build audio-tools`, `bun nx build ui`, and `bun nx build audio-studio`.
