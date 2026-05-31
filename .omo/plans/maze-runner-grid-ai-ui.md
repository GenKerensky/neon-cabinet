# Maze Runner Grid Movement, Pen AI, HUD, and Title Attract Plan

## TL;DR

> **Summary**: Fix Maze Runner movement so player and ghosts stay on grid centerlines, restore respawn scaling, force ghosts to exit the pen before normal AI, enforce one-way pen gate rules, update gameplay HUD layout, and replace the title chase with a bounded visual-only attract loop.
> **Deliverables**:
>
> - Shared grid/pen geometry utility with explicit center tolerance and gate semantics.
> - Player strict centerline movement, delayed visual turning, inward pen blocking, and respawn scale restoration.
> - Enemy centerline preservation, pen-exit priority, outward-only gate behavior, and dead-ghost return/exit cycle.
> - Gameplay HUD with lives icons top-left, score top-center, level top-right, high score bottom-center.
> - Title screen visual-only animated chase bounded by the blue frame with maze blocks behind title text.
> - Updated Vitest coverage plus browser/Cucumber evidence for gameplay HUD and title visuals.
>   **Effort**: Large
>   **Parallel**: YES - 5 waves
>   **Critical Path**: Task 1 → Tasks 2 & 3 → Task 4 → Tasks 5 & 6 → Task 7

## Context

### Original Request

- Fix clipping through walls when turning at corners: movement must stick to grid centerlines, and the player model must not turn visually until the center of the intersection.
- Apply the same centerline movement rule to all characters.
- Fix respawn scaling: after respawn, the player should keep the dynamic `tileSize / 30` scale.
- Ghosts must leave the pen first instead of circling inside toward the player.
- Pen gate must be one-way: ghosts may leave, but player and living enemies may not re-enter; eaten ghosts return through walls, then immediately try to leave again.
- Gameplay HUD: lives as little characters top-left, score top-center, level top-right, high score bottom-middle.
- Title screen: top chase uses animated ghosts chasing player; maze blocks render behind title; chase stays inside blue outline/bounded area; nothing visible outside; chase wraps/re-enters from the opposite side when exiting.

### Interview Summary

- Movement rule: **Strict centerline**. Queued turns do not change velocity or model direction until the exact cell/intersection center, with implementation epsilon for frame-step precision.
- Pen re-entry: **Dead/eaten ghosts return through walls only**. Gate remains outward-only for all normal movement.
- Title animation: **Visual-only loop** using title-local animated visuals; do not instantiate gameplay `Player`/`Enemy` objects or couple to game AI/state.
- HUD layout: confirmed as lives icons top-left, score top-center, level top-right, gameplay high score bottom-center.
- Test workflow: **Tests after**. Implement behavior, then add/update Vitest and browser harness tests.
- High score scope: gameplay HUD only; preserve existing title/game-over high-score behavior.

### Metis Review (gaps addressed)

- Added exact center tolerance default: `Math.max(0.5, tileSize * 0.02)` pixels.
- Defined late queued-turn behavior: if the queued turn is pressed too late and the character passes the valid center, do not snap backward or stop; keep the queued turn for the next valid center/intersection.
- Defined gate semantics by entity/state/direction: player blocked inward; living ghosts blocked inward; dead ghosts ignore walls/gate only while returning; ghosts inside pen exit outward before normal AI.
- Defined dead ghost restoration point: existing dead return target / pen spawn point from `Game.getGhostPenSpawnPosition()`; after reaching it, restore living state and force pen-exit mode.
- Guarded against broad rewrites: no full movement-controller rewrite, no full Pac-Man ghost personality/pathfinding rewrite, no broad maze-generation rewrite.
- Required tests for nearby regression-prone behavior and browser evidence for HUD/title visual changes.

### Working Tree Baseline

- Read-only git status during planning showed a large pre-existing dirty working tree before this plan's implementation begins, including modified target files `apps/maze-runner/src/game/objects/Player.ts`, `Enemy.ts`, `Game.ts`, `Title.ts`, `Collectible.ts`, related specs, package/config files, many deleted `openspec/` files, and many untracked harness/skill/app files.
- Prometheus only created/edited `.omo/plans/maze-runner-grid-ai-ui.md` for this plan. These source/test changes must be treated as pre-existing work and must **not** be reset or isolated by Sisyphus unless the user explicitly instructs it.
- Execution must start by recording `git status --short` to `.omo/evidence/task-7-working-tree-baseline.txt` and must distinguish implementation changes from this pre-existing baseline in final reporting.

## Work Objectives

### Core Objective

Make Maze Runner character movement, ghost pen behavior, gameplay HUD, and title attract presentation match the user’s annotated requirements while preserving current game flow, score/lives/level behavior, title controls, game-over behavior, and dynamic viewport scaling.

### Deliverables

1. `apps/maze-runner/src/game/utils/gridGeometry.ts` shared helper module for centerline math and pen/gate geometry.
2. Player movement changes in `apps/maze-runner/src/game/objects/Player.ts` with updated tests in `tests/objects/Player.spec.ts`.
3. Enemy pen-exit/gate/centerline changes in `apps/maze-runner/src/game/objects/Enemy.ts` with updated tests in `tests/objects/Enemy.spec.ts`.
4. Game scene integration and HUD layout updates in `apps/maze-runner/src/game/scenes/Game.ts` with tests in `tests/scenes/Game.spec.ts`.
5. Title screen bounded visual attract loop in `apps/maze-runner/src/game/scenes/Title.ts` with tests in `tests/scenes/Title.spec.ts`.
6. Harness/browser observability updates in `apps/maze-runner/src/game/utils/harnessSnapshot.ts` and Cucumber features/steps as needed.
7. Validation evidence under `.omo/evidence/` proving tests, build/lint/typecheck, and browser screenshots pass.

### Definition of Done (verifiable conditions with commands)

- `bunx nx typecheck maze-runner` passes.
- `bunx nx test maze-runner` passes, including updated Player/Enemy/Game/Title/harness specs.
- `bunx nx lint maze-runner` passes.
- `bunx nx build maze-runner` passes.
- Browser harness scenarios run against `http://localhost:4200` and produce screenshots/evidence under `.omo/evidence/` for gameplay HUD and title attract loop.
- Snapshot/browser evidence shows:
  - player scale after respawn equals initial `tileSize / 30` scale;
  - player and enemy `x/y` stay on corridor centerlines while moving;
  - queued player turn does not rotate sprite before center;
  - ghosts leave pen before chasing/scattering;
  - living ghosts/player cannot enter pen through the gate;
  - dead ghost returns through walls and then exits;
  - HUD positions match requested layout;
  - title attract loop is bounded by the blue outline and visual-only.

### Must Have

