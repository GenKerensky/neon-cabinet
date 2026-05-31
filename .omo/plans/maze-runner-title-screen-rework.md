# Maze Runner Title Screen Rework

## TL;DR

> **Summary**: Rework Maze Runner's title/start experience into a Pac-Man-cabinet-inspired attract screen with player-yellow title text, animated maze/pellet/ghost background, persistent high score display, and fade transitions across title/game/pause/game-over flow.
> **Deliverables**:
>
> - Player-yellow title screen with blue maze rails, pellet trail, ghost/player attract-loop background, and restrained CRT glow/scanline feel.
> - Persistent `mazeRunnerHighScore` localStorage system with `000000` empty/default display.
> - Shared fade transition helpers applied to Title fade-in after Boot, Title→Game, Game→GameOver, GameOver→Title, GameOver→Game restart, Pause resume, and Pause quit→Title.
> - Unit tests, browser/HMR QA via Chrome DevTools, screenshot evidence, and art-director critique loop.
>   **Effort**: Medium
>   **Parallel**: YES - 5 waves
>   **Critical Path**: Tasks 1-2 → Tasks 3 and 5 → Tasks 4 and 6 → Task 7 → Task 8 → Final Verification

## Context

### Original Request

User asked: “ulw i want you to rework the start game screen for maze-runner. look at how i did battle-tanks and think of some fun background animations you can add to the start screen that are on theme for maze-runner. use the chrome devtool (game is already runnin in hmr) to view your work and have the art director citique it. take inspiration from the original pacman arcade cabinets. the title text should be the same yellow as the player. be sure to show the current high score to beat as well and have fade in-fade-out animations for all game scene transitions.”

### Interview Summary

- Visual direction locked: Pac-Man arcade cabinet homage, not a direct IP clone.
- Empty high score display locked: `000000`.
- High score persistence decision: add `localStorage` key `mazeRunnerHighScore`, with registry/session fallback if storage is unavailable.
- Score formatting decision: zero-pad scores below 1,000,000 to six digits; display full values above 999,999.
- Test strategy: tests-after plus browser QA and art-director critique.

### Metis Review (gaps addressed)

- Defined exact transition paths so “all game scene transitions” is bounded.
- Added high-score persistence and invalid/unavailable storage edge cases.
- Added guardrails against gameplay expansion, direct IP copying, wholesale battle-tanks copying, and new art-pipeline work.
- Required concrete browser assertions, screenshots, console checks, and art-director review before final QA.

## Work Objectives

### Core Objective

Transform the Maze Runner title scene from a sparse cyan text screen into a polished arcade-cabinet-style attract screen while preserving existing gameplay, controls, test harness, and HMR workflow.

### Deliverables

- `apps/maze-runner/src/game/scenes/Title.ts` redesigned with title/background animation and high-score display.
- High-score utility and tests in `apps/maze-runner/src/game/utils/highScore.ts` and `apps/maze-runner/tests/utils/highScore.spec.ts`.
- Shared transition utility and tests in `apps/maze-runner/src/game/utils/sceneTransitions.ts` and `apps/maze-runner/tests/utils/sceneTransitions.spec.ts`.
- Scene updates in `Title.ts`, `Game.ts`, `GameOver.ts`, and `Pause.ts` to use fade helpers, with `Boot.ts` retaining direct Title start and Title performing the Boot→Title fade-in.
- Harness snapshot update in `apps/maze-runner/src/PhaserGame.tsx` exposing high score and transition state for browser QA.
- Harness snapshot helper in `apps/maze-runner/src/game/utils/harnessSnapshot.ts` with tests in `apps/maze-runner/tests/utils/harnessSnapshot.spec.ts`.
- Updated/added scene tests for Title, GameOver, Pause, Boot, and Game transition call paths.
- Browser evidence screenshots and art-director critique notes under `.omo/evidence/`.

### Definition of Done (verifiable conditions with commands)

- `bunx nx test maze-runner` exits 0.
- `bunx nx lint maze-runner` exits 0.
- `bunx nx typecheck maze-runner` exits 0.
- Chrome DevTools browser QA against running HMR app at `http://localhost:4200/` shows no console errors.
- Chrome DevTools browser QA at `http://localhost:4200/?test=1&seed=title-screen-qa` verifies title/high-score/transition behavior and captures evidence screenshots.
- Art Director reviews screenshot evidence and either approves or returns concrete changes; all requested visual fixes are applied and re-reviewed.

### Must Have

- Title text color must match intended player yellow: use `#ffff00` as the UI title/highlight yellow because existing tests model the player as `#ffff00` and user requested “same yellow as the player.”
- Production player SVG body fill must also be `#ffff00` so the title and player yellow match; keep the existing `#ffaa00` stroke and SVG animation/socket metadata intact.
- Title must display `HIGH SCORE: 000000` when no score exists.
- Existing stored score `1234` must display as `HIGH SCORE: 001234`.
- Invalid/corrupt stored value must fall back to `000000` without throwing.
- Background animation must be maze-themed: blue maze rails, pellet trail/marquee, and ghost/player attract-loop movement.
- Transition fades must not leave scenes stuck, blacked out, paused, or double-started.
- Preserve SPACE start behavior and test auto-start behavior.

### Must NOT Have (guardrails, AI slop patterns, scope boundaries)

