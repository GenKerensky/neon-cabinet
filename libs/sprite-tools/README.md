# @neon-cabinet/sprite-tools

A declarative SVG-to-Phaser vector sprite pipeline designed for high-fidelity retro-arcade games. This library enables the **Unified Asset Definition (UAD)** workflow, where a single SVG file defines visuals, animations, physics, and attachment points.

## Key Features

- **VectorPuppet Container**: A Phaser 3 Container that dynamically renders SVG paths and layers.
- **Procedural Animations**: 60fps sine-wave vertex morphing (`data-anim-wave`) and structural wobbling (`data-anim-wobble`).
- **Declarative Physics**: Automatic Arcade Physics hitbox generation via `class="physics-collider"`.
- **Dynamic Sockets**: Transform-aware attachment points for projectiles and particles using SVG group IDs (`socket_*`).
- **HUD Vector Puppets**: Editable SVG HUD shells with procedural sockets, state-driven styling, and predictable stroke scaling.
- **Studio Agent Workflow**: Integrated support for Art Director and Illustrator agent feedback loops.

## Unified Asset Definition (UAD) Specs

Annotate your SVG files with these custom attributes to unlock engine features:

| Attribute                      | Description                      | Example                                   |
| ------------------------------ | -------------------------------- | ----------------------------------------- |
| `data-anim-wave`               | Procedural sine-wave morphing    | `frequency:2 amplitude:5 points:20`       |
| `data-anim-wobble`             | Structural oscillation           | `frequency:1 amplitude:3`                 |
| `data-anim-chomp`              | Procedural mouth chomping        | `frequency:5 range:30`                    |
| `data-anim-flash`              | Hit-flash effect                 | `frequency:10`                            |
| `data-slide-range`             | Directional eye/layer sliding    | `data-slide-range="4"`                    |
| `data-direction-bend`          | Directional layer bending        | `data-direction-bend="5"`                 |
| `data-direction-rotation`      | Direction-based layer rotation   | `data-direction-rotation="true"`          |
| `class="physics-collider"`     | Defines an Arcade Physics body   | `<circle ... class="physics-collider" />` |
| `id="socket_*"`                | Transform-aware attachment point | `<g id="socket_muzzle" ... />`            |
| `data-hud-role`                | Names a HUD layer or socket role | `data-hud-role="radar-center"`            |
| `data-hud-bind`                | Groups HUD elements by state key | `data-hud-bind="torpedoes"`               |
| `data-hud-state-styles`        | State-driven HUD style map       | `{"empty":{"stroke":"#ff43d6"}}`          |
| `vector-effect`                | Standard non-scaling stroke flag | `vector-effect="non-scaling-stroke"`      |
| `data-stroke-policy`           | Stroke scaling override          | `data-stroke-policy="screen"`             |
| `data-material-phosphor-trail` | CRT shader trail metadata        | `data-material-phosphor-trail="2.0"`      |

## Supported SVG Shapes

The parser imports these SVG elements as editable vector layers:

- `path`
- `circle`
- `ellipse`
- `rect`
- `line`
- `polyline`
- `polygon`
- `g`

Groups become container layers and can carry HUD metadata, transforms, visibility, opacity, animations, and child layers. Socket groups are any top-level `<g>` whose `id` starts with `socket_`.

## Stroke Scaling

Stroke width is preserved on import because line weight is part of the art direction. The renderer supports three stroke policies:

| Policy   | How to author it                                                      | Runtime behavior                                                               | Use for                                                  |
| -------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------ | -------------------------------------------------------- |
| `scale`  | Default, or `data-stroke-policy="scale"`                              | Stroke width scales with the puppet.                                           | Cockpit frames, ship outlines, cannon geometry.          |
| `screen` | `vector-effect="non-scaling-stroke"` or `data-stroke-policy="screen"` | Stroke width is divided by puppet scale so it stays visually stable on screen. | Thin HUD readouts, radar grid lines, reticle bounds.     |
| `ignore` | `data-stroke-policy="ignore"`                                         | Stroke metadata is preserved, but the renderer does not draw the stroke.       | Guide paths, editor helper outlines, procedural sockets. |

