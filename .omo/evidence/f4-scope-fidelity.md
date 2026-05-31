# F4 Scope Fidelity Check: ghost-pen-vulnerability

## Verdict

**REJECT**

The current working tree does **not** preserve the requested scope. The required `git diff --stat` shows **91 tracked files changed** with **3,098 insertions** and **5,380 deletions**, far beyond the allowed files. `git status --short` also shows many untracked directories/files for new agents, skills, browser/E2E infrastructure, game assets/configs, new apps, and new libs.

## Commands/evidence reviewed

- `GIT_MASTER=1 git diff --stat`
- `GIT_MASTER=1 git diff --name-status`
- `GIT_MASTER=1 git status --short`
- Diffs/read pass for changed source/config files including:
  - `apps/maze-runner/src/game/utils/MazeGenerator.ts`
  - `apps/maze-runner/src/game/objects/Enemy.ts`
  - `apps/maze-runner/src/game/scenes/Game.ts`
  - `apps/maze-runner/src/game/objects/Player.ts`
  - `apps/maze-runner/src/game/ai/{Ambusher,Chaser,Timid,Wanderer}.ts`
  - `apps/maze-runner/src/{PhaserGame.tsx,game/scenes/Boot.ts,game/scenes/GameOver.ts,game/scenes/Title.ts}`
  - package/config/library files: `package.json`, `bun.lock`, `tsconfig.json`, `nx.json`, app tsconfig/vite config, shader/typed-event-emitter configs.

## Required allowlist assessment