- Do not change core maze generation, enemy AI, scoring values, player movement, collectible behavior, or level progression.
- Do not introduce new enemies, levels, gameplay modes, score mechanics, settings UI, or asset pipeline.
- Do not copy battle-tanks code wholesale; use it only as an implementation pattern reference.
- Do not create a direct Pac-Man clone or use trademarked names/copy; keep it as broad arcade-cabinet homage.
- Do not rely on “looks good” human-only acceptance criteria; every task needs executable QA evidence.

## Verification Strategy

> ZERO HUMAN INTERVENTION - all verification is agent-executed.

- Test decision: tests-after with Vitest + browser QA through Chrome DevTools/Cucumber-compatible route.
- QA policy: Every task has agent-executed scenarios.
- Evidence: `.omo/evidence/task-{N}-{slug}.{ext}`

## Execution Strategy

### Parallel Execution Waves

> Target: 5-8 tasks per wave. <3 per wave (except final) = under-splitting.
> Extract shared dependencies as Wave-1 tasks for max parallelism.

Wave 1: Task 1 high-score utility; Task 2 transition helper.
Wave 2: Task 3 title-screen visual rework; Task 5 GameOver persistence update. These edit different files and may run in parallel.
Wave 3: Task 4 apply transitions to scenes; Task 6 harness/browser observability. These edit different files and may run in parallel after Task 5.
Wave 4: Task 7 focused regression test completion.
Wave 5: Task 8 Chrome DevTools visual QA + art-director critique loop.

### Dependency Matrix (full, all tasks)

- Task 1 blocks Tasks 3, 5, 6, 7, 8.
- Task 2 blocks Tasks 3, 4, 6, 7, 8.
- Task 3 blocks Tasks 4, 7, 8.
- Task 4 blocks Tasks 7 and 8.
- Task 5 blocks Tasks 4, 6, 7, 8.
- Task 6 blocks Tasks 7 and 8.
- Task 7 blocks Task 8.

### Agent Dispatch Summary (wave → task count → categories)

- Wave 1 → 2 tasks → quick, quick.
- Wave 2 → 2 tasks → visual-engineering, quick.
- Wave 3 → 2 tasks → quick, quick.
- Wave 4 → 1 task → quick.
- Wave 5 → 1 task → visual-engineering plus direct `art-director` critique.

## TODOs

> Implementation + Test = ONE task. Never separate.
> EVERY task MUST have: Agent Profile + Parallelization + QA Scenarios.

- [x] 1. Add persistent high-score utility

  **What to do**: Create `apps/maze-runner/src/game/utils/highScore.ts` with:
  - `export const MAZE_RUNNER_HIGH_SCORE_KEY = "mazeRunnerHighScore"`.
  - `formatScore(score: number): string` returning six-digit zero-padded values for `0 <= score < 1_000_000` and full integer string for larger values.
  - `parseStoredHighScore(value: string | null | undefined): number` returning `0` for null, negative, NaN, Infinity, non-numeric input, and decimal strings such as `"12.7"`; only base-10 integer strings matching `/^\d+$/` are valid.
  - `readHighScore(registry?: { get(key: string): unknown }): number` that tries `localStorage.getItem`, falls back to registry `highScore`, catches storage errors, and never throws.
  - `writeHighScore(score: number, registry?: { get(key: string): unknown; set(key: string, value: unknown): void }): number` that stores only `Math.max(score, existingScore, 0)`, updates registry, catches storage errors, and returns the persisted/effective value.
    Add `apps/maze-runner/tests/utils/highScore.spec.ts` covering formatting, invalid storage, registry fallback, storage unavailable, and preserving larger high scores.

  **Must NOT do**: Do not change scoring values or call this utility from gameplay yet; this task only creates the reusable score contract.

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: focused utility + tests.
  - Skills: [] - No special Phaser/browser skill needed.
  - Omitted: [`phaser-integration-test`] - Pure utility, no Phaser object dependency.

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 3, 5, 6, 7, 8 | Blocked By: none

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `apps/battle-tanks/src/game/scenes/GameOver.ts:52-56` - battle-tanks localStorage high-score precedent.
  - Current behavior: `apps/maze-runner/src/game/scenes/GameOver.ts:136-155` - registry-only high-score logic to replace/centralize later.
  - Test pattern: `apps/maze-runner/tests/utils/settings.spec.ts` - utility spec style.
  - Browser state: `apps/maze-runner/src/PhaserGame.tsx:27-58` - snapshot currently lacks high score.

  **Acceptance Criteria** (agent-executable only):
  - [ ] `bunx nx test maze-runner -- --run tests/utils/highScore.spec.ts` exits 0.
  - [ ] Tests prove empty score formats as `000000`, `1234` as `001234`, `1000000` as `1000000`, invalid storage as `0`, and storage exceptions do not throw.

  **QA Scenarios** (MANDATORY - task incomplete without these):

  ```
  Scenario: Empty high score formats for arcade title
    Tool: Bash
    Steps: Run `bunx nx test maze-runner -- --run tests/utils/highScore.spec.ts`.
    Expected: Spec passes and assertion `formatScore(0) === "000000"` is covered.
    Evidence: .omo/evidence/task-1-high-score-vitest.txt

  Scenario: Corrupt stored high score is safe
    Tool: Bash
    Steps: Run the same spec with localStorage mocked to return `not-a-number` and to throw.
    Expected: `readHighScore()` returns 0 and no exception escapes.
    Evidence: .omo/evidence/task-1-high-score-edge.txt
  ```

  **Commit**: YES | Message: `feat(maze-runner): add high score utility` | Files: [`apps/maze-runner/src/game/utils/highScore.ts`, `apps/maze-runner/tests/utils/highScore.spec.ts`]