- Shared geometry helpers must be small and pure; avoid global state.
- Movement changes must preserve manual grid collision semantics; do not add Arcade wall collisions.
- Player and enemies must maintain `tileSize / 30` visual scale after constructor, respawn, reset, and recreation paths.
- Existing `?test=1` title auto-start behavior must remain unchanged.
- Existing title and game-over high-score displays must remain unchanged except where tests need mock updates for added gameplay HUD high score.
- Existing dynamic `tileSize` formula in `Game.ts:90-101` must be preserved unless tests prove a direct conflict; no resizing redesign.

### Must NOT Have (guardrails, AI slop patterns, scope boundaries)

- Do not rewrite all movement into a new controller/state machine.
- Do not rewrite maze generation broadly; use current pen geometry from `MazeGenerator.createEnemyEnclosure()`.
- Do not implement full Pac-Man ghost house timing or new ghost personality/pathfinding systems.
- Do not make title attract loop affect gameplay state, score, lives, sounds, scene navigation, or registry.
- Do not persist a new high score from gameplay HUD display alone; high-score persistence must follow existing `highScore.ts`/game-over behavior unless already present.
- Do not require human visual confirmation; all acceptance criteria must be agent-executable.
- Do not commit automatically during implementation tasks.

## Verification Strategy

> ZERO HUMAN INTERVENTION - all verification is agent-executed.

- Test decision: tests-after using existing Vitest specs and Cucumber/Playwright browser harness.
- QA policy: Every task has agent-executed happy-path and failure/edge scenarios.
- Evidence: `.omo/evidence/task-{N}-{slug}.{ext}`.
- Required commands:
  - `bunx nx typecheck maze-runner`
  - `bunx nx test maze-runner`
  - `bunx nx lint maze-runner`
  - `bunx nx build maze-runner`
  - Serve game with `bunx nx serve maze-runner` or equivalent workspace serve target, then run browser harness with `bunx cucumber-js --config apps/maze-runner/cucumber.cjs`.
- Before changing public APIs in `Player`, `Enemy`, `Game`, `MazeGenerator`, or `Title`, executor must run LSP reference checks or equivalent repo search and record affected files in task evidence.

## Execution Strategy

### Parallel Execution Waves

> Target: 5-8 tasks per wave. <3 per wave (except final) = under-splitting.
> Extract shared dependencies as Wave-1 tasks for max parallelism.

Wave 1: Task 1 foundation geometry helpers.
Wave 2: Tasks 2 and 3 in parallel after Task 1; both consume geometry helpers.
Wave 3: Task 4 after Tasks 2 and 3; integrates scene-level HUD/respawn/enemy reset behavior.
Wave 4: Task 5 after Task 1 and Task 6 after Tasks 4 and 5; Task 6 includes title browser evidence and therefore must wait for the title attract implementation.
Wave 5: Task 7 final validation/evidence after Tasks 1-6.

### Dependency Matrix (full, all tasks)

- Task 1: no blockers; blocks Tasks 2 and 3.
- Task 2: blocked by Task 1; blocks Task 4 and Task 7.
- Task 3: blocked by Task 1; blocks Task 4 and Task 7.
- Task 4: blocked by Tasks 2 and 3; blocks Task 6 and Task 7.
- Task 5: blocked by Task 1 only for shared geometry naming consistency if reused; blocks Task 6 and Task 7 because title browser evidence depends on completed title visuals.
- Task 6: blocked by Tasks 4 and 5; blocks Task 7.
- Task 7: blocked by Tasks 1-6.

### Agent Dispatch Summary (wave → task count → categories)

- Wave 1 → 1 task → `quick` with `phaser-unit-test` skill.
- Wave 2 → 2 tasks → `unspecified-high` with `phaser-integration-test` skill for Player/Enemy object behavior.
- Wave 3 → 1 task → `unspecified-high` with `phaser-integration-test` skill for Game scene HUD/integration.
- Wave 4 → 2 sequential tasks → `visual-engineering` for Title, then `unspecified-high` with `phaser-e2e-test` for harness/browser evidence.
- Wave 5 → 1 task → `unspecified-high` with `nx-run-tasks`, `phaser-e2e-test`, and `browser-test-debug` as needed.

## TODOs

> Implementation + Test = ONE task. Never separate.
> EVERY task MUST have: Agent Profile + Parallelization + QA Scenarios.

