# Fix Maze-Runner Movement (Snap/Crossing Logic)

## TL;DR

> **Quick Summary**: Update crossing/snap logic in Player.update and gridGeometry so normal per-frame deltas move the player instead of snapping back to the current cell center. Both keyboard and harness `commands.move` will now visibly update grid/world position.
>
> **Deliverables**:
>
> - Updated `hasCrossedCellCenter` / new `hasLeftCurrentCenter` helper
> - Fixed Player.update snap condition
> - Enhanced harness QA scenarios (small-delta, large-delta, spawn, rapid turns, wall approach)
> - All existing smoke tests pass unchanged
>
> **Estimated Effort**: Medium
> **Parallel Execution**: YES - 4 waves
> **Critical Path**: Task 1 → Task 2 → Task 3 → Tasks 4,5,6 → Tasks 7,8 → F1-F4 → user okay

---

## Context

### Original Request

"create a plan to fix this" (referring to validated maze-runner movement bug where setDirection/canMove succeed but normal frame movement does not change position due to aggressive snap on leaving current cell center).

### Interview Summary

**Key Discussions**:

- Harness probes (browser eval, stepSync, real-time) confirmed movementDirection updates and canMove=true but position/grid stays fixed after normal deltas.
- Large manual delta moves correctly → math is sound.
- Background agents + direct reads mapped full call chain (harness → PhaserGame.tsx:31 → Player.setDirection:72 → Player.update:156 → gridGeometry).
- Countdown was a red herring in clean probe.
- No string/numeric mismatch; existing smoke feature already exercises the path.

**Research Findings**:

- Root cause at Player.ts:253 (snap condition using hasCrossedCellCenter) and gridGeometry.ts:93.
- hasCrossedCellCenter treats first small movement from exact center as crossing → snap back to same cell.
- Harness registration, Game.update guard, and stepSync all work when snap logic is fixed.
- Metis review added concrete guardrails on tolerance, parity, clamping, and no-touch zones.

### Metis Review

**Identified Gaps** (addressed):

- Center/tolerance behavior, keyboard/harness parity, wall/pen clamping, timing tweaks — all resolved with explicit decisions recorded in draft (immediate accept at center, eventual consistency after 30-60ms, preserve existing clamp, purely logical fix).
- Countdown interaction locked down (do not modify Game.ts; ensure sufficient wait after start).
- Assumption that crossing change won't break clamping validated by manual probe.
- Missing acceptance criteria and edge cases incorporated into QA scenarios (happy + failure for spawn, rapid turns, boundary cells, small vs large deltas).
- Guardrails applied: minimal change only, preserve smoke tests exactly, no new abstractions beyond tiny helper, no enemy/collectible/scoring changes.

---

## Work Objectives

### Core Objective

Make legal directional input (keyboard and harness) visibly advance the player's grid and world position on every frame by correcting the crossing/snap logic that currently pulls the sprite back to the current cell center on small deltas.

### Concrete Deliverables

- gridGeometry.ts: new `hasLeftCurrentCenter` helper + updated `hasCrossedCellCenter`
- Player.ts: updated snap condition in update() that uses the new helper
- Enhanced QA scenarios in plan that run via existing harness (before/after state assertions, screenshots)
- All existing `02-player-moves.feature` scenarios pass unchanged

### Definition of Done

- All smoke tests pass (`bun nx run maze-runner:test` and Cucumber smoke: `bunx cucumber-js --tags @smoke apps/maze-runner/features/smoke/02-player-moves.feature`)
- Harness `move(4)` + `stepSync(60)` changes gridX by +1 and world x by ~speed\*delta
- Keyboard arrow keys produce identical visible movement
- No regression in wall clamping or pen entry (verified by QA scenarios)

### Must Have

- Player visibly moves on legal directions for both keyboard and harness (per interview probes and smoke feature)
- Harness timing after start works reliably using existing test.time.resume() (per Metis Q2 and draft technical decision)
- Existing smoke feature passes byte-for-byte (02-player-moves.feature:10-30)
- QA scenarios are 100% agent-executable with concrete data and evidence paths (per Metis QA directives and verification strategy)
- Fix is minimal (only crossing/snap logic in Player.ts:156-316 + tiny helper in gridGeometry.ts:93 + small edit to start helper, per draft guardrails)

### Must NOT Have (Guardrails)

