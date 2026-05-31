# @neon-cabinet/sprite-tools

A declarative SVG-to-Phaser vector sprite pipeline designed for high-fidelity retro-arcade games. This library enables the **Unified Asset Definition (UAD)** workflow, where a single SVG file defines visuals, animations, physics, and attachment points.

## Key Features

- **VectorPuppet Container**: A Phaser 3 Container that dynamically renders SVG paths and layers.
- **Procedural Animations**: 60fps sine-wave vertex morphing (`data-anim-wave`) and structural wobbling (`data-anim-wobble`).
- **Declarative Physics**: Automatic Arcade Physics hitbox generation via `class="physics-collider"`.
- **Dynamic Sockets**: Transform-aware attachment points for projectiles and particles using SVG group IDs (`socket_*`).
- **Studio Agent Workflow**: Integrated support for Art Director and Illustrator agent feedback loops.

## Unified Asset Definition (UAD) Specs

Annotate your SVG files with these custom attributes to unlock engine features:

| Attribute                  | Description                      | Example                                   |
| -------------------------- | -------------------------------- | ----------------------------------------- |
| `data-anim-wave`           | Procedural sine-wave morphing    | `frequency:2 amplitude:5 points:20`       |
| `data-anim-wobble`         | Structural oscillation           | `frequency:1 amplitude:3`                 |
| `data-anim-chomp`          | Procedural mouth chomping        | `frequency:5 range:30`                    |
| `data-anim-flash`          | Hit-flash effect                 | `frequency:10`                            |
| `data-slide-range`         | Directional eye/layer sliding    | `data-slide-range="4"`                    |
| `data-direction-bend`      | Directional layer bending        | `data-direction-bend="5"`                 |
| `data-direction-rotation`  | Direction-based layer rotation   | `data-direction-rotation="true"`          |
| `class="physics-collider"` | Defines an Arcade Physics body   | `<circle ... class="physics-collider" />` |
| `id="socket_*"`            | Transform-aware attachment point | `<g id="socket_muzzle" ... />`            |
| `data-material-bloom`      | CRT shader glow intensity        | `data-material-bloom="2.0"`               |

## Directional Rotation (`data-direction-rotation`)

This attribute rotates layers or groups automatically when the puppet changes direction.

### Formats

- **Boolean**: `data-direction-rotation="true"`, `data-direction-rotation="1"`, or just `data-direction-rotation`. These use default angles in degrees: `RIGHT: 0`, `DOWN: 90`, `LEFT: 180`, `UP: -90`.
- **JSON Map**: `data-direction-rotation='{"RIGHT": 45, "DOWN": 135}'`. You can provide custom angles in degrees. Partial maps merge with the defaults.

### Behavior

- Transitions use the shortest angular path to prevent 360 degree flips.
- Tweens run for 100ms with a `Quad.out` ease.
- Invalid values are ignored and won't throw errors.
- This works alongside `data-slide-range` and `data-direction-bend` without conflict.

### Chomp Interaction

Layers using `data-anim-chomp` that are in a self-or-ancestor `data-direction-rotation` context keep a fixed base RIGHT-facing gap (0°). This prevents the mouth from rotating twice when the parent group rotates. Layers outside such a context preserve the legacy behavior where the gap center follows the `currentDirection`.

### Examples

**Default rotation on a group**

```svg
<g data-direction-rotation="true">
  <path d="..." fill="red" />
</g>
```

**Custom angles on a shape**

```svg
<circle cx="10" cy="10" r="5" data-direction-rotation='{"UP": -45, "LEFT": 225}' />
```

## Tooling

### Stage 1: Fast Local Critique

Generate PNG snapshots with physics and socket overlays for rapid visual review:

```bash
bun run libs/sprite-tools/src/bin/render-svg.ts input.svg output.png
```

### Stage 2: Unit Testing

Verify asset parsing and coordinate transformations:

```bash
nx test sprite-tools
```

## Usage

```typescript
import { VectorPuppet, SVGParser } from "@neon-cabinet/sprite-tools";

// 1. Parse your SVG
const parser = new SVGParser();
const metadata = parser.parse(svgString);

// 2. Instantiate the puppet
const player = new VectorPuppet(scene, 100, 100, metadata);

// 3. Control animations
player.setDirection("LEFT");
```