- [x] 1. Add shared grid and pen geometry helpers

  **What to do**:
  - Create `apps/maze-runner/src/game/utils/gridGeometry.ts` as a pure utility module.
  - Export:
    - `getCellCenter(gridX, gridY, tileSize, offsetX, offsetY): { x: number; y: number }`
    - `worldToGrid(x, y, tileSize, offsetX, offsetY): { gridX: number; gridY: number }`
    - `distanceToCellCenter(x, y, gridX, gridY, tileSize, offsetX, offsetY): { dx: number; dy: number; distance: number }`
    - `getCenterTolerance(tileSize): number` returning `Math.max(0.5, tileSize * 0.02)`.
    - `isAtCellCenter(x, y, gridX, gridY, tileSize, offsetX, offsetY, tolerance = getCenterTolerance(tileSize)): boolean`
    - `snapToCellCenter(gridX, gridY, tileSize, offsetX, offsetY): { x: number; y: number }` as a pure function returning the exact center coordinate; callers are responsible for assigning `target.x`/`target.y`.
    - `hasCrossedCellCenter(previousPosition, nextPosition, centerPosition, axis): boolean` for frame-step crossing detection.
    - `getPenGeometry(width, height)` returning `{ centerX, centerY, interiorCells, gateCell, exitCell, topGateRow, bottomWallRow }` matching `MazeGenerator.createEnemyEnclosure()` geometry.
    - `isPenInteriorCell(gridX, gridY, width, height): boolean` for x `centerX-1..centerX+1`, y `centerY..centerY+1`.
    - `isPenGateCell(gridX, gridY, width, height): boolean` for x `centerX`, y `centerY-1`.
    - `isPenExitCell(gridX, gridY, width, height): boolean` for the outside cell immediately above gate, x `centerX`, y `centerY-2`.
    - `isEnteringPenFromOutside(from, to, width, height): boolean` true only when normal movement crosses from outside/gate-exit side into gate/interior.
  - Add `tests/utils/gridGeometry.spec.ts` or closest existing utils test location.
  - Test odd grid sizes used by Maze Runner and at least one even-size defensive case without changing maze dimensions.
  - Keep all helpers deterministic and independent of Phaser runtime.

  **Must NOT do**:
  - Do not import Phaser in `gridGeometry.ts`.
  - Do not make `snapToCellCenter` mutate Phaser objects or accept a `target` parameter.
  - Do not alter `MazeGenerator.ts` geometry unless a test exposes a direct mismatch; if mismatch exists, fix helper to match current MazeGenerator, not vice versa.
  - Do not create a new movement controller.

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: one new pure utility plus focused unit tests.
  - Skills: [`phaser-unit-test`] - Use Vitest patterns for pure game utilities.
  - Omitted: [`phaser-integration-test`] - No Phaser object dependencies should be introduced.

  **Parallelization**: Can Parallel: NO | Wave 1 | Blocks: Tasks 2, 3 | Blocked By: none

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `apps/maze-runner/src/game/utils/MazeGenerator.ts:34-85` - protected pen cell set math to mirror.
  - Pattern: `apps/maze-runner/src/game/utils/MazeGenerator.ts:578-632` - authoritative pen enclosure geometry: interior, top gate, side walls, bottom wall, surrounding passages.
  - Pattern: `apps/maze-runner/src/game/objects/Player.ts:193-196` - current snap-to-grid math.
  - Pattern: `apps/maze-runner/src/game/objects/Enemy.ts:516-519` - current enemy snap-to-current-cell math.
  - Test: `tests/utils/MazeGenerator.spec.ts` - existing utility test organization and Vitest style.

  **Acceptance Criteria** (agent-executable only):
  - [ ] `bunx nx test maze-runner -- --run tests/utils/gridGeometry.spec.ts` passes, or if Nx/Vitest filtering differs, executor records the exact successful targeted command in `.omo/evidence/task-1-grid-geometry.txt`.
  - [ ] Tests prove `getCenterTolerance(30) === 0.6`, `getCenterTolerance(10) === 0.5`, and tolerance scales for dynamic tile size 58 to `1.16`.
  - [ ] Tests prove pen interior, gate, and exit cells match `MazeGenerator.createEnemyEnclosure()` assumptions for the current maze width/height.
  - [ ] Tests prove `hasCrossedCellCenter` detects crossing a center without requiring exact equality.
  - [ ] Tests prove `snapToCellCenter(3, 4, 58, 10, 20)` returns `{ x: 213, y: 281 }` and does not require a Phaser object.
  - [ ] No source file outside `apps/maze-runner/src/game/utils/gridGeometry.ts` and its test file is modified by this task.

  **QA Scenarios** (MANDATORY - task incomplete without these):

  ```
  Scenario: Center geometry matches existing grid math
    Tool: Bash
    Steps: Run targeted Vitest for gridGeometry; inspect `.omo/evidence/task-1-grid-geometry.txt` for PASS and assertions covering tileSize 30 and 58.
    Expected: Tests pass; helper centers equal `offset + grid * tileSize + tileSize / 2`; tolerance equals `Math.max(0.5, tileSize * 0.02)`.
    Evidence: .omo/evidence/task-1-grid-geometry.txt

  Scenario: Pen geometry blocks only inward gate semantics
    Tool: Bash
    Steps: Run gridGeometry pen tests; include from/to vectors outside→gate, gate→interior, interior→gate, gate→outside.
    Expected: `isEnteringPenFromOutside` is true only for outside/gate-entry movement and false for outward exit movement.
    Evidence: .omo/evidence/task-1-pen-geometry.txt
  ```

  **Commit**: NO | Message: `fix(maze-runner): add grid geometry helpers` | Files: [`apps/maze-runner/src/game/utils/gridGeometry.ts`, `tests/utils/gridGeometry.spec.ts`]

- [x] 2. Enforce strict player centerline movement and respawn scale restoration

  **What to do**:
  - In `apps/maze-runner/src/game/objects/Player.ts`, import and use `gridGeometry.ts` helpers.
  - Remove early visual rotation from `setDirection` for queued turns: the current behavior at `Player.ts:62-95` changes `facingDirection` and calls `updatePuppetDirection()` before turn commit; replace it so queued directions only update `nextDirection`.
  - Direction/facing/puppet visual direction must change simultaneously only when movement direction commits at a valid cell/intersection center.
  - Keep immediate start from `Direction.NONE` only if player is at current cell center within tolerance and `canMove(nextDir)` is true.
  - During horizontal movement, force `y` to the current row center; during vertical movement, force `x` to the current column center.
  - Snap to exact cell center when within tolerance or when current-frame movement crosses the next cell center on the movement axis.
  - If the player queues a valid turn too late and passes the intersection center, do not snap backward, stop, or rotate early; keep the queued turn until the next valid intersection/center.
  - Update `canMove` to block normal player movement into the pen from outside through the gate/interior using `isEnteringPenFromOutside` / pen helpers while preserving ordinary passage checks.
  - Fix respawn scale by restoring `this.setScale(this.tileSize / 30)` in `respawn()` and/or death tween completion after alpha reset. The final post-respawn scale must equal constructor scale after one or repeated deaths.
  - Update `tests/objects/Player.spec.ts`:
    - Change the existing test around lines `357-384` from “rotates immediately toward a queued valid turn” to assert no early rotation.
    - Add tests for commit-at-center, late queued turn wait, centerline x/y enforcement, pen inward blocking, and repeated respawn scale.

  **Must NOT do**:
  - Do not change `VectorPuppet` direction metadata or SVG assets.
  - Do not add Arcade wall colliders.
  - Do not make invalid queued turns clear unexpectedly unless existing tests already require it; preserve current invalid-turn semantics except early rotation.
  - Do not hardcode tile size 30 except for scale ratio `tileSize / 30`.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: object movement behavior has subtle frame-step and regression risk.
  - Skills: [`phaser-integration-test`] - Player depends on Phaser game object behavior and mocks.
  - Omitted: [`phaser-e2e-test`] - Browser proof is handled in Tasks 6-7.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: Task 4, Task 7 | Blocked By: Task 1

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `apps/maze-runner/src/game/objects/Player.ts:29-60` - constructor scale and grid fields.
  - Problem: `apps/maze-runner/src/game/objects/Player.ts:62-95` - early visual rotation currently happens here.
  - Pattern: `apps/maze-runner/src/game/objects/Player.ts:97-106` - puppet direction mapping to preserve.
  - Problem: `apps/maze-runner/src/game/objects/Player.ts:108-126` - death tween currently resets scale to `1`.
  - Pattern: `apps/maze-runner/src/game/objects/Player.ts:128-190` - movement/update loop to minimally adjust.
  - Pattern: `apps/maze-runner/src/game/objects/Player.ts:244-280` - `canMove` and `isAtIntersection` passage checks.
  - Test: `tests/objects/Player.spec.ts:324-430` - direction/queue tests to update.
  - Test: `tests/objects/Player.spec.ts:467-528` - movement and respawn tests to extend.
  - API/Type: `apps/maze-runner/src/game/utils/MazeGenerator.ts:1-4` - `CellType.PASSAGE` contract.

  **Acceptance Criteria** (agent-executable only):
  - [ ] Targeted Player specs pass and include assertions that queued valid turns do not call `VectorPuppet.setDirection` before center commit.
  - [ ] Tests prove visual direction and movement direction change in the same update frame at center commit.
  - [ ] Tests prove player `y` remains row-center during horizontal movement and `x` remains column-center during vertical movement, within `getCenterTolerance(tileSize)`.
  - [ ] Tests prove late queued turn remains queued after passing a center and commits only at the next valid center/intersection.
  - [ ] Tests prove player cannot enter pen through gate/interior from outside.
  - [ ] Tests prove initial scale and scale after two death/respawn cycles are both `tileSize / 30`.

  **QA Scenarios** (MANDATORY - task incomplete without these):

  ```
  Scenario: Queued turn waits for intersection center
    Tool: Bash
    Steps: Run targeted Player spec with a corridor setup; call `setDirection(RIGHT)` before intersection while moving UP; advance updates until before center, then through center.
    Expected: Before center, movement direction and puppet direction remain UP; at center commit, both become RIGHT in the same update.
    Evidence: .omo/evidence/task-2-player-queued-turn.txt

  Scenario: Respawn restores dynamic scale after repeated deaths
    Tool: Bash
    Steps: Run Player respawn spec with `tileSize=58`; trigger death completion/respawn twice.
    Expected: Player scale is exactly or approximately `58 / 30` after each respawn and never remains `1`.
    Evidence: .omo/evidence/task-2-player-respawn-scale.txt
  ```

  **Commit**: NO | Message: `fix(maze-runner): lock player movement to grid centers` | Files: [`apps/maze-runner/src/game/objects/Player.ts`, `tests/objects/Player.spec.ts`]