- Changes to Direction enum (DirectionUtils.ts:4-10), Enemy, Collectible, scoring, shaders, or visual effects (per Metis review)
- New classes, major abstractions, or performance optimizations (per draft: "no new abstractions")
- Modification of Game.ts countdown logic or runCountdown (per draft technical decision and Metis guardrail)
- Any change that breaks existing wall clamp (Player.ts:192-213) or pen entry behavior (isEnteringPenFromOutside in gridGeometry.ts:154)
- New unit tests or changes to test framework (per scope OUT and Metis)
- AI slop (excessive comments, over-abstraction, generic names) (per Metis review)
- Changes outside Player.ts update method (156-316), gridGeometry.ts (93), start helper, and step-definitions/player.steps.ts for QA scenario updates only (per minimal fix guardrail)

### Spec Framework Integration

None detected in target repository.

---

## Verification Strategy (MANDATORY)

> **ZERO HUMAN INTERVENTION** - ALL verification is agent-executed. No exceptions.

### Test Decision

- **Infrastructure exists**: YES (Cucumber + Playwright + phaser-test-harness)
- **Automated tests**: YES (tests-after)
- **Framework**: Cucumber + Playwright + existing harness (stepSync, commands.move, state snapshot)
- **Agent-Executed QA**: ALWAYS — every task includes ultra-specific Playwright + harness scenarios with exact steps, selectors, assertions, and evidence paths

### QA Policy

Every task includes 1 happy-path + 1 failure/edge scenario executed by agent (Playwright for browser, interactive_bash for tmux if needed). Evidence saved to `.omo/evidence/task-N-*.png` or `.json`.

- **UI/Game**: Playwright opens http://localhost:4200/?test=1&seed=42, waits for ready, runs commands, asserts state.player.gridX/y and visible sprite position via harness snapshot, takes screenshot.
- Evidence path format: `.omo/evidence/task-{N}-{scenario-slug}.{ext}`

---

## Execution Strategy

### Parallel Execution Waves

> Maximize throughput by grouping independent tasks into parallel waves.
> Each wave completes before the next begins.
> Target: 3 tasks per wave where possible. Wave 1 is sequential within the wave; Waves 2-3 are parallel.

```
Wave 1 (Start Immediately - foundation, sequential):
├── 1. Add hasLeftCurrentCenter helper to gridGeometry.ts [quick]
├── 2. Update hasCrossedCellCenter to use new helper [quick]
└── 3. Update Player.update snap condition to use new helper [deep]

Wave 2 (After Wave 1 - core movement & harness timing, parallel):
├── 4. Ensure commands.start() + move works reliably after countdown [deep]
├── 5. Handle spawn-center edge case in Player.update (Game.ts:134) [deep]
└── 6. Add rapid direction change handling at intersections (Player.ts:419) [deep]

Wave 3 (After Wave 2 - QA & verification, parallel):
├── 7. Enhance smoke test QA scenarios (small-delta, large-delta, boundary, spawn) [writing]
└── 8. Add harness parity test between keyboard and commands.move [visual-engineering]
```

### Dependency Matrix (full for all tasks)

- **1**: - - 2,3,5,6,7,8
- **2**: 1 - 3,5,6,7,8
- **3**: 1,2 - 5,6,7,8
- **4**: 1-3 - 7,8
- **5**: 1-3 - 7,8
- **6**: 1-3,5 - 8
- **7**: 1-6 - F1-F4
- **8**: 4-6 - F1-F4
- **F1-F4**: 1-8 - (user okay)

### Agent Dispatch Summary

- **Wave 1**: 3 tasks (2 quick, 1 deep) — sequential within wave (Task 1 → Task 2 → Task 3)
- **Wave 2**: 3 deep tasks — Tasks 4 and 5 parallel, Task 6 sequential after Task 5 (both edit Player.ts)
- **Wave 3**: 2 tasks — parallel QA
- **FINAL**: 4 tasks (oracle, unspecified-high x2, deep)

> All tasks have consistent wave labels, "Can Run In Parallel" flags, and cited evidence from codebase (Game.ts:134 spawn, Player.ts:419 intersection, canMove:398-399 wall rule, setDirection:118 for queued direction, isAtIntersection:419 for intersection, MazeGenerator for seed 42 grid layout). No test infrastructure changes (Task 4 only edits support/helpers/start.ts). Must Have expanded to include harness timing. All QA scenarios now cite specific files for business facts.

---

## TODOs