| File/pattern                                         | Assessment                                                                                                                                                                                                                                                                    |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/maze-runner/src/game/utils/MazeGenerator.ts`   | **FAIL**. This is not a gate flip only. It replaces the maze algorithm with an open-first topology algorithm, adds protected-cell helpers, sparse wall placement, invariant validation, repair/fallback logic, seeded RNG, open-ratio rules, and no-dead-end contracts.       |
| `apps/maze-runner/src/game/objects/Enemy.ts`         | **PARTIAL/FAIL**. It does add frightened/dead primitives, but also changes base class from `GameObjects.Sprite` to `VectorPuppet`, imports `@neon-cabinet/sprite-tools`, changes physics/body setup, animation implementation, direction internals, and movement behavior.    |
| `apps/maze-runner/src/game/scenes/Game.ts`           | **FAIL**. It integrates frightened/dead handling but also adds dynamic ghost definitions/config architecture, countdown flow, rounded wall rendering, player invincibility/death-sequence state, respawn changes, GameOver killer payloads, and active ghost rebuilding.      |
| `apps/maze-runner/tests/objects/Enemy.spec.ts`       | **PARTIAL/FAIL**. Some tests cover frightened/dead primitives, but it also expands vector mocks and custom AI profile tests unrelated to ghost-pen vulnerability.                                                                                                             |
| `apps/maze-runner/tests/scenes/Game.spec.ts`         | Not present in tracked diff; likely under untracked `apps/maze-runner/tests/scenes/`, which was not part of `git diff --stat`.                                                                                                                                                |
| `apps/maze-runner/tests/utils/MazeGenerator.spec.ts` | **FAIL**. Tests were rewritten around the new maze topology algorithm and invariants, not just gate flip coverage.                                                                                                                                                            |
| Browser test support files (Task 5)                  | **PARTIAL**. Some untracked files under `apps/maze-runner/features/`, `step-definitions/`, `support/`, `playwright.config.ts`, and `cucumber.cjs` may be browser support, but the scope also adds broader framework/library infrastructure and many unrelated untracked dirs. |

## Specific “NO changes to” checks

| Constraint                                         | Result                                                                                                                                                                                                                                                                               |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| No scoring beyond +200 preservation                | **No direct extra ghost-eat score found** in inspected `Game.ts`; the frightened collision still adds `200`. However, this does not salvage the scope because many other areas changed.                                                                                              |
| No player life handling changes                    | **FAIL**. `Game.ts` adds `playerInvincible`, `deathSequenceActive`, changed `loseLife(killer?)`, `respawnPlayer()`, invulnerability timing, GameOver killer payloads. `Player.ts` rewrites death/respawn/invulnerability behavior.                                                   |
| No maze dimensions or generation algorithm changes | **FAIL**. Dimensions formula remains, but generation algorithm is replaced wholesale in `MazeGenerator.ts`.                                                                                                                                                                          |
| No new test frameworks                             | **FAIL**. `bun.lock` includes new Cucumber/Playwright-related packages; untracked `apps/maze-runner/cucumber.cjs`, `apps/maze-runner/playwright.config.ts`, `features/`, `step-definitions/`, and test harness dirs exist.                                                           |
| No library architecture changes                    | **FAIL**. `tsconfig.json` adds references for `libs/phaser-debug-bridge`, `libs/browser-test-runner`, `libs/phaser-test-harness`, `libs/sprite-tools`, and `apps/vector-studio`; root/package config changes include TypeScript 6 and `swc-loader`; untracked libs/apps are present. |
| No unrelated files                                 | **FAIL**. `.opencode` deletions/additions, `openspec` deletions, shader import-order edits, root Nx/package/tsconfig changes, app scene/player changes, and multiple untracked dirs are unrelated to the requested implementation scope.                                             |

## Changed tracked files from `git diff --stat` with assessment

### Allowed path but scope exceeded

- `apps/maze-runner/src/game/utils/MazeGenerator.ts` — **FAIL**, full maze-generation algorithm rewrite, not gate flip only.
- `apps/maze-runner/src/game/objects/Enemy.ts` — **PARTIAL/FAIL**, primitives plus vector/library/base-class architecture changes.
- `apps/maze-runner/src/game/scenes/Game.ts` — **FAIL**, integration plus unrelated life handling, countdown, rendering, dynamic ghost architecture.
- `apps/maze-runner/tests/objects/Enemy.spec.ts` — **PARTIAL/FAIL**, includes primitive tests plus unrelated vector/AI-profile coverage.
- `apps/maze-runner/tests/utils/MazeGenerator.spec.ts` — **FAIL**, validates new maze topology algorithm rather than only gate flip.

### Test/support files with questionable or failed scope

- `apps/maze-runner/tests/helpers/createMockScene.ts` — **QUESTIONABLE**, support changes for vector mocks; not in explicit test allowlist except possibly indirect support.
- `apps/maze-runner/tests/objects/Player.spec.ts` — **FAIL**, Player test changes are outside allowlist and tied to player/vector behavior.
- `apps/maze-runner/vite.config.mts` — **QUESTIONABLE**, may support tests, but not verified as strictly Task 5 browser support.

### Gameplay/source files outside allowlist

- `apps/maze-runner/src/PhaserGame.tsx` — **QUESTIONABLE/FAIL**, debug bridge and harness commands may support browser QA but expose broad runtime test bridge behavior.
- `apps/maze-runner/src/game/ai/Ambusher.ts` — **FAIL**, AI constructor/profile behavior changed outside allowlist.
- `apps/maze-runner/src/game/ai/Chaser.ts` — **FAIL**, constructor signature changed outside allowlist.
- `apps/maze-runner/src/game/ai/Timid.ts` — **FAIL**, AI threshold/profile behavior changed outside allowlist.
- `apps/maze-runner/src/game/ai/Wanderer.ts` — **FAIL**, vector-scale AI behavior changed outside allowlist.
- `apps/maze-runner/src/game/objects/Player.ts` — **FAIL**, player architecture, movement, death, respawn, and invulnerability changed.
- `apps/maze-runner/src/game/scenes/Boot.ts` — **FAIL**, asset/animation pipeline changed from generated textures to SVG/vector loading.
- `apps/maze-runner/src/game/scenes/GameOver.ts` — **FAIL**, GameOver payload/copy/vector display changed.
- `apps/maze-runner/src/game/scenes/Title.ts` — **QUESTIONABLE**, test query auto-start support may be browser-test support, but it is outside listed source allowlist.

### Package/config/library architecture changes

- `apps/maze-runner/package.json` — **FAIL**, package/test dependencies/scripts changed outside source allowlist.
- `apps/maze-runner/tsconfig.lib.json` — **FAIL**, TS config changed outside allowlist.
- `bun.lock` — **FAIL**, lockfile adds new framework/library dependencies including Cucumber/Playwright-related packages and TypeScript 6.
- `libs/shaders/src/shaders/CRTShader.ts` — **FAIL**, unrelated library file import-order change.
- `libs/shaders/src/shaders/VectorShader.ts` — **FAIL**, unrelated library file import-order change.
- `libs/typed-event-emitter/tsconfig.lib.json` — **FAIL**, unrelated library tsconfig change.
- `nx.json` — **FAIL**, workspace generator/config formatting and web generator defaults changed.
- `package.json` — **FAIL**, root package name changed, TypeScript upgraded to `^6.0.3`, `swc-loader` added.
- `tsconfig.json` — **FAIL**, new project references added for new libs/app architecture.

### Deleted `.opencode` files — unrelated

- `.opencode/commands/opsx-apply.md` — **FAIL**, unrelated deletion.
- `.opencode/commands/opsx-archive.md` — **FAIL**, unrelated deletion.
- `.opencode/commands/opsx-explore.md` — **FAIL**, unrelated deletion.
- `.opencode/commands/opsx-propose.md` — **FAIL**, unrelated deletion.
- `.opencode/opencode-swarm.json` — **FAIL**, unrelated deletion.
- `.opencode/skills/openspec-apply-change/SKILL.md` — **FAIL**, unrelated deletion.
- `.opencode/skills/openspec-archive-change/SKILL.md` — **FAIL**, unrelated deletion.
- `.opencode/skills/openspec-explore/SKILL.md` — **FAIL**, unrelated deletion.
- `.opencode/skills/openspec-propose/SKILL.md` — **FAIL**, unrelated deletion.

### Deleted OpenSpec files — unrelated

- `openspec/changes/add-unit-tests/.openspec.yaml` — **FAIL**, unrelated deletion.
- `openspec/changes/add-unit-tests/design.md` — **FAIL**, unrelated deletion.
- `openspec/changes/add-unit-tests/proposal.md` — **FAIL**, unrelated deletion.
- `openspec/changes/add-unit-tests/specs/collectibles/spec.md` — **FAIL**, unrelated deletion.
- `openspec/changes/add-unit-tests/specs/enemy-ai/spec.md` — **FAIL**, unrelated deletion.
- `openspec/changes/add-unit-tests/specs/event-bus/spec.md` — **FAIL**, unrelated deletion.
- `openspec/changes/add-unit-tests/specs/pathfinder/spec.md` — **FAIL**, unrelated deletion.
- `openspec/changes/add-unit-tests/specs/settings-utils/spec.md` — **FAIL**, unrelated deletion.
- `openspec/changes/add-unit-tests/tasks.md` — **FAIL**, unrelated deletion.
- `openspec/changes/archive/2026-05-24-add-comprehensive-animations/.openspec.yaml` — **FAIL**, unrelated deletion.
- `openspec/changes/archive/2026-05-24-add-comprehensive-animations/design.md` — **FAIL**, unrelated deletion.
- `openspec/changes/archive/2026-05-24-add-comprehensive-animations/proposal.md` — **FAIL**, unrelated deletion.
- `openspec/changes/archive/2026-05-24-add-comprehensive-animations/specs/ghost-animations/spec.md` — **FAIL**, unrelated deletion.
- `openspec/changes/archive/2026-05-24-add-comprehensive-animations/specs/pickup-effects/spec.md` — **FAIL**, unrelated deletion.
- `openspec/changes/archive/2026-05-24-add-comprehensive-animations/specs/player-animations/spec.md` — **FAIL**, unrelated deletion.
- `openspec/changes/archive/2026-05-24-add-comprehensive-animations/specs/power-pellet-effects/spec.md` — **FAIL**, unrelated deletion.
- `openspec/changes/archive/2026-05-24-add-comprehensive-animations/tasks.md` — **FAIL**, unrelated deletion.
- `openspec/changes/archive/2026-05-24-fenced-enemy-spawn/.openspec.yaml` — **FAIL**, unrelated deletion.
- `openspec/changes/archive/2026-05-24-fenced-enemy-spawn/design.md` — **FAIL**, unrelated deletion.
- `openspec/changes/archive/2026-05-24-fenced-enemy-spawn/proposal.md` — **FAIL**, unrelated deletion.
- `openspec/changes/archive/2026-05-24-fenced-enemy-spawn/specs/enemy-enclosure/spec.md` — **FAIL**, unrelated deletion.
- `openspec/changes/archive/2026-05-24-fenced-enemy-spawn/tasks.md` — **FAIL**, unrelated deletion.
- `openspec/changes/archive/2026-05-24-maze-runner-movement-tests/.openspec.yaml` — **FAIL**, unrelated deletion.
- `openspec/changes/archive/2026-05-24-maze-runner-movement-tests/design.md` — **FAIL**, unrelated deletion.
- `openspec/changes/archive/2026-05-24-maze-runner-movement-tests/proposal.md` — **FAIL**, unrelated deletion.
- `openspec/changes/archive/2026-05-24-maze-runner-movement-tests/specs/direction-utils-tests/spec.md` — **FAIL**, unrelated deletion.
- `openspec/changes/archive/2026-05-24-maze-runner-movement-tests/specs/enemy-movement-tests/spec.md` — **FAIL**, unrelated deletion.
- `openspec/changes/archive/2026-05-24-maze-runner-movement-tests/specs/maze-generator-tests/spec.md` — **FAIL**, unrelated deletion.
- `openspec/changes/archive/2026-05-24-maze-runner-movement-tests/specs/player-movement-tests/spec.md` — **FAIL**, unrelated deletion.
- `openspec/changes/archive/2026-05-24-maze-runner-movement-tests/tasks.md` — **FAIL**, unrelated deletion.
- `openspec/changes/grid-based-enemy-movement/.openspec.yaml` — **FAIL**, unrelated deletion.
- `openspec/changes/grid-based-enemy-movement/design.md` — **FAIL**, unrelated deletion.
- `openspec/changes/grid-based-enemy-movement/proposal.md` — **FAIL**, unrelated deletion.
- `openspec/changes/grid-based-enemy-movement/specs/enemy-ai/spec.md` — **FAIL**, unrelated deletion.
- `openspec/changes/grid-based-enemy-movement/specs/enemy-movement/spec.md` — **FAIL**, unrelated deletion.
- `openspec/changes/grid-based-enemy-movement/specs/pathfinding/spec.md` — **FAIL**, unrelated deletion.
- `openspec/changes/grid-based-enemy-movement/tasks.md` — **FAIL**, unrelated deletion.
- `openspec/changes/improve-maze-layout/.openspec.yaml` — **FAIL**, unrelated deletion.
- `openspec/changes/improve-maze-layout/design.md` — **FAIL**, unrelated deletion.
- `openspec/changes/improve-maze-layout/proposal.md` — **FAIL**, unrelated deletion.
- `openspec/changes/improve-maze-layout/specs/dead-end-reduction/spec.md` — **FAIL**, unrelated deletion.
- `openspec/changes/improve-maze-layout/specs/larger-maze-dimensions/spec.md` — **FAIL**, unrelated deletion.
- `openspec/changes/improve-maze-layout/specs/player-spawn-position/spec.md` — **FAIL**, unrelated deletion.
- `openspec/changes/improve-maze-layout/tasks.md` — **FAIL**, unrelated deletion.
- `openspec/changes/maze-runner/.openspec.yaml` — **FAIL**, unrelated deletion.
- `openspec/changes/maze-runner/design.md` — **FAIL**, unrelated deletion.
- `openspec/changes/maze-runner/proposal.md` — **FAIL**, unrelated deletion.
- `openspec/changes/maze-runner/specs/collectibles/spec.md` — **FAIL**, unrelated deletion.
- `openspec/changes/maze-runner/specs/enemy-ai/spec.md` — **FAIL**, unrelated deletion.
- `openspec/changes/maze-runner/specs/game-scenes/spec.md` — **FAIL**, unrelated deletion.
- `openspec/changes/maze-runner/specs/level-progression/spec.md` — **FAIL**, unrelated deletion.
- `openspec/changes/maze-runner/specs/maze-generation/spec.md` — **FAIL**, unrelated deletion.
- `openspec/changes/maze-runner/specs/pathfinding/spec.md` — **FAIL**, unrelated deletion.
- `openspec/changes/maze-runner/specs/player-movement/spec.md` — **FAIL**, unrelated deletion.
- `openspec/changes/maze-runner/tasks.md` — **FAIL**, unrelated deletion.
- `openspec/config.yaml` — **FAIL**, unrelated deletion.

## Untracked additions observed in `git status --short`

These are not counted by `git diff --stat`, but they are present in the working tree and are relevant to scope fidelity:

- `.github/` — **FAIL/unknown**, unrelated untracked repo config.
- `.ocr/skills/references/reviewers/game-dev.md` — **FAIL/unknown**, unrelated review config.
- `.omo/` — **EVIDENCE/working artifacts**, includes this report and other evidence files.
- `.opencode/agents/{art-director,illustrator,sandbox-engineer}.md` and several `.opencode/skills/*` dirs — **FAIL**, agent/skill architecture unrelated to ghost-pen vulnerability.
- `.pi/`, `apps/maze-runner/.pi-lens/` — **FAIL/unknown**, unrelated artifacts.
- `apps/maze-runner/cucumber.cjs`, `apps/maze-runner/playwright.config.ts`, `apps/maze-runner/features/`, `apps/maze-runner/step-definitions/`, `apps/maze-runner/support/` — **PARTIAL**, may support Task 5 browser tests, but constitute new framework setup and must be reviewed separately.
- `apps/maze-runner/debug-timing.cjs`, `report.json`, `output=test-results/`, `test-results/` — **FAIL/ARTIFACT**, generated/debug artifacts outside allowlist.
- `apps/maze-runner/public/` — **QUESTIONABLE**, vector assets tied to broader vector rewrite, not ghost-pen vulnerability only.
- `apps/maze-runner/src/game/config/`, `DepthLayer.ts`, `env.ts` — **FAIL**, new game config/util architecture outside allowlist.
- `apps/maze-runner/tests/TESTING_MATURITY_ROADMAP.md`, `tests/game/`, `tests/scenes/`, `tests/utils/DepthLayer.spec.ts`, `tests/utils/env.spec.ts` — **FAIL/QUESTIONABLE**, additional tests/docs outside explicit test allowlist except possible `Game.spec.ts` inside `tests/scenes/`.
- `apps/vector-studio/`, `libs/browser-test-runner/`, `libs/phaser-debug-bridge/`, `libs/phaser-test-harness/`, `libs/sprite-tools/` — **FAIL**, new apps/libs/library architecture.

## Scope creep identified

1. **Maze-generation scope creep**: `MazeGenerator.ts` is a wholesale generation rewrite, not the requested gate flip only.
2. **Player life handling scope creep**: `Game.ts` and `Player.ts` alter death, respawn, invulnerability, and GameOver payload behavior.
3. **Library architecture scope creep**: new vector/sprite/test-harness libs and tsconfig references are present.
4. **Test framework scope creep**: Cucumber/Playwright and broader browser harness setup appear in lockfile/config/untracked files.
5. **Repository config/documentation scope creep**: `.opencode` and `openspec` files were deleted/added unrelated to this task.
6. **Unrelated gameplay/UI scope creep**: countdown, rounded wall rendering, vector asset pipeline, dynamic ghost definitions, AI profile tuning, and GameOver presentation changes are outside the stated task.

## Overall verdict

**REJECT** — scope fidelity is not maintained. The implementation introduces unrelated scoring-adjacent/gameplay, maze-generation, test-framework, and library-architecture changes and modifies/deletes many unrelated files.