- [x] 3. Add enemy centerline movement, pen-exit priority, and one-way gate behavior

  **What to do**:
  - In `apps/maze-runner/src/game/objects/Enemy.ts`, import and use `gridGeometry.ts` helpers.
  - Add explicit pen-exit behavior with minimal state surface:
    - Mandatory private field: `private exitingPen = true` initialized in the constructor for every enemy.
    - Mandatory public method: `forcePenExit(): void` that sets `exitingPen = true` and leaves `movementDirection` unchanged unless it is `Direction.NONE`; if direction is `NONE`, the next `update()` must choose a gate/exit direction before normal target AI.
    - Mandatory public getter: `isExitingPen(): boolean` for tests/harness observability.
  - Ghosts inside pen or with `exitingPen=true` must target this exact route before chase/scatter/frightened target logic: current pen interior cell → gate cell `{ x: centerX, y: centerY - 1 }` → exit cell `{ x: centerX, y: centerY - 2 }`.
  - Clear `exitingPen` only after the ghost reaches the exact center of the exit cell `{ x: centerX, y: centerY - 2 }` within `getCenterTolerance(tileSize)` or crosses that center on its movement axis; then resume the current `EnemyState` behavior.
  - DEAD ghosts keep using `moveDeadReturnStep()` to move through walls to `deadReturnTargetX/Y`; after reaching target, always call `setEnemyState(EnemyState.CHASE)` and `forcePenExit()` so the next normal movement exits the pen immediately.
  - Living ghosts outside the pen must not re-enter through the gate; block inward gate/interior moves in `chooseDirection`/movement candidate filtering.
  - Dead ghosts may ignore walls/gate only while `EnemyState.DEAD`; no other state may pass through walls or re-enter pen.
  - Preserve existing ghost personality target methods (`getTargetTile`) and do not introduce full pathfinding. Direction choice can remain Manhattan-distance based, but pen-exit mode must override the target tile while inside/exiting.
  - Preserve existing gate-open timing only where it does not conflict with new requirement. New rule: initial/respawned ghosts should always try to leave; do not keep them circling in the pen because `gateOpenTime` has not elapsed.
  - Keep enemy movement on centerlines using the same tolerance/crossing helpers; never allow drift off the perpendicular centerline.
  - Update `tests/objects/Enemy.spec.ts`:
    - Existing DEAD return test around lines `636-654` currently expects state `CHASE` after target; extend it to also assert pen-exit behavior after restoration.
    - Add tests for initial pen exit, no re-entry through gate for living ghosts, dead return through walls, frightened/dead rule boundaries, and centerline movement.

  **Must NOT do**:
  - Do not create new ghost AI personalities or pathfinding beyond current simple target selection.
  - Do not alter `ghostDefinitions.ts` timing/personality data unless tests prove unavoidable.
  - Do not block dead ghosts from returning through walls.
  - Do not let `FRIGHTENED` override pen-exit for a ghost still inside the pen.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: enemy movement/state behavior is cross-cutting and regression-prone.
  - Skills: [`phaser-integration-test`] - Enemy tests use Phaser-like object mocks and subclass fixtures.
  - Omitted: [`phaser-e2e-test`] - Browser verification is centralized in Tasks 6-7.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: Task 4, Task 7 | Blocked By: Task 1

  **References** (executor has NO interview context - be exhaustive):
  - API/Type: `apps/maze-runner/src/game/objects/Enemy.ts:13-18` - `EnemyState` values to preserve.
  - Pattern: `apps/maze-runner/src/game/objects/Enemy.ts:57-141` - constructor scale, gate fields, dead return target.
  - Pattern: `apps/maze-runner/src/game/objects/Enemy.ts:149-205` - state/speed/visual transitions.
  - Pattern: `apps/maze-runner/src/game/objects/Enemy.ts:207-306` - dead return target and wall-ignoring movement.
  - Pattern: `apps/maze-runner/src/game/objects/Enemy.ts:319-376` - center crossing movement implementation.
  - Problem: `apps/maze-runner/src/game/objects/Enemy.ts:378-454` - `chooseDirection` and gate timing currently allow circling/pressing toward target inside pen.
  - Test: `tests/objects/Enemy.spec.ts:154-242` - `TestEnemy` helpers for exposing protected behavior.
  - Test: `tests/objects/Enemy.spec.ts:409-544` - direction choice tests to extend for gate filtering.
  - Test: `tests/objects/Enemy.spec.ts:612-679` - update/dead-return tests to update.
  - Pattern: `apps/maze-runner/src/game/utils/MazeGenerator.ts:578-632` - pen/gate geometry.

  **Acceptance Criteria** (agent-executable only):
  - [ ] Targeted Enemy specs pass with new tests for pen-exit priority, gate denial, dead return, and centerline preservation.
  - [ ] Tests prove a ghost spawned inside the pen chooses/moves toward the gate/exit before targeting player/scatter/frightened logic.
  - [ ] Tests prove a living ghost outside the pen does not choose an inward gate/interior move even if target is inside/behind the pen.
  - [ ] Tests prove a DEAD ghost moves through walls to its dead return target, restores to `EnemyState.CHASE`, `isExitingPen()` returns true, and then the ghost exits through gate→exit cell.
  - [ ] Tests prove enemy perpendicular coordinate remains at the current corridor centerline during movement within tolerance.
  - [ ] Existing AI subclass tests for Chaser/Ambusher/Wanderer/Timid still pass.

  **QA Scenarios** (MANDATORY - task incomplete without these):

  ```
  Scenario: Ghost exits pen before chasing player
    Tool: Bash
    Steps: Run Enemy spec with ghost at pen interior, player target outside/sideways, `exitingPen=true` or initial spawn state; advance updates.
    Expected: Ghost direction/path heads to gate/exit first; after reaching outside exit cell, `exitingPen` clears and normal target behavior resumes.
    Evidence: .omo/evidence/task-3-enemy-pen-exit.txt

  Scenario: Gate is outward-only except for dead return through walls
    Tool: Bash
    Steps: Run Enemy specs for living outside ghost targeting pen and DEAD ghost returning through wall to spawn.
    Expected: Living ghost cannot enter pen via gate; DEAD ghost ignores walls until target, restores living state, then immediately exits pen.
    Evidence: .omo/evidence/task-3-enemy-gate-dead-return.txt
  ```

  **Commit**: NO | Message: `fix(maze-runner): force ghosts to exit pen before chasing` | Files: [`apps/maze-runner/src/game/objects/Enemy.ts`, `tests/objects/Enemy.spec.ts`]

