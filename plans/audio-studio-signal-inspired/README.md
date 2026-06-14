# Audio Studio Signal-Inspired Composer Workbench Plan

This directory turns the `ryohey/signal` research into an implementation plan for improving Neon Cabinet Audio Studio.

## Recommendation

Do not import or fork Signal wholesale. Signal is a strong MIDI sequencer and composition sketchpad, but its architecture is optimized around MobX, Jotai, Emotion, WebGL canvas rendering, SoundFont playback, MIDI files, Firebase, and Electron. Audio Studio is a game-audio authoring workbench built around RxDB, procedural Web Audio patches, shadcn/Radix UI, per-game registries, and chip-era constraints.

The right move is to build a Signal-inspired custom workbench:

- Borrow Signal's separation of transforms, gesture handlers, command services, rulers, lanes, clipboard payloads, and lookahead scheduling.
- Keep Audio Studio's current React/RxDB/audio-tools architecture.
- Move music-domain behavior into framework-free `@neon-cabinet/audio-tools` helpers.
- Refactor UI code around small focused components instead of growing `AuthoringModes.tsx`.
- Add heavier rendering only after DOM/SVG approaches hit measured limits.

## Documents

- [Research Inventory](./00-research-inventory.md): What Signal contains, what is useful, what is risky, and how each idea maps to Neon Cabinet.
- [Current Codebase Inventory](./02-current-codebase-inventory.md): What the repo already has, where the useful pieces live, and which tests protect the current behavior.
- [Implementation Roadmap](./01-implementation-roadmap.md): Phased work from easiest/highest payoff to most complex/highest ceiling.

## Phase Order

1. **Composer Core Extraction**
   Biggest payoff first: make notes, beats, ticks, transforms, quantize, selection, and command helpers testable outside React.

2. **Compose View Refactor**
   Split the current piano roll into focused components and hooks while keeping the existing DOM rendering.

3. **Composer Editing Workflow**
   Add selection, keyboard commands, clipboard, quantize controls, and better ruler behavior.

4. **Control Lanes And Scheduler**
   Add velocity and chip macro lanes, plus a lookahead playback scheduler for more reliable preview/playhead timing.

5. **Patch Graph Clip Routing**
   Make authored clips first-class source nodes routed through effects with clearer graph behavior.

6. **MIDI And File Interop**
   Add import/export paths where useful, using our own schema as the source of truth.

7. **Canvas Rendering Upgrade**
   Switch Compose rendering to Canvas or WebGL only if dense clips show DOM limits.

## Current Local Context

The current repo already has the right building blocks:

- `@neon-cabinet/audio-tools` has schema v2 clips, instruments, constraint profiles, patch runtime, validation, and migration.
- `apps/audio-studio` has four authoring tabs, RxDB persistence, per-game history, patch graph panning/arrange, and a basic piano roll.
- `@neon-cabinet/ui` has shadcn/Radix controls, `AudioKnob`, `GradientSlider`, and `WaveformPreview`.

The main risks are file size and coupling:

- `apps/audio-studio/src/components/AuthoringModes.tsx` is doing too much.
- `apps/audio-studio/src/hooks/use-studio-history.ts` mixes storage, history, patch commands, game switching, and graph commands.
- `libs/audio-tools/src/lib/audio-tools.ts` mixes validation, migration, music helpers, runtime node creation, and scheduling.
- `apps/audio-studio/src/styles.css` is nearing the point where mode-specific CSS should be split.

The implementation plan addresses those risks before adding advanced features.

## Source Snapshot

Signal was inspected from a shallow clone at `/tmp/ryohey-signal`:

- Repository: `https://github.com/ryohey/signal`
- Commit: `632de9685990c90d0be127994908cc43692ff82a`
- License: MIT

Neon Cabinet local inventory was taken from the current workspace state on this branch. The working tree already contains active Audio Studio changes, so future implementation work should preserve user changes and avoid broad rewrites outside the files named in the roadmap.
