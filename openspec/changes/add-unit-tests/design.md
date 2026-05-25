## Context

The maze-runner app currently has test coverage for Player, Enemy base class, MazeGenerator, and DirectionUtils. Five untested areas remain: enemy AI subclasses, A\* Pathfinder, CollectibleManager, registry utility functions, and EventBus. All these areas can be tested using the existing vitest + jsdom + Phaser mock setup already established in the repository.

## Goals / Non-Goals

**Goals:**

- Full unit test coverage for Enemy AI subclass targeting logic (Chaser, Ambusher, Timid, Wanderer)
- Full unit test coverage for Pathfinder A\* algorithm
- Full unit test coverage for CollectibleManager creation, removal, and lifecycle logic
- Full unit test coverage for settings.ts and font.ts registry accessors
- Full unit test coverage for EventBus event lifecycle
- All tests follow existing patterns: `gridFromPattern`, `createMockScene`, and `TestEnemy` subclasses

**Non-Goals:**

- Integration or E2E tests with real Phaser rendering
- Tests for Phaser Scene classes (Boot, Game, GameOver, Pause, Title) — these require extensive mocking
- Tests for React components (App, PhaserGame, main)
- Modifying any production source code
- Adding new testing dependencies

## Decisions

- **Use existing TestEnemy pattern for AI tests**: Create a `TestEnemy`-style subclass for each AI variant that exposes `getTargetPosition` and state setters publicly. This reuses the established approach from `Enemy.spec.ts` and avoids modifying production classes.
- **Spec files in change directory, not global**: Spec files live under `openspec/changes/add-unit-tests/specs/` rather than `openspec/specs/`. This keeps change-scoped specs together and avoids polluting global specs for a test-only change.
- **No scene integration tests**: Scene classes (Boot, Game, GameOver, etc.) depend heavily on Phaser's internal lifecycle (texture generation, physics, input systems, tweens). Testing them would require deep mocking that provides limited value — these are better covered by manual QA or E2E tests.
- **Prefer fitting into existing test files where logical**: Enemy AI tests belong in `tests/objects/Enemy.spec.ts` since they test subclasses of Enemy. Pathfinder and CollectibleManager get their own files. Settings and font utils can share a file.

## Risks / Trade-offs

- **Test fragility**: Enemy AI tests depend on the internal `_gridX`/`_gridY` naming of Enemy private state. If these change, tests break. Mitigation: use the same `(enemy as any)` access pattern as existing tests.
- **CollectibleManager scene dependency**: CollectibleManager requires a Phaser Scene for sprite creation. The existing `createMockScene` helper provides enough of the API surface. Mitigation: extend the mock scene as needed to support `scene.time.delayedCall` and `scene.add.sprite`.
- **Pathfinder edge cases**: Very large grids could cause performance issues in tests. Mitigation: use small grids (10x10 or smaller) and explicit iteration limits.