- [x] 4. Integrate pen-exit resets and gameplay HUD layout in Game scene

  **What to do**:
  - In `apps/maze-runner/src/game/scenes/Game.ts`, integrate Player/Enemy changes with scene reset/rebuild paths.
  - After `rebuildActiveGhosts()` creates each enemy, ensure its dead return target remains set and call `forcePenExit()` so all newly spawned ghosts try to leave first.
  - In `resetPositions()`, after moving enemies to pen spawn and setting `EnemyState.SCATTER`, call `forcePenExit()` so level reset/life reset ghosts leave the pen.
  - In frightened ghost eaten path (`onEnemyHit` lines `387-402`), preserve score behavior and `EnemyState.DEAD`; dead return/exit behavior should be handled by Enemy, but ensure dead return target has been set.
  - Replace numeric `livesText` gameplay HUD with life icons at top-left:
    - Add a `private lifeIcons: Phaser.GameObjects.Graphics[] = []` field or equivalent scene-owned array with this exact semantic name if TypeScript access requires it.
    - Render each life as one `Graphics` object: yellow filled circle radius `8`, black triangular mouth wedge pointing right, no text label.
    - Render exactly `livesValue` icons after each life update, not text `LIVES: n`.
    - Icon centers: x `24 + index * 28`, y `30`; radius `8`; all icons fixed to scroll factor 0 if HUD text uses scroll factor.
  - Move score text to top-center: x `width / 2`, y `20`, origin `(0.5, 0)`.
  - Keep/move level text top-right: x `width - 20`, y `20`, origin `(1, 0)`.
  - Add gameplay-only high score text bottom-center: x `width / 2`, y `height - 24`, origin `(0.5, 1)`, scroll factor 0 if other HUD elements use scroll factor.
  - Format gameplay high score with existing `formatScore(readHighScore(this.registry))` from `apps/maze-runner/src/game/utils/highScore.ts`.
  - Display-only high score update rule: show `Math.max(readHighScore(this.registry), scoreValue)` during gameplay so current run visibly overtakes old high score without writing persistence here. Persistence remains existing behavior; do not call `writeHighScore` from HUD-only update unless existing GameOver flow already does.
  - Update `showFloatingScore`/score update call sites to refresh score text and high-score display when score changes.
  - Update `tests/scenes/Game.spec.ts` mocks to support any new icon graphics/sprite calls and `setScale` on Player mock if needed.
  - Add scene tests for HUD positions, no numeric lives text, life icon count after lose life, high score bottom-center, and enemy `forcePenExit()` calls in rebuild/reset.

  **Must NOT do**:
  - Do not change gameplay score/lives/level rules.
  - Do not alter Title or GameOver high-score displays in this task.
  - Do not write high score persistence from HUD display updates.
  - Do not remove countdown, pause, invulnerability, or transition behavior.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: Game scene integration touches HUD, reset paths, and enemy lifecycle.
  - Skills: [`phaser-integration-test`] - Scene specs and Phaser mocks are required.
  - Omitted: [`phaser-e2e-test`] - Browser screenshots are handled in Tasks 6-7.

  **Parallelization**: Can Parallel: NO | Wave 3 | Blocks: Tasks 6, 7 | Blocked By: Tasks 2, 3

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `apps/maze-runner/src/game/scenes/Game.ts:79-214` - scene create setup, dynamic tile size, player/enemy/HUD creation.
  - Problem: `apps/maze-runner/src/game/scenes/Game.ts:192-210` - current hardcoded score/lives/level text.
  - Pattern: `apps/maze-runner/src/game/scenes/Game.ts:366-385` - score update on collectible hit.
  - Pattern: `apps/maze-runner/src/game/scenes/Game.ts:387-402` - ghost eaten/death collision path.
  - Pattern: `apps/maze-runner/src/game/scenes/Game.ts:590-625` - lose life and respawn path.
  - Pattern: `apps/maze-runner/src/game/scenes/Game.ts:627-658` - ghost pen spawn/reset logic.
  - Pattern: `apps/maze-runner/src/game/scenes/Game.ts:706-856` - enemy rebuild/creation path.
  - API/Type: `apps/maze-runner/src/game/utils/highScore.ts:3-11` - `formatScore` contract.
  - API/Type: `apps/maze-runner/src/game/utils/highScore.ts:44-86` - read/write high score behavior to preserve.
  - Test: `tests/scenes/Game.spec.ts:154-197` - Game scene test harness/mocks.
  - Test: `tests/scenes/Game.spec.ts:199-283` - existing create/game-over tests to keep passing.

  **Acceptance Criteria** (agent-executable only):
  - [ ] Game scene specs pass with assertions for score top-center, level top-right, high score bottom-center, and lives rendered as icons top-left.
  - [ ] Tests prove no `LIVES: n` text object is created or updated for gameplay HUD.
  - [ ] Tests prove life icon count changes from 3 to 2 after `loseLife()` and positions remain top-left.
  - [ ] Tests prove `forcePenExit()` is called for every enemy created by `rebuildActiveGhosts()` and every enemy reset by `resetPositions()`.
  - [ ] Tests prove gameplay high score display uses `Math.max(readHighScore, scoreValue)` but does not call `writeHighScore` from HUD update.
  - [ ] Existing countdown, scoring, game-over, and transition specs still pass.

  **QA Scenarios** (MANDATORY - task incomplete without these):

  ```
  Scenario: Gameplay HUD matches requested layout
    Tool: Bash
    Steps: Run Game scene specs that create the scene at 1024x768; inspect mocked text/icon calls.
    Expected: Score text at x=512/y=20/origin 0.5,0; level at x=1004/y=20/origin 1,0; high score at x=512/y=744/origin 0.5,1; lives icons are yellow graphics centered at (24,30), (52,30), (80,30); no `LIVES:` text.
    Evidence: .omo/evidence/task-4-game-hud-layout.txt

  Scenario: Reset ghosts immediately exit pen
    Tool: Bash
    Steps: Run Game scene spec for `rebuildActiveGhosts()` and `resetPositions()` with Enemy mock exposing `forcePenExit` spy.
    Expected: Every active enemy receives dead return target and pen-exit instruction after creation/reset.
    Evidence: .omo/evidence/task-4-game-pen-exit-integration.txt
  ```

  **Commit**: NO | Message: `feat(maze-runner): update gameplay hud and ghost reset flow` | Files: [`apps/maze-runner/src/game/scenes/Game.ts`, `tests/scenes/Game.spec.ts`]