- [x] 1. Add `hasLeftCurrentCenter` helper to gridGeometry.ts

  **What to do**:
  - Add function that returns true when player has moved away from current cell center by more than tolerance but grid has not yet changed.
  - Follow exact style of existing `isAtCellCenter`, `hasCrossedCellCenter`, `getCenterTolerance`.
  - Export from gridGeometry.ts.

  **Must NOT do**:
  - Do not change tolerance calculation or add new classes/abstractions.

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single small pure function addition matching existing geometry helpers.
  - **Skills**: [`nx-workspace`]
    - `nx-workspace`: Needed to understand existing geometry utils pattern and test targets.
  - **Skills Evaluated but Omitted**:
    - `phaser-unit-test`: Not needed for geometry helper (no Phaser objects).

  **Parallelization**:
  - **Can Run In Parallel**: YES (first in wave, no blockers)
  - **Parallel Group**: Wave 1 (sequential, starts immediately; Tasks 2-3 follow)
  - **Blocks**: Tasks 2, 3, 5, 6, 7, 8
  - **Blocked By**: None (can start immediately, independent geometry helper per gridGeometry.ts:65-81)

  **References**:
  - `apps/maze-runner/src/game/utils/gridGeometry.ts:69-81` - Exact style of `isAtCellCenter` and `hasCrossedCellCenter` (use same distanceToCellCenter helper).
  - `apps/maze-runner/src/game/objects/Player.ts:253-275` - Where the new helper will be used in snap condition.
  - `apps/maze-runner/src/game/utils/gridGeometry.ts:65` - `getCenterTolerance` definition to reuse.

  **Acceptance Criteria**:
  - Function added and exported from gridGeometry.ts.
  - Existing smoke tests still pass after integration.

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Helper correctly identifies leaving current center (happy path)
    Tool: Bash (node REPL with harness)
    Preconditions: Player at exact center (grid 10,14), tolerance known
    Steps:
      1. Import gridGeometry and call hasLeftCurrentCenter with small delta (dx=2, dy=0)
      2. Assert returns true when gridX/Y unchanged
    Expected Result: true (has left center but not yet new cell)
    Evidence: .omo/evidence/task-1-has-left-center-happy.json

  Scenario: Helper returns false at exact center or after grid change (edge)
    Tool: Bash (node REPL with harness)
    Preconditions: Player exactly at center or after grid advanced
    Steps:
      1. Call with delta=0 (exact center)
      2. Call after worldToGrid returns new cell
    Expected Result: false in both cases
    Evidence: .omo/evidence/task-1-has-left-center-edge.json
  ```

  **Evidence to Capture**:
  - [ ] .omo/evidence/task-1-has-left-center-happy.json
  - [ ] .omo/evidence/task-1-has-left-center-edge.json

  **Commit**: YES
  - Message: `refactor(movement): add hasLeftCurrentCenter helper to fix snap-back on small deltas`
  - Files: apps/maze-runner/src/game/utils/gridGeometry.ts
  - Pre-commit: `bun nx run maze-runner:lint -- --files=apps/maze-runner/src/game/utils/gridGeometry.ts`

- [x] 2. Update hasCrossedCellCenter to distinguish leaving current vs entering new center

  **What to do**:
  - Modify logic so it only returns true when crossing into a _different_ cell's center.
  - Use the new hasLeftCurrentCenter where appropriate.
  - Keep all existing pen-entry and clamp behavior unchanged.

  **Must NOT do**:
  - Do not change tolerance values or wall clamping logic.

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Small pure function update matching existing geometry style.
  - **Skills**: [`nx-workspace`, `lsp_find_references`]
    - `nx-workspace`: To ensure test targets and patterns are followed.
    - `lsp_find_references`: To confirm all callers of hasCrossedCellCenter before change.
  - **Skills Evaluated but Omitted**:
    - `phaser-unit-test`: Not needed (pure geometry).

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 1 (sequential, after Task 1)
  - **Blocks**: Tasks 3, 6, 8
  - **Blocked By**: Task 1

  **References**:
  - `apps/maze-runner/src/game/utils/gridGeometry.ts:93-115` - Current implementation (update the zero-delta short-circuit).
  - `apps/maze-runner/src/game/objects/Player.ts:236-251` - Where crossedCenter is used in update().
  - `apps/maze-runner/features/smoke/02-player-moves.feature:10-30` - Exact scenarios that must continue to pass.

  **Acceptance Criteria**:
  - Function updated and all existing callers still behave correctly.
  - Smoke feature passes with visible movement on small deltas.

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Crossing into new cell center returns true (happy path)
    Tool: Bash (node REPL)
    Preconditions: Player moving from grid (10,14) toward (11,14)
    Steps:
      1. Call hasCrossedCellCenter with previous at center, next past new center
      2. Assert true
    Expected Result: true
    Evidence: .omo/evidence/task-2-cross-new-center-happy.json

  Scenario: Leaving current center but not reaching new one returns false (edge)
    Tool: Bash (node REPL)
    Preconditions: Small delta from exact center
    Steps:
      1. Call with previousDelta=0, nextDelta=small, same grid
      2. Assert false
    Expected Result: false (no longer snaps back)
    Evidence: .omo/evidence/task-2-cross-same-center-edge.json
  ```

  **Evidence to Capture**:
  - [ ] .omo/evidence/task-2-cross-new-center-happy.json
  - [ ] .omo/evidence/task-2-cross-same-center-edge.json

  **Commit**: YES
  - Message: `fix(movement): update hasCrossedCellCenter to prevent snap on leaving current center`
  - Files: apps/maze-runner/src/game/utils/gridGeometry.ts
  - Pre-commit: `bun nx run maze-runner:lint`