- [x] 2. Add shared scene fade transition helper

  **What to do**: Create `apps/maze-runner/src/game/utils/sceneTransitions.ts` with lightweight Phaser camera helpers:
  - `FADE_DURATION_MS = 250` and `FADE_FALLBACK_MS = 350`.
  - `type FadeSceneLike = { cameras?: { main?: { fadeIn?: Function; fadeOut?: Function; once?: Function } }; registry?: { get(key: string): unknown; set(key: string, value: unknown): void }; scene: { start: Function; launch: Function; pause: Function; resume: Function; stop: Function; get?: Function } }`.
  - `type FadeTransitionOptions = { stop?: string[]; pauseCurrent?: boolean; fallbackMs?: number; durationMs?: number }` where shared defaults are `stop: []`, `fallbackMs: FADE_FALLBACK_MS`, `durationMs: FADE_DURATION_MS`; `pauseCurrent` defaults to `true` inside `launchSceneWithFade` only.
  - `const FADE_IN_COMPLETE_EVENT = "camerafadeincomplete"` and `const FADE_OUT_COMPLETE_EVENT = "camerafadeoutcomplete"`; use these exact Phaser camera event names in helper tests and implementation.
  - `fadeInScene(scene: FadeSceneLike, durationMs = FADE_DURATION_MS): void`: set registry `transitionState` to `"fading-in"`; call `scene.cameras.main.fadeIn(durationMs, 0, 0, 0)` if available; listen once for `FADE_IN_COMPLETE_EVENT`; on completion set `transitionState` to `"idle"`. If camera/events are unavailable, set `transitionState` to `"idle"` synchronously.
  - `startSceneWithFade(scene: FadeSceneLike, targetKey: string, data?: unknown, options?: FadeTransitionOptions): void`: set registry `transitionState` to `"fading-out"`; call camera `fadeOut(durationMs, 0, 0, 0)` if available; on fade-out completion or fallback timeout, stop every key in `options.stop`, call `scene.scene.start(targetKey, data)`, and leave `transitionState` as `"fading-out"` for the destination scene's `fadeInScene` to clear.
  - `launchSceneWithFade(scene: FadeSceneLike, targetKey: string, data?: unknown, options?: FadeTransitionOptions): void`: same fade-out lifecycle; on completion, if `options.pauseCurrent ?? true` call `scene.scene.pause()`, then call `scene.scene.launch(targetKey, data)`.
  - `resumeSceneWithFade(scene: FadeSceneLike, resumeKey: string, stopKey: string, options?: FadeTransitionOptions): void`: same fade-out lifecycle; on completion call `scene.scene.resume(resumeKey)`, then `scene.scene.stop(stopKey)`, then if `scene.scene.get?.(resumeKey)` returns a resumed scene with a camera call `fadeInScene(resumedScene, options.durationMs)`.
  - Fade-out completion listens once for `FADE_OUT_COMPLETE_EVENT`. Guard with a `completed` boolean so fallback timeout and event cannot double-run the scene operation.
    All helpers must no-op gracefully if camera fade methods/events are absent in unit mocks by immediately performing the scene operation exactly once.
    Add `apps/maze-runner/tests/utils/sceneTransitions.spec.ts` with camera/event/scene mocks.

  **Must NOT do**: Do not hardcode scene names inside the helper except in tests; caller supplies target keys.

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: focused utility with mock tests.
  - Skills: [] - No browser needed for this helper.
  - Omitted: [`phaser-integration-test`] - Mocks are enough for camera event behavior.

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 3, 4, 6, 7, 8 | Blocked By: none

  **References**:
  - Current immediate start: `apps/maze-runner/src/game/scenes/Title.ts:68-80`.
  - Current Game→GameOver launch: `apps/maze-runner/src/game/scenes/Game.ts:579-592`.
  - Current Pause resume/quit: `apps/maze-runner/src/game/scenes/Pause.ts:72-87`.
  - Battle-tanks transition inspiration: `apps/battle-tanks/src/game/objects/WaveTransition.ts` - use as tween/state-machine inspiration only, not copy.

  **Acceptance Criteria**:
  - [ ] `bunx nx test maze-runner -- --run tests/utils/sceneTransitions.spec.ts` exits 0.
  - [ ] Tests cover normal fade-complete path and no-camera fallback path for start, launch, and resume helpers.

  **QA Scenarios**:

  ```
  Scenario: Fade helper starts target after fade-out
    Tool: Bash
    Steps: Run `bunx nx test maze-runner -- --run tests/utils/sceneTransitions.spec.ts`.
    Expected: Mock `fadeOut` called before mock `scene.start("Game")`.
    Evidence: .omo/evidence/task-2-transition-helper-vitest.txt

  Scenario: Fade helper cannot strand scene when camera events are absent
    Tool: Bash
    Steps: Run fallback spec where camera has no `once`/fade events.
    Expected: Target scene operation still occurs exactly once.
    Evidence: .omo/evidence/task-2-transition-helper-fallback.txt
  ```

  **Commit**: YES | Message: `feat(maze-runner): add scene fade helpers` | Files: [`apps/maze-runner/src/game/utils/sceneTransitions.ts`, `apps/maze-runner/tests/utils/sceneTransitions.spec.ts`]