- [x] 5. Replace title circles with bounded visual-only animated attract loop

  **What to do**:
  - In `apps/maze-runner/src/game/scenes/Title.ts`, replace current circle-only attract loop around lines `49-63`.
  - Keep the scene visual-only: no `Player`, `Enemy`, `Game`, score, lives, collision, input, or AI state objects. Using `VectorPuppet` or existing loaded sprite/vector assets for visual animation is allowed only if it does not pull in gameplay behavior.
  - Draw decorative maze block geometry behind the title text and within the blue frame:
    - It must render at a lower depth than title text/glow.
    - It must not obscure start prompt or controls.
    - It should visually read as blue maze blocks, matching gameplay wall style enough for continuity.
  - Implement the bounded chase area with exact constants: `const attractBounds = { x: 80, y: 40, width: 864, height: 120 }`.
  - Create a container named/assigned as the attract group and apply a Phaser geometry mask made from a filled rectangle exactly matching `attractBounds`; no spawn/despawn-only alternative.
  - Visual entity count and sizes are exact: one yellow player visual with radius/size `14`; three ghost visuals with radius/body size `14`, colors red, pink, cyan; ghosts trail the player by 34px increments on the movement axis.
  - Use title-local graphics/container visuals only. Animate the player mouth by tweening a small black wedge or equivalent graphics property; animate ghosts with bobbing/tweened y offset. Do not import/instantiate gameplay classes.
  - Chase behavior:
    - Deterministic Phaser timeline/tween sequence; no random positions.
    - Segment A: group starts at x `attractBounds.x - 90`, y `attractBounds.y + 35`, facing right; tween to x `attractBounds.x + attractBounds.width + 90`, same y, duration `6000ms`.
    - Segment B: immediately jump to x `attractBounds.x + attractBounds.width + 90`, y `attractBounds.y + 85`, face left; tween to x `attractBounds.x - 90`, same y, duration `6000ms`.
    - Repeat segments A/B forever. This creates top-row rightward chase, bottom-row leftward chase, and opposite-side re-entry.
    - Ghosts visibly trail/chase behind player within the bounded frame.
  - Preserve title text/glow/subtitle/high-score/start prompt/controls and start handlers at `Title.ts:65-177`, including `?test=1` auto-start.
  - Update `tests/scenes/Title.spec.ts` mocks to support new graphics/container/mask/sprite/tween usage.
  - Add tests proving visual-only loop, mask/bounds usage, maze blocks behind title, existing controls unchanged, and no gameplay scene state starts except existing start input/auto-start behavior.

  **Must NOT do**:
  - Do not instantiate gameplay `Player` or `Enemy` classes in Title.
  - Do not start `Game` scene except existing SPACE/ENTER/click/`?test=1` behavior.
  - Do not add title gameplay collisions, scoring, lives, sounds, or registry mutations.
  - Do not remove title high score or controls text.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: requires UI/animation design and Phaser scene mocks.
  - Skills: [`phaser-integration-test`] - Title scene tests use Phaser mocks.
  - Omitted: [`phaser-e2e-test`] - Browser screenshot evidence is captured in Tasks 6-7.

  **Parallelization**: Can Parallel: NO | Wave 4 | Blocks: Tasks 6, 7 | Blocked By: Task 1

  **References** (executor has NO interview context - be exhaustive):
  - Problem: `apps/maze-runner/src/game/scenes/Title.ts:20-63` - existing blue frame, pellet trail, circle chase loop.
  - Pattern: `apps/maze-runner/src/game/scenes/Title.ts:65-117` - title/glow/subtitle/high-score text to preserve and layer above maze blocks.
  - Pattern: `apps/maze-runner/src/game/scenes/Title.ts:119-177` - start prompt, controls, input handlers, and auto-start to preserve.
  - Pattern: `apps/maze-runner/src/game/scenes/Game.ts:443-588` - gameplay maze wall rendering style if helper logic is copied locally/minimally.
  - Test: `tests/scenes/Title.spec.ts:1-64` - existing mocks to extend.
  - Test: `tests/scenes/Title.spec.ts:66-142` - `createScene` helper.
  - Test: `tests/scenes/Title.spec.ts:144-239` - title text, high-score, start behavior tests that must remain passing.

  **Acceptance Criteria** (agent-executable only):
  - [ ] Title specs pass with tests proving no gameplay `Player`/`Enemy` classes are constructed/imported for the attract loop.
  - [ ] Tests prove a Phaser geometry mask with rectangle x=80, y=40, width=864, height=120 is applied to the chase container.
  - [ ] Tests prove maze block graphics are created behind title text depth/order.
  - [ ] Tests prove chase visuals include exactly one player visual and exactly three ghost visuals, with the A/B 6000ms segment loop and opposite-side re-entry coordinates.
  - [ ] Tests prove SPACE, ENTER, click, and `?test=1` auto-start behavior remains unchanged.
  - [ ] Tests prove title high-score text remains present and unchanged in content format.

  **QA Scenarios** (MANDATORY - task incomplete without these):

  ```
  Scenario: Title attract loop is bounded and visual-only
    Tool: Bash
    Steps: Run Title scene specs with mocked add/tweens/masks; inspect assertions for mask bounds and absence of gameplay object construction.
    Expected: Chase visuals are clipped by geometry mask `{x:80,y:40,width:864,height:120}`, deterministic 6000ms rightward and 6000ms leftward loop exists, and no gameplay state starts without input/auto-start.
    Evidence: .omo/evidence/task-5-title-attract-loop.txt

  Scenario: Title controls and high score remain unchanged
    Tool: Bash
    Steps: Run existing Title tests for high score, SPACE, ENTER, click, and `?test=1` after attract-loop changes.
    Expected: All prior title behavior passes with unchanged high-score formatting and scene start triggers.
    Evidence: .omo/evidence/task-5-title-regression.txt
  ```

  **Commit**: NO | Message: `feat(maze-runner): add bounded title attract chase` | Files: [`apps/maze-runner/src/game/scenes/Title.ts`, `tests/scenes/Title.spec.ts`]