- [ ] 3. Update Player.update snap condition to use new helper

  **What to do**:
  - Replace or augment the crossedCenter check with logic that only snaps when actually reaching a new center or hitting a wall.
  - Ensure clamp logic runs before snap.
  - Update comments to explain the fix.

  **Must NOT do**:
  - Do not touch pen entry, enemy, or collectible code.

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Requires careful integration of new helper while preserving all existing clamp and intersection behavior.
  - **Skills**: [`lsp_find_references`, `ast_grep_search`]
    - `lsp_find_references`: Map all usages of update, snapToCellCenter, hasCrossedCellCenter before edit.
    - `ast_grep_search`: Ensure no other call sites rely on old crossing semantics.
  - **Skills Evaluated but Omitted**:
    - `phaser-integration-test`: Covered by harness QA instead.

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 1 (sequential, after Tasks 1, 2)
  - **Blocks**: Tasks 6, 7, 8
  - **Blocked By**: Tasks 1, 2

  **References**:
  - `apps/maze-runner/src/game/objects/Player.ts:156-294` - Full update method (focus on lines 182-275).
  - `apps/maze-runner/src/game/utils/gridGeometry.ts:93` - Updated hasCrossedCellCenter (new helper).
  - `apps/maze-runner/src/game/objects/Player.ts:192-213` - Existing clamp logic that must run first.

  **Acceptance Criteria**:
  - Player moves visibly on legal directions with normal 16ms frames.
  - Existing smoke feature passes without modification.

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Normal movement with small delta succeeds (happy path)
    Tool: Playwright (phaser-e2e-test skill)
    Preconditions: Game at seed=42, player at spawn center, countdown complete
    Steps:
      1. Navigate to http://localhost:4200/?test=1&seed=42
      2. Wait for __TEST__.ready
      3. test.commands.start(); test.time.stepSync(30)
      4. Capture initial state
      5. test.commands.move(4); test.time.stepSync(60)
      6. Assert final.gridX === initial.gridX + 1 and x increased
    Expected Result: gridX increases, visible movement on screenshot
    Evidence: .omo/evidence/task-3-normal-movement-happy.png

  Scenario: Movement blocked by wall does not phase through (negative)
    Tool: Playwright (phaser-e2e-test skill)
    Preconditions: Player at cell center; no maze layout knowledge assumed
    Steps:
      1. Probe all 4 directions by checking state.player.canMove(dir) per Player.canMove:398-399
      2. Select first direction where canMove returns false (this is a wall direction)
      3. test.commands.move(selectedDir); stepSync(60)
      4. Assert gridX and x unchanged
    Expected Result: No movement, position clamped at current cell center
    Evidence: .omo/evidence/task-3-wall-block-negative.png
  ```

  **Evidence to Capture**:
  - [ ] .omo/evidence/task-3-normal-movement-happy.png
  - [ ] .omo/evidence/task-3-wall-block-negative.png

  **Commit**: YES
  - Message: `fix(movement): update Player.update snap to use new crossing helper - prevents snap-back`
  - Files: apps/maze-runner/src/game/objects/Player.ts
  - Pre-commit: `bun nx run maze-runner:test`

- [ ] 4. Ensure commands.start() + move works reliably after countdown (Wave 2)

  **What to do**:
  - Update the start helper to use existing test.time.resume() after scene.start so movement commands are issued after countdown.
  - Do not change production Game.ts or test seam.

  **Must NOT do**:
  - Modify production Game.ts countdown logic or runCountdown.
  - Modify harness core infrastructure, test framework, or feature files.
  - (Editing the existing start helper to add a resume() call is explicitly allowed.)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Requires careful timing coordination between harness, scene transition, and countdown without touching production code (per Metis guardrail).
  - **Skills**: [`phaser-e2e-test`, `lsp_find_references`]
    - `phaser-e2e-test`: To validate timing in browser (per plan QA policy).
    - `lsp_find_references`: To ensure no production code (Game.ts) is touched (per draft:19).
  - **Skills Evaluated but Omitted**:
    - `git-master`: Not needed for this task.

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 5, 6)
  - **Blocks**: Tasks 7, 8
  - **Blocked By**: Tasks 1-3

  **References**:
  - `apps/maze-runner/support/helpers/start.ts:8-14` - commands.start (per Metis review).
  - `apps/maze-runner/src/game/scenes/Game.ts:272` - runCountdown (do not edit, per draft decision).
  - `libs/phaser-test-harness/src/core/timeController.ts:87` - existing resume() (use this).

  **Acceptance Criteria** (concrete):
  - commands.start() followed immediately by move(4) + stepSync(30) produces movement (gridX increases).
  - No change to production countdown behavior (per draft technical decision).

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Start + immediate move succeeds after countdown (happy path)
    Tool: Playwright (phaser-e2e-test skill)
    Preconditions: Fresh page with ?test=1&seed=42 (per feature file)
    Steps:
      1. test.commands.start()
      2. test.commands.move(4) (Direction.RIGHT per DirectionUtils.ts:9)
      3. test.time.stepSync(60) (per player.steps.ts:79)
      4. Assert gridX increased and screenshot shows movement (per smoke feature line 12)
    Expected Result: Player has moved right (gridX +1)
    Evidence: .omo/evidence/task-4-start-move-happy.png

  Scenario: Countdown still blocks in production path (negative)
    Tool: Playwright
    Preconditions: Normal / URL (no ?test=1, per harnessSnapshot.ts)
    Steps:
      1. Observe countdown text (per Game.ts:280-284)
      2. Attempt move before countdown ends
    Expected Result: No movement until countdown finishes (per draft decision)
    Evidence: .omo/evidence/task-4-production-countdown-negative.png
  ```

  **Evidence to Capture**:
  - [ ] .omo/evidence/task-4-start-move-happy.png
  - [ ] .omo/evidence/task-4-production-countdown-negative.png

  **Commit**: YES
  - Message: `fix(harness): ensure start command waits for countdown before movement (no Game.ts change)`
  - Files: apps/maze-runner/support/helpers/start.ts
  - Pre-commit: `bun nx run maze-runner:test`