`data-stroke-policy` takes precedence over `vector-effect`. This means an SVG can include `vector-effect="non-scaling-stroke"` for editor compatibility, then force normal game scaling with `data-stroke-policy="scale"` when needed.

Imported stroke widths are clamped to `64` vector units to prevent malformed or editor-generated SVGs from creating oversized Phaser strokes. The importer still preserves stroke color, fill, opacity, and the clamped `strokeWidth` value in metadata.

Example:

```svg
<line
  id="radar_horizontal"
  x1="390.8"
  y1="522"
  x2="609.2"
  y2="522"
  stroke="#0a5d8f"
  stroke-width="1"
  vector-effect="non-scaling-stroke"
  data-hud-role="radar-grid"
  data-hud-bind="radar"
/>
```

## HUD Vector Puppets

`HudVectorPuppet` extends `VectorPuppet` for cockpit overlays, instrument panels, radar shells, status meters, and other UI-like vector assets that still need procedural game data.

Use SVG for static, editable HUD art:

- cockpit frames
- panel geometry
- laser cannon outlines
- radar bezels and grid lines
- reticle bounds
- meter outlines

Keep fast-changing data procedural in game code:

- radar contact dots
- targeting pips
- text readouts
- animated enemy markers
- weapon fire and hit effects

### HUD Roles and Binds

Add `data-hud-role` to name what a layer or socket is. Add `data-hud-bind` to group multiple elements under a state key.

```svg
<ellipse
  id="radar_bezel"
  cx="500"
  cy="522"
  rx="130"
  ry="44"
  fill="#020107"
  stroke="#23d9ff"
  stroke-width="2"
  data-hud-role="radar-bezel"
  data-hud-bind="radar"
/>

<g
  id="socket_radar_center"
  transform="translate(500, 522)"
  data-socket-type="hud"
  data-hud-role="radar-center"
  data-hud-bind="radar"
/>
```

Runtime lookup:

```typescript
const radarSocket = hud.getSocketByHudRole("radar-center");
```

Sockets are metadata anchors. They are useful for aligning procedural overlays to editable SVG artwork without baking those overlays into the asset.

### State-Driven HUD Styles

Use `data-hud-state-styles` for visual state changes that should round-trip through the SVG asset. The value is a JSON object keyed by state name. Each state can set:

- `fill`
- `stroke`
- `strokeWidth`
- `opacity`
- `visible`

Example:

```svg
<rect
  id="torpedo_meter"
  x="745"
  y="466"
  width="88"
  height="10"
  fill="#020107"
  stroke="#7be8ff"
  stroke-width="2"
  data-hud-role="ammo-indicator"
  data-hud-bind="torpedoes"
  data-hud-state-styles='{
    "normal": { "stroke": "#7be8ff", "opacity": 0.85 },
    "empty": { "stroke": "#ff43d6", "opacity": 0.45 }
  }'
/>
```

Runtime state application:

```typescript
hud.applyHudState("torpedoes", torpedoes <= 0 ? "empty" : "normal");
hud.applyHudState("shields", shieldsDown ? "down" : "normal");
```

`applyHudState(bind, state)` updates any layer whose `data-hud-bind` or `data-hud-role` matches `bind`, then redraws the layer. This works for shape layers and group layers. Shape layers redraw geometry when colors or stroke widths change; group layers update container visibility and opacity.

### Import/Export Guidance

For repeatable authoring:

1. Keep the HUD shell in an SVG file under the game asset directory.
2. Use standard SVG shapes whenever possible; prefer `line`, `rect`, `ellipse`, `polyline`, and `polygon` over flattened paths for simple HUD geometry.
3. Use `vector-effect="non-scaling-stroke"` for thin readout and grid strokes.
4. Use `data-stroke-policy="ignore"` for guides that should stay in the asset but not render.
5. Put procedural overlay anchors in `socket_*` groups with `data-socket-type="hud"`.
6. Put runtime state styling in `data-hud-state-styles`, not hard-coded game conditionals, when the change is purely visual.

When exporting from a vector editor, verify that IDs and custom `data-*` attributes are preserved. If the editor strips custom attributes, keep a source SVG with the annotations and import that file into the game pipeline.

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