- [x] 6. Expose observability and browser scenarios for movement, HUD, pen, and title evidence

  **What to do**:
  - Update `apps/maze-runner/src/game/utils/harnessSnapshot.ts` only as needed for browser/Cucumber assertions.
  - Extend snapshot with these exact stable, test-only fields under existing `window.__PHASER_BRIDGE__` flow:
    - `tileSize: number` and `expectedScale: number` where `expectedScale = tileSize / 30`.
    - `player.scale: { x: number; y: number; matchesExpected: boolean }`.
    - `player.centerline: { isCentered: boolean; deltaX: number; deltaY: number; tolerance: number }` using `gridGeometry` helpers.
    - `enemies[].scale: { x: number; y: number; matchesExpected: boolean }`.
    - `enemies[].pen: { inPen: boolean; exitingPen: boolean; atGate: boolean; atExit: boolean }` using `enemy.isExitingPen()` and `gridGeometry` helpers.
    - `enemies[].centerline: { isCentered: boolean; deltaX: number; deltaY: number; tolerance: number }`.
    - `hud: { score: { text: string; x: number; y: number; originX: number; originY: number }, level: same shape, highScore: same shape, livesIcons: { count: number; centers: Array<{ x: number; y: number }> } }`.
    - `pen: ReturnType<typeof getPenGeometry>` from `gridGeometry.getPenGeometry` rather than hardcoded stale coordinates.
    - When Title is active, `titleAttract: { bounds: { x: 80; y: 40; width: 864; height: 120 }; maskApplied: boolean; playerCount: 1; ghostCount: 3 }` or equivalent literal values if TypeScript requires widened `number` types.
  - Keep snapshot defensive: current try-catch fallback must remain so snapshot failures do not break game load.
  - Add/update tests in `tests/utils/harnessSnapshot.spec.ts` for new fields and fallback behavior.
  - Add or extend Cucumber feature(s) under `apps/maze-runner/features/` using existing patterns:
    - HUD layout screenshot/evaluation scenario after starting game.
    - Title attract screenshot/evaluation scenario before starting game.
    - Mandatory movement/pen snapshot scenario using bridge/direct scene control; do not use synthetic keyboard events.
  - Add/update step definitions under `apps/maze-runner/step-definitions/` only if existing steps cannot assert snapshot fields/screenshots.
  - Browser scenario evidence must save exactly:
    - `.omo/evidence/task-6-title-attract.png`
    - `.omo/evidence/task-6-game-hud.png`
    - `.omo/evidence/task-6-movement-pen.json`
    - `.omo/evidence/task-6-browser-scenarios.txt`
  - Use existing project URL `http://localhost:4200` and Cucumber config `apps/maze-runner/cucumber.cjs`.

  **Must NOT do**:
  - Do not reintroduce `window.__TEST__`; keep using `window.__PHASER_BRIDGE__`.
  - Do not make snapshot exceptions fail game load.
  - Do not depend on programmatic KeyboardEvents for Phaser keyboard movement in headless Chrome; use bridge/direct scene controls or visual/snapshot assertions.
  - Do not add a new Nx e2e target unless necessary; use existing Cucumber config.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: browser harness and snapshot changes cross test/runtime boundaries.
  - Skills: [`phaser-e2e-test`, `browser-test-debug`] - Cucumber/Playwright harness and screenshots are required.
  - Omitted: [`phaser-unit-test`] - Unit tests are secondary to browser observability here.

  **Parallelization**: Can Parallel: NO | Wave 4 | Blocks: Task 7 | Blocked By: Tasks 4, 5

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `apps/maze-runner/src/game/utils/harnessSnapshot.ts:40-64` - defensive scene/registry helper style.
  - Pattern: `apps/maze-runner/src/game/utils/harnessSnapshot.ts:66-123` - current snapshot shape and try-catch fallback.
  - Test: `tests/utils/harnessSnapshot.spec.ts` - snapshot unit tests to extend.
  - Browser feature: `apps/maze-runner/features/smoke/01-game-loads.feature` - title/game-start screenshot patterns.
  - Browser feature: `apps/maze-runner/features/debug/frame-inspection.feature` - frame inspection/screenshot patterns.
  - Step definitions: `apps/maze-runner/step-definitions/game.steps.ts` - existing game control/snapshot steps.
  - Step definitions: `apps/maze-runner/step-definitions/screenshot.steps.ts` - screenshot evidence patterns.
  - Config: `apps/maze-runner/cucumber.cjs` - browser harness config.
  - Memory decision: use `window.__PHASER_BRIDGE__` as stable browser-accessible global for game state/control in dev/test mode.
  - Memory warning: Phaser keyboard event system does not receive programmatically dispatched KeyboardEvents in headless Chrome; avoid keyboard-event-dependent movement assertions.

  **Acceptance Criteria** (agent-executable only):
  - [ ] Harness snapshot specs pass and assert new player/enemy scale, centerline, HUD, and pen geometry fields.
  - [ ] Snapshot fallback still returns a safe object if active Game scene access throws.
  - [ ] Cucumber scenario captures title screenshot with bounded attract loop into exactly `.omo/evidence/task-6-title-attract.png`.
  - [ ] Cucumber scenario captures gameplay HUD screenshot into exactly `.omo/evidence/task-6-game-hud.png`.
  - [ ] Cucumber/bridge scenario writes movement/pen snapshot assertions into exactly `.omo/evidence/task-6-movement-pen.json`.
  - [ ] Browser assertions use `window.__PHASER_BRIDGE__`/snapshot, not synthetic keyboard events.
  - [ ] Existing smoke feature still passes.

  **QA Scenarios** (MANDATORY - task incomplete without these):

  ```
  Scenario: Snapshot exposes stable gameplay evidence fields
    Tool: Bash
    Steps: Run harnessSnapshot specs after creating mocked Game scene with player, enemies, HUD, and pen geometry.
    Expected: Snapshot includes exact `tileSize`, `expectedScale`, `player.scale`, `player.centerline`, `enemies[].scale`, `enemies[].pen`, `enemies[].centerline`, `hud`, `pen`, and `titleAttract` fields and preserves try-catch fallback behavior.
    Evidence: .omo/evidence/task-6-harness-snapshot.txt

  Scenario: Browser captures title and HUD evidence
    Tool: Playwright / Cucumber via Bash
    Steps: Serve maze-runner, run Cucumber feature(s) for title and gameplay HUD screenshots.
    Expected: Screenshots exist exactly at `.omo/evidence/task-6-title-attract.png` and `.omo/evidence/task-6-game-hud.png`; movement/pen JSON exists at `.omo/evidence/task-6-movement-pen.json`; scenarios pass without keyboard-event movement dependency.
    Evidence: .omo/evidence/task-6-browser-scenarios.txt
  ```

  **Commit**: NO | Message: `test(maze-runner): add browser evidence for hud and title` | Files: [`apps/maze-runner/src/game/utils/harnessSnapshot.ts`, `tests/utils/harnessSnapshot.spec.ts`, `apps/maze-runner/features/**`, `apps/maze-runner/step-definitions/**`]