- [ ] 5. Update Player.update to handle spawn-center edge case (per Game.ts:134)

  **What to do**:
  - Ensure first direction after spawn (exact center at gridWidth/2, height-3 per Game.ts:134) is accepted immediately.
  - Use new hasLeftCurrentCenter helper.
  - Add comment referencing spawn (Game.ts:134).

  **Must NOT do**:
  - Change any enemy or collectible update logic (per Must NOT Have).

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Spawn timing is a common edge that must not regress (per Metis edge cases).
  - **Skills**: [`lsp_find_references`]
    - `lsp_find_references`: Confirm spawn path in Game.ts:134 and Player constructor:63-70.
  - **Skills Evaluated but Omitted**:
    - `phaser-integration-test`: Covered by final QA wave (per plan verification strategy).

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4, 6)
  - **Blocks**: Task 7
  - **Blocked By**: Tasks 1-3

  **References**:
  - `apps/maze-runner/src/game/scenes/Game.ts:133-154` - Spawn at exact center (gridWidth/2, height-3).
  - `apps/maze-runner/src/game/objects/Player.ts:63-70` - Constructor sets exact center.
  - `apps/maze-runner/src/game/objects/Player.ts:75-95` - setDirection at NONE case (per Metis Q1).

  **Acceptance Criteria** (concrete):
  - First move after spawn immediately sets movementDirection and moves on next frame (gridX changes after stepSync(30)).

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: First move after spawn succeeds (happy path, per Game.ts:134)
    Tool: Playwright
    Preconditions: Fresh game start at seed=42 (per feature file and Game.ts:134 spawn at gridWidth/2, height-3)
    Steps:
      1. test.commands.start(); test.time.stepSync(5) (per player.steps.ts)
      2. test.commands.move(4)
      3. test.time.stepSync(30)
      4. Assert gridX increased from spawn (per smoke feature line 12)
    Expected Result: Immediate movement from spawn center
    Evidence: .omo/evidence/task-5-spawn-move-happy.png

  Scenario: Illegal direction at spawn is ignored (negative, per canMove:398-399)
    Tool: Playwright
    Preconditions: Spawn position (gridWidth/2, height-3 per Game.ts:134); no maze layout knowledge assumed
    Steps:
      1. Probe all 4 directions from spawn by checking state.player.canMove(dir) per Player.canMove:398-399
      2. Select first direction where canMove returns false (wall direction at spawn)
      3. test.commands.move(selectedDir); stepSync(30)
      4. Assert position unchanged (per Player.canMove:398-399)
    Expected Result: No movement
    Evidence: .omo/evidence/task-5-spawn-illegal-negative.png
  ```

  **Evidence to Capture**:
  - [ ] .omo/evidence/task-5-spawn-move-happy.png
  - [ ] .omo/evidence/task-5-spawn-illegal-negative.png

  **Commit**: YES
  - Message: `fix(movement): handle spawn-center edge case with new crossing helper (Game.ts:134)`
  - Files: apps/maze-runner/src/game/objects/Player.ts
  - Pre-commit: `bun nx run maze-runner:test`

- [ ] 6. Add rapid direction change handling at intersections (per Player.ts:419)

  **What to do**:
  - Ensure nextDirection is committed correctly when changing direction at intersection (per isAtIntersection:419-432).
  - Update the condition at Player.update:297-309 to use new helper.
  - Add comment referencing the fix and isAtIntersection.

  **Must NOT do**:
  - Add new state variables or change intersection detection logic (per Must NOT Have).

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Intersection turning is core gameplay mechanic (per Metis edge cases).
  - **Skills**: [`lsp_find_references`]
    - `lsp_find_references`: Map all intersection and nextDirection usage (Player.ts:419, Game.ts:384).
  - **Skills Evaluated but Omitted**:
    - `git-master`: Not needed.

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2 (sequential after Task 5)
  - **Blocks**: Task 8
  - **Blocked By**: Tasks 1-3, 5

  **References**:
  - `apps/maze-runner/src/game/objects/Player.ts:297-316` - nextDirection commit logic (per Metis review).
  - `apps/maze-runner/src/game/objects/Player.ts:419-432` - isAtIntersection (cited evidence).
  - `apps/maze-runner/features/smoke/02-player-moves.feature:15-25` - Direction change scenarios (exact test).

  **Acceptance Criteria** (concrete):
  - Rapid direction changes at intersections update movement immediately (grid and direction change after stepSync(30)).

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Rapid direction change at intersection succeeds (happy path, per Player.ts:419)
    Tool: Playwright
    Preconditions: Player at cell center; no maze layout knowledge assumed
    Steps:
      1. Navigate by repeatedly moving in directions where canMove returns true (per Player.canMove:398-399) and stepping until isAtIntersection returns true (passageCount >= 3 per Player.ts:429)
      2. Probe all 4 directions at intersection; select two legal directions where canMove returns true that are perpendicular to each other
      3. test.commands.move(legalDir1); test.time.stepSync(5) to establish movement
      4. test.commands.move(legalDir2); test.time.stepSync(30)
      5. Assert direction changed to legalDir2 and position updated (per state.player)
    Expected Result: Direction changes without delay
    Evidence: .omo/evidence/task-6-rapid-turn-happy.png

  Scenario: Illegal rapid change is queued but not executed (negative, per setDirection:118 and canMove:398)
    Tool: Playwright
    Preconditions: Player at cell center; no maze layout knowledge assumed
    Steps:
      1. Probe all 4 directions by checking state.player.canMove(dir) per Player.canMove:398-399
      2. Select one legal direction (canMove=true) and one illegal direction (canMove=false)
      3. test.commands.move(legalDir); test.time.stepSync(10) to establish movement in legal direction
      4. test.commands.move(illegalDir) to queue illegal turn (per setDirection:118)
      5. stepSync(30)
      6. Assert continues in legalDir (illegalDir queued but not executed per state)
    Expected Result: Queued but not executed until legal
    Evidence: .omo/evidence/task-6-illegal-rapid-negative.png
  ```

  **Evidence to Capture**:
  - [ ] .omo/evidence/task-6-rapid-turn-happy.png
  - [ ] .omo/evidence/task-6-illegal-rapid-negative.png

  **Commit**: YES
  - Message: `fix(movement): improve rapid direction change at intersections using new helper (Player.ts:419)`
  - Files: apps/maze-runner/src/game/objects/Player.ts
  - Pre-commit: `bun nx run maze-runner:test`

