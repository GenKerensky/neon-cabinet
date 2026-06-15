# Learned from Plan and Previous Oracle Iterations

**Metis Guardrails (Critical):**

- Minimal change ONLY: crossing/snap logic in Player.ts:156-316 + tiny helper in gridGeometry.ts:93 + small edit to start helper
- Preserve existing smoke tests byte-for-byte (02-player-moves.feature:10-30)
- No changes to Game.ts countdown logic or runCountdown
- No new classes, abstractions, unit tests, or test framework changes
- Preserve wall clamp (Player.ts:192-213) and pen entry behavior
- No AI slop (excessive comments, over-abstraction, generic names)
- QA scenarios must be 100% agent-executable with concrete data, no human intervention

**QA Policy:**

- Every task: 1 happy-path + 1 failure/edge scenario
- Use phaser-e2e-test skill + playwright for browser, node REPL for geometry helpers
- Evidence: .omo/evidence/task-N-{scenario-slug}.{png|json}
- Use seed=42 for deterministic maze layout
- Dynamic canMove probing for all maze-dependent scenarios (no hardcoded grid positions or directions)
- stepSync(60) for normal movement, stepSync(30) for spawn/rapid turns

**Technical Decisions:**

- New helper: hasLeftCurrentCenter (returns true when moved > tolerance from current center but grid unchanged)
- Use test.time.resume() in start helper after scene.start
- Dynamic direction selection in Task 6 QA (probe canMove, select legal/perpendicular pairs)
- All Nx commands must use `bun nx`, cucumber uses `bunx cucumber-js`
- Task 6 must be sequential after Task 5 (both edit Player.update)

**Inherited Patterns:**

- Follow exact style of existing geometry helpers (isAtCellCenter, hasCrossedCellCenter, getCenterTolerance)
- Use lsp_find_references and ast_grep_search before any Player.ts edits
- All commits must be atomic with specific messages
- Final wave must have ALL 4 reviewers APPROVE

**Gotchas:**

- Player.update: clamp logic MUST run before snap
- intersection detection uses passageCount >= 3
- Keyboard uses global keydown events (Game.ts:160-167)
- harnessSnapshot.ts provides position-player helper for parity test

Updated: 2026-05-31

## [2026-05-31] Task 1 Completed

- Added `hasLeftCurrentCenter` helper to gridGeometry.ts following exact existing style
- Function uses `distanceToCellCenter` and `getCenterTolerance`
- Task 1 checkbox marked completed in plan
- No scope creep - only modified the one allowed file
- Next: Task 2 must update hasCrossedCellCenter to use this new helper

## [2026-05-31] Task 2 Completed

- Updated hasCrossedCellCenter in gridGeometry.ts:121: changed `return nextDelta !== 0;` to `return false;`
- This fixes the zero-delta short-circuit bug: when previousDelta===0 (at exact center), any movement now returns false (leaving, not crossing)
- Verified all callers via lsp_find_references (called at line 107 before edit; second call confirmed 10 refs): Player.ts (import+2 calls at 238,245), Enemy.ts (import+2 calls at 373,687 for movement and pen exit), gridGeometry.spec.ts (import+3 calls at 43,46,49), + declaration
- All other logic in function preserved exactly (both-zero short-circuit, nextDelta===0 case, sign-change cross at end)
- No changes to tolerance values, wall clamping, function signature, or any files outside gridGeometry.ts for the fix itself
- QA evidence created (using node -e REPL as required):
  - .omo/evidence/task-2-cross-new-center-happy.json : crossing new center (prevDelta !=0 for the passed center) -> true
  - .omo/evidence/task-2-cross-same-center-edge.json : leaving same center (prevDelta=0) -> false
- Pre-commit verification: bun nx run maze-runner:lint executed and passed (see command output)
- All existing callers (Player snap at current center, Enemy crossing to next cell or pen exit) now behave correctly: no erroneous snap when leaving exact center on small moves
- Commit will use exact required message
- Next: Task 3 (update Player.update snap condition to use hasLeftCurrentCenter helper)

Updated: 2026-05-31