- [x] 7. Run full validation and capture final evidence

  **What to do**:
  - Run final static/test/build commands through Nx/package-manager conventions:
    - `bunx nx typecheck maze-runner`
    - `bunx nx test maze-runner`
    - `bunx nx lint maze-runner`
    - `bunx nx build maze-runner`
  - Start the app with `bunx nx serve maze-runner` or the project’s resolved serve target. If port differs from 4200, record the actual URL and configure Cucumber accordingly without editing source code.
  - Run browser harness with `bunx cucumber-js --config apps/maze-runner/cucumber.cjs`.
  - First record the pre-existing dirty working tree baseline with `GIT_MASTER=1 git status --short > .omo/evidence/task-7-working-tree-baseline.txt` or an equivalent command that preserves the same content.
  - Capture final screenshots/evidence:
    - `.omo/evidence/task-7-title-attract-final.png`
    - `.omo/evidence/task-7-game-hud-final.png`
    - `.omo/evidence/task-7-snapshot-final.json`
    - `.omo/evidence/task-7-validation.log`
    - `.omo/evidence/task-7-working-tree-baseline.txt`
  - Verify through snapshot/evaluation:
    - player initial scale equals respawn scale equals `tileSize / 30`;
    - movement centerline fields are true/within tolerance;
    - ghost in pen is in pen-exit behavior before normal chase;
    - high-score HUD exists bottom-center during gameplay;
    - title attract entities are bounded/clipped.
  - If any command fails, fix the underlying implementation/test issue and rerun the failed command plus any impacted downstream command. Record final passing command outputs only, plus brief notes about fixed failures.

  **Must NOT do**:
  - Do not skip lint/typecheck/build because tests pass.
  - Do not mark final verification complete with failing/flaky browser scenarios.
  - Do not require the user to manually inspect screenshots.
  - Do not commit changes.
  - Do not reset or discard pre-existing working-tree changes unless the user explicitly asks.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: full validation, failure triage, browser evidence, and integration confidence.
  - Skills: [`nx-run-tasks`, `phaser-e2e-test`, `browser-test-debug`] - Nx validation plus browser harness debugging.
  - Omitted: [`phaser-unit-test`] - Unit tests are included through Nx test command; no separate pure utility work remains.

  **Parallelization**: Can Parallel: NO | Wave 5 | Blocks: final verification | Blocked By: Tasks 1, 2, 3, 4, 5, 6

  **References** (executor has NO interview context - be exhaustive):
  - Nx target research: project `maze-runner` has `build`, `test`, `lint`, `typecheck`, `dev`, `serve`, `preview`, `serve-static`, `build-deps`, `watch-deps`; no dedicated Nx e2e target.
  - Config: `apps/maze-runner/cucumber.cjs` - browser harness entry.
  - Config: `apps/maze-runner/playwright.config.ts` - Playwright configuration.
  - Browser support: `apps/maze-runner/support/world.ts`, `apps/maze-runner/support/hooks.ts` - localhost and hooks.
  - Shared browser runner: `libs/browser-test-runner/src/config/playwright.ts`, `libs/browser-test-runner/src/core/world.ts`, `libs/browser-test-runner/src/core/hooks.ts`, `libs/browser-test-runner/src/core/screenshot.ts`.

  **Acceptance Criteria** (agent-executable only):
  - [ ] `bunx nx typecheck maze-runner` passes and output is saved.
  - [ ] `bunx nx test maze-runner` passes and output is saved.
  - [ ] `bunx nx lint maze-runner` passes and output is saved.
  - [ ] `bunx nx build maze-runner` passes and output is saved.
  - [ ] Cucumber browser harness passes and produces final title/HUD screenshots.
  - [ ] Final snapshot JSON proves scale, centerline, pen, and HUD fields satisfy this plan’s Definition of Done.
  - [ ] Working tree baseline evidence exists and documents pre-existing dirty files before implementation validation.
  - [ ] All `.omo/evidence/task-7-*` files exist and contain final passing evidence.

  **QA Scenarios** (MANDATORY - task incomplete without these):

  ```
  Scenario: Full Nx validation passes
    Tool: Bash
    Steps: Run typecheck, test, lint, and build commands in order; save combined output.
    Expected: All commands exit 0; no TypeScript, lint, test, or build errors remain.
    Evidence: .omo/evidence/task-7-validation.log

  Scenario: Final browser evidence proves requested visuals and behavior
    Tool: Playwright / Cucumber via Bash
    Steps: Serve app; run Cucumber scenarios; capture final title/HUD screenshots and snapshot JSON.
    Expected: Title chase is bounded; HUD layout matches request; snapshot proves scale/centerline/pen semantics.
    Evidence: .omo/evidence/task-7-title-attract-final.png, .omo/evidence/task-7-game-hud-final.png, .omo/evidence/task-7-snapshot-final.json
  ```

  **Commit**: NO | Message: `test(maze-runner): validate grid movement and ui updates` | Files: [`.omo/evidence/**`]

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.
> **Do NOT auto-proceed after verification. Wait for user's explicit approval before marking work complete.**
> **Never mark F1-F4 as checked before getting user's okay.** Rejection or user feedback -> fix -> re-run -> present again -> wait for okay.

- [x] F1. Plan Compliance Audit — oracle
  - Verify every user-requested behavior is implemented and covered by tests/evidence.
  - Verify no scope creep: no full movement rewrite, no full ghost AI rewrite, no title gameplay coupling.
- [x] F2. Code Quality Review — unspecified-high
  - Review implementation for minimal diffs, type safety, readable helper boundaries, no AI slop, and no duplicated geometry constants where helper should be used.
- [x] F3. Real Manual QA — unspecified-high (+ playwright if UI)
  - Run app in browser, exercise start/gameplay/respawn/title paths, inspect screenshots/snapshots, and verify no console errors.
- [x] F4. Scope Fidelity Check — deep
  - Compare final behavior and evidence against original request and annotated screenshot requirements; flag any mismatch before user approval.

## Commit Strategy

- Implementation tasks specify commit messages for future executor reference, but **do not commit automatically**.
- Recommended final commit after user approval: `fix(maze-runner): lock movement to grid and update maze ui`.
- Stage only intended source, test, feature, and evidence files.
- Before any commit, inspect `git status`, `git diff`, and recent log per git-master discipline.

## Success Criteria

- Characters cannot visually or physically cut corners: player and enemies remain on open-grid centerlines, and turns/rotations occur only at cell/intersection centers.
- Player respawn preserves dynamic scale (`tileSize / 30`) across repeated deaths.
- Ghosts always try to leave the pen before normal AI and do not press against pen walls toward the player.
- Pen gate is outward-only for player/living enemies, while dead ghosts return through walls then immediately exit again.
- Gameplay HUD matches requested layout: life icons top-left, score top-center, level top-right, high score bottom-center.
- Title screen shows a bounded visual-only animated chase with maze blocks behind title text and unchanged start controls.
- All relevant unit/integration/browser tests pass with saved evidence and no human inspection required.
