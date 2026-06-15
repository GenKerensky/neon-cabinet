# Learnings - maze-runner-grid-ai-ui

## Conventions

- Use gridGeometry.ts helpers for all centerline/pen math; no hardcoded geometry.
- getCenterTolerance(tileSize) = Math.max(0.5, tileSize \* 0.02).
- Player/enemy scale must always be tileSize / 30 after constructor, respawn, reset.
- Queued turns do NOT rotate sprite before center commit.
- Pen gate is outward-only for player/living ghosts; dead ghosts ignore walls/gate only while returning.
- Title attract loop is visual-only; no gameplay Player/Enemy instantiation.
- HUD: life icons top-left, score top-center, level top-right, high score bottom-center.
- Use window.**PHASER_BRIDGE** for browser harness state; never window.**TEST**.
- Phaser keyboard events don't work in headless Chrome; use bridge/direct scene controls.

## Decisions

- Added `gridGeometry.ts` as a pure Phaser-independent source of centerline and pen geometry math.
- `getPenGeometry(width, height)` mirrors `MazeGenerator.createEnemyEnclosure()` with `centerX/centerY`, six-cell interior, gate, exit, top gate row, and bottom wall row.
- `isEnteringPenFromOutside()` only returns true for outside -> gate/interior movement; exit/outward movement stays false.
- Targeted Vitest verification passed for the new utility spec, including the pen-geometry subset.
- Enemy movement now uses centerline geometry helpers (`getCellCenter`, `snapToCellCenter`, `hasCrossedCellCenter`, `isAtCellCenter`) to prevent perpendicular drift and to clear pen-exit mode only on reaching/crossing exit-cell center.
- Enemy pen logic now has explicit `exitingPen` control (`forcePenExit()`, `isExitingPen()`) so initial and respawned ghosts prioritize interior->gate->exit routing before normal chase/scatter/frightened targeting.
- Living ghosts outside pen are blocked from gate/interior re-entry, while `DEAD` ghosts still bypass walls/gate during return and immediately transition to `CHASE + forcePenExit()` at return target.
- Enemy spec coverage now includes initial/forced pen-exit behavior, no living gate re-entry, dead return through walls with immediate re-exit cycle, frightened-vs-pen-exit boundary, and centerline alignment checks.
- Verification evidence for required command was saved to `.omo/evidence/task-3-enemy-pen-exit.txt` and `.omo/evidence/task-3-enemy-gate-dead-return.txt` with `45/45` tests passing.
- Game scene HUD now uses gameplay layout convention: life icons rendered as yellow circle + black right-facing wedge at top-left (`x = 24 + i*28`, `y = 30`, `r = 8`), score top-center, level top-right, and high score bottom-center.
- Gameplay high-score HUD is display-only and computed as `Math.max(readHighScore(registry), scoreValue)` with `formatScore`; no `writeHighScore` call occurs during in-game HUD refresh.
- Pen-exit routing is re-armed in `Game.rebuildActiveGhosts()` and `Game.resetPositions()` by calling `forcePenExit()` on every enemy after spawn/reset.
- Targeted verification for Wave 3 Task 4 passed with `bunx nx test maze-runner -- --run tests/scenes/Game.spec.ts` (`12/12` tests).

## Issues

## Problems

- Title attract loop replaced with bounded visual-only animated sequence using Phaser geometry mask and tweens.
- Attract loop uses `this.tweens.chain` for deterministic Segment A (right) and Segment B (left) sequence.
- Attract loop visuals are pure graphics/containers; no gameplay `Player` or `Enemy` classes are instantiated in Title scene.
- Wave 4 Task 6 snapshot now exposes `tileSize`, `expectedScale`, player/enemy scale checks, player/enemy centerline deltas+tolerance, pen geometry via `getPenGeometry`, enemy pen state (`inPen`, `atGate`, `atExit`, `isExitingPen`).
- HUD observability now captures score/level/high-score text values + coordinates and life icon count/positions from `Game` scene fields.
- Title observability now emits `titleAttract` with fixed bounds `{x:80,y:40,width:864,height:120}`, bridge-visible mask flag, and expected attract actor counts.
- Browser scenario evidence for Task 6 is generated through `window.__PHASER_BRIDGE__` state/screenshot APIs with direct scene control, avoiding synthetic keyboard events.

## Task 7 final validation (2026-05-30 00:24)

- bunx nx typecheck maze-runner passed; evidence: .omo/evidence/task-7-typecheck.txt.
- bunx nx test maze-runner passed with 21 passed files / 268 passed tests; evidence: .omo/evidence/task-7-test-output.txt.
- bunx nx lint maze-runner completed with warnings only (no lint errors); evidence: .omo/evidence/task-7-lint.txt.
- bunx nx build maze-runner passed; evidence: .omo/evidence/task-7-build.txt.
- Browser harness: initial bunx cucumber-js resolved a dependency-confusion placeholder package; resolved by running scoped binary from @cucumber/cucumber in apps/maze-runner cwd. @task6 scenarios then passed (3 scenarios, 12 steps). Evidence: .omo/evidence/task-7-browser-scenarios.txt.
- Final browser artifacts captured at http://localhost:4200: .omo/evidence/task-7-title-attract-final.png, .omo/evidence/task-7-game-hud-final.png, .omo/evidence/task-7-snapshot-final.json.
- Working tree baseline recorded: .omo/evidence/task-7-working-tree-baseline.txt. Combined validation summary: .omo/evidence/task-7-validation.log.

## Final Wave F1/F2 blocking-fix pass (2026-05-30)

- `isEnteringPenFromOutside()` now treats `exitCell -> gateCell` as outside->pen entry (blocked for player/living enemies), while gate/interior/exiting flows remain allowed in the outward direction.
- `Player.setDirection()` now requires centerline alignment (`isAtCellCenter` with `getCenterTolerance`) before immediate turn commit for already-moving players; off-center turn requests are queued.
- Title attract mask graphics are now hidden (`alpha = 0`) after creating the geometry mask, preserving clipping while removing the visible white rectangle artifact.
- HUD life icon graphics now retain rendered centers in object coordinates (`icon.x/icon.y` at `24 + i*28, 30`) and snapshot output emits `hud.livesIcons.centers` plus text origins for score/level/highScore.
- `Enemy` and `Game` center/spawn math now consistently use `gridGeometry` helpers (`getCellCenter`, `snapToCellCenter`, `hasCrossedCellCenter`, `isAtCellCenter`) instead of duplicated arithmetic.
- Removed `as any` from the changed production files (`Enemy.ts`, `harnessSnapshot.ts`) via typed narrowing/intermediate structural types.
- Regenerated browser evidence files include `.omo/evidence/task-6-title-attract.png`, `.omo/evidence/task-6-game-hud.png`, `.omo/evidence/task-7-title-attract-final.png`, `.omo/evidence/task-7-game-hud-final.png`, `.omo/evidence/task-7-snapshot-final.json`.
- Snapshot verification confirms expected final shape/values: player scale matches tile scale, player centerline centered on spawn, in-pen ghosts report `exitingPen=true`, and life centers are `[24,30]`, `[52,30]`, `[80,30]` with HUD origins present.
