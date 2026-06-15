# Learnings — sprite-tools-type-tightening

## Phaser 3.90 Type System

- `Phaser.GameObjects.GameObject` base class does NOT have `x`, `y`, `rotation`, `visible` — these come via component mixins on `Container` and `Graphics`
- `Graphics` has `fillEllipse` and `strokeEllipse` but NO `ellipse()` method
- `Graphics` has `arc(x, y, radius, startAngle, endAngle, anticlockwise?)` for arc segments
- `scene.physics.add.existing(gameObject)` returns the game object (not the body)
- After arcade physics registration, `this.body` narrows to `Arcade.Body | Arcade.StaticBody`
- `Phaser.Physics.Arcade.Body` is a class — `instanceof` works for narrowing

## SVG Attribute Parsing

- `el.getAttribute(attr)` returns `string | null` — always nullable
- `parseNumericAttribute(el, attr)` helper pattern eliminates all `!` assertions cleanly

## Mock Typing Resolution

- A lightweight `MockScene` can stay runtime-simple if the spec narrows an `unknown` input with a type guard before calling `VectorPuppet`.
- This avoids unsafe cast chains while keeping the Phaser test mock implementation minimal.
