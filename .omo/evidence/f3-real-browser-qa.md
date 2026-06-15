# F3 Real Browser QA — Power Pellets

## Scope and execution

- App server started with: `bun nx serve maze-runner`
- Cucumber command executed (as requested):
  - `cd apps/maze-runner && bunx cucumber-js --config cucumber.cjs features/gameplay/power-pellets.feature`
- Raw run log captured at:
  - `.omo/evidence/f3-power-pellets-cucumber.log`

## Important run detail

`cucumber.cjs` currently merges `features/**/*.feature` with CLI feature args (deprecation warning shown by Cucumber), so this command executed the full suite, not only `power-pellets.feature`.

Observed summary from this real browser run:

- `22 scenarios (15 failed, 7 passed)`
- `134 steps (15 failed, 7 skipped, 112 passed)`

## Power-pellets scenario results (focused)

From the same run log:

1. **Power pellet activates frightened mode** (`features/gameplay/power-pellets.feature:9`) — **FAILED**
   - Failure: `Expected enemy "chaser" in state "frightened" but got ""`

2. **Repeated power pellets extend frightened window** (`features/gameplay/power-pellets.feature:24`) — **FAILED**
   - Failure: `Expected enemy "chaser" in state "frightened" but got ""`

3. **Eaten ghost returns to pen and revives** (`features/gameplay/power-pellets.feature:33`) — **FAILED**
   - Failure: `Expected enemy "chaser" to exist`

## Failure artifacts (screenshots)

Manual browser captures taken from live `window.__TEST__` state after reproducing each failing path:

- `.omo/evidence/f3-power-pellet-frightened-state.png`
  - Captured after start → 10 frames → collect power pellet → 5 frames.
- `.omo/evidence/f3-power-pellet-extended-frightened.png`
  - Captured after start → pellet → 120 frames → pellet → 520 frames.
- `.omo/evidence/f3-power-pellet-pen-return.png`
  - Captured after start → mark enemy dead + move to `(1,1)` → 220 frames.

## Root-cause analysis

### Classification: **Pre-existing harness/step-definition issue (primary)**

- Step definitions in `apps/maze-runner/step-definitions/enemy.steps.ts` resolve enemies for these assertions via texture/id string matching.
- Failing scenarios assert on enemy key `"chaser"`.
- Runtime browser state (`window.__TEST__.state`) in manual reproductions shows enemy textures as `"timid"`, `"wanderer"`, `"trickster"`.
- As a result, lookup by `"chaser"` returns no match (`""` or missing enemy), producing false negatives even when state transitions (e.g., `frightened`) are visibly present.

### Classification: **Implementation bug**

- **Not confirmed** from this QA pass for power-pellet behavior itself.
- Manual runtime captures show frightened state and pen return behavior occurring with existing enemy identities.

### Classification: **Test environment issue**

- Secondary issue present: command/config currently broadens execution to all features due config+CLI merge behavior.
- This does not explain the specific `"chaser"` lookup failures, but it increases noise in focused runs.

## Overall verdict

## **REJECT**

Reason: the required real browser Cucumber power-pellet scenarios do not pass in current automated QA execution (3/3 failed), so acceptance criteria for this QA gate are not met, despite evidence that failures are predominantly harness identifier mismatches rather than clear gameplay regressions.
