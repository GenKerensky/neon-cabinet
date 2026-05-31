# Learnings - Direction Rotation Sprites

## Conventions

- Use `hasAttribute()` for boolean/default SVG data attributes, not truthiness of `getAttribute()`.
- Parser helpers follow pattern: `parseX(el): XMetadata | undefined`.
- `parseDataParams()` tries JSON first, then key:value pairs.
- LayerMetadata stores optional metadata fields; `animations` and `material` are always present (empty arrays/objects).

## Decisions

- Attribute format: both boolean/default AND explicit angle-map.
- Pivot: rotate around existing Phaser object display origin.
- Chomp ownership: self-or-ancestor direction-rotation context → base RIGHT-facing gap.
- Player asset: `data-direction-rotation` directly on body circle, not wrapping group.
- Player.ts: remove container rotation/scaleX tween, keep `super.setDirection()`.

## Gotchas

- `applyTransform()` only parses `translate(...)`, no rotate/scale support.
- Phaser rotation is radians, SVG metadata is degrees.
- Wrap boundary: 350° → 10° should be +20°, not -340°.
- Repeated same-direction calls must not accumulate rotation.

## File Patterns

- types.ts:47-73 - LayerMetadata interface
- svg-parser.ts:58-73 - parseElement constructs metadata
- svg-parser.ts:123-132 - parseDirectionBend pattern
- vector-puppet.ts:337-373 - setDirection slide/bend tween logic
- vector-puppet.ts:529-558 - chomp rendering
- vector-puppet.ts:570-580 - chomp direction mapping

## Task 1 - Parser and Type Contract for Direction Rotation

- Added `DirectionRotationMetadata` contract with strict `RIGHT`, `DOWN`, `LEFT`, `UP` numeric degree fields.
- Added `directionRotation?: DirectionRotationMetadata` on `LayerMetadata` so both group and element layers can carry parsed rotation metadata.
- `data-direction-rotation` parsing now checks `hasAttribute()` first so empty boolean attributes are detected (`<g data-direction-rotation>`).
- Default map behavior is enabled for empty string, `"true"`, and `"1"`: `{ RIGHT: 0, DOWN: 90, LEFT: 180, UP: -90 }`.
- Explicit JSON maps accept only known direction keys and numeric values; partial maps merge into defaults.
- Invalid JSON, non-object JSON, unknown-only maps, and non-numeric values resolve to `undefined` without throwing.

## Task 2 - Runtime Shortest-Path Layer and Group Rotation

- `VectorPuppet` now tracks self-or-ancestor direction-rotation ownership during recursive setup via `directionRotationContext` and inherited context propagation.
- `setDirection()` now has two independent tween passes: existing `slideRange` x/y tweening and rotation tweening for layers with `directionRotation` metadata.
- Rotation target pipeline is explicit: direction key -> degrees map (`getDirectionRotationDegrees`) -> radians (`degreesToRadians`) -> shortest wrapped target (`getShortestRotationTarget`).
- Shortest-path tie at exact 180° is normalized to `+PI` instead of `-PI` so LEFT direction target matches expected PI-equivalent tween output.
- Chomp ownership rule is enforced at draw-time: if a chomp layer is in direction-rotation context, mouth gap center is fixed to base RIGHT-facing `0`; otherwise legacy `getChompGapCenter()` still uses `currentDirection`.
- Mock tweens now record configs and immediately apply tweened fields (`x`, `y`, `rotation`, `directionBendX`) to targets, enabling deterministic assertions without animation frame progression.

## Task 4 - Authoring Documentation and Examples

- Verified and updated `libs/sprite-tools/README.md` to include `data-direction-rotation` in the UAD attribute table.
- Documented both boolean/default and JSON angle-map formats with clear examples.
- Specified default angles (RIGHT: 0, DOWN: 90, LEFT: 180, UP: -90) and degree-based input.
- Explained shortest-path rotation behavior and 100ms Quad.out tween duration.
- Clarified the chomp interaction: layers with `data-anim-chomp` in a self-or-ancestor `data-direction-rotation` context use a fixed base RIGHT-facing gap (0°) to prevent double-rotation.
- Noted that `data-direction-rotation` coexists with `data-slide-range` and `data-direction-bend` as they mutate different properties.
- Ensured malformed values are documented as failing silently (ignored).
- Added `data-direction-bend`, `data-anim-chomp`, and `data-anim-flash` to the UAD attribute table for completeness.
- Created evidence files at `.omo/evidence/task-4-docs-required-strings.txt` and `.omo/evidence/task-4-docs-scope.txt`.

## Task 3 - Classic Player Asset and Container Rotation Removal

- `apps/maze-runner/public/assets/vector/player.svg` now puts `data-direction-rotation="true"` on the body circle that already carries `data-anim-chomp`; this keeps the file XML-safe for the render pipeline while still using the boolean/default format.
- `apps/maze-runner/src/game/objects/Player.ts` now forwards direction ownership only via `super.setDirection(dirMap[this.movementDirection])`; the old container `rotation`/`scaleX` tween block is gone.
- `apps/maze-runner/tests/objects/Player.spec.ts` now verifies the on-disk player SVG structure and the runtime tween ownership split: body-layer rotation tween still happens, but the player container no longer receives rotation/scaleX tweens.
- Verification notes: `bunx nx test maze-runner` still fails on the pre-existing `typed-event-emitter` TS5101 `baseUrl` deprecation error; the focused Player direction tests passed, and the renderer produced `.omo/evidence/task-3-player-classic.png`.

## Task 5 - Integrated Verification and Visual Approval

- Created `.omo/evidence/` directory.
- Ran `bunx nx test sprite-tools` and saved output to `.omo/evidence/task-5-sprite-tools-tests.txt`. All 28 tests passed.
- Ran `bunx nx test maze-runner` and saved output to `.omo/evidence/task-5-maze-runner-tests.txt`. The test failed due to a pre-existing issue: `typed-event-emitter` TS5101 `baseUrl` deprecation. This is not caused by the direction-rotation work.
- Ran focused tests `bunx vitest run -c libs/sprite-tools/vite.config.mts libs/sprite-tools/src/lib/svg-parser.spec.ts libs/sprite-tools/src/lib/vector-puppet.spec.ts` and saved output to `.omo/evidence/task-5-focused-tests.txt`. All 23 tests passed.
- Rendered the player SVG to `.omo/evidence/player-direction-rotation.png` using `bun run libs/sprite-tools/src/bin/render-svg.ts`.
- Used the `look_at` tool to act as the Art Director and critique the rendered PNG. The Art Director confirmed:
  - Classic Pac-Man shape (no eye)
  - Centered body/collider
  - Clear chomp readability
  - Mouth facing is coherent