- [x] 3. Rework Title scene into Pac-Man-cabinet attract screen

  **What to do**: Update `apps/maze-runner/src/game/scenes/Title.ts`:
  - Import `readHighScore`, `formatScore`, and `fadeInScene`.
  - Set background black and call `fadeInScene(this)` at create start.
  - Replace cyan title with layered `MAZE RUNNER` text at `height * 0.25`: main text `#ffff00`, stroke `#664400`, stroke thickness `3`; glow layer behind it in `#ffff00`, alpha `0.25`, depth 99, pulsing via `Sine.easeInOut` like battle-tanks.
  - Add high-score text under subtitle: `HIGH SCORE: ${formatScore(readHighScore(this.registry))}` in pale pellet color `#ffffcc`.
  - Add animated background using Phaser graphics/text only:
    1. Blue maze rail frame: static rounded/rectangular maze-like rails in `0x0000ff` with softer highlight `0x4444ff` based on existing wall colors.
    2. Pellet trail: 18-30 tiny `0xffffcc` circles along a horizontal/curved route; tween alpha/scale in staggered loop to create movement.
    3. Attract loop: simple yellow circle/player and 3-4 colored ghost circles/rounded shapes moving on a tweened path behind text at low alpha/depth; do not use copyrighted names.
    4. CRT restraint: add scanline graphics at alpha `0.06` and a subtle vignette rectangle at alpha `0.12`; both must sit behind text and not reduce readability.
  - Update `apps/maze-runner/public/assets/vector/player.svg` body fill from `#998400` to `#ffff00`; keep stroke `#ffaa00`, `data-anim-chomp`, `data-direction-rotation`, and `socket_exhaust` unchanged.
  - Preserve `PRESS SPACE TO START` and `ARROW KEYS / WASD - MOVE` copy unless positioning changes are needed for high-score line.
  - Replace direct `this.scene.start("Game")` with `startSceneWithFade(this, "Game")` from Task 2.
  - Preserve test auto-start query behavior, but route it through the fade helper after the 500ms delayed call.
  - Add Enter and pointer/click start handlers for battle-tanks parity; all three start paths (SPACE, Enter, pointerdown) must use the same fade helper.

  **Must NOT do**: Do not load new assets. Do not use exact Pac-Man title/cabinet art. Do not obscure start/high-score text with animations.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: UI/animation design and Phaser scene layout.
  - Skills: [`frontend-ui-ux`] - Visual polish and readability guidance.
  - Omitted: [`vector-sprite-pipeline`] - No new SVG asset creation.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: 4, 7, 8 | Blocked By: 1, 2

  **References**:
  - Current Title scene: `apps/maze-runner/src/game/scenes/Title.ts:9-84`.
  - Battle-tanks layered glow text: `apps/battle-tanks/src/game/scenes/Title.ts:64-93`.
  - Battle-tanks start prompt tween: `apps/battle-tanks/src/game/scenes/Title.ts:104-123`.
  - Maze wall/pellet colors: `apps/maze-runner/src/game/scenes/Boot.ts:19-31`, `apps/maze-runner/src/game/scenes/Boot.ts:57-73`, `apps/maze-runner/src/game/scenes/Game.ts:469-516`.
  - Production player palette: `apps/maze-runner/public/assets/vector/player.svg:1-6`; use `#ffff00` as title yellow per user decision/test fixture parity.
  - Existing Title tests: `apps/maze-runner/tests/scenes/Title.spec.ts:60-121`.

  **Acceptance Criteria**:
  - [ ] `bunx nx test maze-runner -- --run tests/scenes/Title.spec.ts` exits 0.
  - [ ] Title spec asserts title text uses `#ffff00`, high score text uses formatted score, SPACE calls fade transition helper/scene start path, and auto-start still schedules delayed transition when `?test=1` exists.
  - [ ] Browser screenshot at `http://localhost:4200/` shows yellow title, high-score line, visible prompt, blue maze/pellet/ghost background, and no console errors.

  **QA Scenarios**:

  ```
  Scenario: Title renders required arcade elements
    Tool: Bash
    Steps: Run `bunx nx test maze-runner -- --run tests/scenes/Title.spec.ts`.
    Expected: Unit test observes `MAZE RUNNER` color `#ffff00`, `HIGH SCORE: 000000`, and prompt text creation.
    Evidence: .omo/evidence/task-3-title-unit.txt

  Scenario: HMR title screen is readable and themed
    Tool: Chrome DevTools
    Steps: Open running `http://localhost:4200/`, clear console, capture screenshot.
    Expected: Yellow title, high-score line, start prompt, blue rails, pellet trail, ghost/player attract loop visible; console error count is 0.
    Evidence: .omo/evidence/task-3-title-browser.png
  ```

  **Commit**: YES | Message: `feat(maze-runner): redesign title screen` | Files: [`apps/maze-runner/src/game/scenes/Title.ts`, `apps/maze-runner/public/assets/vector/player.svg`, `apps/maze-runner/tests/scenes/Title.spec.ts`]

- [x] 4. Apply fade transitions to all scene paths

  **What to do**: Update scenes to use Task 2 helper:
  - `Boot.create()`: keep `this.scene.start("Title")` after `EventBus.emit`; Boot has no visible content, so Boot→Title transition scope is explicitly “Title fades in after Boot start,” implemented by Task 3's `fadeInScene(this)` call at the top of `Title.create()`.
  - `Title.create()`: verify SPACE, Enter, pointerdown, and test auto-start all use `startSceneWithFade(this, "Game")`; Task 3 owns Title visual/start-handler edits, so Task 4 should only adjust tests/mocks if Task 3 already changed Title.
  - `Game.create()`: call `fadeInScene(this)` after camera/background setup so Title→Game and GameOver→Game restart have fade-in.
  - `Game.loseLife()`: when lives reach 0, use `launchSceneWithFade(this, "GameOver", { score, killerGhostId }, { pauseCurrent: true })` instead of immediate pause+launch.
  - `GameOver.create()`: call `fadeInScene(this)`; restart uses `startSceneWithFade(this, "Game", undefined, { stop: ["Game", "GameOver"] })`; menu uses `startSceneWithFade(this, "Title", undefined, { stop: ["Game", "GameOver"] })`.
  - `Pause.create()`: call `fadeInScene(this)` after overlay creation; ESC uses `resumeSceneWithFade(this, "Game", "Pause")`; Q uses `startSceneWithFade(this, "Title", undefined, { stop: ["Game", "Pause"] })`. Keep V vector mode toggle immediate.
  - Add/update tests for affected scene handlers.

  **Must NOT do**: Do not add fade to every `nextLevel()` countdown; user requested scene transitions, not in-level progression.

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: targeted scene call-site replacement and tests.
  - Skills: [`phaser-integration-test`] - Phaser scene handler behavior touches scene objects/mocks.
  - Omitted: [`phaser-e2e-test`] - Browser verification is Task 8.

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: 7, 8 | Blocked By: 2, 3, 5

  **References**:
  - Boot immediate start: `apps/maze-runner/src/game/scenes/Boot.ts:76-88`.
  - Title immediate start: `apps/maze-runner/src/game/scenes/Title.ts:68-80`.
  - Game create and pause launch GameOver: `apps/maze-runner/src/game/scenes/Game.ts:74-203`, `apps/maze-runner/src/game/scenes/Game.ts:579-592`.
  - GameOver restart/menu: `apps/maze-runner/src/game/scenes/GameOver.ts:183-195`.
  - Pause resume/quit: `apps/maze-runner/src/game/scenes/Pause.ts:72-87`.
  - Existing tests: `apps/maze-runner/tests/scenes/Boot.spec.ts:93-116`, `apps/maze-runner/tests/scenes/Pause.spec.ts:121-154`.

  **Acceptance Criteria**:
  - [ ] Scene tests prove transition helpers are called or resulting mocked camera/scene operations occur for all scoped paths.
  - [ ] `bunx nx test maze-runner -- --run tests/scenes/Boot.spec.ts tests/scenes/Title.spec.ts tests/scenes/Pause.spec.ts tests/game/GameOver.spec.ts tests/scenes/Game.spec.ts` exits 0.

  **QA Scenarios**:

  ```
  Scenario: Keyboard scene transitions use fade paths
    Tool: Bash
    Steps: Run scoped scene specs for Boot/Title/Pause/GameOver/Game.
    Expected: Tests pass and assert no direct immediate transition remains for scoped paths.
    Evidence: .omo/evidence/task-4-transition-unit.txt

  Scenario: Pause vector toggle remains immediate
    Tool: Bash
    Steps: Run `bunx nx test maze-runner -- --run tests/scenes/Pause.spec.ts`.
    Expected: V still emits `vector-mode-changed`; ESC/Q use fade/resume/start paths.
    Evidence: .omo/evidence/task-4-pause-edge.txt
  ```

  **Commit**: YES | Message: `feat(maze-runner): fade scene transitions` | Files: [`apps/maze-runner/src/game/scenes/Boot.ts`, `apps/maze-runner/src/game/scenes/Title.ts`, `apps/maze-runner/src/game/scenes/Game.ts`, `apps/maze-runner/src/game/scenes/GameOver.ts`, `apps/maze-runner/src/game/scenes/Pause.ts`, relevant tests]

- [x] 5. Move GameOver high-score behavior to persistent utility

  **What to do**: Update `apps/maze-runner/src/game/scenes/GameOver.ts`:
  - Import `readHighScore`, `writeHighScore`, and `formatScore`.
  - In `create()`, compute previous high score with `readHighScore(this.registry)`.
  - If final score beats previous high score, call `writeHighScore(this.finalScore, this.registry)`, show pulsing `NEW HIGH SCORE!` at `height * 0.74`, show `HIGH SCORE: ${formatScore(newScore)}` at `height * 0.79`, set restart prompt to `height * 0.87`, and set menu prompt to `height * 0.93`.
  - Else show `HIGH SCORE: ${formatScore(previousHighScore)}`.
  - Restart/menu handlers must not manually compute registry highScore anymore; persistence belongs in utility.
  - Keep killer presentation and VectorPuppet behavior unchanged.
    Add/update GameOver tests for new/old high score, formatted display, storage fallback, restart/menu transition calls.

  **Must NOT do**: Do not remove killer ghost copy or ghost puppet animation.

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: focused scene integration and tests.
  - Skills: [`phaser-integration-test`] - Scene tests with mocks.
  - Omitted: [`phaser-e2e-test`] - Browser high-score verification is Task 8.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: 4, 6, 7, 8 | Blocked By: 1, 2

  **References**:
  - Current registry-only high score: `apps/maze-runner/src/game/scenes/GameOver.ts:136-155`.
  - Current restart/menu handlers: `apps/maze-runner/src/game/scenes/GameOver.ts:183-195`.
  - Battle-tanks localStorage precedent: `apps/battle-tanks/src/game/scenes/GameOver.ts:52-84`.
  - Existing killer-copy tests: `apps/maze-runner/tests/game/GameOver.spec.ts`.

  **Acceptance Criteria**:
  - [ ] `bunx nx test maze-runner -- --run tests/game/GameOver.spec.ts tests/utils/highScore.spec.ts` exits 0.
  - [ ] Tests prove a final score of 1200 stores/displays `001200`, a lower score preserves existing `002000`, and storage errors still render safely.

  **QA Scenarios**:

  ```
  Scenario: New high score persists from GameOver
    Tool: Bash
    Steps: Run GameOver and highScore specs with localStorage mock.
    Expected: `mazeRunnerHighScore` receives the final score and display text is zero-padded.
    Evidence: .omo/evidence/task-5-gameover-high-score.txt

  Scenario: Lower final score does not overwrite high score
    Tool: Bash
    Steps: Run spec with existing high score greater than final score.
    Expected: Stored value remains unchanged and display uses existing formatted score.
    Evidence: .omo/evidence/task-5-gameover-lower-score.txt
  ```

  **Commit**: YES | Message: `feat(maze-runner): persist high score` | Files: [`apps/maze-runner/src/game/scenes/GameOver.ts`, `apps/maze-runner/tests/game/GameOver.spec.ts`]

- [x] 6. Expose title/high-score/transition observability in browser harness

  **What to do**: Update `apps/maze-runner/src/PhaserGame.tsx` `getStateSnapshot()`:
  - Create `apps/maze-runner/src/game/utils/harnessSnapshot.ts` exporting `getMazeRunnerStateSnapshot(gameInstance: any)` and move the current snapshot construction from `PhaserGame.tsx` into that helper.
  - Include `activeScenes`: active scene keys from `gameInstance.scene.getScenes(true)`.
  - Include `highScore`: `readHighScore(registry)` using the active Game scene registry when present, otherwise the first active scene registry.
  - Include `formattedHighScore` via `formatScore`.
  - Include `transitionState`: registry `transitionState` or `"idle"`.
  - Preserve existing `player`, `enemies`, `score`, `lives`, `level`, `collectibles`, `pen`, and `scene` fields when Game/player exists.
  - If no Game scene/player exists (Title screen), snapshot must still return high score and active scene info instead of `{}`.
  - Update `PhaserGame.tsx` to import/use `getMazeRunnerStateSnapshot`.
  - Add `apps/maze-runner/tests/utils/harnessSnapshot.spec.ts` covering title-only and active-game snapshots.

  **Must NOT do**: Do not remove `window.__TEST__` or `window.__PHASER_BRIDGE__`; do not rename existing snapshot fields.

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: small observability/refactor task.
  - Skills: [] - Browser use deferred to Task 8.
  - Omitted: [`link-workspace-packages`] - No new package dependency.

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: 7, 8 | Blocked By: 1, 2, 5

  **References**:
  - Current snapshot early return: `apps/maze-runner/src/PhaserGame.tsx:27-58`.
  - Harness creation: `apps/maze-runner/src/PhaserGame.tsx:103-119`.
  - Dev-only bridge setup: `apps/maze-runner/src/PhaserGame.tsx:199-201`.
  - Cleanup: `apps/maze-runner/src/PhaserGame.tsx:122-127`, `apps/maze-runner/src/PhaserGame.tsx:215-222`.

  **Acceptance Criteria**:
  - [ ] On Title screen in browser, `window.__PHASER_BRIDGE__.state()` or `window.__TEST__.state()` returns `formattedHighScore: "000000"` and includes `activeScenes` containing `Title`.
  - [ ] Existing game state fields still appear after starting Game.
  - [ ] `bunx nx typecheck maze-runner` exits 0.

  **QA Scenarios**:

  ```
  Scenario: Title snapshot exposes high score
    Tool: Chrome DevTools
    Steps: Open `http://localhost:4200/`, evaluate `window.__PHASER_BRIDGE__.state()`.
    Expected: Result includes active Title scene and formattedHighScore `000000` when storage cleared.
    Evidence: .omo/evidence/task-6-title-bridge-state.json

  Scenario: Game snapshot remains backward compatible
    Tool: Chrome DevTools
    Steps: Press Space/start game, evaluate state again.
    Expected: Existing score/lives/level/player fields remain present; high score fields also present.
    Evidence: .omo/evidence/task-6-game-bridge-state.json
  ```

  **Commit**: YES | Message: `test(maze-runner): expose high score in harness` | Files: [`apps/maze-runner/src/PhaserGame.tsx`, `apps/maze-runner/src/game/utils/harnessSnapshot.ts`, `apps/maze-runner/tests/utils/harnessSnapshot.spec.ts`]

- [x] 7. Complete focused regression test pass

  **What to do**: Add/update unit tests after Tasks 1-6 so the exact requested behavior is covered:
  - `Title.spec.ts`: title color, high-score display, background element creation counts/types, SPACE/test auto-start fade path.
  - `Boot.spec.ts`: Boot still starts Title after boot setup and `fontFamily` is still set; `Title.spec.ts` covers the Title fade-in that represents Boot→Title visual fade.
  - `Pause.spec.ts`: ESC/Q fade behavior and V toggle unchanged.
  - `Game.spec.ts`: final life path launches GameOver through fade helper with `{ score, killerGhostId }` intact; do not over-test private gameplay internals.
  - `GameOver.spec.ts`: persistent high-score formatting and transition handlers.
  - Utility specs from Tasks 1-2.
    Then run full Maze Runner test/lint/typecheck.

  **Must NOT do**: Do not weaken existing assertions to pass; update mocks to reflect new behavior.

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: test consolidation and verification.
  - Skills: [`phaser-unit-test`, `phaser-integration-test`] - Mix of utility and scene mocks.
  - Omitted: [`phaser-e2e-test`] - Browser QA in Task 8.

  **Parallelization**: Can Parallel: NO | Wave 4 | Blocks: 8 | Blocked By: 3, 4, 5, 6

  **References**:
  - Vitest include/setup: `apps/maze-runner/vite.config.mts:60-72`.
  - Existing Title tests: `apps/maze-runner/tests/scenes/Title.spec.ts:98-121`.
  - Existing Pause tests: `apps/maze-runner/tests/scenes/Pause.spec.ts:107-154`.
  - Existing Boot tests: `apps/maze-runner/tests/scenes/Boot.spec.ts:87-116`.
  - Existing mock scene helper: `apps/maze-runner/tests/helpers/createMockScene.ts:1-153`.

  **Acceptance Criteria**:
  - [ ] `bunx nx test maze-runner` exits 0.
  - [ ] `bunx nx lint maze-runner` exits 0 with no new errors.
  - [ ] `bunx nx typecheck maze-runner` exits 0.

  **QA Scenarios**:

  ```
  Scenario: Full unit regression passes
    Tool: Bash
    Steps: Run `bunx nx test maze-runner`.
    Expected: All Maze Runner tests pass.
    Evidence: .omo/evidence/task-7-test-output.txt

  Scenario: Static checks pass
    Tool: Bash
    Steps: Run `bunx nx lint maze-runner` and `bunx nx typecheck maze-runner`.
    Expected: Both commands exit 0; warnings, if any, are pre-existing and summarized.
    Evidence: .omo/evidence/task-7-static-checks.txt
  ```

  **Commit**: YES | Message: `test(maze-runner): cover title transitions and high score` | Files: [`apps/maze-runner/tests/scenes/Title.spec.ts`, `apps/maze-runner/tests/scenes/Boot.spec.ts`, `apps/maze-runner/tests/scenes/Pause.spec.ts`, `apps/maze-runner/tests/scenes/Game.spec.ts`, `apps/maze-runner/tests/game/GameOver.spec.ts`, `apps/maze-runner/tests/utils/highScore.spec.ts`, `apps/maze-runner/tests/utils/sceneTransitions.spec.ts`, `apps/maze-runner/tests/utils/harnessSnapshot.spec.ts`, `apps/maze-runner/tests/helpers/createMockScene.ts`]

- [x] 8. Run Chrome DevTools visual QA and art-director critique loop

  **What to do**:
  - Use the existing running HMR game at `http://localhost:4200/`; do not start another server unless the page is unreachable.
  - In Chrome DevTools, clear `localStorage.mazeRunnerHighScore`, reload, screenshot title as `.omo/evidence/task-8-title-empty.png`.
  - Set `localStorage.mazeRunnerHighScore = "1234"`, reload, screenshot title as `.omo/evidence/task-8-title-existing-score.png`.
  - Verify via DevTools evaluate that title/high-score text exists, state exposes `formattedHighScore`, and console errors are 0.
  - Press SPACE and capture Title→Game transition evidence: screenshot before pressing, screenshot at approximately 125ms after press, screenshot at approximately 350ms after press, and evaluate active scenes before/after.
  - Use DevTools runtime access to trigger GameOver deterministically after starting Game: evaluate `const game = window.__PHASER_BRIDGE__.game(); const scene = game.scene.getScene('Game'); scene.livesValue = 1; scene.loseLife();` then step/wait until GameOver is active. Use existing bridge/test commands only for supplemental checks.
  - Verify GameOver→Title: from GameOver, press `M`; capture screenshots at approximately 125ms and 350ms; evaluate active scenes and confirm Title is active with no black screen.
  - Verify GameOver→Game restart: trigger GameOver again, press SPACE; capture screenshots at approximately 125ms and 350ms; evaluate active scenes and confirm Game is active.
  - Verify Pause resume: start Game, press ESC to open Pause, press ESC again; capture 125ms/350ms screenshots and confirm Game is active/resumed.
  - Verify Pause quit→Title: open Pause, press `Q`; capture 125ms/350ms screenshots and confirm Title is active.
  - Send screenshots to `task(subagent_type="art-director")` with prompt asking for critique against Pac-Man cabinet homage, yellow title, readability, motion/theme, and CRT restraint.
  - If Art Director returns required changes, implement them, re-run screenshots, and re-submit until approved.

  **Must NOT do**: Do not mark this task complete without screenshot evidence and art-director approval/critique resolution.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: browser QA plus visual polish.
  - Skills: [`frontend-ui-ux`] - UI critique guidance; use Chrome DevTools tools directly for browser QA per user requirement.
  - Omitted: [`vector-sprite-pipeline`] - No new vector assets expected.

  **Parallelization**: Can Parallel: NO | Wave 5 | Blocks: none | Blocked By: 3, 4, 5, 6, 7

  **References**:
  - Dev server convention: `apps/maze-runner/vite.config.mts:10-13`.
  - Browser world default URL: `apps/maze-runner/support/world.ts:5-10`.
  - Cucumber config: `apps/maze-runner/cucumber.cjs:1-19`.
  - Bridge registration: `apps/maze-runner/src/PhaserGame.tsx:103-119`.
  - User-required browser tool: Chrome DevTools with game already running in HMR.

  **Acceptance Criteria**:
  - [ ] Browser console has 0 errors on title, during Title→Game, during Game→GameOver, during GameOver→Title, during GameOver→Game restart, during Pause resume, and during Pause quit→Title.
  - [ ] Empty high score screenshot visibly shows `HIGH SCORE: 000000`.
  - [ ] Existing score screenshot visibly shows `HIGH SCORE: 001234`.
  - [ ] Title screenshot shows yellow `MAZE RUNNER`, blue rails, pellet trail, ghost/player attract animation, and readable start prompt.
  - [ ] Art Director response is saved/summarized and all required fixes are resolved.

  **QA Scenarios**:

  ```
  Scenario: Empty high-score title browser QA
    Tool: Chrome DevTools
    Steps: Clear localStorage key `mazeRunnerHighScore`, reload `http://localhost:4200/`, take screenshot, evaluate bridge state and console errors.
    Expected: Screenshot shows `HIGH SCORE: 000000`, yellow title, visible start prompt; bridge formattedHighScore is `000000`; console errors are 0.
    Evidence: .omo/evidence/task-8-title-empty.png and .omo/evidence/task-8-title-empty-state.json

  Scenario: Existing high-score title browser QA
    Tool: Chrome DevTools
    Steps: Set localStorage key `mazeRunnerHighScore` to `1234`, reload, screenshot and evaluate title state.
    Expected: Screenshot/text/state show `HIGH SCORE: 001234`.
    Evidence: .omo/evidence/task-8-title-existing-score.png and .omo/evidence/task-8-title-existing-state.json

  Scenario: All scoped scene transitions fade without stranding scenes
    Tool: Chrome DevTools
    Steps: Exercise Title→Game, Game→GameOver, GameOver→Title, GameOver→Game restart, Pause resume, and Pause quit→Title using keyboard/runtime steps above; capture 125ms and 350ms screenshots for each path and evaluate active scenes after each transition.
    Expected: Each path shows fade evidence mid-transition, lands on the expected scene, and never leaves a black/stuck screen; console errors are 0.
    Evidence: .omo/evidence/task-8-transition-matrix.md plus referenced screenshots

  Scenario: Art director visual critique loop
    Tool: task(subagent_type="art-director")
    Steps: Provide screenshots from empty/existing score title and transition frame evidence; request critique against plan requirements.
    Expected: Art Director returns APPROVED or required changes; if changes required, they are applied and reviewed again.
    Evidence: .omo/evidence/task-8-art-director.md
  ```

  **Commit**: YES | Message: `feat(maze-runner): polish title screen visuals` | Files: [changed source/tests plus `.omo/evidence/*` not committed unless repo policy allows evidence commits]

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.
> **Do NOT auto-proceed after verification. Wait for user's explicit approval before marking work complete.**
> **Never mark F1-F4 as checked before getting user's okay.** Rejection or user feedback -> fix -> re-run -> present again -> wait for okay.

- [x] F1. Plan Compliance Audit — oracle
- [x] F2. Code Quality Review — unspecified-high
- [x] F3. Real Manual QA — unspecified-high (+ Chrome DevTools)
- [x] F4. Scope Fidelity Check — deep

## Commit Strategy

- Commit after each task if the workspace is green for that task's scoped verification.
- Use conventional messages listed per task.
- Do not commit `.omo/evidence/*` unless project policy or user explicitly requests evidence artifacts in git.
- Before any commit: inspect `git status`, `git diff`, and `git log --oneline -10`; stage only intended files.

## Success Criteria

- Title screen clearly reads as Maze Runner arcade-cabinet homage while staying original.
- Title text is player-yellow `#ffff00` and no longer cyan.
- High score is visible on Title and GameOver, persistent across reloads, safe under invalid/unavailable localStorage, and formatted as decided.
- Scene transitions fade in/out for scoped paths without breaking controls, test mode, HMR, or browser bridge.
- All unit/static/browser checks pass.
- Art Director critique is addressed and final verification agents approve before user signoff.