- [ ] 7. Enhance smoke test QA scenarios (small-delta, large-delta, boundary, spawn per Game.ts:134)

  **What to do**:
  - Expand existing QA in plan and update player.steps.ts if needed to include before/after assertions for all edge cases (small-delta, large-delta, boundary, spawn per Game.ts:134).
  - Add screenshots and state JSON evidence for every scenario.

  **Must NOT do**:
  - Change the feature file assertions themselves (per guardrail).

  **Recommended Agent Profile**:
  - **Category**: `writing`
    - Reason: Focused on QA scenario clarity and evidence capture (per Metis QA directives).
  - **Skills**: [`phaser-e2e-test`, `review-work`]
    - `phaser-e2e-test`: To write precise Playwright scenarios with exact steps/assertions.
    - `review-work`: To ensure QA meets zero-human-intervention standard (per verification strategy).
  - **Skills Evaluated but Omitted**:
    - `vector-sprite-pipeline`: Not relevant.

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Task 8)
  - **Blocks**: Final wave
  - **Blocked By**: Tasks 1-6

  **References**:
  - `apps/maze-runner/features/smoke/02-player-moves.feature:1-30` - Existing scenarios to enhance (cited evidence).
  - `apps/maze-runner/step-definitions/player.steps.ts:10-100` - Current step implementations (per background agent).
  - Plan QA template (use exact format with tool, concrete data, assertions, evidence path per Metis).

  **Acceptance Criteria** (concrete):
  - 8+ QA scenarios (happy + negative) with exact evidence files in .omo/evidence/.
  - All scenarios pass when run via harness (per smoke feature).

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: All enhanced QA scenarios execute and produce evidence (per Metis QA policy)
    Tool: phaser-e2e-test skill (or review-work)
    Preconditions: Plan complete, all previous tasks done
    Steps:
      1. Run full smoke feature with enhanced QA (per 02-player-moves.feature)
      2. Verify .omo/evidence/ contains all task-N-*.png and .json (per plan)
      3. Assert all scenarios report PASS with concrete grid deltas
    Expected Result: 100% QA coverage with evidence (14/14 pass per F3)
    Evidence: .omo/evidence/task-7-full-qa-pass.json
  ```

  **Evidence to Capture**:
  - [ ] .omo/evidence/task-7-full-qa-pass.json (plus all per-task screenshots per task)

  **Commit**: YES
  - Message: `test(movement): enhance harness QA scenarios with small/large delta, spawn (Game.ts:134), boundary cases`
  - Files: .omo/plans/maze-movement-fix.md apps/maze-runner/step-definitions/player.steps.ts
  - Pre-commit: `bun nx run maze-runner:test`

- [ ] 8. Add harness parity test between keyboard and commands.move (per Game.ts:160)

  **What to do**:
  - Add a new QA scenario that runs both keyboard simulation (per Game.ts:160-167) and harness move and asserts identical final state.
  - Use Playwright keyboard events for the keyboard path.

  **Must NOT do**:
  - Add new feature file scenarios (keep existing smoke unchanged per guardrail).

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Requires precise Playwright keyboard + harness comparison with screenshots (per Metis parity question).
  - **Skills**: [`phaser-e2e-test`, `playwright`]
    - `phaser-e2e-test`: For Cucumber-style game flow with exact steps.
    - `playwright`: For keyboard event simulation (per Game.ts:160).
  - **Skills Evaluated but Omitted**:
    - `git-master`: Not needed.

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Task 7)
  - **Blocks**: Final wave
  - **Blocked By**: Tasks 4-6

  **References**:
  - `apps/maze-runner/src/game/scenes/Game.ts:160-167` - Keyboard listener registration (cited evidence for parity).
  - `apps/maze-runner/src/PhaserGame.tsx:31` - Harness move command (per background agent).
  - `libs/browser-test-runner/src/steps/common.ts:54-70` - Keyboard simulation patterns (per Metis).

  **Acceptance Criteria** (concrete):
  - New parity QA scenario passes with identical grid and world position for both input methods (per draft technical decision on parity).

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Keyboard and harness move produce identical state (happy path, per Game.ts:160)
    Tool: Playwright (phaser-e2e-test skill)
    Preconditions: Fresh game at seed=42 (per feature and Game.ts:160 keyboard registration)
    Steps:
      1. Start game, stepSync(30) (per player.steps.ts)
      2. Simulate keyboard ArrowRight (page.keyboard.press, per Game.ts:166)
      3. Capture state A (gridX, x, y, direction)
      4. Reset position (per position-player helper), use test.commands.move(4), stepSync same amount (per harnessSnapshot.ts)
      5. Capture state B, assert A === B (gridX, x, y, direction per harnessSnapshot.ts)
    Expected Result: Identical final state (per Metis Q2)
    Evidence: .omo/evidence/task-8-parity-happy.png
  ```

  **Evidence to Capture**:
  - [ ] .omo/evidence/task-8-parity-happy.png

  **Commit**: YES
  - Message: `test(movement): add keyboard (Game.ts:160) vs harness parity QA scenario`
  - Files: apps/maze-runner/step-definitions/player.steps.ts
  - Pre-commit: `bun nx run maze-runner:test`

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.

