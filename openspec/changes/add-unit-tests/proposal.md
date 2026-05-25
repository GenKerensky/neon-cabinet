## Why

The maze-runner app has significant untested behavior — enemy AI logic, collectible management, A\* pathfinding, and utility functions all lack test coverage. These modules contain game-critical logic that will benefit from unit tests before additional features are added. The existing test infrastructure (vitest, jsdom, Phaser mocks, ASCII grid helpers) already supports testing these areas without requiring extensive new mocking.

## What Changes

- Add test suites for the four enemy AI subclasses (Chaser, Ambusher, Timid, Wanderer)
- Add test suite for the A\* Pathfinder
- Add test suite for CollectibleManager (creation, removal, level completion, bonus items)
- Add test suite for settings and font utilities
- Add test suite for EventBus
- No modifications to existing source code — tests only

## Capabilities

### New Capabilities

- `enemy-ai`: Unit tests for the four Enemy subclass `getTargetPosition` overrides, covering SCATTER, CHASE, FRIGHTENED, and DEAD states for each AI variant
- `pathfinder`: Unit tests for the A\* pathfinding algorithm — path existence, wall avoidance, iteration limits, heuristics, edge cases
- `collectibles`: Unit tests for CollectibleManager — grid-based item placement, removal and counter updates, level completion detection, bonus item spawning logic
- `settings-utils`: Unit tests for settings.ts and font.ts registry accessor functions
- `event-bus`: Unit tests for TypedEventEmitter emit/on/off lifecycle

### Modified Capabilities

- None

## Impact

- 5 new spec files under `openspec/specs/`
- 5 new test files under `apps/maze-runner/tests/` or additions to existing test files
- No changes to production source code
- No new dependencies
