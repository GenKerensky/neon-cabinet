# Plan: Sprite-Tools Library — Type Tightening & Runtime Bug Fixes

## TL;DR

> **Quick Summary**: Remove every `any` / `as any` / `as any as X` escape across the sprite-tools library, replace with type guards and proper types, fix 2 runtime bugs (setDirection broken `direction`→`dir` variable, `Graphics.ellipse()` doesn't exist in Phaser 3.90), add minimal public accessor methods for tests, and verify with zero tsc errors.
>
> **Deliverables**:
>
> - `vector-puppet.ts`: Clean types, fixed runtime bugs, added public `getLayer()`/`getLayerDrawable()`/`getRotationTarget()` accessors
> - `svg-parser.ts`: No `any`/`as any` anywhere, no `!` assertions, proper types on `parseDataParams`
> - `phaser-mocks.ts`: Fully typed mock classes, no `eslint-disable`
> - `vector-puppet.spec.ts`: Eliminated 22 `as any` casts via public accessors
> - `render-svg.ts`: Proper global type augmentation
> - Zero `tsc --noEmit` errors on lib tsconfig
>
> **Estimated Effort**: Medium
> **Parallel Execution**: YES — 3 waves
> **Critical Path**: Wave 1 → Wave 2 → Wave 3 → Wave Final

---

## Context

### Original Request

"Tighten up the types in this file" — no `any` or `as any as X` used anywhere, use type guards to narrow types, look for runtime bugs from faulty lib logic.

### Interview Summary

**Key Findings**:

- 9 tsc errors on `vector-puppet.ts`: unused import, wrong map types (GameObject instead of Container/Graphics), direction→dir bug, ellipse() doesn't exist
- 8 `as any` escapes in `svg-parser.ts`, 22 in `vector-puppet.spec.ts`, 9 eslint-disable in `phaser-mocks.ts`, 2 in `render-svg.ts`
- Phaser 3.90 confirmed: Graphics has no `ellipse()`, base GameObject has no `x`/`y`/`rotation`/`visible`
- Public accessor methods (`getLayer()`, `getLayerDrawable()`, `getRotationTarget()`) explicitly approved to fix tests

### Metis Review

**Identified Gaps** (addressed):

- Runtime bugs in scope? ✅ User stated "look for runtime bugs"
- Tests/mocks/CLI too? ✅ User said "anywhere"
- Non-null `!` assertions? ✅ Included in tightening
- Type guards over casts? ✅ Confirmed approach
- Public API changes? ✅ Minimal accessor addition approved

---

## Work Objectives

### Core Objective

**Tighten all types across sprite-tools library (vector-puppet.ts, svg-parser.ts, phaser-mocks.ts, render-svg.ts, vector-puppet.spec.ts): remove every `any` / `as any` / `as any as X`, use type guards for narrowing, add minimal public accessors for tests, fix the 2 runtime bugs, verify zero tsc errors.**

### Concrete Deliverables

- `libs/sprite-tools/src/lib/vector-puppet.ts`: No tsc errors, public `getLayer()`/`getLayerDrawable()`/`getRotationTarget()` methods, `direction`→`dir` fixed, ellipse→arc fixed
- `libs/sprite-tools/src/lib/svg-parser.ts`: No `any`, `as any`, `Record<string, any>`, or `!` assertions
- `libs/sprite-tools/src/lib/phaser-mocks.ts`: Fully typed mock implementations
- `libs/sprite-tools/src/bin/render-svg.ts`: Proper global declaration or typed helper
- `libs/sprite-tools/src/lib/vector-puppet.spec.ts`: No `as any` casts

### Definition of Done

- [x] `bun nx typecheck sprite-tools` → exit 0, zero errors
- [x] `bun nx test sprite-tools` → all tests pass
- [x] `bun nx lint sprite-tools` → no new lint errors
- [x] grep `as any` `libs/sprite-tools/src/` → zero matches
- [x] grep `: any` `libs/sprite-tools/src/lib/` → zero matches (excluding spec files where intentional)
- [x] grep `as any as` `libs/sprite-tools/src/` → zero matches
- [x] grep `Record<string, any>` `libs/sprite-tools/src/` → zero matches

### Must Have

- Zero `any` type annotations in production code
- Zero `as any` / `as any as X` / `as unknown as X` in ALL files (including tests/mocks/CLI)
- Zero `!` non-null assertions in svg-parser.ts
- `setDirection(dir)` uses `dir` parameter, not undefined `direction`
- `Graphics.ellipse()` call removed, replaced with correct arc-based drawing
- `layers`, `layerDrawables`, `directionRotationTargets` maps have correct types
- Public `getLayer()`, `getLayerDrawable()`, `getRotationTarget()` methods on VectorPuppet
- All existing test behavior and assertions pass (test code may be refactored from `as any` to typed accessors, but outcomes are identical)

### Must NOT Have (Guardrails)

- NO public API changes beyond the 3 approved accessors (getLayer, getLayerDrawable, getRotationTarget)
- NO replacing `any` with `unknown` without proper narrowing
- NO `as unknown as X` chains
- NO touching `path-tokenizer.ts` or `sprite-tools.ts` (already clean)
- NO touching projects outside sprite-tools (maze-runner, etc.)
- NO rewriting SVG parser architecture
- NO adding new features

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed.

### Test Decision

- **Infrastructure exists**: YES (vitest)
- **Automated tests**: Tests-after (fix existing tests alongside type changes, don't change test behavior)
- **Framework**: vitest (via `bun nx test sprite-tools`)

### QA Policy

Every task includes agent-executed QA scenarios.

- **Typecheck**: `bun nx typecheck sprite-tools` — must exit 0
- **Test**: `bun nx test sprite-tools` — all existing tests pass
- **Lint**: `bun nx lint sprite-tools` — no new errors
- **Forbidden pattern scans**: grep assertions as listed in DoD
- **Evidence files**: Screenshots of terminal output for each verification command

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — foundation, 6 parallel):
├── 1: vector-puppet.ts: Fix imports + map types + public accessors [quick]
├── 2: svg-parser.ts: Fix (tagName as any), parseAnimations as any, Record<string, any> [unspecified-high]
├── 3: phaser-mocks.ts: Replace any types + eslint-disable [quick]
├── 4: render-svg.ts: Fix global as any with type augmentation [quick]
├── 5: vector-puppet.ts: Fix direction→dir runtime bug in setDirection [quick*]
└── 6: vector-puppet.ts: Fix graphic.ellipse() → manual arc drawing [quick*]

Wave 2 (Starts as soon as 1-2 complete — core fixes, 2 parallel):
├── 7: vector-puppet.ts: Fix setupPhysics() type predicate + body assertion [quick]
└── 8: svg-parser.ts: Replace 9 ! assertions with null-safe patterns [deep]

Wave 3 (After Wave 2 — test cleanup, 1 sequential):
└── 9: vector-puppet.spec.ts: Eliminate 22 as any casts via public accessors [unspecified-high]

Wave FINAL (After ALL tasks — 4 parallel reviews, then approval):
├── F1. Plan compliance audit (oracle)
├── F2. Code quality + typecheck review (unspecified-high)
├── F3. Real QA execution (unspecified-high)
└── F4. Scope fidelity check (deep)
→ Present results → Get explicit user okay

* Tasks 5 and 6 are pure variable-rename and API-call-replacement in the same file (vector-puppet.ts). They don't depend on the type/map changes from task 1 because the fixes are on orthogonal concerns (variable name, drawing API call) that don't trigger the existing tsc errors. Verified: tasks 5 and 6 produce no tsc errors on their own and can run in parallel with task 1.
```

### Dependency Matrix

- **1-6**: None (Wave 1, parallel — tasks 5-6 are orthogonal to task 1's map type changes)
- **7**: 1 (needs clean types/maps for the body type guard)
- **8**: 2 (needs clean svg-parser first)
- **9**: 1, 5, 6, 7 (needs accessors + all fixes)
- **F1-F4**: All 1-9

---

## TODOs

- [x] 1. `vector-puppet.ts`: Fix imports, map types, add public accessors

  **What to do**:
  - Remove unused `import { Vector } from 'matter'` import (line 10)
  - Change all 3 map types:
    - `layers: Map<string, Phaser.GameObjects.GameObject>` → `layers: Map<string, Phaser.GameObjects.Container | Phaser.GameObjects.Graphics>`
    - `layerDrawables: Map<string, Phaser.GameObjects.GameObject>` → `layerDrawables: Map<string, Phaser.GameObjects.Container | Phaser.GameObjects.Graphics>`
    - `directionRotationTargets: Map<string, Phaser.GameObjects.GameObject>` → `directionRotationTargets: Map<string, Phaser.GameObjects.Container>`
  - Update all `.get()`, `.set()`, iteration usage of these maps throughout the file
  - Add a type alias if helpful: `type LayerGameObject = Phaser.GameObjects.Container | Phaser.GameObjects.Graphics`
  - Add 3 public methods:
    - `getLayer(id: string): Phaser.GameObjects.Container | Phaser.GameObjects.Graphics | undefined` — returns `this.layers.get(id)`
    - `getLayerDrawable(id: string): Phaser.GameObjects.Container | Phaser.GameObjects.Graphics | undefined` — returns `this.layerDrawables.get(id)`
    - `getRotationTarget(id: string): Phaser.GameObjects.Container | undefined` — returns `this.directionRotationTargets.get(id)`

  **Must NOT do**:
  - Don't change variable names or runtime behavior of map operations
  - Don't touch the setDirection logic or physics setup (those are separate tasks)
  - Don't add any other new public methods

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Straightforward type changes and adding 3 simple accessor methods
  - **Skills**: none
  - **Skills Evaluated but Omitted**: none

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with 2, 3, 4, 5, 6)
  - **Blocks**: 7, 9 (7 needs clean map types for body guard; 9 needs accessor methods)
  - **Blocked By**: None

  **References**:
  - `libs/sprite-tools/src/lib/vector-puppet.ts` — full file, the target
  - `libs/sprite-tools/src/lib/vector-puppet.ts:490-510` — `layers` map declaration and usage
  - `libs/sprite-tools/src/lib/vector-puppet.ts:440-450` — `layerDrawables` map declaration and usage
  - `libs/sprite-tools/src/lib/vector-puppet.ts:520-530` — `directionRotationTargets` map declaration and usage
  - Phaser 3.90 types: `node_modules/.bun/phaser@3.90.0/node_modules/phaser/types/phaser.d.ts` — Graphics and Container have `x`, `y`, `rotation`, `visible` via components; base GameObject does not

  **Acceptance Criteria**:
  - [ ] `bun nx typecheck sprite-tools` — exit 0, no errors from map type changes
  - [ ] `bun nx test sprite-tools` — all tests still pass
  - [ ] grep `import.*Vector.*matter` `libs/sprite-tools/src/lib/vector-puppet.ts` → no match (import removed)
  - [ ] grep `Map<string,.*GameObject>` `libs/sprite-tools/src/lib/vector-puppet.ts` → no match (old type)
  - [ ] grep `getLayer(` `libs/sprite-tools/src/lib/vector-puppet.ts` → 3 matches (3 accessor methods defined)
  - [ ] grep `getLayerDrawable(` `libs/sprite-tools/src/lib/vector-puppet.ts` → 1 match
  - [ ] grep `getRotationTarget(` `libs/sprite-tools/src/lib/vector-puppet.ts` → 1 match

  **QA Scenarios**:
  \`\`\`
  Scenario: Typecheck passes with cleaned up types
  Tool: Bash
  Preconditions: File is on the branch with all clean-import/map-type edits applied
  Steps: 1. bun nx typecheck sprite-tools
  Expected Result: exit code 0, no type errors
  Failure Indicators: tsc errors about map wrong-type access
  Evidence: .omo/evidence/task-1-typecheck.txt

  Scenario: New public accessor methods are callable
  Tool: Bash (bun REPL or vitest)
  Preconditions: Build succeeds
  Steps: 1. grep -n "getLayer\|getLayerDrawable\|getRotationTarget" libs/sprite-tools/src/lib/vector-puppet.ts
  Expected Result: All 3 method signatures present and exported
  Failure Indicators: Method missing or not on class
  Evidence: .omo/evidence/task-1-accessors.txt
  \`\`\`

  **Evidence to Capture**: terminal output of typecheck, grep results

---

- [x] 2. `svg-parser.ts`: Fix `(tagName as any)`, `as any` in parseAnimations, `Record<string, any>`

  **What to do**:
  - **Line 66 — `(tagName as any)`**: Replace with proper typed approach. Create a `type LayerType = 'path' | 'circle' | 'rect' | 'group'` and cast `tagName as LayerType`. Or use a type-guarded helper that validates the tagName value.
  - **Lines 109, 114, 119, 124 — `as any` in `parseAnimations()`**: Each push creates `{ type: 'wave', ...this.parseDataParams(wave) } as any`. Instead:
    - Parse `parseDataParams` return, extract known AnimationMetadata fields explicitly
    - Construct with proper typing: `const anim: AnimationMetadata = { type: 'wave', frequency: params.frequency as number, amplitude: params.amplitude as number, ... }`
    - Use numeric coercion/validation instead of `as any`
  - **Lines 226, 232 — `Record<string, any>` return type on `parseDataParams()`**:
    - Change to `Record<string, string | number>`
    - Ensure `parseFloat` result is used for numbers, fallback to string for non-numeric
    - The return type is the function's own constructed object, so this is safe
  - **Line 135 — `params as DirectionBendMetadata`**: After ensuring `params.amount` is a number, this is a safe narrow cast. Keep the guard before it.
  - **Line 159 — `parsed as Record<string, unknown>`**: This is already fairly safe after the `typeof parsed !== 'object'` check. Keep as-is or strengthen slightly.

  **Must NOT do**:
  - Don't change SVG attribute parsing behavior
  - Don't remove `as SVGElement` casts — these are valid DOM type narrowing
  - Don't break `parseDataParams` expected return shape (consumed by parseDirectionBend and others)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Multiple interconnected type fixes with careful behavior preservation needed
  - **Skills**: none
  - **Skills Evaluated but Omitted**: none

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with 1, 3, 4)
  - **Blocks**: 8
  - **Blocked By**: None

  **References**:
  - `libs/sprite-tools/src/lib/svg-parser.ts:66` — `(tagName as any)` for type field
  - `libs/sprite-tools/src/lib/svg-parser.ts:104-128` — `parseAnimations()` with `as any` pushes
  - `libs/sprite-tools/src/lib/svg-parser.ts:226-242` — `parseDataParams()` with `Record<string, any>`
  - `libs/sprite-tools/src/lib/types.ts:1-12` — AnimationMetadata interface (has type, frequency, amplitude, speed, points, color1, color2, yStart, yEnd)
  - `libs/sprite-tools/src/lib/svg-parser.spec.ts:34-40` — Test showing expected parsed output shape

  **Acceptance Criteria**:
  - [ ] `bun nx typecheck sprite-tools` — exit 0
  - [ ] `bun nx test sprite-tools` — all tests pass (including svg-parser.spec.ts)
  - [ ] grep `as any` `libs/sprite-tools/src/lib/svg-parser.ts` → no match
  - [ ] grep `Record<string, any>` `libs/sprite-tools/src/lib/svg-parser.ts` → no match

  **QA Scenarios**:
  \`\`\`
  Scenario: Typecheck passes after removing as any escapes
  Tool: Bash
  Preconditions: File edited with all fixes
  Steps: 1. bun nx typecheck sprite-tools
  Expected Result: exit 0
  Evidence: .omo/evidence/task-2-typecheck.txt

  Scenario: Parser behavior preserved for all animation types
  Tool: Bash
  Preconditions: Tests pass
  Steps: 1. bun nx test sprite-tools
  Expected Result: exit 0, all svg-parser tests pass
  Evidence: .omo/evidence/task-2-tests.txt
  \`\`\`

---

- [x] 3. `phaser-mocks.ts`: Replace `any` types and `eslint-disable-next-line`

  **What to do**:
  - Replace `any` type annotations with proper types throughout the file:
    - `scene`: correct type is `MockScene` (handle circular ref via forward-declared class or typed constructor parameter)
    - `parent`: correct type is `MockContainer | null`
    - `list`: correct type is `MockGameObject[]`
    - `add(child)`: correct param type is `MockGameObject | MockGameObject[]`
    - `remove(child)`: correct param type is `MockGameObject`
    - `point`: correct type is `{ x: number; y: number }` (inline struct — simpler than importing Vector2)
    - `targets`: correct type is `MockGameObject | MockGameObject[]`
    - `target`: correct type is `MockGameObject`
    - `config`: correct type is `{ targets: MockGameObject | MockGameObject[]; x?: number; y?: number; rotation?: number; directionBendX?: number }`
  - Remove `eslint-disable-next-line @typescript-eslint/no-empty-function` — replace empty methods with:
    ```ts
    update(_time?: number, _delta?: number) { /* mock no-op */ }
    ```
    (The underscore prefix tells TS/eslint the param is intentionally unused)
  - Same pattern for: `setTexture()`, `clearTint()`, `setTint()`, `play()`, `stop()`, `on()`, `setCircle()`, `setOffset()`, `setMass()`, `setBounce()`, `setDrag()`, `setFriction()`, `setSize()`

  **Must NOT do**:
  - Don't change mock behavior (how add/remove/tweens work)
  - Don't remove `// eslint-disable-next-line @typescript-eslint/no-this-alias` (that one is for `const self = this` which is legitimate)
  - **Fix `get add()` return type** — define a proper return interface:
    ```ts
    interface MockSceneAdd {
      existing: (obj: MockGameObject) => {
        setCircle: () => MockPhysicsBody;
        setOffset: () => MockPhysicsBody;
        setMass: () => MockPhysicsBody;
        setBounce: () => MockPhysicsBody;
        setDrag: () => MockPhysicsBody;
        setFriction: () => MockPhysicsBody;
        setSize: () => MockPhysicsBody;
      };
      container: (x?: number, y?: number) => MockContainer;
      graphics: () => MockGraphics;
      sprite: (x?: number, y?: number) => MockGameObject;
    }
    ```
    Return `this._add as MockSceneAdd` (or type the field properly).

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Mechanical type replacement, well-defined pattern
  - **Skills**: none
  - **Skills Evaluated but Omitted**: none

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with 1, 2, 4)
  - **Blocks**: None directly
  - **Blocked By**: None

  **References**:
  - `libs/sprite-tools/src/lib/phaser-mocks.ts` — entire file (163 lines), the target
  - `libs/sprite-tools/src/lib/vector-puppet.spec.ts` — imports MockScene, uses MockContainer, MockGameObject

  **Acceptance Criteria**:
  - [ ] `bun nx typecheck sprite-tools` — exit 0
  - [ ] `bun nx test sprite-tools` — all tests pass
  - [ ] grep `: any` `libs/sprite-tools/src/lib/phaser-mocks.ts` → zero matches
  - [ ] grep `eslint-disable-next-line` `libs/sprite-tools/src/lib/phaser-mocks.ts` → only `@typescript-eslint/no-this-alias` remains (max 1)

  **QA Scenarios**:
  \`\`\`
  Scenario: Mock types no longer use any
  Tool: Bash
  Preconditions: Edits applied
  Steps: 1. bun nx typecheck sprite-tools
  Expected Result: exit 0
  Failure Indicators: Errors about type mismatches in mock usage
  Evidence: .omo/evidence/task-3-typecheck.txt
  \`\`\`

---

- [x] 4. `render-svg.ts`: Fix `global as any` with proper type augmentation

  **What to do**:
  - Replace `(global as any).DOMParser = ...` and `(global as any).SVGElement = ...` with one of:
    - **Option A (preferred)**: Create a local module augmentation:
      ```ts
      declare global {
        var DOMParser: (typeof import("jsdom").JSDOM)["window"]["DOMParser"];
        var SVGElement: (typeof import("jsdom").JSDOM)["window"]["SVGElement"];
      }
      ```
    - **Option B**: Extract to a typed helper:
      ```ts
      function ensureGlobalPolyfills() {
        if (typeof global !== "undefined" && !global.DOMParser) {
          const { window } = new JSDOM();
          global.DOMParser = window.DOMParser as typeof global.DOMParser;
          global.SVGElement = window.SVGElement as typeof global.SVGElement;
        }
      }
      ```
  - The key is that `global.DOMParser` and `global.SVGElement` don't exist in the Node lib types, so some form of assertion is needed. The declare global approach is cleanest.

  **Must NOT do**:
  - Don't change the polyfill behavior or conditional checks
  - Don't remove the JSDOM dependency

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple, self-contained change
  - **Skills**: none
  - **Skills Evaluated but Omitted**: none

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with 1, 2, 3)
  - **Blocks**: None
  - **Blocked By**: None

  **References**:
  - `libs/sprite-tools/src/bin/render-svg.ts:5-10` — the polyfill section
  - Check `tsconfig.lib.json` for the `libs/sprite-tools` bin tsconfig to ensure `lib: ["dom", "es2022"]` includes DOM types (needed for DOM types in declarations)

  **Acceptance Criteria**:
  - [ ] `bun nx typecheck sprite-tools` — exit 0
  - [ ] grep `as any` `libs/sprite-tools/src/bin/render-svg.ts` → no match

  **QA Scenarios**:
  \`\`\`
  Scenario: Typecheck passes without as any
  Tool: Bash
  Preconditions: Edits applied
  Steps: 1. bun nx typecheck sprite-tools
  Expected Result: exit 0
  Failure Indicators: Error about missing global type
  Evidence: .omo/evidence/task-4-typecheck.txt
  \`\`\`

---

- [x] 5. `vector-puppet.ts`: Fix runtime bug — `direction` → `dir` in `setDirection`

  **What to do**:
  - In `setDirection(dir: Direction)` method, find all references to undefined `direction` variable:
    - Line 544-545: `this.getDirectionRotationDegrees(direction, ...)` → change `direction` to `dir`
    - Line 562-563: `direction === "LEFT"` etc. → change to `dir`
  - This is currently a RUNTIME BUG: the parameter is `dir` but the code uses `direction` which is never declared, causing a ReferenceError. Direction rotation and bend features are completely broken.

  **Must NOT do**:
  - Don't change any other variable names or logic
  - Don't add new direction handling beyond fixing the variable name

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: One-line fix, trivially verifiable
  - **Skills**: none
  - **Skills Evaluated but Omitted**: none

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with 1, 2, 3, 4, 6 — variable rename, no type dependency)
  - **Blocks**: 9
  - **Blocked By**: None

  **References**:
  - `libs/sprite-tools/src/lib/vector-puppet.ts:530-570` — the `setDirection` method body
  - Search for `direction` in file to find all occurrences

  **Acceptance Criteria**:
  - [ ] `bun nx typecheck sprite-tools` — exit 0
  - [ ] `bun nx test sprite-tools` — all direction tests pass (rotation, bend behavior)
  - [ ] grep `direction(?!\w)` `libs/sprite-tools/src/lib/vector-puppet.ts` → verify all remaining `direction` references are valid property names, not the undefined variable bug

  **QA Scenarios**:
  \`\`\`
  Scenario: Typecheck passes — direction variable no longer undefined
  Tool: Bash
  Preconditions: Edit applied
  Steps: 1. bun nx typecheck sprite-tools
  Expected Result: exit 0
  Failure Indicators: tsc error "Cannot find name 'direction'"
  Evidence: .omo/evidence/task-5-typecheck.txt

  Scenario: Direction tests pass (verifying the fix works at runtime)
  Tool: Bash
  Preconditions: Edit applied
  Steps: 1. bun nx test sprite-tools
  Expected Result: exit 0, all rotation/direction tests pass
  Failure Indicators: setDirection rotation/bend tests failing
  Evidence: .omo/evidence/task-5-tests.txt
  \`\`\`

---

- [x] 6. `vector-puppet.ts`: Fix `graphic.ellipse()` → manual arc drawing

  **What to do**:
  - Replace `graphic.ellipse(cx, cy, rx, ry, ...)` with manual `Graphics.arc()` + `lineTo()` approach.
  - Phaser 3.90 Graphics does NOT have `ellipse()`. It has:
    - `fillEllipse(x, y, width, height, smoothness?)` — fills an ellipse
    - `strokeEllipse(x, y, width, height, smoothness?)` — strokes an ellipse
    - `arc(x, y, radius, startAngle, endAngle, anticlockwise?)` — draws an arc
  - In `drawSVGPathArc()`, the ellipse call likely handles the SVG arc (A/a command). SVG arcs are parameterized as `rx ry x-axis-rotation large-arc-flag sweep-flag x y`.
  - If this is drawing an actual ellipse shape (not an arc), use `graphic.fillEllipse(...)` or `graphic.strokeEllipse(...)`.
  - If this is drawing a partial ellipse (arc segment), use `graphic.arc()` + `graphic.lineTo()` to approximate the curve.
  - **CRITICAL**: Read the surrounding context to understand what the `ellipse()` call was doing, then pick the right replacement.

  **Must NOT do**:
  - Don't change the visual output — the fix must preserve the rendered shape
  - Don't introduce new drawing API calls that don't exist in Phaser 3.90

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single API call replacement with straightforward Phaser alternative
  - **Skills**: none
  - **Skills Evaluated but Omitted**: none

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with 1, 2, 3, 4, 5 — API call replacement, no type dependency)
  - **Blocks**: 9
  - **Blocked By**: None

  **References**:
  - `libs/sprite-tools/src/lib/vector-puppet.ts:420-435` — the `ellipse()` call context
  - Phaser 3.90 Graphics API: `fillEllipse(x, y, width, height, smoothness?)`, `strokeEllipse(...)`, `arc(x, y, radius, startAngle, endAngle, anticlockwise?)`
  - `libs/sprite-tools/src/lib/vector-puppet.ts:380-420` — surrounding arc-drawing code for pattern match

  **Acceptance Criteria**:
  - [ ] `bun nx typecheck sprite-tools` — exit 0
  - [ ] `bun nx test sprite-tools` — all tests pass
  - [ ] grep `\.ellipse\(` `libs/sprite-tools/src/lib/vector-puppet.ts` → no match

  **QA Scenarios**:
  \`\`\`
  Scenario: No ellipse() call remains
  Tool: Bash
  Preconditions: Edit applied
  Steps: 1. grep -n '\.ellipse(' libs/sprite-tools/src/lib/vector-puppet.ts
  Expected Result: zero matches
  Failure Indicators: grep returns matches
  Evidence: .omo/evidence/task-6-no-ellipse.txt
  \`\`\`

---

- [x] 7. `vector-puppet.ts`: Fix `setupPhysics()` type predicate + body assertion

  **What to do**:
  - Replace `this.body as Phaser.Physics.Arcade.Body` (line 463) with a proper type guard:
    ```ts
    const body = this.body;
    if (body instanceof Phaser.Physics.Arcade.Body) {
      // use body
    }
    ```
    Or use a type predicate function:
    ```ts
    function isArcadeBody(
      body:
        | Phaser.Physics.Arcade.Body
        | Phaser.Physics.Arcade.StaticBody
        | MatterJS.BodyType
        | null,
    ): body is Phaser.Physics.Arcade.Body {
      return body instanceof Phaser.Physics.Arcade.Body;
    }
    ```
  - This is in `setupPhysics()` which is called after `scene.physics.add.existing(this)` — so it's guaranteed to be Arcade, but the types are still union.

  **Must NOT do**:
  - Don't change physics behavior
  - Don't add dependencies on Matter.js types

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single assertion replacement, well-understood pattern
  - **Skills**: none
  - **Skills Evaluated but Omitted**: none

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with 8)
  - **Blocks**: 9
  - **Blocked By**: 1 (needs clean map types for body type guard)

  **References**:
  - `libs/sprite-tools/src/lib/vector-puppet.ts:455-475` — `setupPhysics()` body
  - Phaser types: `node_modules/.bun/phaser@3.90.0/node_modules/phaser/types/phaser.d.ts` — `Phaser.Physics.Arcade.Body` is a class, so `instanceof` works

  **Acceptance Criteria**:
  - [ ] `bun nx typecheck sprite-tools` — exit 0
  - [ ] `bun nx test sprite-tools` — all tests pass
  - [ ] grep `as Phaser.Physics` `libs/sprite-tools/src/lib/vector-puppet.ts` → no match

  **QA Scenarios**:
  \`\`\`
  Scenario: No as assertion on body
  Tool: Bash
  Preconditions: Edit applied
  Steps: 1. grep -n 'as.\*Phaser\.Physics' libs/sprite-tools/src/lib/vector-puppet.ts
  Expected Result: zero matches
  Evidence: .omo/evidence/task-7-no-body-as.txt
  \`\`\`

---

- [x] 8. `svg-parser.ts`: Replace `!` non-null assertions with null-safe patterns

  **What to do**:
  - The 9 `!` assertions are all on `getAttribute()` calls where the attribute was already checked for existence:
    - Line 73: `el.getAttribute('data-slide-range')!` → Already guarded by `el.getAttribute('data-slide-range') ?` — redundant `!`, remove it
    - Line 78: `el.getAttribute('stroke-width')!` → Already guarded by `el.getAttribute('stroke-width') ?`
    - Line 79: `el.getAttribute('opacity')!` → Already guarded by `el.getAttribute('opacity') ?`
    - Line 172: `el.getAttribute('data-material-phosphor-trail')!` → Already guarded by `el.getAttribute('data-material-phosphor-trail') ?`
    - Line 173: `el.getAttribute('data-material-chromatic-scale')!` → Already guarded
    - Line 182: `el.getAttribute('data-mass')!` → Already guarded by `el.getAttribute('data-mass') ?`
    - Line 183: `el.getAttribute('data-bounce')!` → Already guarded
    - Line 184: `el.getAttribute('data-drag')!` → Already guarded
    - Line 185: `el.getAttribute('data-friction')!` → Already guarded
  - Strategy: Extract a small helper:
    ```ts
    function parseNumericAttribute(
      el: SVGElement,
      attr: string,
    ): number | undefined {
      const val = el.getAttribute(attr);
      return val !== null ? parseFloat(val) : undefined;
    }
    ```
    Then replace each `!` + `parseFloat` call with `parseNumericAttribute(el, 'attr-name')`.
  - This is safer, DRYer, and removes all `!` assertions from the file.

  **Must NOT do**:
  - Don't change the behavior — each `!` assertion is correct (the attribute exists when guarded), but the `!` is unnecessary noise
  - Don't extract the helper outside the file

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Multiple interconnected replacements requiring careful behavior preservation
  - **Skills**: none
  - **Skills Evaluated but Omitted**: none

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with 7)
  - **Blocks**: None
  - **Blocked By**: 2 (needs clean svg-parser first)

  **References**:
  - `libs/sprite-tools/src/lib/svg-parser.ts:72-80` — first batch of `!` assertions
  - `libs/sprite-tools/src/lib/svg-parser.ts:170-186` — second batch in parseMaterial and parsePhysics
  - The guard pattern: `el.getAttribute('X') ? parseFloat(el.getAttribute('X')!) : undefined`

  **Acceptance Criteria**:
  - [ ] `bun nx typecheck sprite-tools` — exit 0
  - [ ] `bun nx test sprite-tools` — all tests pass (especially numeric edge cases)
  - [ ] grep `!` `libs/sprite-tools/src/lib/svg-parser.ts` → verify no non-null assertions remain on getAttribute calls (the pattern `getAttribute(...)!` should be gone)
  - [ ] A `parseNumericAttribute` helper exists or inline null-coalescing is used

  **QA Scenarios**:
  \`\`\`
  Scenario: No non-null assertions on getAttribute
  Tool: Bash
  Preconditions: Edit applied
  Steps: 1. grep -n 'getAttribute.\*!' libs/sprite-tools/src/lib/svg-parser.ts
  Expected Result: zero matches
  Failure Indicators: grep returns matches
  Evidence: .omo/evidence/task-8-no-bang.txt

  Scenario: All parser tests still pass
  Tool: Bash
  Preconditions: Edit applied
  Steps: 1. bun nx test sprite-tools
  Expected Result: exit 0, all svg-parser tests pass
  Evidence: .omo/evidence/task-8-tests.txt
  \`\`\`

---

- [x] 9. `vector-puppet.spec.ts`: Eliminate 22 `as any` casts via public accessors

  **What to do**:
  - All 22 `as any` casts follow the pattern `(puppet as any).layers.get('some-id')` or `(mouthGraphics as any).arc`
  - Replace `(puppet as any).layers.get('...')` with `puppet.getLayer('...')` (the new public accessor from task 1)
  - Replace `(puppet as any).layerDrawables.get('...')` with `puppet.getLayerDrawable('...')`
  - For the `(mouthGraphics as any).arc` mock assignments, use proper typing:
    - Either: `const mouthGraphics = puppet.getLayer('mouth')!;` and assign to a properly typed variable
    - Or: declare an interface for the mock and use `jest.fn()` typed assertions
  - Each replacement must keep the test behavior identical — just change how the value is accessed

  **Must NOT do**:
  - Don't change test assertions or expected values
  - Don't remove any tests
  - Don't add test-only helper methods to VectorPuppet that aren't also useful for production

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Many scattered replacements across a 350-line test file
  - **Skills**: none
  - **Skills Evaluated but Omitted**: none

  **Parallelization**:
  - **Can Run In Parallel**: NO (sequential — test behavior depends on all fixes)
  - **Parallel Group**: Wave 3 (alone)
  - **Blocks**: F1-F4
  - **Blocked By**: 1, 5, 6, 7 (needs accessors + all fixes applied)

  **References**:
  - `libs/sprite-tools/src/lib/vector-puppet.spec.ts` — the target file full content
  - `libs/sprite-tools/src/lib/vector-puppet.ts` — the new `getLayer()`, `getLayerDrawable()`, `getRotationTarget()` methods
  - All `as any` occurrences were identified in the exploration phase (lines 19, 33, 58, 83, 100, 111, 131, 137, 157, 170, 198, 210, 224, 254, 271, 273, 287, 312, 314, 328, 344, 346)

  **Acceptance Criteria**:
  - [ ] `bun nx typecheck sprite-tools` — exit 0
  - [ ] `bun nx test sprite-tools` — all tests pass
  - [ ] grep `as any` `libs/sprite-tools/src/lib/vector-puppet.spec.ts` → zero matches

  **QA Scenarios**:
  \`\`\`
  Scenario: No as any in tests
  Tool: Bash
  Preconditions: All edits applied
  Steps: 1. grep -n 'as any' libs/sprite-tools/src/lib/vector-puppet.spec.ts
  Expected Result: zero matches
  Evidence: .omo/evidence/task-9-no-as-any.txt

  Scenario: All tests pass
  Tool: Bash
  Preconditions: All Wave 1-3 edits applied
  Steps: 1. bun nx test sprite-tools
  Expected Result: exit 0, all tests pass
  Evidence: .omo/evidence/task-10-tests.txt
  \`\`\`

---

## Final Verification Wave

- [x] F1. **Plan Compliance Audit** — `oracle`

  **What to do**:
  - Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, grep for patterns). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .omo/evidence/. Compare deliverables against plan.

  **Acceptance Criteria**:
  - [ ] All Must Have items verified present
  - [ ] All Must NOT Have items confirmed absent (no forbidden patterns found)
  - [ ] All evidence files from tasks 1-9 exist in .omo/evidence/

  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [x] F2. **Code Quality Review** — `unspecified-high`

  **What to do**:
  - Run `bun nx typecheck sprite-tools` + `bun nx lint sprite-tools` + `bun nx test sprite-tools`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, commented-out code, unused imports. Run forbidden pattern scans.

  **Acceptance Criteria**:
  - [x] `bun nx typecheck sprite-tools` → exit 0
  - [x] `bun nx lint sprite-tools` → no new errors
  - [x] `bun nx test sprite-tools` → exit 0, all pass
  - [x] grep `as any` `libs/sprite-tools/src/` → zero matches
  - [x] grep `Record<string, any>` `libs/sprite-tools/src/` → zero matches
  - [x] grep `\.ellipse(` `libs/sprite-tools/src/` → zero matches

  Output: `Typecheck [PASS/FAIL] | Lint [PASS/FAIL] | Tests [N pass/N fail] | Forbidden patterns [CLEAN/N issues] | VERDICT`

- [x] F3. **Real Manual QA** — `unspecified-high`

  **What to do**:
  - Start from clean state. Execute EVERY QA scenario from EVERY task — follow exact steps, capture evidence. Test cross-task integration (all files working together). Test edge cases: verify all parsing test cases still work. Save evidence to `.omo/evidence/final-qa/`.

  **Acceptance Criteria**:
  - [ ] Every QA scenario from tasks 1-9 executed and verified passing
  - [ ] Direct `setDirection` calls verified not to cause ReferenceError
  - [ ] SVG parser tests on numeric edge cases still pass
  - [ ] All evidence saved to `.omo/evidence/final-qa/`

  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [x] F4. **Scope Fidelity Check** — `deep`

  **What to do**:
  - For each task: read "What to do", read actual diff (git log/diff via `git diff origin/main --stat libs/sprite-tools/`). Verify 1:1 — everything in scope was built (no missing), nothing beyond scope was built (no creep). Check "Must NOT do" compliance. Detect cross-task contamination.

  **Acceptance Criteria**:
  - [ ] Every task's "What to do" matches actual git diff changes
  - [ ] No changes to files outside defined scope (maze-runner, path-tokenizer.ts, sprite-tools.ts untouched)
  - [ ] No "Must NOT do" violations found
  - [ ] No cross-task contamination (task 5 didn't modify task 3's files)

  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

- **1-6** (Wave 1): Commit together as `refactor(sprite-tools): remove unused imports, fix map types, clean svg-parser as-any, type mocks, fix global polyfill, fix direction→dir bug, replace ellipse()`
- **7-8** (Wave 2): Commit as `fix(sprite-tools): guard body type, remove non-null assertions from svg-parser`
- **9** (Wave 3): Commit as `test(sprite-tools): remove as-any casts from spec using public accessors`

---

## Success Criteria

### Verification Commands

```bash
bun nx typecheck sprite-tools  # exit 0
bun nx test sprite-tools       # exit 0, all pass
bun nx lint sprite-tools       # no new errors
grep -r "as any" libs/sprite-tools/src/  # zero matches
grep -r "Record<string, any>" libs/sprite-tools/src/  # zero matches
grep -r "\.ellipse(" libs/sprite-tools/src/  # zero matches
```

### Final Checklist

- [x] All "Must Have" present
- [x] All "Must NOT Have" absent
- [x] All tests pass
- [x] Zero `any` in production code
- [x] Zero `as any` in all files
- [x] Zero `!` assertions in svg-parser.ts
- [x] `setDirection` uses `dir`, not undefined `direction`
- [x] `public getLayer()`, `getLayerDrawable()`, `getRotationTarget()` exist on VectorPuppet
- [x] All 22 `as any` removed from spec