- [ ] F1. **Plan Compliance Audit** — `oracle`
      Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .omo/evidence/. Compare deliverables against plan.
      **Recommended Agent Profile**: oracle (read-only consultation)
      **Parallelization**: Wave FINAL (with F2, F3, F4)
      **Acceptance Criteria**: `Must Have [5/5] | Must NOT Have [7/7] | Tasks [8/8] | VERDICT: APPROVE`
      **QA Scenarios**:

  ```
  Scenario: All Must Have and Must NOT Have satisfied
    Tool: oracle
    Steps: Run full plan compliance check on .omo/plans/maze-movement-fix.md
    Expected Result: APPROVE verdict with all counts matching (5 Must Have, 7 Must NOT Have, 8 tasks)
    Evidence: .omo/evidence/task-F1-compliance-approve.txt
  ```

- [ ] F2. **Code Quality Review** — `unspecified-high`
      Run `bun nx run-many --targets=lint,typecheck,test --projects=maze-runner`. Review all changed files for `as any`/`@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names.
      **Recommended Agent Profile**: unspecified-high (code quality focus)
      **Parallelization**: Wave FINAL (with F1, F3, F4)
      **Acceptance Criteria**: `Build [PASS] | Lint [PASS] | Tests [PASS] | Files [4 clean/0 issues] | VERDICT: APPROVE`
      **QA Scenarios**:

  ```
  Scenario: No new errors or slop introduced
    Tool: Bash (bun nx lint/typecheck/test)
    Steps: Run `bun nx run-many --targets=lint,typecheck,test --projects=maze-runner`
    Expected Result: All pass with zero new issues
    Evidence: .omo/evidence/task-F2-quality-approve.txt
  ```

- [ ] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill)
      Start from clean state. Execute EVERY QA scenario from EVERY task — follow exact steps, capture evidence. Test cross-task integration (features working together). Test edge cases: empty state (no), invalid input (illegal direction), rapid actions. Save to `.omo/evidence/final-qa/`.
      **Recommended Agent Profile**: unspecified-high (hands-on QA)
      **Parallelization**: Wave FINAL (with F1, F2, F4)
      **Acceptance Criteria**: `Scenarios [14/14 pass] | Integration [4/4] | Edge Cases [6 tested] | VERDICT: APPROVE`
      **QA Scenarios**:

  ```
  Scenario: Full end-to-end movement verification
    Tool: playwright (via phaser-e2e-test skill)
    Steps: Run all 14 task QA scenarios + smoke feature
    Expected Result: All evidence files present and assertions pass
    Evidence: .omo/evidence/final-qa/full-movement-verified.png
  ```

- [ ] F4. **Scope Fidelity Check** — `deep`
      For each task: read "What to do", read actual diff (git log/diff). Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance. Detect cross-task contamination. Flag unaccounted changes.
      **Recommended Agent Profile**: deep (scope and diff analysis)
      **Parallelization**: Wave FINAL (with F1-F3)
      **Acceptance Criteria**: `Tasks [8/8 compliant] | Contamination [CLEAN] | Unaccounted [CLEAN] | VERDICT: APPROVE`
      **QA Scenarios**:
  ```
  Scenario: No scope creep or missing items
    Tool: Bash (git diff + grep)
    Steps: `git diff HEAD~1 -- apps/maze-runner/src/game/` and check against plan Must NOT Have
    Expected Result: Only crossing/snap logic changed, no forbidden files touched
    Evidence: .omo/evidence/task-F4-scope-clean.txt
  ```

---

## Commit Strategy

Each task commits individually with its own message:

- Task 1: `refactor(movement): add hasLeftCurrentCenter helper to fix snap-back on small deltas`
- Task 2: `fix(movement): update hasCrossedCellCenter to prevent snap on leaving current center`
- Task 3: `fix(movement): update Player.update snap to use new crossing helper - prevents snap-back`
- Task 4: `fix(harness): ensure start command waits for countdown before movement (no Game.ts change)`
- Task 5: `fix(movement): handle spawn-center edge case with new crossing helper (Game.ts:134)`
- Task 6: `fix(movement): improve rapid direction change at intersections using new helper (Player.ts:419)`
- Task 7: `test(movement): enhance harness QA scenarios with small/large delta, spawn (Game.ts:134), boundary cases`
- Task 8: `test(movement): add keyboard (Game.ts:160) vs harness parity QA scenario`
- Final: `chore(movement): update plan compliance and QA evidence`

---

## Success Criteria

### Verification Commands

```bash
bun nx run maze-runner:test
bun nx serve maze-runner & sleep 8
bunx cucumber-js --tags @smoke apps/maze-runner/features/smoke/02-player-moves.feature
# Expected: tests pass, 4 smoke scenarios pass, grid deltas observed, no snap-back
```

### Final Checklist

- All "Must Have" present
- All "Must NOT Have" absent
- All smoke tests pass with visible movement
- Harness and keyboard produce identical grid deltas after equivalent time
- QA evidence files exist in .omo/evidence/ for every task
