# Draft: Sprite-Tools Type Tightening

## Core Objective

**Tighten all types across the sprite-tools library (vector-puppet.ts, svg-parser.ts, phaser-mocks.ts, render-svg.ts, vector-puppet.spec.ts) by removing every `any` / `as any` / `as any as X` escape, using type guards for narrowing, adding minimal public accessor methods needed for tests, fixing the 2 runtime bugs discovered (setDirection `direction`→`dir`, `graphic.ellipse()` doesn't exist), and verifying with zero tsc --noEmit errors on the lib tsconfig.**

## Requirements (confirmed)

- Remove all `any` types, `as any` assertions, and `as any as X` patterns
- Fix runtime bugs found during type analysis
- Use type guards to narrow types properly
- All map types should use the most specific type, not `GameObject`
- Target zero tsc --noEmit errors on lib tsconfig

## Technical Decisions

### Root Cause Analysis

**Runtime bugs in setDirection (CRITICAL):**

- Line 544-545: `this.getDirectionRotationDegrees(direction, ...)` — `direction` is undefined (parameter is `dir`)
- Line 562-563: `direction === "LEFT"` — same bug
- Effect: Direction rotation and bend features are broken for any direction

**Wrong map types causing cascading errors:**

- `layers` map typed as `GameObject` → no access to `x`, `y`, `rotation`, `visible`
- Same for `layerDrawables` and `directionRotationTargets`
- Fix: `LayerGameObject` (Container | Graphics) and `Container` respectively

**Phaser API misuse:**

- `Graphics.ellipse()` does not exist in Phaser 3.90 types — only `fillEllipse`, `strokeEllipse`, `arc`
- The `ellipse()` call in `drawSVGPathArc` was hidden by the union type previously
- Fix: Replace with manual lineTo arc computation (same approach as transformPoint branch)

**SVG Parser issues:**

- `(tagName as any)` for type discriminator — should use proper typed constant
- `as any` in `parseAnimations` — should construct `AnimationMetadata` with proper partial
- `Record<string, any>` — should be `Record<string, string | number>`
- 9 `!` non-null assertions on `getAttribute()` — safe but unnecessary

**Test file:**

- 22 `as any` casts throughout spec — all from `(puppet as any).layers.get(...)` pattern
- Resolution: Add public accessor methods to VectorPuppet (`getLayer(id)`, `getLayerDrawable(id)`, `getRotationTarget(id)`) so tests don't need to reach into internals
- This is a minimal public API addition explicitly approved by user

## Test Strategy Decision

- **Infrastructure exists**: YES (vitest)
- **Automated tests**: TDD — fix existing tests alongside type changes
- **Agent-Executed QA**: ALWAYS (mandatory for all tasks)

## Scope Boundaries

- IN: vector-puppet.ts, svg-parser.ts, phaser-mocks.ts, render-svg.ts, vector-puppet.spec.ts
- OUT: Other projects (maze-runner), path-tokenizer.ts (already clean), sprite-tools.ts (trivial clean)
- Guardrail: Preserve existing public barrel exports. Only new public API addition is the `getLayer()`/`getRotationTarget()` accessors on VectorPuppet, explicitly approved by user.
