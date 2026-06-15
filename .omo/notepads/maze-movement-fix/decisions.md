# Architectural Decisions for maze-movement-fix

**Core Decision (Root Cause):**

- Root cause identified at Player.ts:253 (snap condition using hasCrossedCellCenter) and gridGeometry.ts:93
- hasCrossedCellCenter treats first small movement from exact center as "crossing" → immediate snap back to same cell
- Solution: Add `hasLeftCurrentCenter` helper that returns true when player has moved away from current cell center by more than tolerance but grid has not yet changed

**Key Technical Decisions:**

- **Helper Design**: Follow exact style of existing `isAtCellCenter`, `hasCrossedCellCenter`, `getCenterTolerance`, `distanceToCellCenter`
- **Update Strategy**: Update hasCrossedCellCenter to use new helper for zero-delta short-circuit. Update Player.update snap condition to use new helper. Clamp logic must run BEFORE snap.
- **Spawn Edge Case**: First direction after spawn (exact center at gridWidth/2, height-3 per Game.ts:134) must be accepted immediately using new helper
- **Intersection Handling**: nextDirection commit at Player.update:297-309 must use new helper. Use dynamic canMove probing (no hardcoded directions)
- **Harness Timing**: Update start helper to use existing test.time.resume() after scene.start. Do NOT modify Game.ts or core test infrastructure.
- **QA Strategy**: 14 agent-executable scenarios using phaser-e2e-test skill. All maze-dependent scenarios use dynamic canMove probing. Evidence in .omo/evidence/task-N-\*.{png|json}
- **Test Strategy**: Tests-after only. Enhance existing smoke feature QA scenarios. No new unit tests or feature file changes.
- **Package Manager**: All commands must use `bun nx` or `bunx`. Pre-commit hooks updated accordingly.

**Scope Guardrails (Must NOT Have - 7 items):**

1. Changes to Direction enum, Enemy, Collectible, scoring, shaders, visual effects
2. New classes, major abstractions, or performance optimizations
3. Modification of Game.ts countdown logic or runCountdown
4. Breaking existing wall clamp or pen entry behavior
5. New unit tests or changes to test framework
6. AI slop (excessive comments, over-abstraction, generic names)
7. Changes outside allowed files: Player.ts:156-316, gridGeometry.ts:93, start helper, player.steps.ts (QA only)

**Parallelization Decisions:**

- Wave 1: Sequential (1→2→3) - foundation dependencies
- Wave 2: Task 4+5 parallel, Task 6 sequential after Task 5 (both edit Player.ts)
- Wave 3: Tasks 7+8 parallel (QA)
- Final Wave: All 4 reviewers in parallel

**Commit Strategy:** Individual commits per task with specific messages. No grouping.

Updated: 2026-05-31
